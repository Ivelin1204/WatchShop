import { MODEL } from '../data/product';
import { money } from '../lib/format';
import { delay } from '../lib/style';
import { WatchFace } from './watch/WatchFace';

export function Hero() {
  return (
    <section className="hero" id="top" data-enter>
      <div className="wrap hero__grid">
        <div className="hero__copy">
          <p className="eyebrow enter" style={delay(0)}>
            Meridian 39 · Made in Sofia
          </p>
          <h1 className="hero__title enter" style={delay(80)}>
            The everyday automatic watch, <em>in 39&nbsp;mm of steel.</em>
          </h1>
          <p className="hero__lead enter" style={delay(160)}>
            A field watch with a Swiss automatic movement, sapphire front and back, and 100&nbsp;m of water
            resistance. Built in small batches and timed by hand before it ships.
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
              <strong>{money(MODEL.basePrice)}</strong> on leather
            </li>
            <li>Free EU delivery</li>
            <li>5-year warranty</li>
          </ul>
        </div>

        <div className="hero__stage enter enter--stage" style={delay(120)}>
          <WatchFace dial="navy" strap="leather" view="full" className="hero__watch" title="Meridian 39 with navy dial on tan leather, showing the time now" />
        </div>
      </div>
    </section>
  );
}
