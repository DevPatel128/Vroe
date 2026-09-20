/**
 * The subscriber backup (scripts/backup-subscribers.mjs).
 *
 * In order of importance: a snapshot can be restored exactly; a failure never
 * leaves something that looks like a good backup; old files do go, and only
 * backup files; the folder can never be committed; nothing personal is printed.
 * The last test runs the whole thing, restore included, against Wrangler's real
 * local simulation.
 */

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  BACKUP_RETENTION_DAYS,
  NEWEST_MAX_AGE_DAYS,
  buildSnapshot,
  checkBackups,
  daysBefore,
  expiredSnapshots,
  readValue,
  runBackup,
} from "../scripts/backup-subscribers.mjs";

const code = fileURLToPath(new URL("../", import.meta.url));
const repo = path.resolve(code, "..");
const NOW = new Date("2026-09-20T10:23:00Z");
const epoch = Math.floor(NOW.getTime() / 1000);

const scratch = () => mkdtempSync(path.join(tmpdir(), "vroe-backup-test-"));

/** Subscribers shaped exactly as the Worker's storeSubscriber writes them. */
function subscribers(count) {
  const store = new Map();
  for (let i = 0; i < count; i++) {
    const key = `sub:${String(i).padStart(6, "0")}`;
    const record = { email: `person${i}@example.test`, subscribed_at: "2026-09-01T10:00:00.000Z", country: "GB", consent: true };
    store.set(key, { value: JSON.stringify(record), expiration: epoch + 700 * 86400 + i, metadata: { subscribed_at: record.subscribed_at } });
  }
  return store;
}

/**
 * A stand-in for Wrangler: answers `kv key list` and `kv bulk get` from a Map, and records the calls.
 * `shape` is how `bulk get` answers: "remote" is Cloudflare's ({ key: value }), "local" is the
 * simulation's ({ key: { value } }). Production and the simulation differ, and the first run
 * against production found it.
 */
function fakeWrangler(store, { failOnBulkCall, shape = "remote" } = {}) {
  const calls = [];
  const run = (args) => {
    calls.push(args);
    const [, sub] = args;
    if (sub === "key") {
      return JSON.stringify([...store].map(([name, v]) => ({ name, ...(v.expiration !== undefined ? { expiration: v.expiration } : {}), ...(v.metadata !== undefined ? { metadata: v.metadata } : {}) })));
    }
    if (sub === "bulk") {
      if (failOnBulkCall === calls.filter((c) => c[1] === "bulk").length) throw new Error("Wrangler exploded");
      const names = JSON.parse(readFileSync(args[3], "utf8"));
      assert.ok(names.length <= 100, "a bulk read takes at most 100 keys");
      return JSON.stringify(Object.fromEntries(names.map((n) => {
        const value = store.get(n)?.value ?? null;
        return [n, shape === "local" && value !== null ? { value } : shape === "local" ? { value: null } : value];
      })));
    }
    throw new Error(`unexpected Wrangler call: ${args.join(" ")}`);
  };
  run.calls = calls;
  return run;
}

const snapshotFile = (dir, date) => path.join(dir, "subscribers", `${date}.json`);
const readSnapshot = (dir, date) => JSON.parse(readFileSync(snapshotFile(dir, date), "utf8"));

/** What `wrangler kv bulk put` does with a snapshot, minus the network. */
function bulkPut(snapshot, target, at = NOW) {
  for (const { key, value, expiration, metadata } of snapshot) {
    if (expiration !== undefined && expiration <= Math.floor(at.getTime() / 1000) + 60) continue; // KV refuses an expiry inside 60 s
    target.set(key, { value, ...(expiration !== undefined ? { expiration } : {}), ...(metadata !== undefined ? { metadata } : {}) });
  }
}

/* Wrangler's real local simulation, for the two tests that use it. */
const wranglerBin = path.join(code, "node_modules", ".bin", "wrangler");
const wranglerEnv = () => ({ ...process.env, CI: "true", WRANGLER_SEND_METRICS: "false", NO_COLOR: "1" });
const wrangler = (args) => execFileSync(wranglerBin, args, { cwd: code, encoding: "utf8", env: wranglerEnv(), stdio: ["ignore", "pipe", "pipe"] });

function seedLocal(state, count) {
  const now = Math.floor(Date.now() / 1000);
  const emails = [];
  const entries = [];
  for (let i = 0; i < count; i++) {
    const email = `local${i}@example.test`;
    emails.push(email);
    const record = { email, subscribed_at: "2026-09-01T10:00:00.000Z", country: i % 2 ? "GB" : "IN", consent: true };
    entries.push({ key: `sub:local${String(i).padStart(3, "0")}`, value: JSON.stringify(record), expiration: now + 700 * 86400 + i, metadata: { subscribed_at: record.subscribed_at } });
  }
  const file = path.join(state, "seed.json");
  writeFileSync(file, JSON.stringify(entries), { mode: 0o600 });
  wrangler(["kv", "bulk", "put", file, "--binding", "SUBSCRIBERS", "--local", "--persist-to", state]);
  rmSync(file);
  return emails;
}

/* ─── The snapshot ─────────────────────────────────────────────────────── */

test("the snapshot is exactly what `wrangler kv bulk put` accepts", () => {
  const dir = scratch();
  runBackup({ wrangler: fakeWrangler(subscribers(5)), dir, now: NOW });
  const snapshot = readSnapshot(dir, "2026-09-20");
  assert.equal(snapshot.length, 5);
  assert.equal(new Set(snapshot.map((e) => e.key)).size, 5, "keys are unique");
  for (const entry of snapshot) {
    assert.deepEqual(Object.keys(entry).sort(), ["expiration", "key", "metadata", "value"]);
    assert.equal(typeof entry.value, "string", "bulk put takes string values");
    assert.ok(Number.isInteger(entry.expiration), "an absolute expiry, in seconds");
    assert.deepEqual(Object.keys(JSON.parse(entry.value)).sort(), ["consent", "country", "email", "subscribed_at"]);
  }
});

test("restoring a snapshot reproduces the list, with each record's original expiry and metadata", () => {
  const dir = scratch();
  const live = subscribers(250);
  runBackup({ wrangler: fakeWrangler(live), dir, now: NOW });

  const restored = new Map();
  bulkPut(readSnapshot(dir, "2026-09-20"), restored);
  assert.deepEqual(restored, live);
});

test("records with no expiry or metadata are backed up without those fields", () => {
  const dir = scratch();
  runBackup({ wrangler: fakeWrangler(new Map([["sub:plain", { value: '{"email":"a@example.test"}' }]])), dir, now: NOW });
  assert.deepEqual(readSnapshot(dir, "2026-09-20"), [{ key: "sub:plain", value: '{"email":"a@example.test"}' }]);
});

test("an empty list still produces a valid, empty snapshot", () => {
  const dir = scratch();
  const result = runBackup({ wrangler: fakeWrangler(new Map()), dir, now: NOW });
  assert.equal(result.count, 0);
  assert.deepEqual(readSnapshot(dir, "2026-09-20"), []);
});

test("a record that vanished between the listing and the read is left out and counted", () => {
  const listed = [{ name: "sub:a" }, { name: "sub:b" }];
  assert.deepEqual(buildSnapshot(listed, new Map([["sub:a", "1"], ["sub:b", null]])), [{ key: "sub:a", value: "1" }]);

  const dir = scratch();
  const store = subscribers(3);
  const wrangler = fakeWrangler(store);
  const original = wrangler.calls; // keep the recorder, wrap the behaviour
  const run = (args) => {
    const out = wrangler(args);
    if (args[1] === "key") store.delete("sub:000001"); // an unsubscribe lands after the listing
    return out;
  };
  run.calls = original;
  const result = runBackup({ wrangler: run, dir, now: NOW });
  assert.equal(result.skipped, 1);
  assert.deepEqual(readSnapshot(dir, "2026-09-20").map((e) => e.key), ["sub:000000", "sub:000002"]);
});

test("more than 100 records are read in batches of at most 100", () => {
  const dir = scratch();
  const wrangler = fakeWrangler(subscribers(250));
  const result = runBackup({ wrangler, dir, now: NOW });
  assert.equal(result.count, 250);
  assert.equal(wrangler.calls.filter((c) => c[1] === "bulk").length, 3, "100 + 100 + 50");
});

test("both shapes of Wrangler's `bulk get` answer give the same backup", () => {
  const store = subscribers(150);
  const remote = scratch();
  const local = scratch();
  runBackup({ wrangler: fakeWrangler(store, { shape: "remote" }), dir: remote, now: NOW });
  runBackup({ wrangler: fakeWrangler(store, { shape: "local" }), dir: local, now: NOW });
  assert.equal(readSnapshot(remote, "2026-09-20").length, 150);
  assert.deepEqual(readSnapshot(local, "2026-09-20"), readSnapshot(remote, "2026-09-20"));
});

test("readValue understands both shapes, treats null as vanished, and refuses anything else", () => {
  assert.equal(readValue({ k: "v" }, "k"), "v");
  assert.equal(readValue({ k: { value: "v" } }, "k"), "v");
  assert.equal(readValue({ k: null }, "k"), null);
  assert.equal(readValue({ k: { value: null } }, "k"), null);
  assert.throws(() => readValue({}, "k"), /did not mention every key/);
  assert.throws(() => readValue(null, "k"), /did not mention every key/);
  assert.throws(() => readValue({ k: 42 }, "k"), /shape this script does not recognise/);
  assert.throws(() => readValue({ k: { value: 42 } }, "k"), /shape this script does not recognise/);
  assert.throws(() => readValue({ k: { other: "v" } }, "k"), /shape this script does not recognise/);
});

test("a list with keys whose values cannot be read fails, and writes nothing, instead of writing an empty backup", () => {
  for (const answer of ["{}", '{"sub:000000":null,"sub:000001":null,"sub:000002":null}', '{"sub:000000":42}']) {
    const dir = scratch();
    const inner = fakeWrangler(subscribers(3));
    const run = (args) => (args[1] === "bulk" ? answer : inner(args));
    assert.throws(() => runBackup({ wrangler: run, dir, now: NOW }), /Backup failed/, `answer ${answer}`);
    assert.equal(existsSync(path.join(dir, "subscribers")), false, "nothing written");
  }
});

test("running twice on one day overwrites; a new day adds a file", () => {
  const dir = scratch();
  runBackup({ wrangler: fakeWrangler(subscribers(3)), dir, now: NOW });
  runBackup({ wrangler: fakeWrangler(subscribers(4)), dir, now: new Date("2026-09-20T20:00:00Z") });
  assert.deepEqual(readdirSync(path.join(dir, "subscribers")), ["2026-09-20.json"]);
  assert.equal(readSnapshot(dir, "2026-09-20").length, 4);

  runBackup({ wrangler: fakeWrangler(subscribers(4)), dir, now: new Date("2026-09-21T10:00:00Z") });
  assert.deepEqual(readdirSync(path.join(dir, "subscribers")).sort(), ["2026-09-20.json", "2026-09-21.json"]);
});

test("the files and the folder are readable only by their owner", { skip: process.platform === "win32" }, () => {
  const dir = scratch();
  runBackup({ wrangler: fakeWrangler(subscribers(2)), dir, now: NOW });
  assert.equal(statSync(snapshotFile(dir, "2026-09-20")).mode & 0o777, 0o600);
  assert.equal(statSync(path.join(dir, "subscribers")).mode & 0o077, 0, "no access for group or others");
});

/* ─── Retention ────────────────────────────────────────────────────────── */

test("snapshots inside the window are kept and older ones are deleted", () => {
  assert.equal(BACKUP_RETENTION_DAYS, 30);
  const dir = scratch();
  mkdirSync(path.join(dir, "subscribers"), { recursive: true });
  for (const d of ["2026-08-20", "2026-08-21", "2026-08-22", "2026-09-01", "2026-09-19"]) writeFileSync(snapshotFile(dir, d), "[]");

  const result = runBackup({ wrangler: fakeWrangler(subscribers(1)), dir, now: NOW }); // window: 08-22 to 09-20, thirty days
  assert.equal(result.pruned, 2);
  assert.deepEqual(readdirSync(path.join(dir, "subscribers")).sort(), ["2026-08-22.json", "2026-09-01.json", "2026-09-19.json", "2026-09-20.json"]);
});

test("the window is exactly thirty days across month, year and leap-day boundaries", () => {
  for (const [today, oldestKept, newestDeleted] of [
    ["2026-10-01", "2026-09-02", "2026-09-01"],
    ["2027-01-05", "2026-12-07", "2026-12-06"],
    ["2028-03-01", "2028-02-01", "2028-01-31"], // through a leap February: 1 March plus 29 days
  ]) {
    const gone = expiredSnapshots([`${oldestKept}.json`, `${newestDeleted}.json`], today);
    assert.deepEqual(gone, [`${newestDeleted}.json`], `on ${today}`);
  }
  assert.equal(daysBefore("2028-03-01", 1), "2028-02-29");
});

test("only files named like a dated snapshot are ever deleted", () => {
  const files = ["2020-01-01.json", "notes.txt", "2020-01-01.json.bak", "2020-01-01.txt", "latest.json", ".DS_Store"];
  assert.deepEqual(expiredSnapshots(files, "2026-09-20"), ["2020-01-01.json"]);
});

test("a half-written file left by a crashed run is removed by the next run", () => {
  const dir = scratch();
  mkdirSync(path.join(dir, "subscribers"), { recursive: true });
  writeFileSync(path.join(dir, "subscribers", "2026-09-19.json.partial"), "[");
  runBackup({ wrangler: fakeWrangler(subscribers(1)), dir, now: NOW });
  assert.deepEqual(readdirSync(path.join(dir, "subscribers")), ["2026-09-20.json"]);
});

/* ─── Failure leaves no false comfort ──────────────────────────────────── */

test("if a read fails part-way, nothing is written and yesterday's backup is untouched", () => {
  const dir = scratch();
  runBackup({ wrangler: fakeWrangler(subscribers(3)), dir, now: new Date("2026-09-19T10:00:00Z") });
  const yesterday = readFileSync(snapshotFile(dir, "2026-09-19"), "utf8");

  assert.throws(() => runBackup({ wrangler: fakeWrangler(subscribers(250), { failOnBulkCall: 2 }), dir, now: NOW }), /Wrangler exploded/);
  assert.deepEqual(readdirSync(path.join(dir, "subscribers")), ["2026-09-19.json"]);
  assert.equal(readFileSync(snapshotFile(dir, "2026-09-19"), "utf8"), yesterday);
});

test("if Wrangler's answer is not JSON, it says how to check the login and writes nothing", () => {
  const dir = scratch();
  assert.throws(() => runBackup({ wrangler: () => "You are not logged in", dir, now: NOW }), /Are you logged in.*Nothing was written/s);
  assert.equal(existsSync(path.join(dir, "subscribers")), false);
});

test("Wrangler's banner before the JSON does not break parsing", () => {
  const dir = scratch();
  const store = subscribers(2);
  const inner = fakeWrangler(store);
  runBackup({ wrangler: (args) => `⛅️ wrangler 4\n─────\nResource location: remote\n${inner(args)}`, dir, now: NOW });
  assert.equal(readSnapshot(dir, "2026-09-20").length, 2);
});

test("the temporary file of key names is deleted, even when a read fails", () => {
  const seen = [];
  const store = subscribers(3);
  const inner = fakeWrangler(store);
  const run = (args) => {
    if (args[1] === "bulk") seen.push(args[3]);
    if (args[1] === "bulk") throw new Error("boom");
    return inner(args);
  };
  assert.throws(() => runBackup({ wrangler: run, dir: scratch(), now: NOW }), /boom/);
  assert.equal(seen.length, 1);
  assert.equal(existsSync(seen[0]), false, "the key file is gone");
  assert.equal(existsSync(path.dirname(seen[0])), false, "and so is its folder");
});

/* ─── The check ────────────────────────────────────────────────────────── */

test("the check passes for a backup dated today or yesterday, and fails after that", () => {
  assert.equal(NEWEST_MAX_AGE_DAYS, 1);
  assert.equal(checkBackups(["2026-09-20.json"], NOW).ok, true);
  assert.equal(checkBackups(["2026-09-19.json"], NOW).ok, true, "one late run is not an alarm");
  const stale = checkBackups(["2026-09-18.json"], NOW);
  assert.equal(stale.ok, false);
  assert.match(stale.problems[0], /2026-09-18.*today or yesterday/);
});

test("the check fails when there is no backup at all", () => {
  const none = checkBackups([], NOW);
  assert.equal(none.ok, false);
  assert.match(none.problems[0], /no backup yet/);
});

test("the check fails when an old backup was kept past its retention, or a partial file remains", () => {
  const overdue = checkBackups(["2026-09-20.json", "2026-07-01.json"], NOW);
  assert.equal(overdue.ok, false);
  assert.match(overdue.problems.join(" "), /older than 30 days/);
  const partial = checkBackups(["2026-09-20.json", "2026-09-19.json.partial"], NOW);
  assert.equal(partial.ok, false);
  assert.match(partial.problems.join(" "), /half-written/);
});

/* ─── It can never be committed ────────────────────────────────────────── */

test("the backups folder is gitignored, and nothing under it is tracked", () => {
  for (const file of ["backups/subscribers/2026-09-20.json", "backups/anything", "backups/subscribers/2026-09-20.json.partial"]) {
    const ignored = spawnSync("git", ["check-ignore", "-q", file], { cwd: repo });
    assert.equal(ignored.status, 0, `git must ignore ${file}`);
  }
  const tracked = execFileSync("git", ["ls-files", "backups"], { cwd: repo, encoding: "utf8" });
  assert.equal(tracked.trim(), "", "no file under backups/ may be tracked");
});

/* ─── Nothing personal is printed ──────────────────────────────────────── */

test("the command prints counts and dates only", () => {
  const dir = scratch();
  const state = scratch();
  // Seed Wrangler's local simulation, then run the real command against it.
  const emails = seedLocal(state, 4);
  const out = spawnSync(process.execPath, [path.join(code, "scripts", "backup-subscribers.mjs"), "--dir", dir, "--local-state", state], { cwd: code, encoding: "utf8", env: wranglerEnv() });
  assert.equal(out.status, 0, out.stderr);
  const printed = out.stdout + out.stderr;
  assert.match(printed, /Subscriber backup written: \d{4}-\d{2}-\d{2}, 4 records/);
  for (const email of emails) assert.ok(!printed.includes(email), "no address is printed");
  assert.doesNotMatch(printed, /sub:/, "no key is printed");
});

/* ─── The whole thing, against Wrangler's real local simulation ────────── */

test("end to end: back up a real (local) KV namespace, restore into a fresh one, and the lists are identical", { timeout: 180_000, skip: !existsSync(wranglerBin) }, () => {
  const live = scratch();
  const fresh = scratch();
  const dir = scratch();
  seedLocal(live, 25);

  const backup = spawnSync(process.execPath, [path.join(code, "scripts", "backup-subscribers.mjs"), "--dir", dir, "--local-state", live], { cwd: code, encoding: "utf8", env: wranglerEnv() });
  assert.equal(backup.status, 0, backup.stderr);

  const [file] = readdirSync(path.join(dir, "subscribers"));
  const restoreFile = path.join(fresh, "restore.json");
  const now = Math.floor(Date.now() / 1000);
  const snapshot = JSON.parse(readFileSync(path.join(dir, "subscribers", file), "utf8"));
  writeFileSync(restoreFile, JSON.stringify(snapshot.filter((e) => e.expiration === undefined || e.expiration > now + 120)));
  wrangler(["kv", "bulk", "put", restoreFile, "--binding", "SUBSCRIBERS", "--local", "--persist-to", fresh]);

  const list = (state) => JSON.parse(wrangler(["kv", "key", "list", "--binding", "SUBSCRIBERS", "--local", "--persist-to", state]));
  assert.equal(list(live).length, 25);
  assert.deepEqual(list(fresh), list(live), "the same keys, expiries and metadata");
  for (const key of ["sub:local000", "sub:local024"]) {
    const get = (state) => wrangler(["kv", "key", "get", key, "--binding", "SUBSCRIBERS", "--local", "--persist-to", state]);
    assert.equal(get(fresh), get(live), `${key} has the same value`);
  }
});
