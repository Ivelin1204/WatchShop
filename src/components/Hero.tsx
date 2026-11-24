import { useEffect, useRef, useState } from 'react';
import { MODEL, dialById } from '../data/product';
import { useI18n } from '../i18n';
import { delay } from '../lib/style';
import type { WatchScene } from '../three/watchScene';
import { WatchFace } from './watch/WatchFace';
import { usePrefersReducedMotion } from './watch/useClock';

/* the hero's resting pose: three-quarter view, dial tipped towards you */
const POSE = { turn: -0.52, tilt: 0.32 };

export function Hero() {
  const { t } = useI18n();
  return (
    <section className="hero" id="top" data-enter>
      <div className="wrap hero__grid">
        <div className="hero__copy">
          <h1 className="hero__title enter" style={delay(0)}>
            <em>{t.hero.lead1}</em> <span>{t.hero.lead2}</span>
          </h1>
          <p className="hero__lead enter" style={delay(100)}>
            {t.hero.body(t.brand.street)}
          </p>
          <div className="hero__actions enter" style={delay(180)}>
            <a className="btn btn--solid" href="#buy">
              {t.hero.cta}
            </a>
            <a className="hero__more" href="#in-3d">
              {t.hero.more} <span aria-hidden="true">→</span>
            </a>
          </div>
          <p className="hero__line enter" style={delay(260)}>
            <span>40&nbsp;{t.units.mm}</span>
            <span>100&nbsp;{t.units.m}</span>
            <span>42&nbsp;{t.units.h}</span>
            <span>
              {t.hero.from} <strong>{t.money(MODEL.basePrice)}</strong>
            </span>
          </p>
        </div>

        <div className="hero__stage enter enter--stage" style={delay(120)}>
          <SecondsRing />
          <HeroWatch />
        </div>
      </div>

      <a className="hero__cue enter" style={delay(600)} href="#in-3d">
        <span className="hero__cue-line" aria-hidden="true" />
        {t.hero.cue}
      </a>
    </section>
  );
}

/** A large scale of second marks behind the watch; an orange dot keeps real time on it. */
function SecondsRing() {
  const reduced = usePrefersReducedMotion();
  // seconds since midnight, so the dot only ever moves forwards (no spin back at :00)
  const now = () => Math.floor(Date.now() / 1000) % 86400;
  const [sec, setSec] = useState(now);

  useEffect(() => {
    if (reduced) return;
    const t = window.setInterval(() => setSec(now()), 250);
    return () => window.clearInterval(t);
  }, [reduced]);

  return (
    <svg className="ring" viewBox="0 0 1000 1000" aria-hidden="true">
      <circle cx="500" cy="500" r="470" fill="none" stroke="currentColor" strokeOpacity="0.1" />
      <circle cx="500" cy="500" r="400" fill="none" stroke="currentColor" strokeOpacity="0.06" />
      {Array.from({ length: 120 }, (_, i) => {
        const major = i % 10 === 0;
        const mid = i % 2 === 0;
        return (
          <line
            key={i}
            x1="500"
            y1="32"
            x2="500"
            y2={major ? 62 : mid ? 50 : 42}
            stroke="currentColor"
            strokeOpacity={major ? 0.42 : mid ? 0.2 : 0.1}
            strokeWidth={major ? 2 : 1}
            transform={`rotate(${i * 3} 500 500)`}
          />
        );
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const n = i === 0 ? 60 : i * 5;
        return (
          <text
            key={i}
            x={500 + Math.sin(a) * 428}
            y={500 - Math.cos(a) * 428 + 7}
            textAnchor="middle"
            fontSize="19"
            fontWeight="600"
            fill="currentColor"
            fillOpacity="0.32"
            fontFamily="Manrope Variable, Manrope, sans-serif"
          >
            {String(n).padStart(2, '0')}
          </text>
        );
      })}
      {!reduced && (
        <g className="ring__sec" style={{ transform: `rotate(${sec * 6}deg)` }}>
          <circle cx="500" cy="47" r="6" fill="var(--accent)" />
        </g>
      )}
    </svg>
  );
}

/** The 3D model, spinning in on load and then resting in its pose. */
function HeroWatch() {
  const { t } = useI18n();
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let scene: WatchScene | null = null;
    let disposed = false;
    let io: IntersectionObserver | null = null;
    let ro: ResizeObserver | null = null;

    (async () => {
      try {
        const { createWatchScene } = await import('../three/watchScene');
        if (disposed || !canvas.current) return;
        scene = createWatchScene(canvas.current, dialById('midnight'), reduced, {
          margin: 1.04,
          initial: { turn: -1.9, tilt: 0.05 },
          tilt: POSE.tilt,
          float: true,
        });
        scene.setTurn(POSE.turn);
        setReady(true);

        io = new IntersectionObserver(([e]) => scene?.setActive(e.isIntersecting));
        io.observe(canvas.current);
        ro = new ResizeObserver(() => scene?.resize());
        ro.observe(canvas.current);
      } catch {
        if (!disposed) setFailed(true);
      }
    })();

    return () => {
      disposed = true;
      io?.disconnect();
      ro?.disconnect();
      scene?.dispose();
    };
  }, [reduced]);

  if (failed) {
    return <WatchFace dial="midnight" strap="bracelet" view="full" className="hero__watch" title={t.watchTitle(t.dials.midnight, t.straps.bracelet.name)} />;
  }
  return (
    <canvas
      ref={canvas}
      className={`hero__canvas ${ready ? 'is-ready' : ''}`}
      role="img"
      aria-label={t.hero.canvas}
    />
  );
}
