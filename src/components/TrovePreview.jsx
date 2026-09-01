import {
  ArrowUpRight, ChartLineUp, House, ShieldCheck, Sparkle, Target, Wallet,
} from "@phosphor-icons/react/dist/ssr";

const NAVIGATION = [
  { label: "Overview", icon: House, active: true },
  { label: "Transactions", icon: Wallet },
  { label: "Insights", icon: ChartLineUp },
  { label: "Goals", icon: Target },
];

/* Twelve bars. Their heights are set by .bars span:nth-child() in
   products.css — an inline style attribute would be blocked by the CSP. */
const BARS = Array.from({ length: 12 });

const TRANSACTIONS = [
  { name: "Grocery store", when: "Today", amount: "798.42", Icon: House },
  { name: "Rent transfer", when: "Yesterday", amount: "12,000", Icon: ShieldCheck },
  { name: "Coffee club", when: "10 Jun", amount: "245.00", Icon: Sparkle },
];

/**
 * Decorative illustration of the Trove interface.
 *
 * Every figure here is invented for the sake of the picture. It is marked
 * aria-hidden so assistive technology skips it entirely rather than reading out
 * numbers that look like someone's real balance, and the surrounding card copy
 * carries the actual meaning.
 */
export function TrovePreview() {
  return (
    <div className="trove-preview" aria-hidden="true">
      <aside className="trove-sidebar">
        <div className="trove-brand-lockup">
          <span className="trove-mark"><Wallet weight="fill" /></span>
          <span>Trove</span>
        </div>
        <div className="trove-user">
          <span className="avatar">D</span>
          <span>Devu</span>
        </div>
        <nav className="trove-nav">
          {NAVIGATION.map(({ label, icon: Icon, active }) => (
            <span className={`trove-nav-item${active ? " is-active" : ""}`} key={label}>
              <Icon weight={active ? "fill" : "regular"} />
              {label}
            </span>
          ))}
        </nav>
        <div className="trove-sidebar-note">
          <span className="eyebrow">THIS MONTH</span>
          <strong>₹ 18,420</strong>
          <span className="positive">+8% saved</span>
        </div>
      </aside>

      <div className="trove-main">
        <div className="trove-preview-topline">
          <span className="eyebrow">WEDNESDAY, 12 JUNE</span>
          <span className="trove-status"><span /> In control</span>
        </div>

        <div className="trove-balance-row">
          <div>
            <span className="eyebrow">TOTAL BALANCE</span>
            <strong>₹ 54,208.62</strong>
            <span className="positive">+2.5% this month</span>
          </div>
          <span className="mini-action"><ArrowUpRight /></span>
        </div>

        <div className="trove-grid">
          <div className="trove-card chart-card">
            <div className="card-heading"><span>Spending</span><span className="muted">This month</span></div>
            <div className="bars">
              {BARS.map((_, i) => <span key={i} />)}
            </div>
            <div className="chart-labels"><span>1 Jun</span><span>12 Jun</span><span>30 Jun</span></div>
          </div>

          <div className="trove-card goal-card">
            <div className="card-heading"><span>Next goal</span><Target /></div>
            <strong>Emergency fund</strong>
            <span className="muted">₹ 32,000 of ₹ 50,000</span>
            <div className="goal-track"><span /></div>
          </div>
        </div>

        <div className="trove-transactions">
          <div className="card-heading"><span>Recent activity</span><span className="muted">See all</span></div>
          {TRANSACTIONS.map(({ name, when, amount, Icon }) => (
            <div className="transaction" key={name}>
              <span className="transaction-icon"><Icon /></span>
              <span><strong>{name}</strong><small>{when}</small></span>
              <strong className="transaction-amount">− ₹ {amount}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
