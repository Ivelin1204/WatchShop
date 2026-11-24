import { useEffect, useRef } from 'react';

/** Thin orange line along the top edge that fills as the page scrolls. */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        bar.current?.style.setProperty('transform', `scaleX(${p})`);
      });
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    // the page grows as fonts, images and 3D load: keep the length right
    const ro = new ResizeObserver(on);
    ro.observe(document.body);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="progress" aria-hidden="true">
      <div className="progress__bar" ref={bar} />
    </div>
  );
}
