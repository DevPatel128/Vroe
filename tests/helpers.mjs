/** Shared fakes for the worker tests. */

/** In-memory KV double with the subset of the API the worker uses. */
export function fakeKV(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    store,
    async get(key) {
      return store.has(key) ? store.get(key) : null;
    },
    async put(key, value) {
      store.set(key, value);
    },
    async delete(key) {
      store.delete(key);
    },
  };
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
