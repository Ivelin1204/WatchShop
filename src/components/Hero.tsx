import { priceFor } from '../data/product';
import { money } from '../lib/format';
import { delay } from '../lib/style';
import { WatchFace } from './watch/WatchFace';

export function Hero() {
  return (
    <section className="hero" id="top" data-enter>
      <div className="wrap hero__grid">
        <div className="hero__copy">
          <p className="eyebrow enter" style={delay(0)}>
            Meridian Chronograph · Made in Sofia
          </p>
          <h1 className="hero__title enter" style={delay(80)}>
            An automatic chronograph <em>in 40&nbsp;mm of steel.</em>
          </h1>
          <p className="hero__lead enter" style={delay(160)}>
            Two counters, a date and a Swiss automatic movement, behind sapphire front and back and sealed
            to 100&nbsp;m. Built in small batches and timed by hand before it ships.
          </p>
          <div className="hero__actions enter" style={delay(240)}>
            <a className="btn btn--solid" href="#buy">
              Choose your Meridian
            </a>
            <a className="btn btn--ghost" href="#details">
              See the details
            </a>
          </div>
          <ul className="hero__facts enter" style={delay(320)}>
            <li>
              <strong>{money(priceFor('bracelet'))}</strong> on the steel bracelet
            </li>
            <li>Free EU delivery</li>
            <li>5-year warranty</li>
          </ul>
        </div>

        <div className="hero__stage enter enter--stage" style={delay(120)}>
          <WatchFace dial="slate" strap="bracelet" view="full" className="hero__watch" title="Meridian Chronograph with slate dial on the steel bracelet, showing the time now" />
        </div>
      </div>
    </section>
  );
}
