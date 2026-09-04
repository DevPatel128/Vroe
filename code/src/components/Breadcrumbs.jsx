/**
 * Visible breadcrumb trail. The matching BreadcrumbList JSON-LD is emitted by
 * src/seo/JsonLd.jsx from the same `trail` array, so the structured data can
 * never describe a trail the page does not actually show.
 */
export function Breadcrumbs({ trail }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {trail.map((crumb, i) => {
        const isLast = i === trail.length - 1;
        return (
          <span key={crumb.href}>
            {i > 0 && <span aria-hidden="true">/&nbsp;</span>}
            {isLast ? (
              <span aria-current="page">{crumb.label}</span>
            ) : (
              <>
                <a href={crumb.href}>{crumb.label}</a>{" "}
              </>
            )}
          </span>
        );
      })}
    </nav>
  );
}
