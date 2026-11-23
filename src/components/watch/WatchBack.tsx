import { useMemo } from 'react';
import { useSvgId } from './useClock';

/**
 * Exhibition caseback. Hovering (or focusing) the frame sets the rotor and
 * balance wheel moving; at rest everything is still.
 */
export function WatchBack({ className }: { className?: string }) {
  const id = useSvgId('b');
  const notches = useMemo(() => Array.from({ length: 8 }, (_, i) => i * 45), []);
  const jewels: [number, number][] = [
    [262, 164],
    [148, 250],
    [242, 262],
    [206, 120],
    [292, 226],
  ];

  return (
    <svg className={className} viewBox="0 0 400 400" role="img" aria-label="Sapphire caseback showing the automatic movement">
      <defs>
        <linearGradient id={`${id}-case`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E9E9E7" />
          <stop offset="0.3" stopColor="#9FA2A6" />
          <stop offset="0.55" stopColor="#D8D9D8" />
          <stop offset="1" stopColor="#6F7277" />
        </linearGradient>
        <linearGradient id={`${id}-polish`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8A8D91" />
          <stop offset="0.4" stopColor="#FBFBF9" />
          <stop offset="0.7" stopColor="#A9ACB0" />
          <stop offset="1" stopColor="#E6E6E4" />
        </linearGradient>
        <radialGradient id={`${id}-plate`} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#D7D9DB" />
          <stop offset="1" stopColor="#8F9397" />
        </radialGradient>
        <pattern id={`${id}-perlage`} width="9" height="9" patternUnits="userSpaceOnUse">
          <rect width="9" height="9" fill={`url(#${id}-plate)`} />
          <circle cx="4.5" cy="4.5" r="4.2" fill="none" stroke="#fff" strokeOpacity="0.3" />
          <circle cx="4.5" cy="4.5" r="2.2" fill="none" stroke="#000" strokeOpacity="0.08" />
        </pattern>
        <pattern id={`${id}-cotes`} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
          <rect width="12" height="12" fill="#B8BBBF" />
          <rect width="6" height="12" fill="#D6D8DA" />
        </pattern>
        <linearGradient id={`${id}-rotor`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8C9094" />
          <stop offset="0.5" stopColor="#E8E9EA" />
          <stop offset="1" stopColor="#8C9094" />
        </linearGradient>
        <radialGradient id={`${id}-jewel`} cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#FF8BA0" />
          <stop offset="0.5" stopColor="#B4203D" />
          <stop offset="1" stopColor="#5E0B1E" />
        </radialGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F1D38E" />
          <stop offset="0.5" stopColor="#B88A3E" />
          <stop offset="1" stopColor="#E8C778" />
        </linearGradient>
        <clipPath id={`${id}-win`}>
          <circle cx="200" cy="200" r="124" />
        </clipPath>
        <path id={`${id}-arc`} d="M 200 200 m -78 0 a 78 78 0 0 1 156 0" />
      </defs>

      <circle cx="200" cy="200" r="168" fill={`url(#${id}-case)`} />
      <circle cx="200" cy="200" r="152" fill={`url(#${id}-polish)`} />
      {notches.map((a) => (
        <rect key={a} x="194" y="57" width="12" height="9" rx="2" fill="#5A5D61" transform={`rotate(${a} 200 200)`} />
      ))}
      <circle cx="200" cy="200" r="130" fill="#2B2D31" />

      <g clipPath={`url(#${id}-win)`}>
        <circle cx="200" cy="200" r="124" fill={`url(#${id}-perlage)`} />
        <g transform="translate(200 200) scale(1.1) translate(-200 -200)">
        {/* bridges */}
        <path d="M100,150 Q170,108 262,128 L290,186 Q210,180 132,214 Z" fill={`url(#${id}-cotes)`} stroke="#6B6E72" strokeWidth="1.2" />
        <path d="M206,232 L312,206 L318,262 Q262,300 214,290 Z" fill={`url(#${id}-cotes)`} stroke="#6B6E72" strokeWidth="1.2" />
        {/* screws */}
        {[
          [118, 172],
          [272, 140],
          [300, 248],
          [226, 282],
        ].map(([x, y]) => (
          <g key={`${x}${y}`}>
            <circle cx={x} cy={y} r="5.5" fill="#3D5A8A" />
            <rect x={x - 4.5} y={y - 0.8} width="9" height="1.6" fill="#16233B" transform={`rotate(35 ${x} ${y})`} />
          </g>
        ))}
        {jewels.map(([x, y]) => (
          <g key={`${x}${y}`}>
            <circle cx={x} cy={y} r="5.4" fill="#C9CBCD" />
            <circle cx={x} cy={y} r="3.6" fill={`url(#${id}-jewel)`} />
          </g>
        ))}
        {/* balance wheel */}
        <g className="balance" style={{ transformOrigin: '150px 266px', transformBox: 'view-box' }}>
          <circle cx="150" cy="266" r="28" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="5" />
          {[0, 90].map((a) => (
            <rect key={a} x="122" y="264.5" width="56" height="3" fill={`url(#${id}-gold)`} transform={`rotate(${a} 150 266)`} />
          ))}
          <circle cx="150" cy="266" r="12" fill="none" stroke="#3B3D40" strokeWidth="0.8" strokeDasharray="2 2" />
          <circle cx="150" cy="266" r="4" fill={`url(#${id}-jewel)`} />
        </g>

        {/* rotor */}
        <g className="rotor" style={{ transformOrigin: '200px 200px', transformBox: 'view-box' }}>
          <path d="M 200 200 L 92 200 A 108 108 0 0 1 308 200 Z" fill={`url(#${id}-rotor)`} opacity="0.94" />
          <path d="M 200 200 L 104 200 A 96 96 0 0 1 296 200 Z" fill="none" stroke="#fff" strokeOpacity="0.4" />
          <text fontSize="9" fontWeight="700" letterSpacing="3" fill="#4B4E52" fontFamily="Manrope Variable, Manrope, sans-serif">
            <textPath href={`#${id}-arc`} startOffset="50%" textAnchor="middle">
              MERID · SOFIA · 27 JEWELS
            </textPath>
          </text>
          <circle cx="200" cy="200" r="13" fill={`url(#${id}-polish)`} />
          <circle cx="200" cy="200" r="4" fill={`url(#${id}-jewel)`} />
        </g>
        </g>
      </g>

      {/* sapphire reflection */}
      <path d="M 116 150 A 96 96 0 0 1 176 102" stroke="#fff" strokeOpacity="0.22" strokeWidth="6" strokeLinecap="round" fill="none" />
    </svg>
  );
}
