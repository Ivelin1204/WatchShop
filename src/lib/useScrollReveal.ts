import { useEffect } from 'react';

/**
 * Scroll reveal: elements fade and rise into place the first time they enter
 * the screen. Siblings in the same group follow each other with a short stagger.
 *
 * Targets are picked by selector here, so the components stay clean. State lives
 * in data attributes (not className) so React re-renders never reset it.
 */

const TEXT = [
  '.section .h2',
  '.section .lead',
  '.workshop .eyebrow',
  '.config__price',
  '.opt',
  '.config__panel .btn--wide',
  '.config__note',
  '.specs__row',
  '.figures li',
  '.parts li',
  '.promises li',
  '.faq__item',
  '.footer__grid > div',
];

const MEDIA = ['.config__stage', '.details__stage', '.profile__stage', '.movement__stage', '.lineup__row > li'];

const STAGGER_MS = 90;
const MAX_STAGGER = 6;

export function useScrollReveal() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) return;

    const root = document.documentElement;
    const targets: HTMLElement[] = [];
    const timers: number[] = [];

    const tag = (selectors: string[], kind: 'text' | 'media') => {
      document.querySelectorAll<HTMLElement>(selectors.join(',')).forEach((el) => {
        if (el.dataset.rv) return;
        el.dataset.rv = kind;
        targets.push(el);
      });
    };
    tag(MEDIA, 'media');
    tag(TEXT, 'text');

    // stagger: position among revealed siblings in the same parent
    for (const el of targets) {
      const siblings = Array.from(el.parentElement?.children ?? []).filter((c) => (c as HTMLElement).dataset.rv);
      const i = Math.min(siblings.indexOf(el), MAX_STAGGER);
      el.style.setProperty('--rv-d', `${Math.max(0, i) * STAGGER_MS}ms`);
    }

    root.classList.add('rv');

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.dataset.rvIn = '';
          io.unobserve(el);
          // once it has arrived, hand the element back to its own styles,
          // so hover and press transitions are not slowed by the reveal timing
          const wait = 1500 + parseInt(el.style.getPropertyValue('--rv-d') || '0', 10);
          timers.push(
            window.setTimeout(() => {
              delete el.dataset.rv;
              delete el.dataset.rvIn;
              el.style.removeProperty('--rv-d');
            }, wait),
          );
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0 },
    );
    targets.forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      root.classList.remove('rv');
      for (const el of targets) {
        delete el.dataset.rv;
        delete el.dataset.rvIn;
        el.style.removeProperty('--rv-d');
      }
    };
  }, []);
}
