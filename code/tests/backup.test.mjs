/**
 * The daily subscriber backup (worker/backup.js).
 *
 * The properties that matter, in order: a snapshot can be restored exactly; a
 * failure never leaves something that looks like a good backup; old snapshots do
 * go, and only snapshots; nothing personal reaches a log; the health flags say
 * whether the backup is fresh without becoming a dependency of the deploy.
 */

import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import worker from "../worker/index.js";
import {
  BACKUP_RETENTION_DAYS,
  LATEST_KEY,
  RECENT_AFTER_HOURS,
  backupStatus,
  resetBackupStatus,
  runBackup,
} from "../worker/backup.js";
import { baseEnv, edge, fakeKV, fakeR2 } from "./helpers.mjs";

const NOW = new Date("2026-09-20T03:23:00Z");
const HOUR = 3_600_000;
const epoch = (date) => Math.floor(date.getTime() / 1000);

beforeEach(() => resetBackupStatus());

/** Subscribers shaped exactly as storeSubscriber writes them. */
function seed(kv, count, { from = 0 } = {}) {
  const emails = [];
  for (let i = from; i < from + count; i++) {
    const email = `person${i}@example.test`;
    emails.push(email);
    const record = { email, subscribed_at: "2026-09-01T10:00:00.000Z", country: "GB", consent: true };
    kv.store.set(`sub:${String(i).padStart(6, "0")}`, JSON.stringify(record));
    kv.meta.set(`sub:${String(i).padStart(6, "0")}`, {
      expiration: epoch(NOW) + 700 * 86400,
      metadata: { subscribed_at: record.subscribed_at },
    });
  }
  return emails;
}

function envWith(count = 3) {
  const SUBSCRIBERS = fakeKV();
  const BACKUPS = fakeR2({ clock: () => NOW });
  const emails = seed(SUBSCRIBERS, count);
  return { SUBSCRIBERS, BACKUPS, emails };
}

const snapshotOf = async (env, date = "2026-09-20") => (await env.BACKUPS.get(`subscribers/${date}.json`)).json();

/** What `wrangler kv bulk put` does with a snapshot, minus the network. */
function bulkPut(snapshot, target, at = NOW) {
  for (const { key, value, expiration, metadata } of snapshot) {
    if (expiration !== undefined && expiration <= epoch(at) + 60) continue; // KV refuses expiry inside 60 s
    target.store.set(key, value);
    target.meta.set(key, {
      ...(expiration !== undefined ? { expiration } : {}),
      ...(metadata !== undefined ? { metadata } : {}),
    });
  }
}

/* ─── The snapshot ─────────────────────────────────────────────────────── */

test("the snapshot is exactly what `wrangler kv bulk put` accepts", async () => {
  const env = envWith(5);
  await runBackup(env, { now: NOW });
  const snapshot = await snapshotOf(env);

  assert.ok(Array.isArray(snapshot));
  assert.equal(snapshot.length, 5);
  assert.equal(new Set(snapshot.map((e) => e.key)).size, 5, "keys are unique");
  for (const entry of snapshot) {
    assert.deepEqual(Object.keys(entry).sort(), ["expiration", "key", "metadata", "value"]);
    assert.equal(typeof entry.value, "string", "bulk put takes string values");
    assert.ok(Number.isInteger(entry.expiration), "an absolute expiry, in seconds");
    assert.deepEqual(Object.keys(JSON.parse(entry.value)).sort(), ["consent", "country", "email", "subscribed_at"]);
  }
});

test("restoring a snapshot reproduces the list, with each record's original expiry and metadata", async () => {
  const env = envWith(250);
  await runBackup(env, { now: NOW });

  const restored = fakeKV();
  bulkPut(await snapshotOf(env), restored);

  assert.deepEqual(restored.store, env.SUBSCRIBERS.store);
  assert.deepEqual(restored.meta, env.SUBSCRIBERS.meta);
});

test("a record with no expiry or metadata is backed up without those fields", async () => {
  const env = envWith(0);
  env.SUBSCRIBERS.store.set("sub:plain", '{"email":"a@example.test"}');
  await runBackup(env, { now: NOW });
  assert.deepEqual(await snapshotOf(env), [{ key: "sub:plain", value: '{"email":"a@example.test"}' }]);
});

test("an empty list still produces a valid, empty snapshot", async () => {
  const env = envWith(0);
  const result = await runBackup(env, { now: NOW });
  assert.equal(result.count, 0);
  assert.deepEqual(await snapshotOf(env), []);
});

test("expired records and records deleted mid-run are left out", async () => {
  const env = envWith(4);
  env.SUBSCRIBERS.meta.set("sub:000000", { expiration: epoch(NOW) - 86400 }); // already expired
  const list = env.SUBSCRIBERS.list;
  env.SUBSCRIBERS.list = async (options) => {
    const page = await list(options);
    env.SUBSCRIBERS.store.delete("sub:000003"); // an unsubscribe lands between the listing and the read
    return page;
  };
  await runBackup(env, { now: NOW });
  assert.deepEqual((await snapshotOf(env)).map((e) => e.key), ["sub:000001", "sub:000002"]);
});

test("the pointer names today's snapshot and its size", async () => {
  const env = envWith(3);
  await runBackup(env, { now: NOW });
  assert.deepEqual(await (await env.BACKUPS.get(LATEST_KEY)).json(), { date: "2026-09-20", count: 3 });
});

test("running twice on one day overwrites; a new day adds a snapshot", async () => {
  const env = envWith(3);
  await runBackup(env, { now: NOW });
  await runBackup(env, { now: new Date("2026-09-20T15:00:00Z") });
  assert.deepEqual([...env.BACKUPS.objects.keys()].sort(), ["subscribers/2026-09-20.json", LATEST_KEY]);

  await runBackup(env, { now: new Date("2026-09-21T03:23:00Z") });
  assert.deepEqual([...env.BACKUPS.objects.keys()].sort(), ["subscribers/2026-09-20.json", "subscribers/2026-09-21.json", LATEST_KEY]);
});

/* ─── Scale, and the limit on requests ─────────────────────────────────── */

test("more than 1,000 records and more than 100 reads paginate, within the request budget", async () => {
  const env = envWith(2500);
  const result = await runBackup(env, { now: NOW });
  assert.equal(result.count, 2500);
  // 3 list pages, 25 bulk reads, 2 writes, 1 listing of old snapshots. Counted
  // before the test reads anything back.
  assert.equal(result.requests, env.SUBSCRIBERS.ops + env.BACKUPS.ops, "the job counts every request it makes");
  assert.equal(env.SUBSCRIBERS.ops, 3 + 25);
  assert.ok(result.requests < 100, `used ${result.requests} requests`);
  assert.equal((await snapshotOf(env)).length, 2500);
});

test("a list too big for one run is refused before anything is read or written", async () => {
  const env = envWith(2500);
  await assert.rejects(runBackup(env, { now: NOW, maxRequests: 20 }), /Backup refused.*2500 subscribers.*Nothing was written/s);
  assert.equal(env.BACKUPS.objects.size, 0, "no partial backup");
  assert.equal(env.SUBSCRIBERS.ops, 3, "it stopped after listing");
});

test("a runaway listing is stopped", async () => {
  const env = envWith(2500);
  await assert.rejects(runBackup(env, { now: NOW, maxRequests: 2 }), /Backup refused/);
  assert.equal(env.BACKUPS.objects.size, 0);
});

/* ─── Retention ────────────────────────────────────────────────────────── */

const snapshotKey = (date) => `subscribers/${date}.json`;
const putSnapshot = (env, date) => env.BACKUPS.objects.set(snapshotKey(date), { body: "[]", customMetadata: {}, uploaded: NOW });

test("snapshots inside the window are kept and older ones are deleted", async () => {
  assert.equal(BACKUP_RETENTION_DAYS, 30);
  const env = envWith(1);
  for (const d of ["2026-08-20", "2026-08-21", "2026-08-22", "2026-09-01", "2026-09-19"]) putSnapshot(env, d);

  const result = await runBackup(env, { now: NOW }); // 2026-09-20: the window is 08-22 to 09-20, thirty snapshots
  assert.equal(result.pruned, 2);
  assert.deepEqual(
    [...env.BACKUPS.objects.keys()].sort(),
    [snapshotKey("2026-08-22"), snapshotKey("2026-09-01"), snapshotKey("2026-09-19"), snapshotKey("2026-09-20"), LATEST_KEY],
  );
});

test("the window is exactly thirty snapshots across a month and a year boundary", async () => {
  for (const [today, oldestKept, newestDeleted] of [
    ["2026-10-01", "2026-09-02", "2026-09-01"],
    ["2027-01-05", "2026-12-07", "2026-12-06"],
    ["2028-03-01", "2028-02-01", "2028-01-31"], // through a leap February: 1 March plus 29 days
  ]) {
    const env = envWith(1);
    putSnapshot(env, oldestKept);
    putSnapshot(env, newestDeleted);
    await runBackup(env, { now: new Date(`${today}T03:23:00Z`) });
    assert.ok(env.BACKUPS.objects.has(snapshotKey(oldestKept)), `${oldestKept} is kept on ${today}`);
    assert.ok(!env.BACKUPS.objects.has(snapshotKey(newestDeleted)), `${newestDeleted} is deleted on ${today}`);
  }
});

test("only dated snapshots are ever deleted", async () => {
  const env = envWith(1);
  putSnapshot(env, "2020-01-01");
  for (const key of ["subscribers/notes.txt", "subscribers/2020-01-01.json.bak", "other/2020-01-01.json", "subscribers/keep-me.json"]) {
    env.BACKUPS.objects.set(key, { body: "x", customMetadata: {}, uploaded: NOW });
  }
  await runBackup(env, { now: NOW });
  assert.ok(!env.BACKUPS.objects.has(snapshotKey("2020-01-01")));
  for (const key of ["subscribers/notes.txt", "subscribers/2020-01-01.json.bak", "other/2020-01-01.json", "subscribers/keep-me.json", LATEST_KEY]) {
    assert.ok(env.BACKUPS.objects.has(key), `${key} must survive`);
  }
});

test("a large backlog is deleted in batches of at most 1,000", async () => {
  const env = envWith(1);
  for (let year = 1000; year < 2000; year++) {
    putSnapshot(env, `${year}-01-01`);
    putSnapshot(env, `${year}-02-01`);
  }
  const result = await runBackup(env, { now: NOW });
  assert.equal(result.pruned, 2000, "two batches were needed, and the fake refuses a batch over 1,000");
  assert.deepEqual([...env.BACKUPS.objects.keys()].sort(), [snapshotKey("2026-09-20"), LATEST_KEY]);
});

/* ─── Failure is loud and leaves no false comfort ──────────────────────── */

test("if reading the list fails, nothing is written", async () => {
  const env = envWith(3);
  env.SUBSCRIBERS.list = async () => { throw new Error("KV is down"); };
  await assert.rejects(runBackup(env, { now: NOW }), /KV is down/);
  assert.equal(env.BACKUPS.objects.size, 0);
});

test("if writing the snapshot fails, the pointer is not moved", async () => {
  const env = envWith(3);
  putSnapshot(env, "2026-09-19");
  env.BACKUPS.objects.set(LATEST_KEY, { body: '{"date":"2026-09-19","count":3}', customMetadata: {}, uploaded: NOW });
  const put = env.BACKUPS.put;
  env.BACKUPS.put = async (key, ...rest) => {
    if (key === snapshotKey("2026-09-20")) throw new Error("R2 is down");
    return put(key, ...rest);
  };
  await assert.rejects(runBackup(env, { now: NOW }), /R2 is down/);
  assert.equal(env.BACKUPS.objects.get(LATEST_KEY).body, '{"date":"2026-09-19","count":3}');
  assert.ok(!env.BACKUPS.objects.has(snapshotKey("2026-09-20")));
});

test("if pruning fails, today's backup is kept and the run still fails", async () => {
  const env = envWith(3);
  putSnapshot(env, "2020-01-01");
  env.BACKUPS.delete = async () => { throw new Error("cannot delete"); };
  await assert.rejects(runBackup(env, { now: NOW }), /removing old backups failed/);
  assert.ok(env.BACKUPS.objects.has(snapshotKey("2026-09-20")));
  assert.ok(env.BACKUPS.objects.has(LATEST_KEY));
});

test("without both bindings it fails and says which is missing", async () => {
  await assert.rejects(runBackup({ SUBSCRIBERS: fakeKV() }, { now: NOW }), /BACKUPS R2 bucket is not bound/);
  await assert.rejects(runBackup({ BACKUPS: fakeR2() }, { now: NOW }), /SUBSCRIBERS namespace is not bound/);
});

/* ─── Privacy ──────────────────────────────────────────────────────────── */

test("nothing personal is written to any log, on success or failure", async () => {
  const lines = [];
  const original = { log: console.log, error: console.error, warn: console.warn, info: console.info };
  for (const level of Object.keys(original)) console[level] = (...args) => lines.push(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
  try {
    const env = envWith(5);
    putSnapshot(env, "2020-01-01");
    await runBackup(env, { now: NOW });
    env.BACKUPS.delete = async () => { throw new Error("cannot delete"); };
    putSnapshot(env, "2020-01-02");
    await runBackup(env, { now: NOW }).catch(() => {});
    env.SUBSCRIBERS.list = async () => { throw new Error("KV is down"); };
    await runBackup(env, { now: NOW }).catch(() => {});
  } finally {
    Object.assign(console, original);
  }
  assert.ok(lines.length >= 2, "the job does log its counts");
  const all = lines.join("\n");
  assert.doesNotMatch(all, /@|example\.test|person\d/, "no address in the logs");
  assert.doesNotMatch(all, /sub:0/, "no key in the logs");
});

/* ─── The cron entry point ─────────────────────────────────────────────── */

test("the Worker's scheduled handler runs the backup for the scheduled day", async () => {
  const env = baseEnv({ SUBSCRIBERS: fakeKV(), BACKUPS: fakeR2() });
  seed(env.SUBSCRIBERS, 4);
  await worker.scheduled({ scheduledTime: Date.parse("2026-11-02T03:23:00Z") }, env);
  assert.ok(env.BACKUPS.objects.has(snapshotKey("2026-11-02")));
});

test("a failed scheduled run rejects, so Cloudflare records it as failed", async () => {
  const env = baseEnv({ SUBSCRIBERS: fakeKV(), BACKUPS: undefined });
  await assert.rejects(worker.scheduled({ scheduledTime: Date.now() }, env), /not bound/);
});

/* ─── Health flags ─────────────────────────────────────────────────────── */

test("without the bucket, all three flags are false", async () => {
  assert.deepEqual(await backupStatus({}), { backups_r2: false, backup_ever: false, backup_recent: false });
});

test("before the first run: bound, never backed up", async () => {
  assert.deepEqual(await backupStatus({ BACKUPS: fakeR2() }, NOW), { backups_r2: true, backup_ever: false, backup_recent: false });
});

test("after a run it is recent, and it stops being recent after 36 hours", async () => {
  assert.equal(RECENT_AFTER_HOURS, 36);
  const env = envWith(2);
  await runBackup(env, { now: NOW });
  assert.deepEqual(await backupStatus(env, new Date(NOW.getTime() + 35 * HOUR)), { backups_r2: true, backup_ever: true, backup_recent: true });
  resetBackupStatus();
  assert.deepEqual(await backupStatus(env, new Date(NOW.getTime() + 37 * HOUR)), { backups_r2: true, backup_ever: true, backup_recent: false });
});

test("the status is remembered for a minute, so the public endpoint cannot hammer R2", async () => {
  const BACKUPS = fakeR2();
  await backupStatus({ BACKUPS }, NOW);
  await backupStatus({ BACKUPS }, new Date(NOW.getTime() + 30_000));
  assert.equal(BACKUPS.ops, 1);
  await backupStatus({ BACKUPS }, new Date(NOW.getTime() + 61_000));
  assert.equal(BACKUPS.ops, 2);
});

test("if R2 cannot be read, the status says the backup is not recent, and is not remembered", async () => {
  let fail = true;
  const BACKUPS = { async head() { if (fail) throw new Error("R2 unreachable"); return null; } };
  const original = console.error;
  console.error = () => {};
  try {
    assert.deepEqual(await backupStatus({ BACKUPS }, NOW), { backups_r2: true, backup_ever: true, backup_recent: false });
  } finally {
    console.error = original;
  }
  fail = false;
  assert.deepEqual(await backupStatus({ BACKUPS }, NOW), { backups_r2: true, backup_ever: false, backup_recent: false }, "asked again");
});

test("/api/health reports the flags as booleans only, and a stale backup does not make the site unready", async () => {
  const env = baseEnv({ BACKUPS: fakeR2({ clock: () => new Date(Date.now() - 100 * HOUR) }) });
  await runBackup({ ...env, SUBSCRIBERS: seedKV() }, { now: new Date(Date.now() - 100 * HOUR) });
  const response = await worker.fetch(edge("https://vroelabs.com/api/health"), env);
  const body = await response.json();

  assert.equal(response.status, 200, "ready does not depend on the backup");
  assert.equal(body.ready, true);
  assert.deepEqual(body.configured.backups_r2, true);
  assert.equal(body.configured.backup_ever, true);
  assert.equal(body.configured.backup_recent, false);
  for (const [name, value] of Object.entries(body.configured)) assert.equal(typeof value, "boolean", `${name} is a boolean`);
  assert.doesNotMatch(JSON.stringify(body), /\d{4}-\d{2}-\d{2}|count|subscribers\//, "no date, count or key is disclosed");
});

function seedKV() {
  const kv = fakeKV();
  seed(kv, 2);
  return kv;
}

test("/api/health still answers when the bucket is not bound", async () => {
  const response = await worker.fetch(edge("https://vroelabs.com/api/health"), baseEnv());
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.configured.backups_r2, false);
});
