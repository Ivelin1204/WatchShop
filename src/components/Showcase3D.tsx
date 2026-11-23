import { useEffect, useRef, useState } from 'react';
import { DIALS, dialById, type DialId } from '../data/product';
import type { WatchScene } from '../three/watchScene';
import { WatchBack } from './watch/WatchBack';
import { WatchFace } from './watch/WatchFace';
import { usePrefersReducedMotion } from './watch/useClock';

/**
 * Pinned 3D section: the section is several screens tall, its stage sticks to
 * the screen, and scroll progress turns the watch through four views.
 */

const STEPS = [
  {
    title: 'A sunburst dial under domed sapphire.',
    body: 'Applied steel markers stand off the dial and catch the light. Their lume keeps glowing for hours after dark.',
  },
  {
    title: 'A screw-down crown, sealed to 100 m.',
    body: 'Unscrew it to wind the movement by hand or set the date, then screw it back down before you swim.',
  },
  {
    title: 'The movement, on show through the back.',
    body: 'A sapphire caseback shows the rotor that winds the spring every time your wrist moves.',
  },
  {
    title: 'Curved lugs that sit flat on the wrist.',
    body: 'The case slopes down into the strap, so the watch wears closer than its 39 mm suggests.',
  },
];

// where each view rests in the scroll (0-1), and how long it holds there
const STOPS = [0.05, 0.36, 0.66, 0.95];
const HOLD = 0.07;
const ANGLE = (i: number) => (-i * Math.PI) / 2;

const smooth = (t: number) => t * t * (3 - 2 * t);

function turnFor(p: number) {
  if (p <= STOPS[0] + HOLD) return 0;
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i] + HOLD;
    const b = STOPS[i + 1] - HOLD;
    if (p <= b) {
      const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
      return ANGLE(i) + (ANGLE(i + 1) - ANGLE(i)) * smooth(t);
    }
    if (p <= STOPS[i + 1] + HOLD) return ANGLE(i + 1);
  }
  return ANGLE(STOPS.length - 1);
}

const stepFor = (p: number) => {
  let best = 0;
  STOPS.forEach((s, i) => {
    if (Math.abs(p - s) < Math.abs(p - STOPS[best])) best = i;
  });
  return best;
};

export function Showcase3D() {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const backSvg = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<WatchScene | null>(null);
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState(0);
  const [dial, setDial] = useState<DialId>('navy');
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  // build the scene (Three.js is loaded only when this section mounts)
  useEffect(() => {
    let disposed = false;
    let io: IntersectionObserver | null = null;
    let ro: ResizeObserver | null = null;

    (async () => {
      try {
        const { createWatchScene } = await import('../three/watchScene');
        if (disposed || !canvas.current) return;
        const s = createWatchScene(canvas.current, dialById(dial), reduced);
        sceneRef.current = s;
        setReady(true);

        // movement texture: draw the 2D caseback artwork, cropped to the window
        const svg = backSvg.current?.querySelector('svg');
        if (svg) {
          const clone = svg.cloneNode(true) as SVGSVGElement;
          clone.setAttribute('viewBox', '76 76 248 248');
          clone.setAttribute('width', '768');
          clone.setAttribute('height', '768');
          clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
          clone.querySelectorAll('.rotor, .balance').forEach((n) => (n as SVGElement).removeAttribute('style'));
          const img = new Image();
          img.onload = () => !disposed && s.setMovementTexture(img);
          img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
        }

        io = new IntersectionObserver(([e]) => s.setActive(e.isIntersecting), { rootMargin: '100px' });
        if (section.current) io.observe(section.current);
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
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
    // the scene is built once; dial changes go through setDial below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  useEffect(() => {
    sceneRef.current?.setDial(dialById(dial));
  }, [dial, ready]);

  // scroll drives the turn
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = section.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const travel = r.height - window.innerHeight;
        const p = travel > 0 ? Math.min(1, Math.max(0, -r.top / travel)) : 0;
        sceneRef.current?.setTurn(turnFor(p));
        setStep(stepFor(p));
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
  }, [reduced, ready]);

  // the dots: scroll to a view (or, with reduced motion, switch straight to it)
  const goTo = (i: number) => {
    if (reduced) {
      setStep(i);
      sceneRef.current?.setTurn(ANGLE(i));
      return;
    }
    const el = section.current;
    if (!el) return;
    const travel = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: el.offsetTop + STOPS[i] * travel, behavior: 'smooth' });
  };

  return (
    <section className={`showcase ${reduced ? 'is-still' : ''}`} id="in-3d" ref={section} aria-labelledby="showcase-title">
      <div className="showcase__pin">
        <div className="wrap showcase__grid">
          <div className="showcase__copy">
            <h2 className="eyebrow" id="showcase-title">
              Turn it over
            </h2>
            <div className="showcase__steps" aria-live="polite">
              {STEPS.map((s, i) => (
                <div key={s.title} className={`showcase__step ${i === step ? 'is-on' : ''}`} aria-hidden={i !== step}>
                  <p className="showcase__title">{s.title}</p>
                  <p className="showcase__body">{s.body}</p>
                </div>
              ))}
            </div>
            <div className="showcase__dots" role="group" aria-label="Views of the watch">
              {STEPS.map((s, i) => (
                <button
                  key={s.title}
                  className={i === step ? 'is-on' : ''}
                  aria-label={['Dial', 'Crown side', 'Caseback', 'Other side'][i]}
                  aria-pressed={i === step}
                  onClick={() => goTo(i)}
                >
                  <span />
                </button>
              ))}
            </div>
          </div>

          <div className="showcase__stage">
            {failed ? (
              <WatchFace dial={dial} strap="leather" view="full" className="showcase__fallback" />
            ) : (
              <canvas ref={canvas} className={`showcase__canvas ${ready ? 'is-ready' : ''}`} role="img" aria-label={`3D model of the Meridian 39 with ${dialById(dial).name.toLowerCase()} dial, turning as you scroll`} />
            )}
            <div className="showcase__swatches" role="radiogroup" aria-label="Dial colour">
              {DIALS.map((d) => (
                <button
                  key={d.id}
                  role="radio"
                  aria-checked={dial === d.id}
                  aria-label={`${d.name} dial`}
                  className={`swatch swatch--btn ${dial === d.id ? 'is-on' : ''}`}
                  onClick={() => setDial(d.id)}
                >
                  <span className="swatch__dot" style={{ background: `radial-gradient(circle at 35% 30%, ${d.glow}, ${d.swatch})` }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* source artwork for the movement texture; never shown */}
      <div ref={backSvg} className="showcase__source" aria-hidden="true">
        <WatchBack />
      </div>
    </section>
  );
}
