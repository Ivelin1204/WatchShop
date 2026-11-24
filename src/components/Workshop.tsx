import { useEffect, useRef, useState } from 'react';
import { BRAND, dialById } from '../data/product';
import { movementImage } from '../three/movementImage';
import type { WatchScene } from '../three/watchScene';
import { WatchBack } from './watch/WatchBack';
import { WatchFace } from './watch/WatchFace';
import { usePrefersReducedMotion } from './watch/useClock';

/**
 * The regulation story, pinned while you scroll: the statement fills in, then
 * the 3D watch turns through the five test positions on a lit bench while a
 * timing-machine trace streams its ticks between the pass limits.
 */

const STATEMENT =
  'Every Meridian is assembled and regulated by hand in our workshop in Sofia, then timed for five days in five positions.';

interface Day {
  name: string;
  note: string;
  pose: { turn: number; tilt: number; roll: number };
  /** slope of the trace in this position, for the timing-machine drawing */
  drift: number;
}

const DAYS: Day[] = [
  { name: 'Dial up', note: 'Lying flat, as on a bedside table.', pose: { turn: -0.35, tilt: -1.0, roll: 0 }, drift: 0.16 },
  { name: 'Dial down', note: 'Face down on its crystal, clasp up.', pose: { turn: Math.PI + 0.3, tilt: -0.45, roll: 0 }, drift: -0.1 },
  { name: 'Crown up', note: 'Standing on its side, crown to the sky.', pose: { turn: -0.45, tilt: 0.15, roll: Math.PI / 2 }, drift: 0.26 },
  { name: 'Crown down', note: 'As it hangs on a resting arm.', pose: { turn: -0.45, tilt: 0.15, roll: -Math.PI / 2 }, drift: -0.2 },
  { name: 'Crown left', note: 'As it sits on a raised wrist.', pose: { turn: 0.45, tilt: 0.15, roll: Math.PI }, drift: 0.06 },
];

const WORDS_END = 0.18; // share of the scroll spent filling in the sentence
const DAYS_END = 0.94; // the last day finishes here

export function Workshop() {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const words = STATEMENT.split(' ');
  const [p, setP] = useState(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      setP(1);
      return;
    }
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const travel = r.height - window.innerHeight;
        setP(travel > 0 ? Math.min(1, Math.max(0, -r.top / travel)) : 1);
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
  }, [reduced]);

  const lit = Math.round(Math.min(1, p / WORDS_END) * words.length);
  const dayP = Math.min(1, Math.max(0, (p - WORDS_END) / (DAYS_END - WORDS_END)));
  const active = Math.min(DAYS.length - 1, Math.floor(dayP * DAYS.length));
  const within = dayP >= 1 ? 1 : dayP * DAYS.length - active;
  const done = dayP >= 1;

  return (
    <section className={`workshop ${reduced ? 'is-still' : ''}`} id="workshop" ref={ref} aria-labelledby="workshop-title">
      <div className="workshop__pin">
        <div className="wrap workshop__grid">
          <div className="workshop__copy">
            <h2 className="eyebrow" id="workshop-title">
              The workshop on {BRAND.street}
            </h2>
            <p className="workshop__text" aria-label={STATEMENT}>
              {words.map((w, i) => (
                <span key={i} aria-hidden="true" className={i < lit ? 'is-lit' : ''}>
                  {w}{' '}
                </span>
              ))}
            </p>

            <ol className="steps">
              {DAYS.map((d, i) => {
                const state = done || i < active ? 'is-done' : i === active && dayP > 0 ? 'is-now' : '';
                return (
                  <li key={d.name} className={state}>
                    <span className="steps__mark" aria-hidden="true">
                      <svg viewBox="0 0 16 16">
                        <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="steps__day">Day {i + 1}</span>
                    <span className="steps__name">{d.name}</span>
                    <span className="steps__bar" aria-hidden="true">
                      <span style={{ transform: `scaleX(${state === 'is-done' ? 1 : state === 'is-now' ? within : 0})` }} />
                    </span>
                  </li>
                );
              })}
            </ol>

            <p className={`workshop__result ${done ? 'is-on' : ''}`}>
              <strong>Within −4 and +6 seconds a day</strong> in every position, or it goes back on the bench.
            </p>
          </div>

          <Bench day={active} started={dayP > 0} done={done} reduced={reduced} />
        </div>
      </div>
    </section>
  );
}

function Bench({ day, started, done, reduced }: { day: number; started: boolean; done: boolean; reduced: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const backSvg = useRef<HTMLDivElement>(null);
  const scene = useRef<WatchScene | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const current = DAYS[day];

  useEffect(() => {
    let disposed = false;
    let io: IntersectionObserver | null = null;
    let ro: ResizeObserver | null = null;
    (async () => {
      try {
        const { createWatchScene } = await import('../three/watchScene');
        if (disposed || !canvas.current) return;
        const s = createWatchScene(canvas.current, dialById('slate'), reduced, {
          fit: { h: 104, w: 104 },
          tilt: DAYS[0].pose.tilt,
          initial: { turn: DAYS[0].pose.turn, tilt: DAYS[0].pose.tilt },
        });
        scene.current = s;
        setReady(true);
        const svg = backSvg.current?.querySelector('svg');
        if (svg) movementImage(svg).then((img) => !disposed && s.setMovementTexture(img), () => {});
        io = new IntersectionObserver(([e]) => s.setActive(e.isIntersecting));
        io.observe(canvas.current);
        ro = new ResizeObserver(() => s.resize());
        ro.observe(canvas.current);
      } catch {
        if (!disposed) setFailed(true);
      }
    })();
    return () => {
      disposed = true;
      io?.disconnect();
      ro?.disconnect();
      scene.current?.dispose();
      scene.current = null;
    };
  }, [reduced]);

  // turn the watch into the day's position
  useEffect(() => {
    const s = scene.current;
    if (!s) return;
    s.setTurn(current.pose.turn);
    s.setTilt(current.pose.tilt);
    s.setRoll(current.pose.roll);
  }, [current, ready]);

  return (
    <div className="bench">
      <div className="bench__stage">
        {failed ? (
          <WatchFace dial="slate" strap="bracelet" view="head" className="bench__fallback" />
        ) : (
          <canvas ref={canvas} className={`bench__canvas ${ready ? 'is-ready' : ''}`} role="img" aria-label={`The watch in the ${current.name.toLowerCase()} position`} />
        )}
        <div className="bench__tag" aria-live="polite">
          <span className={`bench__led ${started && !done ? 'is-on' : ''}`} aria-hidden="true" />
          {done ? 'Passed in all five positions' : `Day ${day + 1} · ${current.name}`}
          <span className="bench__note">{done ? 'Ready to ship' : current.note}</span>
        </div>
      </div>
      <Trace drift={current.drift} running={started && !done} reduced={reduced} />
      <div ref={backSvg} className="showcase__source" aria-hidden="true">
        <WatchBack />
      </div>
    </div>
  );
}

/** Timing-machine trace: two rows of tick and tock marks scrolling left between the pass limits. */
function Trace({ drift, running, reduced }: { drift: number; running: boolean; reduced: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const driftRef = useRef(drift);
  driftRef.current = drift;
  const runRef = useRef(running);
  runRef.current = running;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const size = () => {
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(cv);

    const ink = getComputedStyle(cv).color || '#ece7dd';
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#d2591f';
    const dots: { x: number; y: number; row: number }[] = [];
    let offset = [0, 0];
    let last = performance.now();
    let acc = 0;
    let raf = 0;
    let visible = true;
    const SPEED = 60; // px a second
    const BEAT = 1 / 8; // eight beats a second, tick and tock alternate

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const top = h * 0.2;
      const bot = h * 0.8;
      const mid = (top + bot) / 2;

      if (runRef.current && !reduced) {
        for (const d of dots) d.x -= SPEED * dt;
        acc += dt;
        while (acc >= BEAT) {
          acc -= BEAT;
          const row = dots.length % 2;
          offset[row] += driftRef.current * 0.5 + (Math.random() - 0.5) * 0.35;
          // keep the trace inside the pass band, as a regulated watch does
          if (Math.abs(offset[row]) > (bot - top) * 0.32) offset[row] *= 0.6;
          dots.push({ x: w - 4, y: mid + (row ? 12 : -12) - offset[row], row });
        }
        while (dots.length && dots[0].x < -4) dots.shift();
      }

      ctx.clearRect(0, 0, w, h);
      // pass band
      ctx.strokeStyle = ink;
      ctx.globalAlpha = 0.18;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(0, top);
      ctx.lineTo(w - 40, top);
      ctx.moveTo(0, bot);
      ctx.lineTo(w - 40, bot);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.08;
      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(w, mid);
      ctx.stroke();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = ink;
      ctx.font = '600 11px Manrope Variable, Manrope, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('+6 s', w - 4, top + 4);
      ctx.fillText('−4 s', w - 4, bot + 4);
      // ticks and tocks
      for (const d of dots) {
        const fade = Math.min(1, d.x / (w * 0.35));
        ctx.globalAlpha = 0.25 + 0.75 * fade;
        ctx.fillStyle = d.row ? ink : accent;
        ctx.fillRect(d.x, d.y - 1.6, 3.2, 3.2);
      }
      ctx.globalAlpha = 1;
      if (visible) raf = requestAnimationFrame(draw);
    };

    // seed a full trace so it never starts empty
    for (let x = 0; x < (cv.clientWidth || 600); x += SPEED * BEAT) {
      const row = dots.length % 2;
      dots.push({ x, y: cv.clientHeight / 2 + (row ? 12 : -12) + (Math.random() - 0.5) * 3, row });
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) {
        last = performance.now();
        raf = requestAnimationFrame(draw);
      } else cancelAnimationFrame(raf);
    });
    io.observe(cv);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      offset = [0, 0];
    };
  }, [reduced]);

  return (
    <div className="trace">
      <span className="trace__label">Timing machine</span>
      <canvas ref={ref} className="trace__canvas" aria-hidden="true" />
    </div>
  );
}
