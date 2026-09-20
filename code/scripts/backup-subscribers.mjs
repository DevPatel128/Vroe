#!/usr/bin/env node
/**
 * Back up the subscriber list to this computer.
 *
 *   npm run backup                 writes backups/subscribers/YYYY-MM-DD.json
 *   npm run backup:check           fails if the newest backup is stale, or an old one was kept
 *
 * It reads the live SUBSCRIBERS namespace through Wrangler, using the maintainer's
 * own login, and writes one file per day in the exact format `wrangler kv bulk put`
 * reads ({ key, value, expiration, metadata }), so a restore needs no custom code
 * and every record keeps its expiry. Snapshots older than BACKUP_RETENTION_DAYS are
 * deleted by the same run. See docs/06_OPERATIONS/BACKUPS.md and
 * docs/06_OPERATIONS/RUNBOOKS/RESTORE-SUBSCRIBERS.md.
 *
 * The folder is personal data. It is gitignored (a test proves it), the files are
 * readable only by their owner, and nothing here prints a key or an address.
 *
 * Flags: --dir <path> to write somewhere else; --local-state <path> to read
 * Wrangler's local simulation instead of production (for rehearsals).
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Mirrors BACKUP_RETENTION_DAYS in src/content/legal.js. Both must change together. */
export const BACKUP_RETENTION_DAYS = 30;

/** The newest backup must be dated today or yesterday (UTC), so one late run is not an alarm. */
export const NEWEST_MAX_AGE_DAYS = 1;

const KEYS_PER_READ = 100;
const SNAPSHOT_FILE = /^(\d{4}-\d{2}-\d{2})\.json$/;
const LEFTOVER_FILE = /^\d{4}-\d{2}-\d{2}\.json\.partial$/;

const isoDate = (date) => date.toISOString().slice(0, 10);

/** The date `days` days before `date` (a YYYY-MM-DD string), by UTC calendar arithmetic. */
export function daysBefore(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return isoDate(d);
}

/**
 * Join the key listing (names, expiries, metadata) to the values.
 * A key with no value was deleted or expired between the two reads and is left out.
 *
 * @param {{ name: string, expiration?: number, metadata?: unknown }[]} listed
 * @param {Map<string, string | null>} values
 */
export function buildSnapshot(listed, values) {
  const entries = [];
  for (const k of listed) {
    const value = values.get(k.name);
    if (value === null || value === undefined) continue;
    const entry = { key: k.name, value };
    if (k.expiration !== undefined) entry.expiration = k.expiration;
    if (k.metadata !== undefined && k.metadata !== null) entry.metadata = k.metadata;
    entries.push(entry);
  }
  return entries;
}

/**
 * The dated snapshots that have left the retention window: the newest
 * BACKUP_RETENTION_DAYS are kept (today and the days before it). Only files named
 * like a dated snapshot are ever candidates.
 *
 * @param {string[]} files  file names in the snapshot folder
 * @param {string} today    YYYY-MM-DD
 */
export function expiredSnapshots(files, today, retention = BACKUP_RETENTION_DAYS) {
  const oldestKept = daysBefore(today, retention - 1);
  return files.filter((f) => {
    const m = SNAPSHOT_FILE.exec(f);
    return m !== null && m[1] < oldestKept;
  });
}

/**
 * Is the backup in a good state? Both directions matter: a backup that stopped
 * happening, and old files that were never deleted, which would break the
 * retention the privacy policy states.
 *
 * @param {string[]} files
 * @param {Date} now
 */
export function checkBackups(files, now, retention = BACKUP_RETENTION_DAYS) {
  const dated = files.map((f) => SNAPSHOT_FILE.exec(f)?.[1]).filter(Boolean).sort();
  const problems = [];
  const today = isoDate(now);
  const newest = dated.length ? dated[dated.length - 1] : null;

  if (newest === null) {
    problems.push("There is no backup yet. Run `npm run backup`.");
  } else if (newest < daysBefore(today, NEWEST_MAX_AGE_DAYS)) {
    problems.push(`The newest backup is dated ${newest}; it should be dated today or yesterday (UTC). Run \`npm run backup\`, and schedule it.`);
  }
  const overdue = expiredSnapshots(files, today, retention);
  if (overdue.length > 0) {
    problems.push(`${overdue.length} backup(s) are older than ${retention} days and were not deleted. Run \`npm run backup\`, which deletes them. The privacy policy promises ${retention} days.`);
  }
  if (files.some((f) => LEFTOVER_FILE.test(f))) {
    problems.push("A half-written backup was left behind. Run `npm run backup`, which deletes it.");
  }
  return { ok: problems.length === 0, problems, newest };
}

/**
 * @param {object} options
 * @param {(args: string[]) => string} options.wrangler  runs a Wrangler command, returns stdout
 * @param {string} options.dir        the backups folder
 * @param {Date} [options.now]
 * @param {string[]} [options.target] Wrangler flags choosing what to read
 */
export function runBackup({ wrangler, dir, now = new Date(), target = ["--remote"] }) {
  const listed = parseJson(wrangler(["kv", "key", "list", "--binding", "SUBSCRIBERS", ...target]), "the key listing");
  if (!Array.isArray(listed)) throw new Error("Backup failed: Wrangler's key listing was not a list. Nothing was written.");

  // Values, a hundred keys per Wrangler call. The key names go through a temporary
  // file that only this user can read and that is deleted straight away.
  const scratch = mkdtempSync(path.join(tmpdir(), "vroe-backup-"));
  const values = new Map();
  try {
    for (let i = 0; i < listed.length; i += KEYS_PER_READ) {
      const names = listed.slice(i, i + KEYS_PER_READ).map((k) => k.name);
      const keysFile = path.join(scratch, "keys.json");
      writeFileSync(keysFile, JSON.stringify(names), { mode: 0o600 });
      const batch = parseJson(wrangler(["kv", "bulk", "get", keysFile, "--binding", "SUBSCRIBERS", ...target]), "a value read");
      for (const name of names) values.set(name, batch?.[name]?.value ?? null);
    }
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }

  const entries = buildSnapshot(listed, values);
  const date = isoDate(now);
  const folder = path.join(dir, "subscribers");
  mkdirSync(folder, { recursive: true, mode: 0o700 });

  // Written last and renamed into place, so a failure earlier leaves yesterday's
  // backup as the newest and a crash mid-write never leaves half a file that looks whole.
  const finalPath = path.join(folder, `${date}.json`);
  const tempPath = `${finalPath}.partial`;
  writeFileSync(tempPath, JSON.stringify(entries), { mode: 0o600 });
  renameSync(tempPath, finalPath);

  // Old snapshots, and any half-written file a crashed run left behind: a leftover
  // is personal data too, and would otherwise outlive the retention period.
  const present = readdirSync(folder);
  const doomed = [...expiredSnapshots(present, date), ...present.filter((f) => LEFTOVER_FILE.test(f))];
  for (const f of doomed) rmSync(path.join(folder, f));

  return { date, count: entries.length, skipped: listed.length - entries.length, pruned: doomed.length };
}

function parseJson(text, what) {
  // Wrangler prints its banner on stderr, but be forgiving: start at the first line that opens JSON.
  const start = text.search(/^[[{]/m);
  try {
    return JSON.parse(start >= 0 ? text.slice(start) : text);
  } catch {
    throw new Error(`Backup failed: could not read ${what} from Wrangler. Are you logged in (\`npx wrangler whoami\`)? Nothing was written.`);
  }
}

/* ─── Command line ─────────────────────────────────────────────────────── */

function main() {
  const codeDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const repoRoot = path.resolve(codeDir, "..");
  const argv = process.argv.slice(2);
  const flag = (name) => {
    const i = argv.indexOf(name);
    return i === -1 ? undefined : argv[i + 1];
  };
  const dir = path.resolve(flag("--dir") ?? path.join(repoRoot, "backups"));

  if (argv.includes("--check")) {
    const folder = path.join(dir, "subscribers");
    const files = existsSync(folder) ? readdirSync(folder) : [];
    const result = checkBackups(files, new Date());
    if (result.newest) console.log(`Newest backup: ${result.newest}`);
    for (const p of result.problems) console.error(`::error::${p}`);
    if (!result.ok) process.exit(1);
    console.log("Backups are current.");
    return;
  }

  const localState = flag("--local-state");
  const target = localState ? ["--local", "--persist-to", path.resolve(localState)] : ["--remote"];
  const wranglerBin = path.join(codeDir, "node_modules", ".bin", "wrangler");
  const wrangler = (args) =>
    execFileSync(wranglerBin, args, { cwd: codeDir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 28 });

  try {
    const result = runBackup({ wrangler, dir, target });
    console.log(`Subscriber backup written: ${result.date}, ${result.count} records, ${result.pruned} old backup(s) deleted.`);
    if (result.skipped > 0) console.log(`${result.skipped} record(s) expired or were deleted while it ran and were left out.`);
  } catch (error) {
    console.error(error?.message ?? "Backup failed.");
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
