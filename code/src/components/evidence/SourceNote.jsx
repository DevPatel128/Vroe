/**
 * The citation under a figure: the study, its year, and where in it the number
 * lives. Every figure on the page carries one — a number without a source is
 * not allowed onto the page (see content/evidence/derive.js).
 */
export function SourceNote({ data, story, record }) {
  const source = data.sources[record.sourceId];
  return (
    <p className="source-note">
      <a href={source.url} rel="noopener noreferrer">{source.shortName}</a>
      {`, ${record.year}. ${record.sourceLocator}.`}
      {record.confidence === "medium" ? (
        <span className="source-confidence">{` ${story.method.confidenceMedium}.`}</span>
      ) : null}
    </p>
  );
}
