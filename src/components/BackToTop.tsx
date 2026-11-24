import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './watch/useClock';

const R = 22; // ring radius in the 52 x 52 button
const C = 2 * Math.PI * R;

/** Round button, bottom right: appears after the hero, scrolls back to the top. The ring shows how far down the page you are. */
export function BackToTop() {
  const [show, setShow] = useState(false);
  const ring = useRef<SVGCircleElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? window.scrollY / max : 0;
        setShow(window.scrollY > window.innerHeight * 0.8);
        ring.current?.setAttribute('stroke-dashoffset', String(C * (1 - p)));
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
  }, []);

  // our own glide to the top: same length (about 0.8 s) from anywhere on the page,
  // and it stops the moment you scroll yourself
  const toTop = () => {
    document.querySelector<HTMLElement>('.nav__logo')?.focus({ preventScroll: true });
    const from = window.scrollY;
    if (reduced || from === 0) {
      window.scrollTo(0, 0);
      return;
    }
    const html = document.documentElement;
    const behaviour = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto'; // the page's CSS smooth scrolling would fight each step
    const duration = Math.min(1000, 500 + from / 40);
    const start = performance.now();
    let raf = 0;
    const stop = () => {
      cancelAnimationFrame(raf);
      html.style.scrollBehavior = behaviour;
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchstart', stop);
      window.removeEventListener('keydown', stop);
    };
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      window.scrollTo(0, from * (1 - ease(t)));
      if (t < 1) raf = requestAnimationFrame(step);
      else stop();
    };
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    window.addEventListener('keydown', stop);
    raf = requestAnimationFrame(step);
  };

  return (
    <button className={`totop ${show ? 'is-on' : ''}`} onClick={toTop} aria-label="Back to the top" tabIndex={show ? 0 : -1} aria-hidden={!show}>
      <svg viewBox="0 0 52 52" aria-hidden="true">
        <circle cx="26" cy="26" r={R} fill="none" stroke="currentColor" strokeOpacity="0.14" strokeWidth="2" />
        <circle
          ref={ring}
          cx="26"
          cy="26"
          r={R}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C}
          transform="rotate(-90 26 26)"
        />
        <path className="totop__arrow" d="M26 33V19M19.5 25.5L26 19l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
