import { useMemo, useRef } from 'react';
import { dialById, sizeById, type DialId, type SizeId, type StrapId } from '../../data/product';
import { useSvgId, useWatchHands } from './useClock';

/**
 * Front view of the Meridian, drawn in SVG so every dial and strap
 * combination is pixel-sharp at any size. Swap for product photography
 * by replacing <WatchFace> with an <img> where the client has shots.
 */

const CX = 200;
const CY = 400;

export type WatchView = 'full' | 'head' | 'macro';

const VIEWBOX: Record<WatchView, string> = {
  full: '0 0 400 800',
  head: '40 215 320 370',
  macro: '244 322 156 156',
};

interface Props {
  dial: DialId;
  strap: StrapId;
  size?: SizeId;
  view?: WatchView;
  live?: boolean;
  className?: string;
  title?: string;
}

const MARKERS = Array.from({ length: 12 }, (_, i) => i).filter((i) => i !== 3); // 3 o’clock holds the date

export function WatchFace({ dial: dialId, strap, size = '39', view = 'full', live = true, className, title }: Props) {
  const id = useSvgId('w');
  const dial = dialById(dialId);
  const scale = sizeById(size).scale;
  const svgRef = useRef<SVGSVGElement>(null);
  const hour = useRef<SVGGElement>(null);
  const minute = useRef<SVGGElement>(null);
  const second = useRef<SVGGElement>(null);
  const hands = useMemo(() => ({ hour, minute, second }), []);
  useWatchHands(svgRef, hands, CX, CY, live);

  const date = new Date().getDate();
  const handFill = dial.dark ? `url(#${id}-polish)` : '#1B1D20';
  const markerFill = dial.dark ? `url(#${id}-polish)` : '#1B1D20';
  const lume = dial.dark ? '#EDE8D6' : '#F4F0E2';

  const sunburst = useMemo(
    () =>
      Array.from({ length: 180 }, (_, i) => {
        const a = (i / 180) * Math.PI * 2;
        return { x: CX + Math.cos(a) * 110, y: CY + Math.sin(a) * 110, light: i % 2 === 0 };
      }),
    [],
  );

  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox={VIEWBOX[view]}
      role="img"
      aria-label={title ?? `Meridian with ${dial.name.toLowerCase()} dial`}
      preserveAspectRatio="xMidYMid meet"
      data-view={view}
    >
      <defs>
        <linearGradient id={`${id}-brushed`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F2F2F0" />
          <stop offset="0.28" stopColor="#B9BBBE" />
          <stop offset="0.5" stopColor="#E4E4E2" />
          <stop offset="0.72" stopColor="#8E9195" />
          <stop offset="1" stopColor="#D2D3D2" />
        </linearGradient>
        <linearGradient id={`${id}-polish`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#7D8085" />
          <stop offset="0.35" stopColor="#FAFAF8" />
          <stop offset="0.55" stopColor="#A4A7AB" />
          <stop offset="0.8" stopColor="#F0F0EE" />
          <stop offset="1" stopColor="#8B8E92" />
        </linearGradient>
        <linearGradient id={`${id}-lug`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8A8D91" />
          <stop offset="0.45" stopColor="#ECECEA" />
          <stop offset="1" stopColor="#9C9FA3" />
        </linearGradient>
        <radialGradient id={`${id}-dial`} cx="0.38" cy="0.32" r="0.85">
          <stop offset="0" stopColor={dial.glow} />
          <stop offset="1" stopColor={dial.base} />
        </radialGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.42" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.8" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id={`${id}-leather`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5C3520" />
          <stop offset="0.12" stopColor="#8B5635" />
          <stop offset="0.5" stopColor="#9C6340" />
          <stop offset="0.88" stopColor="#8B5635" />
          <stop offset="1" stopColor="#5C3520" />
        </linearGradient>
        <linearGradient id={`${id}-rubber`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0E0F11" />
          <stop offset="0.15" stopColor="#24272B" />
          <stop offset="0.5" stopColor="#2B2E33" />
          <stop offset="0.85" stopColor="#24272B" />
          <stop offset="1" stopColor="#0E0F11" />
        </linearGradient>
        <pattern id={`${id}-links`} width="400" height="26" patternUnits="userSpaceOnUse" y="7">
          <rect x="0" y="0" width="400" height="26" fill="#55585D" />
          <rect x="130" y="1" width="45" height="24" rx="3" fill={`url(#${id}-lug)`} />
          <rect x="225" y="1" width="45" height="24" rx="3" fill={`url(#${id}-lug)`} />
          <rect x="177" y="1" width="46" height="24" rx="4" fill={`url(#${id}-polish)`} />
        </pattern>
        <pattern id={`${id}-grooves`} width="400" height="12" patternUnits="userSpaceOnUse">
          <rect width="400" height="12" fill={`url(#${id}-rubber)`} />
          <rect x="152" y="5" width="96" height="2" rx="1" fill="#000" opacity="0.35" />
          <rect x="152" y="7" width="96" height="1" rx="0.5" fill="#fff" opacity="0.05" />
        </pattern>
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="1.6" dy="2.4" stdDeviation="1.4" floodColor="#000" floodOpacity="0.38" />
        </filter>
        <filter id={`${id}-case-shadow`} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#2A2015" floodOpacity="0.18" />
        </filter>
        <clipPath id={`${id}-dialclip`}>
          <circle cx={CX} cy={CY} r="110" />
        </clipPath>
      </defs>

      <g transform={`translate(${CX} ${CY}) scale(${scale}) translate(${-CX} ${-CY})`}>
        {/* strap */}
        <Strap id={id} strap={strap} />

        {/* lugs */}
        <g filter={`url(#${id}-case-shadow)`}>
          {[
            [123, 228],
            [261, 228],
            [123, 468],
            [261, 468],
          ].map(([x, y]) => (
            <g key={`${x}-${y}`}>
              <rect x={x} y={y} width="16" height="104" rx="8" fill={`url(#${id}-lug)`} />
              <rect x={x + 3.5} y={y + 6} width="2" height="92" rx="1" fill="#fff" opacity="0.55" />
            </g>
          ))}

          {/* crown */}
          <rect x="322" y="391" width="10" height="18" rx="2" fill="#9A9DA1" />
          <rect x="329" y="380" width="22" height="40" rx="5" fill={`url(#${id}-lug)`} />
          {Array.from({ length: 7 }, (_, i) => (
            <rect key={i} x={332 + i * 2.8} y="381" width="1.2" height="38" fill="#6E7175" opacity="0.6" />
          ))}

          {/* case */}
          <circle cx={CX} cy={CY} r="130" fill={`url(#${id}-brushed)`} />
        </g>
        <circle cx={CX} cy={CY} r="129.2" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1" />
        <circle cx={CX} cy={CY} r="123" fill={`url(#${id}-polish)`} />
        <circle cx={CX} cy={CY} r="116" fill="#2A2C30" />
        <circle cx={CX} cy={CY} r="114.5" fill={dial.dark ? dial.base : '#CFC8B9'} />

        {/* dial */}
        <circle cx={CX} cy={CY} r="110" fill={`url(#${id}-dial)`} />
        <g clipPath={`url(#${id}-dialclip)`} opacity={dial.dark ? 1 : 0.6}>
          {sunburst.map((p, i) => (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={p.x}
              y2={p.y}
              stroke={p.light ? '#fff' : '#000'}
              strokeOpacity={p.light ? 0.035 : 0.05}
              strokeWidth="1.8"
            />
          ))}
        </g>

        {/* minute track */}
        {Array.from({ length: 60 }, (_, i) => {
          const five = i % 5 === 0;
          return (
            <line
              key={i}
              x1={CX}
              y1={CY - 107}
              x2={CX}
              y2={CY - (five ? 100.5 : 103.5)}
              stroke={dial.print}
              strokeOpacity={five ? 0.85 : 0.55}
              strokeWidth={five ? 1.3 : 0.7}
              transform={`rotate(${i * 6} ${CX} ${CY})`}
            />
          );
        })}

        {/* applied markers */}
        <g filter={`url(#${id}-shadow)`}>
          {MARKERS.map((i) =>
            i === 0 ? (
              <g key={i}>
                {[-6, 6].map((dx) => (
                  <g key={dx}>
                    <rect x={CX + dx - 3.4} y={CY - 96} width="6.8" height="24" rx="1.6" fill={markerFill} />
                    <rect x={CX + dx - 1.4} y={CY - 93} width="2.8" height="18" rx="1" fill={lume} />
                  </g>
                ))}
              </g>
            ) : (
              <g key={i} transform={`rotate(${i * 30} ${CX} ${CY})`}>
                <rect x={CX - 3.4} y={CY - 96} width="6.8" height={i % 3 === 0 ? 24 : 19} rx="1.6" fill={markerFill} />
                <rect x={CX - 1.4} y={CY - 93} width="2.8" height={i % 3 === 0 ? 18 : 13} rx="1" fill={lume} />
              </g>
            ),
          )}
        </g>

        {/* date window */}
        <rect x="267" y="390" width="25" height="20" rx="2" fill={`url(#${id}-polish)`} />
        <rect x="269" y="392" width="21" height="16" rx="1.2" fill="#F6F3EC" />
        <text x="279.5" y="404.3" textAnchor="middle" fontSize="11" fontWeight="600" fill="#17191C" fontFamily="Manrope Variable, Manrope, sans-serif">
          {date}
        </text>

        {/* printing */}
        <text x={CX} y={CY - 46} textAnchor="middle" fontSize="13" fontWeight="700" letterSpacing="4" fill={dial.print} fontFamily="Manrope Variable, Manrope, sans-serif">
          MERID
        </text>
        <text x={CX} y={CY + 52} textAnchor="middle" fontSize="6.6" fontWeight="600" letterSpacing="2.6" fill={dial.print} fillOpacity="0.78" fontFamily="Manrope Variable, Manrope, sans-serif">
          AUTOMATIC
        </text>
        <text x={CX} y={CY + 62} textAnchor="middle" fontSize="5.6" fontWeight="700" letterSpacing="2" fill="#D0561F" fontFamily="Manrope Variable, Manrope, sans-serif">
          100 M
        </text>

        {/* hands */}
        <g filter={`url(#${id}-shadow)`}>
          <g ref={hour}>
            <path d="M200,332 L206.2,352 L205.4,406 L194.6,406 L193.8,352 Z" fill={handFill} />
            <path d="M200,339 L203.4,353 L203,394 L197,394 L196.6,353 Z" fill={lume} />
          </g>
          <g ref={minute}>
            <path d="M200,302 L205.2,323 L204.6,408 L195.4,408 L194.8,323 Z" fill={handFill} />
            <path d="M200,309 L202.7,324 L202.4,395 L197.6,395 L197.3,324 Z" fill={lume} />
          </g>
          <g ref={second}>
            <rect x="199.3" y="296" width="1.4" height="130" rx="0.7" fill="#D0561F" />
            <circle cx="200" cy="420" r="3.4" fill="#D0561F" />
          </g>
          <circle cx={CX} cy={CY} r="4.8" fill={`url(#${id}-polish)`} />
          <circle cx={CX} cy={CY} r="2" fill="#D0561F" />
        </g>

        {/* crystal */}
        <circle cx={CX} cy={CY} r="116" fill={`url(#${id}-glass)`} pointerEvents="none" />
        <path
          d={`M ${CX - 92} ${CY - 46} A 104 104 0 0 1 ${CX - 30} ${CY - 100}`}
          stroke="#fff"
          strokeOpacity="0.16"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

function Strap({ id, strap }: { id: string; strap: StrapId }) {
  // top and bottom strap shapes: slight taper away from the case
  const top = 'M136,300 L136,40 Q137,-20 140,-40 L260,-40 Q263,-20 264,40 L264,300 Z';
  const bottom = 'M136,500 L136,760 Q137,820 140,840 L260,840 Q263,820 264,760 L264,500 Z';

  if (strap === 'bracelet') {
    return (
      <g>
        <path d={top} fill={`url(#${id}-links)`} />
        <path d={bottom} fill={`url(#${id}-links)`} />
        <path d={top} fill="none" stroke="#3E4145" strokeWidth="1" />
        <path d={bottom} fill="none" stroke="#3E4145" strokeWidth="1" />
      </g>
    );
  }

  if (strap === 'rubber') {
    return (
      <g>
        <path d={top} fill={`url(#${id}-grooves)`} />
        <path d={bottom} fill={`url(#${id}-grooves)`} />
        {[640, 672, 704].map((y) => (
          <ellipse key={y} cx="200" cy={y} rx="4" ry="5" fill="#060708" />
        ))}
      </g>
    );
  }

  return (
    <g>
      <path d={top} fill={`url(#${id}-leather)`} />
      <path d={bottom} fill={`url(#${id}-leather)`} />
      {[top, bottom].map((d) => (
        <path key={d} d={d} fill="none" stroke="#3B2112" strokeWidth="2" />
      ))}
      {[143, 257].map((x) => (
        <g key={x}>
          <line x1={x} y1="-40" x2={x} y2="296" stroke="#EADCC4" strokeOpacity="0.85" strokeWidth="1.3" strokeDasharray="5 4" />
          <line x1={x} y1="504" x2={x} y2="840" stroke="#EADCC4" strokeOpacity="0.85" strokeWidth="1.3" strokeDasharray="5 4" />
        </g>
      ))}
      {[648, 680, 712].map((y) => (
        <ellipse key={y} cx="200" cy={y} rx="3.6" ry="4.6" fill="#2A160B" />
      ))}
    </g>
  );
}
