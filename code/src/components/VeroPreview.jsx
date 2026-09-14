import { Buildings, CheckCircle, Certificate, UserCircle } from "@phosphor-icons/react/dist/ssr";

/**
 * Decorative illustration of a Vero record — the moment a worker and a
 * business both sign off on a completed job.
 *
 * Every name and figure here is invented for the sake of the picture, same
 * discipline as TrovePreview.jsx. Marked aria-hidden so assistive technology
 * skips it, and every label stays at 11px or larger so nothing here needs the
 * decorative-text exemption that the Trove mock's dense sidebar does.
 */
export function VeroPreview() {
  return (
    <div className="vero-preview" aria-hidden="true">
      <div className="vero-preview-card">
        <div className="vero-preview-top">
          <span className="vero-preview-tag">RECORD</span>
          <span className="vero-preview-status"><CheckCircle weight="fill" /> Confirmed by both sides</span>
        </div>

        <h4>Kitchen fit-out, final stage</h4>
        <p className="vero-preview-sub">Completed 14 June · Ahmedabad</p>

        <div className="vero-preview-parties">
          <div className="vero-preview-party">
            <span className="vero-preview-avatar"><UserCircle weight="fill" /></span>
            <span className="vero-preview-party-label">
              <strong>Worker</strong>
              <span>Signed off</span>
            </span>
            <CheckCircle weight="fill" className="vero-preview-check" />
          </div>
          <div className="vero-preview-party">
            <span className="vero-preview-avatar"><Buildings weight="fill" /></span>
            <span className="vero-preview-party-label">
              <strong>Business</strong>
              <span>Signed off</span>
            </span>
            <CheckCircle weight="fill" className="vero-preview-check" />
          </div>
        </div>

        <div className="vero-preview-footer">
          <Certificate weight="fill" />
          Portable proof, owned by the worker
        </div>
      </div>
    </div>
  );
}
