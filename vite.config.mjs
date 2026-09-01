import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Vite builds only two things for the browser: the stylesheet and
 * src/client/enhance.js. There is no React entry point, because no React runs
 * in the browser — scripts/prerender.mjs imports the components directly and
 * renders them to HTML at build time.
 *
 * `manifest: true` is what lets the prerenderer discover the hashed asset
 * filenames so it can write correct <link> and <script> tags.
 */
export default defineConfig({
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
    manifest: true,
    // Source maps would publish the original sources to anyone who opens
    // devtools. Nothing here is secret, but it is needless exposure and the
    // security tests assert no .map file is ever emitted.
    sourcemap: false,
    rollupOptions: {
      input: {
        enhance: "src/client/enhance.js",
        styles: "src/styles/index.css",
      },
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  plugins: [react()],
  server: { host: "127.0.0.1", port: 5173 },
});
