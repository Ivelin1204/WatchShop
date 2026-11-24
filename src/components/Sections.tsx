import { useEffect, useRef, useState } from 'react';
import { BRAND, DIALS, MODEL, priceFor, type DialId } from '../data/product';
import { useI18n } from '../i18n';
import { DIAL_EVENT } from './Configurator';
import { usePrefersReducedMotion } from './watch/useClock';
import { LogoMark } from './Logo';
import { WatchBack } from './watch/WatchBack';
import { WatchFace } from './watch/WatchFace';
import { WatchProfile } from './watch/WatchProfile';

const pad = (n: number, w = 2) => String(Math.floor(n)).padStart(w, '0');
const readout = (ms: number) => `${pad((ms / 60000) % 30)}:${pad((ms / 1000) % 60)}.${pad((ms % 1000) / 10)}`;

/** A working chronograph: start, stop and reset it, and switch the lights off to see the lume. */
export function Details() {
  const { t } = useI18n();
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
            title={t.details.dialTitle}
          />
        </div>
        <div className="details__copy">
          <h2 className="h2">{t.details.title}</h2>
          <p className="lead">{t.details.lead}</p>

          <div className="chrono">
            <span className="chrono__time" ref={timeRef} aria-live="off">
              00:00.00
            </span>
            <div className="chrono__btns">
              <button className={`btn ${running ? 'btn--ghost' : 'btn--solid'}`} onClick={() => press('start')}>
                {running ? t.details.stop : t.details.start}
              </button>
              <button className="btn btn--ghost" onClick={() => press('reset')} disabled={running}>
                {t.details.reset}
              </button>
              <button className={`switch ${night ? 'is-on' : ''}`} role="switch" aria-checked={night} onClick={() => setNight((n) => !n)}>
                <span className="switch__track" aria-hidden="true">
                  <span className="switch__thumb" />
                </span>
                {t.details.lights}
              </button>
            </div>
          </div>

          <dl className="specs">
            {t.specs.map((s) => (
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
  const { t } = useI18n();
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
          <h2 className="h2 profile__title">{t.profile.title}</h2>
          <p className="lead">{t.profile.lead}</p>
        </div>
        <div className="profile__stage">
          <WatchProfile className="profile__drawing" />
        </div>
        <p className="profile__dims-m">
          {[t.profile.thick, t.profile.case, t.profile.lugs].map(([big, small]) => (
            <span key={small}>
              <strong>{big}</strong> {small}
            </span>
          ))}
        </p>
        <ol className="parts">
          {t.profile.parts.map((p, i) => (
            <li key={i}>
              <span className="parts__n" aria-hidden="true">
                {i + 1}
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
  const { t } = useI18n();
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
          <h2 className="h2">{t.movement.title}</h2>
          <p className="lead">{t.movement.lead}</p>
          <ul className="figures figures--dark">
            {t.movement.figures.map((f) => (
              <li key={f.text}>
                <strong>{f.big}</strong>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** Closing lineup: all three dials side by side; choosing one preselects it in the builder. */
export function Close() {
  const { t } = useI18n();
  const choose = (dial: DialId) => {
    window.dispatchEvent(new CustomEvent<DialId>(DIAL_EVENT, { detail: dial }));
    document.getElementById('buy')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="section lineup" id="order">
      <div className="wrap">
        <div className="lineup__head">
          <h2 className="h2">{t.close.title}</h2>
          <p className="lead">{t.close.lead(t.money(MODEL.basePrice), t.money(priceFor('bracelet')))}</p>
        </div>
        <ul className="lineup__row">
          {DIALS.map((d) => (
            <li key={d.id}>
              <button className="lineup__card" onClick={() => choose(d.id)}>
                <span className="lineup__watch">
                  <WatchFace dial={d.id} strap="bracelet" view="head" title={t.watchTitle(t.dials[d.id], t.straps.bracelet.name)} />
                </span>
                <span className="lineup__name">{t.dials[d.id]}</span>
                <span className="lineup__cta">
                  {t.close.choose(t.dials[d.id])}
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
  const { t } = useI18n();
  return (
    <footer className="footer">
      <div className="wrap footer__grid">
        <div>
          <p className="footer__brand">
            <LogoMark className="footer__mark" />
            {BRAND.name}
          </p>
          <p>{t.footer.tagline}</p>
        </div>
        <div>
          <p className="footer__h">{t.footer.workshop}</p>
          <p>
            {t.brand.street}, {t.brand.city}
          </p>
          <a className="link" href={`mailto:${BRAND.email}`}>
            {t.footer.write}
          </a>
        </div>
        <div>
          <p className="footer__h">{t.footer.shop}</p>
          <a className="link" href="#buy">
            {t.footer.watch}
          </a>
          <a className="link" href="#delivery">
            {t.footer.returns}
          </a>
        </div>
        <div>
          <p className="footer__h">{t.footer.care}</p>
          <a className="link" href="#movement">
            {t.footer.movement}
          </a>
          <a className="link" href="#delivery">
            {t.footer.warranty}
          </a>
        </div>
      </div>
      <div className="wrap footer__base">
        <span>© 2026 {BRAND.legal}</span>
        <span>{t.footer.base}</span>
      </div>
    </footer>
  );
}
