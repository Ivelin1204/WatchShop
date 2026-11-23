import { useSvgId } from './useClock';

/** Side profile: shows how slim the case sits on the wrist. */
export function WatchSide({ className }: { className?: string }) {
  const id = useSvgId('s');
  return (
    <svg className={className} viewBox="0 0 640 260" role="img" aria-label="Meridian case seen from the side, 11.2 mm thick">
      <defs>
        <linearGradient id={`${id}-band`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4F4F2" />
          <stop offset="0.35" stopColor="#C3C5C8" />
          <stop offset="0.55" stopColor="#ECECEA" />
          <stop offset="1" stopColor="#7E8186" />
        </linearGradient>
        <linearGradient id={`${id}-bezel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#9A9DA1" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#B8C4CC" stopOpacity="0.35" />
          <stop offset="0.3" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="0.6" stopColor="#C9D3DA" stopOpacity="0.4" />
          <stop offset="1" stopColor="#B8C4CC" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={`${id}-leather`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A06844" />
          <stop offset="1" stopColor="#5C3520" />
        </linearGradient>
        <radialGradient id={`${id}-sh`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#2A2015" stopOpacity="0.28" />
          <stop offset="1" stopColor="#2A2015" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* straps curving round the wrist */}
      <path d="M118,150 C80,170 40,210 -10,262 L22,262 C62,222 98,190 130,174 Z" fill={`url(#${id}-leather)`} />
      <path d="M522,150 C560,170 600,210 650,262 L618,262 C578,222 542,190 510,174 Z" fill={`url(#${id}-leather)`} />

      <ellipse cx="320" cy="180" rx="190" ry="16" fill={`url(#${id}-sh)`} />
      <g>
        {/* lugs */}
        <path d="M168,112 C140,114 118,128 104,160 L126,168 C138,146 152,138 172,136 Z" fill={`url(#${id}-band)`} />
        <path d="M472,112 C500,114 522,128 536,160 L514,168 C502,146 488,138 468,136 Z" fill={`url(#${id}-band)`} />

        {/* caseback */}
        <path d="M196,150 L444,150 L432,166 Q320,176 208,166 Z" fill="#9EA1A5" />
        {/* case band */}
        <rect x="160" y="108" width="320" height="44" rx="10" fill={`url(#${id}-band)`} />
        <rect x="166" y="112" width="308" height="2" rx="1" fill="#fff" opacity="0.7" />
        {/* bezel */}
        <rect x="168" y="96" width="304" height="14" rx="6" fill={`url(#${id}-bezel)`} />
        {/* domed crystal */}
        <path d="M184,97 Q320,70 456,97 Z" fill={`url(#${id}-glass)`} stroke="#AEB8BF" strokeOpacity="0.6" />

        {/* crown */}
        <rect x="478" y="120" width="10" height="20" rx="2" fill="#9A9DA1" />
        <rect x="486" y="112" width="20" height="36" rx="5" fill={`url(#${id}-band)`} />
        {Array.from({ length: 6 }, (_, i) => (
          <rect key={i} x={488 + i * 3} y="113" width="1.2" height="34" fill="#6E7175" opacity="0.55" />
        ))}
      </g>
    </svg>
  );
}
