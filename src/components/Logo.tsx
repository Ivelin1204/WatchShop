/**
 * The Merid mark: an M drawn like two watch hands meeting at an orange
 * centre pin, inside the case ring. Inherits its colour from `currentColor`.
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M13.5 35 V13 L24 26.5 L34.5 13 V35" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
      <circle className="logo-pin" cx="24" cy="26.5" r="2.9" fill="var(--accent, #d2591f)" />
    </svg>
  );
}

/** Path data for drawing the mark on a canvas (crown engraving), on a 48 x 48 grid. */
export const LOGO_PATHS = {
  ring: { cx: 24, cy: 24, r: 21 },
  m: 'M13.5 35 V13 L24 26.5 L34.5 13 V35',
  pin: { cx: 24, cy: 26.5, r: 2.9 },
};
