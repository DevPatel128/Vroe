/** Shared fakes for the worker tests. */

/**
 * In-memory KV double: get (one key or up to 100), put with expiry and metadata,
 * delete and list with a cursor. `ops` counts requests to it, which is what the
 * Workers Free plan's limit on requests to Cloudflare services counts.
 *
 * `store` maps key to value and `meta` maps key to { expiration, metadata }, so
 * tests that only care about values can ignore `meta`.
 */
export function fakeKV(initial = {}) {
  const store = new Map(Object.entries(initial));
  const meta = new Map();
  const now = () => Math.floor(Date.now() / 1000);
  const live = (key) => {
    const expiration = meta.get(key)?.expiration;
    return store.has(key) && !(expiration !== undefined && expiration <= now());
  };
  const kv = {
    store,
    meta,
    ops: 0,
    async get(key) {
      kv.ops++;
      if (Array.isArray(key)) {
        if (key.length > 100) throw new Error("KV bulk get takes at most 100 keys");
        return new Map(key.map((k) => [k, live(k) ? store.get(k) : null]));
      }
      return live(key) ? store.get(key) : null;
    },
    async put(key, value, options = {}) {
      kv.ops++;
      store.set(key, value);
      const entry = {};
      if (options.expiration !== undefined) entry.expiration = options.expiration;
      else if (options.expirationTtl !== undefined) entry.expiration = now() + options.expirationTtl;
      if (options.metadata !== undefined) entry.metadata = options.metadata;
      meta.set(key, entry);
    },
    async delete(key) {
      kv.ops++;
      store.delete(key);
      meta.delete(key);
    },
    async list({ prefix = "", cursor, limit = 1000 } = {}) {
      kv.ops++;
      if (limit > 1000) throw new Error("KV list returns at most 1000 keys");
      const names = [...store.keys()].filter((k) => k.startsWith(prefix) && live(k)).sort();
      const from = cursor ? Number(cursor) : 0;
      const page = names.slice(from, from + limit);
      const complete = from + limit >= names.length;
      return {
        keys: page.map((name) => ({ name, ...meta.get(name) })),
        list_complete: complete,
        cursor: complete ? undefined : String(from + limit),
      };
    },
  };
  return kv;
}

/**
 * In-memory R2 double: put, get, head, list with a cursor, and delete of up to 1000
 * keys. `clock` supplies the upload time, so a test can age an object.
 */
export function fakeR2({ clock = () => new Date() } = {}) {
  const objects = new Map();
  const describe = (key, o) => ({ key, size: o.body.length, uploaded: o.uploaded, customMetadata: o.customMetadata });
  const r2 = {
    objects,
    ops: 0,
    async put(key, body, options = {}) {
      r2.ops++;
      const o = { body: String(body), customMetadata: options.customMetadata ?? {}, uploaded: clock() };
      objects.set(key, o);
      return describe(key, o);
    },
    async head(key) {
      r2.ops++;
      return objects.has(key) ? describe(key, objects.get(key)) : null;
    },
    async get(key) {
      r2.ops++;
      if (!objects.has(key)) return null;
      const o = objects.get(key);
      return { ...describe(key, o), text: async () => o.body, json: async () => JSON.parse(o.body) };
    },
    async list({ prefix = "", cursor, limit = 1000 } = {}) {
      r2.ops++;
      const keys = [...objects.keys()].filter((k) => k.startsWith(prefix)).sort();
      const from = cursor ? Number(cursor) : 0;
      const truncated = from + limit < keys.length;
      return {
        objects: keys.slice(from, from + limit).map((k) => describe(k, objects.get(k))),
        truncated,
        cursor: truncated ? String(from + limit) : undefined,
      };
    },
    async delete(keys) {
      r2.ops++;
      const list = Array.isArray(keys) ? keys : [keys];
      if (list.length > 1000) throw new Error("R2 delete takes at most 1000 keys");
      for (const k of list) objects.delete(k);
    },
  };
  return r2;
}

/**
 * Minimal ASSETS double.
 * @param {Record<string, {status?: number, body?: string, type?: string}>} files
 */
export function fakeAssets(files) {
  const calls = [];
  return {
    calls,
    async fetch(request) {
      const url = new URL(request.url);
      calls.push(url.pathname + url.search);
      const file = files[url.pathname];
      if (!file) return new Response("missing", { status: 404 });
      return new Response(file.body ?? "ok", {
        status: file.status ?? 200,
        headers: { "Content-Type": file.type ?? "text/html; charset=utf-8" },
      });
    },
  };
}

export function baseEnv(overrides = {}) {
  return {
    ASSETS: fakeAssets({
      "/index.html": { body: "<!doctype html><html><body>home</body></html>" },
      "/404.html": { body: "<!doctype html><html><body>not found</body></html>" },
      "/assets/styles-abc12345.css": { body: "body{}", type: "text/css" },
      "/fonts/dm-sans-latin-400-normal.woff2": { body: "font", type: "font/woff2" },
    }),
    RATE_LIMIT: fakeKV(),
    SUBSCRIBERS: fakeKV(),
    ...overrides,
  };
}

/**
 * A request as Cloudflare's edge delivers it.
 *
 * CF-Ray is what tells the worker it is running in production rather than under
 * `wrangler dev`; canonicalRedirect ignores anything without it. Redirect tests
 * must therefore go through here to exercise the real code path.
 *
 * @param {string} url Absolute URL
 * @param {RequestInit} [init]
 */
export function edge(url, init = {}) {
  return new Request(url, {
    ...init,
    headers: { Accept: "text/html", "CF-Ray": "8f2a1c0d4e6b0000-LHR", ...init.headers },
  });
}

export function post(path, body, headers = {}) {
  return new Request(`https://vroelabs.com${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://vroelabs.com",
      "CF-Connecting-IP": "203.0.113.10",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

export function get(path, headers = {}) {
  return new Request(`https://vroelabs.com${path}`, {
    method: "GET",
    headers: { Accept: "text/html", ...headers },
  });
}
