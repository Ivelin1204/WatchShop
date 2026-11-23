import { useEffect, useRef, useState } from 'react';
import { BRAND, FAQ, MODEL, SPECS } from '../data/product';
import { money } from '../lib/format';
import { usePrefersReducedMotion } from './watch/useClock';
import { WatchBack } from './watch/WatchBack';
import { WatchFace } from './watch/WatchFace';
import { WatchSide } from './watch/WatchSide';

export function Details() {
  return (
    <section className="section details" id="details">
      <div className="wrap details__grid">
        <div className="details__macro">
          <WatchFace dial="forest" strap="leather" view="macro" title="Close-up of the forest dial: applied markers, lume and the date window" />
        </div>
        <div className="details__copy">
          <h2 className="h2">A dial you can read at a glance, even in the dark.</h2>
          <p className="lead">
            Raised steel markers catch the light by day. Their lume and the hands glow for hours after sunset. The
            orange seconds hand is the only colour on the dial, so you always find it.
          </p>
          <dl className="specs">
            {SPECS.map((s) => (
              <div key={s.label} className="specs__row">
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export function Profile() {
  return (
    <section className="section profile" id="case">
      <div className="wrap">
        <h2 className="h2 profile__title">11.2&nbsp;mm thin, so it slides under a shirt cuff.</h2>
        <div className="profile__stage">
          <WatchSide className="profile__side" />
        </div>
        <ul className="figures">
          <li>
            <strong>46 mm</strong>
            <span>lug to lug, curved to sit flat</span>
          </li>
          <li>
            <strong>78 g</strong>
            <span>on the leather strap</span>
          </li>
          <li>
            <strong>20 mm</strong>
            <span>strap width, quick-release</span>
          </li>
        </ul>
      </div>
    </section>
  );
}

export function Movement() {
  return (
    <section className="section movement" id="movement">
      <div className="wrap movement__grid">
        <div className="movement__stage">
          <WatchBack className="movement__back" />
        </div>
        <div className="movement__copy">
          <h2 className="h2">A Swiss automatic you can watch through the back.</h2>
          <p className="lead">
            Turn the Meridian over and the movement is behind sapphire. The rotor swings as your wrist moves and
            winds the spring, so it never needs a battery. Hover the caseback to set it going.
          </p>
          <ul className="figures figures--dark">
            <li>
              <strong>28,800</strong>
              <span>beats an hour, so the seconds hand sweeps</span>
            </li>
            <li>
              <strong>38 h</strong>
              <span>power reserve off the wrist</span>
            </li>
            <li>
              <strong>25</strong>
              <span>jewels at the points of wear</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

const STATEMENT =
  'Every Meridian is assembled and regulated by hand in our workshop in Sofia, then timed for five days in five positions before it leaves the bench.';

/** Type-led moment: the sentence fills in word by word as the section passes. */
export function Workshop() {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const words = STATEMENT.split(' ');
  const [lit, setLit] = useState(reduced ? words.length : 0);

  useEffect(() => {
    if (reduced) {
      setLit(words.length);
      return;
    }
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        // 0 when the section's top reaches 85% of the screen, 1 when its middle reaches 40%
        const start = vh * 0.85;
        const end = vh * 0.4 - r.height / 2;
        const p = Math.min(1, Math.max(0, (start - r.top) / (start - end)));
        setLit(Math.round(p * words.length));
      });
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, [reduced, words.length]);

  return (
    <section className="section workshop" id="workshop" ref={ref}>
      <div className="wrap">
        <h2 className="eyebrow">The workshop on {BRAND.street}</h2>
        <p className="workshop__text" aria-label={STATEMENT}>
          {words.map((w, i) => (
            <span key={i} aria-hidden="true" className={i < lit ? 'is-lit' : ''}>
              {w}{' '}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}

export function Delivery() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="section delivery" id="delivery">
      <div className="wrap delivery__grid">
        <div>
          <h2 className="h2">Delivery, returns and the warranty.</h2>
          <ul className="promises">
            <li>
              <strong>Free delivery in the EU</strong>
              <span>Insured, tracked and signed for. It arrives in {MODEL.shipping}.</span>
            </li>
            <li>
              <strong>30 days to change your mind</strong>
              <span>Send it back unworn in its box and we refund you in full.</span>
            </li>
            <li>
              <strong>5 years on the movement</strong>
              <span>If it stops keeping time, we service it at no cost.</span>
            </li>
          </ul>
        </div>
        <div className="faq">
          {FAQ.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className={`faq__item ${isOpen ? 'is-open' : ''}`}>
                <h3>
                  <button
                    className="faq__q"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    id={`faq-q-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    {f.q}
                    <span className="faq__icon" aria-hidden="true" />
                  </button>
                </h3>
                <div className="faq__a" id={`faq-${i}`} role="region" aria-labelledby={`faq-q-${i}`}>
                  <div>
                    <p>{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Close() {
  return (
    <section className="section close" id="order">
      <div className="wrap close__inner">
        <h2 className="close__title">
          Meridian 39.
          <br />
          <em>From {money(MODEL.basePrice)}.</em>
        </h2>
        <div className="close__side">
          <WatchFace dial="bone" strap="bracelet" view="head" className="close__watch" title="Meridian 39 with bone dial on the steel bracelet" />
          <a className="btn btn--solid" href="#buy">
            Choose your Meridian
          </a>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__grid">
        <div>
          <p className="footer__brand">{BRAND.name}</p>
          <p>Automatic watches, made in small batches.</p>
        </div>
        <div>
          <p className="footer__h">Workshop</p>
          <p>
            {BRAND.street}, {BRAND.city}
          </p>
          <a className="link" href={`mailto:${BRAND.email}`}>
            Write to us
          </a>
        </div>
        <div>
          <p className="footer__h">Shop</p>
          <a className="link" href="#buy">
            The watch
          </a>
          <a className="link" href="#delivery">
            Delivery and returns
          </a>
        </div>
        <div>
          <p className="footer__h">Care</p>
          <a className="link" href="#movement">
            The movement
          </a>
          <a className="link" href="#delivery">
            Warranty
          </a>
        </div>
      </div>
      <div className="wrap footer__base">
        <span>© 2026 {BRAND.legal}</span>
        <span>Prices include VAT</span>
      </div>
    </footer>
  );
}
