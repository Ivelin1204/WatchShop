import { useEffect, useRef, useState } from 'react';
import { BRAND, DIALS, FAQ, MODEL, SPECS, priceFor, type DialId } from '../data/product';
import { DIAL_EVENT } from './Configurator';
import { money } from '../lib/format';
import { usePrefersReducedMotion } from './watch/useClock';
import { LogoMark } from './Logo';
import { WatchBack } from './watch/WatchBack';
import { WatchFace } from './watch/WatchFace';
import { WatchProfile } from './watch/WatchProfile';

const pad = (n: number, w = 2) => String(Math.floor(n)).padStart(w, '0');
const readout = (ms: number) => `${pad((ms / 60000) % 30)}:${pad((ms / 1000) % 60)}.${pad((ms % 1000) / 10)}`;

/** A working chronograph: start, stop and reset it, and switch the lights off to see the lume. */
export function Details() {
  const hand = useRef<SVGGElement>(null);
  const counter = useRef<SVGGElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();
  const [running, setRunning] = useState(false);
  const [night, setNight] = useState(false);
  const [pressed, setPressed] = useState<'start' | 'reset' | null>(null);
  const state = useRef({ acc: 0, since: 0 });

  const paint = (ms: number) => {
    // 8 beats a second, like the movement
    const s = reduced ? Math.floor(ms / 1000) : Math.floor(ms / 125) / 8;
    hand.current?.setAttribute('transform', `rotate(${(s % 60) * 6} 200 400)`);
    counter.current?.setAttribute('transform', `rotate(${((ms / 60000) % 30) * 12} 246 400)`);
    if (timeRef.current) timeRef.current.textContent = readout(ms);
  };

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const loop = () => {
      paint(state.current.acc + performance.now() - state.current.since);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const press = (which: 'start' | 'reset') => {
    setPressed(which);
    window.setTimeout(() => setPressed(null), 160);
    const st = state.current;
    if (which === 'start') {
      if (running) {
        st.acc += performance.now() - st.since;
        paint(st.acc);
        setRunning(false);
      } else {
        st.since = performance.now();
        setRunning(true);
      }
    } else if (!running) {
      st.acc = 0;
      paint(0);
    }
  };

  return (
    <section className={`section details ${night ? 'is-night' : ''}`} id="details">
      <div className="wrap details__grid">
        <div className={`details__stage ${pressed ? `press-${pressed}` : ''}`}>
          <WatchFace
            dial="midnight"
            strap="bracelet"
            view="dial"
            night={night}
            chronoHandRef={hand}
            chronoCounterRef={counter}
            onPusher={press}
            className="details__dial"
            title="Meridian Chronograph dial. The top pusher starts and stops the timer, the lower one resets it."
          />
        </div>
        <div className="details__copy">
          <h2 className="h2">A timer you can read at a glance, even in the dark.</h2>
          <p className="lead">
            Try it. The top pusher starts and stops the orange hand, the lower one sends it back to zero. Then switch
            the lights off.
          </p>

          <div className="chrono">
            <span className="chrono__time" ref={timeRef} aria-live="off">
              00:00.00
            </span>
            <div className="chrono__btns">
              <button className={`btn ${running ? 'btn--ghost' : 'btn--solid'}`} onClick={() => press('start')}>
                {running ? 'Stop timer' : 'Start timer'}
              </button>
              <button className="btn btn--ghost" onClick={() => press('reset')} disabled={running}>
                Reset
              </button>
              <button className={`switch ${night ? 'is-on' : ''}`} role="switch" aria-checked={night} onClick={() => setNight((n) => !n)}>
                <span className="switch__track" aria-hidden="true">
                  <span className="switch__thumb" />
                </span>
                Lights off
              </button>
            </div>
          </div>

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

const PARTS = [
  { n: 1, title: 'Domed sapphire', body: 'Curved crystal, anti-reflective inside, 2.9 mm of the height.' },
  { n: 2, title: 'Two pushers', body: 'Start and stop at 2 o’clock, reset at 4.' },
  { n: 3, title: 'Screw-down crown', body: 'Engraved with the Merid mark, sealed to 100 m.' },
  { n: 4, title: 'Display caseback', body: 'Sapphire window onto the movement, flush with the wrist.' },
];

export function Profile() {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const [drawn, setDrawn] = useState(false);

  // the dimension lines draw in once, the first time the section comes into view
  useEffect(() => {
    if (reduced) {
      setDrawn(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <section className={`section profile ${drawn ? 'is-drawn' : ''}`} id="case" ref={ref}>
      <div className="wrap">
        <div className="profile__head">
          <h2 className="h2 profile__title">12.9&nbsp;mm from crystal to caseback.</h2>
          <p className="lead">
            Slim for a chronograph, so it slides under a shirt cuff. It weighs 138&nbsp;g on the bracelet, which tapers
            from 20 to 16&nbsp;mm at the clasp.
          </p>
        </div>
        <div className="profile__stage">
          <WatchProfile className="profile__drawing" />
        </div>
        <p className="profile__dims-m">
          <span>
            <strong>12.9 mm</strong> thick
          </span>
          <span>
            <strong>40 mm</strong> case
          </span>
          <span>
            <strong>47 mm</strong> lug to lug
          </span>
        </p>
        <ol className="parts">
          {PARTS.map((p) => (
            <li key={p.n}>
              <span className="parts__n" aria-hidden="true">
                {p.n}
              </span>
              <div>
                <strong>{p.title}</strong>
                <span>{p.body}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Movement() {
  const section = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const [started, setStarted] = useState(false);
  const [visible, setVisible] = useState(false);

  // starts once, the first time the section scrolls into view, then keeps
  // running on its own; it only pauses while off screen to save battery
  useEffect(() => {
    if (reduced || !section.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting);
        if (e.isIntersecting) setStarted(true);
      },
      { threshold: 0.35 },
    );
    io.observe(section.current);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <section className={`section movement ${started ? 'is-started' : ''} ${started && !visible ? 'is-paused' : ''}`} id="movement" ref={section}>
      <div className="wrap movement__grid">
        <div className="movement__stage">
          <WatchBack className="movement__back" />
        </div>
        <div className="movement__copy">
          <h2 className="h2">A Swiss chronograph calibre you can watch through the back.</h2>
          <p className="lead">
            Turn the watch over and the movement is behind sapphire. The rotor swings as your wrist moves and
            winds the spring, so it never needs a battery.
          </p>
          <ul className="figures figures--dark">
            <li>
              <strong>28,800</strong>
              <span>beats an hour, so the seconds hand sweeps</span>
            </li>
            <li>
              <strong>42 h</strong>
              <span>power reserve off the wrist</span>
            </li>
            <li>
              <strong>27</strong>
              <span>jewels at the points of wear</span>
            </li>
          </ul>
        </div>
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

/** Closing lineup: all three dials side by side; choosing one preselects it in the builder. */
export function Close() {
  const choose = (dial: DialId) => {
    window.dispatchEvent(new CustomEvent<DialId>(DIAL_EVENT, { detail: dial }));
    document.getElementById('buy')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="section lineup" id="order">
      <div className="wrap">
        <div className="lineup__head">
          <h2 className="h2">Three dials. Pick yours.</h2>
          <p className="lead">
            From {money(MODEL.basePrice)} on leather or rubber, {money(priceFor('bracelet'))} on the steel bracelet.
            Free delivery across the EU.
          </p>
        </div>
        <ul className="lineup__row">
          {DIALS.map((d) => (
            <li key={d.id}>
              <button className="lineup__card" onClick={() => choose(d.id)}>
                <span className="lineup__watch">
                  <WatchFace dial={d.id} strap="bracelet" view="head" title={`Meridian Chronograph with ${d.name.toLowerCase()} dial`} />
                </span>
                <span className="lineup__name">{d.name}</span>
                <span className="lineup__cta">
                  Choose {d.name}
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__grid">
        <div>
          <p className="footer__brand">
            <LogoMark className="footer__mark" />
            {BRAND.name}
          </p>
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
