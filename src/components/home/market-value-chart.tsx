import { money } from "@/lib/format";

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function MarketValueChart({
  tradeIn,
  wholesale,
  retail,
}: {
  tradeIn: number;
  wholesale: number;
  retail: number;
}) {
  const low = Math.min(tradeIn, wholesale, retail);
  const high = Math.max(tradeIn, wholesale, retail);
  const span = Math.max(1, high - low);
  const pin = clamp(((wholesale - low) / span) * 100, 6, 94);

  return (
    <div
      className="homeValueChart"
      role="img"
      aria-label={`Trade-in ${money(tradeIn)}, wholesale ${money(wholesale)}, retail ${money(retail)}`}
    >
      <div className="homeValuePinWrap">
        <div className="homeValuePin" style={{ left: `${pin}%` }}>
          <div className="homeValuePinCard">
            <strong>{money(wholesale)}</strong>
            <span>Wholesale</span>
          </div>
          <i />
        </div>
      </div>

      <div className="homeValueRail">
        <span className="is-great">Great</span>
        <span className="is-fair">Fair</span>
        <span className="is-high">High</span>
      </div>
      <ul className="homeValueStops">
        <li className="is-trade">
          <i />
          <span>
            <small>Trade-in</small>
            <em>Great deal</em>
          </span>
          <b>{money(tradeIn)}</b>
        </li>
        <li className="is-whole">
          <i />
          <span>
            <small>Wholesale</small>
            <em>Fair book</em>
          </span>
          <b>{money(wholesale)}</b>
        </li>
        <li className="is-retail">
          <i />
          <span>
            <small>Retail</small>
            <em>Asking high</em>
          </span>
          <b>{money(retail)}</b>
        </li>
      </ul>
    </div>
  );
}
