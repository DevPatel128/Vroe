/**
 * Daily backup of the subscriber list.
 *
 * A Cron Trigger (wrangler.jsonc) calls runBackup(), which writes the whole
 * SUBSCRIBERS namespace to a private R2 bucket as one JSON file per day, and
 * deletes files older than BACKUP_RETENTION_DAYS.
 *
 * The file is an array of { key, value, expiration, metadata }. That is exactly
 * the input `wrangler kv bulk put` reads, so restoring needs no custom code and
 * every record keeps its original expiry. See docs/06_OPERATIONS/BACKUPS.md and
 * docs/06_OPERATIONS/RUNBOOKS/RESTORE-SUBSCRIBERS.md.
 *
 * Nothing here logs an address. Counts and dates only.
 *
 * Constants may be exported from this module because it is not the Worker's entry
 * point; only worker/index.js is restricted to function exports (ADR-007).
 */

/** Mirrors BACKUP_RETENTION_DAYS in src/content/legal.js. Both must change together. */
export const BACKUP_RETENTION_DAYS = 30;

export const SNAPSHOT_PREFIX = "subscribers/";
export const LATEST_KEY = `${SNAPSHOT_PREFIX}latest.json`;

/** A daily job is "recent" for a day and a half, so one late run is not an alarm. */
export const RECENT_AFTER_HOURS = 36;

const KV_LIST_PAGE = 1000;
const KV_BULK_GET = 100;
const R2_DELETE_BATCH = 1000;

// The Workers Free plan allows 1,000 requests to Cloudflare services (KV, R2) per
// invocation, and a bulk read counts as one. Stop well short of it.
const MAX_SERVICE_REQUESTS = 900;
// Two R2 writes, the listing of old snapshots and the deletes, with room to spare.
const R2_RESERVE = 8;

const SNAPSHOT_KEY = /^subscribers\/(\d{4}-\d{2}-\d{2})\.json$/;
const STATUS_TTL_MS = 60_000;

/**
 * @typedef {object} BackupEnv
 * @property {KVNamespace} SUBSCRIBERS
 * @property {R2Bucket} BACKUPS
 */

/** UTC calendar date, YYYY-MM-DD. */
function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

/** The date `days` days before `date`, as YYYY-MM-DD. Pure UTC arithmetic. */
function daysBefore(date, days) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - days);
  return isoDate(d);
}

/**
 * Write today's snapshot, then remove snapshots past the retention window.
 *
 * Either the whole snapshot is written or nothing is: it is built in memory and
 * stored with one put, so a failure part-way through leaves the previous
 * snapshots untouched. A failure is thrown, never swallowed, so the run shows as
 * failed in Cloudflare's cron events and the health check goes stale.
 *
 * @param {BackupEnv} env
 * @param {{ now?: Date, maxRequests?: number }} [options]
 * @returns {Promise<{ date: string, count: number, bytes: number, pruned: number, requests: number }>}
 */
export async function runBackup(env, { now = new Date(), maxRequests = MAX_SERVICE_REQUESTS } = {}) {
  if (!env.SUBSCRIBERS?.list) throw new Error("Backup failed: the SUBSCRIBERS namespace is not bound");
  if (!env.BACKUPS?.put) throw new Error("Backup failed: the BACKUPS R2 bucket is not bound");

  let requests = 0;
  const spend = () => {
    if (++requests > maxRequests) {
      throw new Error(`Backup refused: more than ${maxRequests} requests to Cloudflare services in one run. Nothing was written.`);
    }
  };

  // 1. Every key in the namespace, with its expiry and metadata. Paginate on
  //    list_complete, never on an empty page: expired keys can leave a page empty
  //    while more remain.
  const listed = [];
  let cursor;
  do {
    spend();
    const page = await env.SUBSCRIBERS.list({ cursor, limit: KV_LIST_PAGE });
    listed.push(...page.keys);
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  // 2. Refuse before reading if the reads plus the writes cannot fit. A partial
  //    backup that looks complete is worse than a failed one.
  const reads = Math.ceil(listed.length / KV_BULK_GET);
  if (requests + reads + R2_RESERVE > maxRequests) {
    throw new Error(
      `Backup refused: ${listed.length} subscribers need about ${requests + reads + R2_RESERVE} requests to Cloudflare services, ` +
        `over the ${maxRequests} allowed in one run. Nothing was written. See docs/06_OPERATIONS/BACKUPS.md.`,
    );
  }

  // 3. The values, 100 keys per request. Values stay as the strings KV holds, so
  //    the worker parses nothing.
  const entries = [];
  for (let i = 0; i < listed.length; i += KV_BULK_GET) {
    const batch = listed.slice(i, i + KV_BULK_GET);
    spend();
    const values = await env.SUBSCRIBERS.get(batch.map((k) => k.name), "text");
    for (const k of batch) {
      const value = values.get(k.name);
      // Expired or deleted between the listing and the read.
      if (value === null || value === undefined) continue;
      const entry = { key: k.name, value };
      if (k.expiration !== undefined) entry.expiration = k.expiration;
      if (k.metadata !== undefined && k.metadata !== null) entry.metadata = k.metadata;
      entries.push(entry);
    }
  }

  // 4. Snapshot first, pointer second, so the pointer never names a missing file.
  //    Running twice on one day overwrites the same key.
  const date = isoDate(now);
  const body = JSON.stringify(entries);
  const meta = { date, count: String(entries.length) };
  spend();
  await env.BACKUPS.put(`${SNAPSHOT_PREFIX}${date}.json`, body, {
    httpMetadata: { contentType: "application/json" },
    customMetadata: meta,
  });
  spend();
  await env.BACKUPS.put(LATEST_KEY, JSON.stringify({ date, count: entries.length }), {
    httpMetadata: { contentType: "application/json" },
    customMetadata: meta,
  });

  // 5. Prune. A failure here must not hide the fact that today's snapshot exists,
  //    but it must not pass silently either: it breaks the retention promise.
  let pruned = 0;
  let pruneError = null;
  try {
    pruned = await prune(env.BACKUPS, date, spend);
  } catch (error) {
    pruneError = error;
  }

  const bytes = new TextEncoder().encode(body).length;
  console.log("Subscriber backup written", { date, count: entries.length, bytes, pruned });
  if (pruneError) {
    console.error("Subscriber backup pruning failed:", pruneError?.message ?? "unknown");
    throw new Error("Today's backup was written, but removing old backups failed. Old backups are being kept longer than the privacy policy says.");
  }
  return { date, count: entries.length, bytes, pruned, requests };
}

/**
 * Delete snapshots dated before the oldest one still inside the window. Only keys
 * that look like a dated snapshot are ever deleted; the pointer and anything else
 * in the bucket are left alone.
 */
async function prune(bucket, today, spend) {
  const oldestKept = daysBefore(new Date(`${today}T00:00:00Z`), BACKUP_RETENTION_DAYS - 1);
  const expired = [];
  let cursor;
  do {
    spend();
    const page = await bucket.list({ prefix: SNAPSHOT_PREFIX, cursor });
    for (const object of page.objects) {
      const match = SNAPSHOT_KEY.exec(object.key);
      if (match && match[1] < oldestKept) expired.push(object.key);
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);

  for (let i = 0; i < expired.length; i += R2_DELETE_BATCH) {
    spend();
    await bucket.delete(expired.slice(i, i + R2_DELETE_BATCH));
  }
  return expired.length;
}

/* ─── Status, for /api/health ──────────────────────────────────────────── */

let statusCache = null;

/** Forget the remembered status. For tests. */
export function resetBackupStatus() {
  statusCache = null;
}

/**
 * Three booleans about the backup, for /api/health. Never a count, a date or a
 * key. Remembered for a minute so the public endpoint cannot be used to hammer R2.
 *
 * If R2 cannot be read the answer is "a backup exists and is not recent", so the
 * health check fails rather than going quiet. That answer is not remembered, so
 * the next request asks again.
 *
 * @param {Partial<BackupEnv>} env
 * @param {Date} [now]
 * @returns {Promise<{ backups_r2: boolean, backup_ever: boolean, backup_recent: boolean }>}
 */
export async function backupStatus(env, now = new Date()) {
  if (typeof env.BACKUPS?.head !== "function") {
    return { backups_r2: false, backup_ever: false, backup_recent: false };
  }
  if (statusCache && now.getTime() - statusCache.at < STATUS_TTL_MS) return statusCache.value;

  try {
    const latest = await env.BACKUPS.head(LATEST_KEY);
    const ever = latest !== null && latest !== undefined;
    const ageMs = ever ? now.getTime() - latest.uploaded.getTime() : Infinity;
    const value = { backups_r2: true, backup_ever: ever, backup_recent: ageMs < RECENT_AFTER_HOURS * 3_600_000 };
    statusCache = { at: now.getTime(), value };
    return value;
  } catch (error) {
    console.error("Backup status check failed:", error?.message ?? "unknown");
    return { backups_r2: true, backup_ever: true, backup_recent: false };
  }
}
