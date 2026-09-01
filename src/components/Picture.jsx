import images from "../generated/images.json";

/**
 * Responsive <picture> driven by the manifest that scripts/optimize-images.mjs
 * writes. AVIF first, then WebP, then a JPEG the oldest browser can read.
 *
 * width/height always come from the manifest so the browser can reserve the
 * right box before the bytes arrive — that is what holds Cumulative Layout
 * Shift at zero. `priority` marks the LCP image: it opts out of lazy loading
 * and asks the browser to fetch it ahead of other resources.
 */
export function Picture({ name, alt, sizes, className, priority = false }) {
  const entry = images[name];
  if (!entry) throw new Error(`Unknown image "${name}". Run npm run build:images.`);

  return (
    <picture>
      <source type="image/avif" srcSet={entry.sources.avif.srcset} sizes={sizes} />
      <source type="image/webp" srcSet={entry.sources.webp.srcset} sizes={sizes} />
      <img
        className={className}
        src={entry.fallback}
        srcSet={entry.sources.jpg.srcset}
        sizes={sizes}
        alt={alt}
        width={entry.width}
        height={entry.height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        {...(priority ? { fetchPriority: "high" } : {})}
      />
    </picture>
  );
}
