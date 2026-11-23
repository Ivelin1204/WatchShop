import { useEffect, useId, useState, type RefObject } from 'react';

/** Unique, url()-safe id prefix for SVG gradients when several watches render at once. */
export function useSvgId(prefix: string) {
  const raw = useId();
  return `${prefix}${raw.replace(/[^a-zA-Z0-9]/g, '')}`;
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

interface Hands {
  hour: RefObject<SVGGElement | null>;
  minute: RefObject<SVGGElement | null>;
  second: RefObject<SVGGElement | null>;
}

const BEATS_PER_SECOND = 8; // 28,800 vph: the seconds hand moves in eight small steps a second

function angles(d: Date, smooth: boolean) {
  const ms = d.getMilliseconds();
  const s = d.getSeconds() + (smooth ? Math.floor((ms / 1000) * BEATS_PER_SECOND) / BEATS_PER_SECOND : 0);
  const m = d.getMinutes() + s / 60;
  const h = (d.getHours() % 12) + m / 60;
  return { h: h * 30, m: m * 6, s: s * 6 };
}

/** The classic catalogue time: 10:09:36, hands framing the logo. */
const STILL = { h: (10 + 9 / 60) * 30, m: (9 + 36 / 60) * 6, s: 36 * 6 };

/**
 * Drives the hands by writing transforms straight to the SVG groups,
 * so React does not re-render 60 times a second. Pauses off-screen.
 */
export function useWatchHands(
  container: RefObject<Element | null>,
  hands: Hands,
  cx: number,
  cy: number,
  live: boolean,
  /** centre of the running-seconds hand when it sits in a sub-dial */
  sec: [number, number] = [cx, cy],
) {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const set = (a: { h: number; m: number; s: number }) => {
      hands.hour.current?.setAttribute('transform', `rotate(${a.h} ${cx} ${cy})`);
      hands.minute.current?.setAttribute('transform', `rotate(${a.m} ${cx} ${cy})`);
      hands.second.current?.setAttribute('transform', `rotate(${a.s} ${sec[0]} ${sec[1]})`);
    };

    if (!live || reduced) {
      set(live ? angles(new Date(), false) : STILL);
      if (!live) return;
      // reduced motion: hands still show the right time, updated once a minute
      const t = window.setInterval(() => set(angles(new Date(), false)), 60_000);
      return () => window.clearInterval(t);
    }

    let raf = 0;
    let visible = true;
    const loop = () => {
      set(angles(new Date(), true));
      raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      const now = e.isIntersecting;
      if (now && !visible) raf = requestAnimationFrame(loop);
      if (!now) cancelAnimationFrame(raf);
      visible = now;
    });
    if (container.current) io.observe(container.current);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, reduced, cx, cy, sec[0], sec[1], container, hands.hour, hands.minute, hands.second]);
}
