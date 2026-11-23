import { useMemo, useRef } from 'react';
import { dialById, sizeById, type DialId, type SizeId, type StrapId } from '../../data/product';
import { useSvgId, useWatchHands } from './useClock';

/**
 * Front view of the Meridian Chronograph, drawn in SVG so every dial and strap
 * combination is pixel-sharp at any size. Swap for product photography by
 * replacing <WatchFace> with an <img> where the client has shots.
 *
 * Layout: running seconds in the sub-dial at 9, 30-minute counter at 3,
 * date at 6, the orange chronograph hand resting at 12.
 */

const CX = 200;
const CY = 400;
const SUB_L: [number, number] = [154, 400]; // small seconds
const SUB_R: [number, number] = [246, 400]; // 30-minute counter
const SUB_R_SIZE = 27;
const FONT = 'Manrope Variable, Manrope, sans-serif';
const ORANGE = '#D2591F';

export type WatchView = 'full' | 'head' | 'macro';

const VIEWBOX: Record<WatchView, string> = {
  full: '0 0 400 800',
  head: '40 215 320 370',
  macro: '214 362 170 170',
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

const HOUR_MARKERS = [0, 1, 2, 4, 5, 7, 8, 10, 11]; // 3, 6 and 9 hold the counters and the date

export function WatchFace({ dial: dialId, strap, size = '40', view = 'full', live = true, className, title }: Props) {
  const id = useSvgId('w');
  const dial = dialById(dialId);
  const scale = sizeById(size).scale;
  const svgRef = useRef<SVGSVGElement>(null);
  const hour = useRef<SVGGElement>(null);
  const minute = useRef<SVGGElement>(null);
  const second = useRef<SVGGElement>(null);
  const hands = useMemo(() => ({ hour, minute, second }), []);
  useWatchHands(svgRef, hands, CX, CY, live, SUB_L);

  const date = new Date().getDate();
  const steel = dial.dark ? `url(#${id}-polish)` : '#1B1D20';
  const lume = '#EFEBDD';

  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox={VIEWBOX[view]}
      role="img"
      aria-label={title ?? `Meridian Chronograph with ${dial.name.toLowerCase()} dial`}
      preserveAspectRatio="xMidYMid meet"
      data-view={view}
    >
      <defs>
        <linearGradient id={`${id}-brushed`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F2F2F0" />
          <stop offset="0.28" stopColor="#B4B7BA" />
          <stop offset="0.5" stopColor="#E6E6E4" />
          <stop offset="0.72" stopColor="#8A8D91" />
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
          <stop offset="0" stopColor="#fff" stopOpacity="0.2" />
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
        <radialGradient id={`${id}-rice`} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.45" stopColor="#D9DBDE" />
          <stop offset="1" stopColor="#7E8186" />
        </radialGradient>
        {/* beads of rice: brushed outer links, three rows of polished rice links, dark gaps */}
        <pattern id={`${id}-links`} width="400" height="17" patternUnits="userSpaceOnUse" y="2">
          <rect x="0" y="0" width="400" height="17" fill="#2E3034" />
          <rect x="136" y="1" width="31" height="15" rx="3" fill={`url(#${id}-lug)`} />
          <rect x="231" y="1" width="33" height="15" rx="3" fill={`url(#${id}-lug)`} />
          {[168, 189, 210].map((x) => (
            <rect key={x} x={x} y="1" width="20" height="15" rx="6.5" fill={`url(#${id}-rice)`} />
          ))}
        </pattern>
        <pattern id={`${id}-grooves`} width="400" height="12" patternUnits="userSpaceOnUse">
          <rect width="400" height="12" fill={`url(#${id}-rubber)`} />
          <rect x="152" y="5" width="96" height="2" rx="1" fill="#000" opacity="0.35" />
          <rect x="152" y="7" width="96" height="1" rx="0.5" fill="#fff" opacity="0.05" />
        </pattern>
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="1.4" dy="2.2" stdDeviation="1.3" floodColor="#000" floodOpacity="0.4" />
        </filter>
        <clipPath id={`${id}-dialclip`}>
          <circle cx={CX} cy={CY} r="111" />
        </clipPath>
      </defs>

      <g transform={`translate(${CX} ${CY}) scale(${scale}) translate(${-CX} ${-CY})`}>
        <Strap id={id} strap={strap} />

        {/* lugs */}
        {[
          [122, 222],
          [262, 222],
          [122, 474],
          [262, 474],
        ].map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <rect x={x} y={y} width="16" height="104" rx="8" fill={`url(#${id}-lug)`} />
            <rect x={x + 3.5} y={y + 6} width="2" height="92" rx="1" fill="#fff" opacity="0.55" />
          </g>
        ))}

        {/* pushers at 2 and 4 o'clock */}
        {[-30, 30].map((a) => (
          <g key={a} transform={`rotate(${a} ${CX} ${CY})`}>
            <rect x="328" y="393" width="12" height="14" rx="2" fill="#9A9DA1" />
            <rect x="338" y="387" width="15" height="26" rx="5" fill={`url(#${id}-lug)`} />
            <rect x="349" y="389" width="2.5" height="22" rx="1.2" fill="#fff" opacity="0.6" />
          </g>
        ))}

        {/* crown */}
        <rect x="324" y="390" width="12" height="20" rx="2" fill="#9A9DA1" />
        <rect x="332" y="378" width="24" height="44" rx="6" fill={`url(#${id}-lug)`} />
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={335 + i * 2.6} y="379" width="1.2" height="42" fill="#6E7175" opacity="0.6" />
        ))}

        {/* case and bezel */}
        <circle cx={CX} cy={CY} r="133" fill={`url(#${id}-brushed)`} />
        <circle cx={CX} cy={CY} r="132.2" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1" />
        <circle cx={CX} cy={CY} r="127" fill={`url(#${id}-polish)`} />
        <circle cx={CX} cy={CY} r="120" fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="1.5" />
        <circle cx={CX} cy={CY} r="118" fill="#25272B" />
        {/* rehaut with its own minute scale */}
        {Array.from({ length: 60 }, (_, i) => (
          <line
            key={i}
            x1={CX}
            y1={CY - 117}
            x2={CX}
            y2={CY - (i % 5 === 0 ? 112.5 : 114.5)}
            stroke="#D9D6CF"
            strokeOpacity={i % 5 === 0 ? 0.9 : 0.5}
            strokeWidth={i % 5 === 0 ? 1.1 : 0.6}
            transform={`rotate(${i * 6} ${CX} ${CY})`}
          />
        ))}

        {/* dial */}
        <circle cx={CX} cy={CY} r="111" fill={`url(#${id}-dial)`} />
        <Sunburst id={id} dark={dial.dark} />

        {/* fifth-of-a-second track */}
        {Array.from({ length: 240 }, (_, i) => {
          const five = i % 20 === 0;
          const sec = i % 4 === 0;
          return (
            <line
              key={i}
              x1={CX}
              y1={CY - 109}
              x2={CX}
              y2={CY - (five ? 101 : sec ? 104.5 : 106.5)}
              stroke={dial.print}
              strokeOpacity={five ? 0.9 : sec ? 0.6 : 0.35}
              strokeWidth={five ? 1.4 : sec ? 0.8 : 0.45}
              transform={`rotate(${i * 1.5} ${CX} ${CY})`}
            />
          );
        })}

        {/* sub-dials */}
        <SubDial cx={SUB_L[0]} cy={SUB_L[1]} fill={dial.sub} print={dial.print} labels={['60', '20', '40']} ticks={60} />
        <SubDial cx={SUB_R[0]} cy={SUB_R[1]} fill={dial.sub} print={dial.print} labels={['30', '10', '20']} ticks={30} />

        {/* applied markers */}
        <g filter={`url(#${id}-shadow)`}>
          {HOUR_MARKERS.map((i) =>
            i === 0 ? (
              <g key={i}>
                {[-5.5, 5.5].map((dx) => (
                  <g key={dx}>
                    <rect x={CX + dx - 3.3} y={CY - 98} width="6.6" height="24" rx="1.4" fill={steel} />
                    <rect x={CX + dx - 1.3} y={CY - 95} width="2.6" height="18" rx="0.8" fill={lume} />
                  </g>
                ))}
              </g>
            ) : (
              <g key={i} transform={`rotate(${i * 30} ${CX} ${CY})`}>
                <rect x={CX - 3.3} y={CY - 98} width="6.6" height="21" rx="1.4" fill={steel} />
                <rect x={CX - 1.3} y={CY - 95} width="2.6" height="15" rx="0.8" fill={lume} />
              </g>
            ),
          )}
        </g>

        {/* date at 6 */}
        <rect x="188" y="461" width="24" height="20" rx="2" fill={`url(#${id}-polish)`} />
        <rect x="190" y="463" width="20" height="16" rx="1.2" fill="#F6F3EC" />
        <text x="200" y="475.3" textAnchor="middle" fontSize="11" fontWeight="600" fill="#17191C" fontFamily={FONT}>
          {date}
        </text>

        {/* printing */}
        <text x={CX + 1.6} y={CY - 52} textAnchor="middle" fontSize="12.5" fontWeight="700" letterSpacing="4" fill={dial.print} fontFamily={FONT}>
          MERID
        </text>
        <text x={CX + 1.2} y={CY - 42} textAnchor="middle" fontSize="5.6" fontWeight="600" letterSpacing="2.4" fill={dial.print} fillOpacity="0.75" fontFamily={FONT}>
          AUTOMATIC
        </text>
        <text x={CX + 1} y={CY + 50} textAnchor="middle" fontSize="5.4" fontWeight="700" letterSpacing="2" fill={ORANGE} fontFamily={FONT}>
          CHRONOGRAPH
        </text>

        {/* hands */}
        <g filter={`url(#${id}-shadow)`}>
          {/* running seconds in the sub-dial at 9 */}
          <g ref={second}>
            <rect x={SUB_L[0] - 0.6} y={SUB_L[1] - 23} width="1.2" height="28" rx="0.6" fill={dial.print} />
          </g>
          <circle cx={SUB_L[0]} cy={SUB_L[1]} r="2.2" fill={dial.print} />
          {/* 30-minute counter at rest */}
          <rect x={SUB_R[0] - 0.6} y={SUB_R[1] - 23} width="1.2" height="28" rx="0.6" fill={dial.print} />
          <circle cx={SUB_R[0]} cy={SUB_R[1]} r="2.2" fill={dial.print} />

          <g ref={hour}>
            <path d="M200,334 L205,342 L205,408 L195,408 L195,342 Z" fill={steel} />
            <rect x="197.4" y="344" width="5.2" height="50" rx="1" fill={lume} />
          </g>
          <g ref={minute}>
            <path d="M200,300 L204.2,308 L204.2,410 L195.8,410 L195.8,308 Z" fill={steel} />
            <rect x="197.8" y="310" width="4.4" height="84" rx="1" fill={lume} />
          </g>
          {/* chronograph seconds, resting at 12 */}
          <rect x="199.35" y="292" width="1.3" height="134" rx="0.65" fill={ORANGE} />
          <path d="M196.6,426 L203.4,426 L200,436 Z" fill={ORANGE} />
          <circle cx={CX} cy={CY} r="5" fill={`url(#${id}-polish)`} />
          <circle cx={CX} cy={CY} r="2" fill={ORANGE} />
        </g>

        {/* crystal */}
        <circle cx={CX} cy={CY} r="118" fill={`url(#${id}-glass)`} pointerEvents="none" />
        <path
          d={`M ${CX - 94} ${CY - 48} A 106 106 0 0 1 ${CX - 30} ${CY - 102}`}
          stroke="#fff"
          strokeOpacity="0.15"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

function Sunburst({ id, dark }: { id: string; dark: boolean }) {
  const rays = useMemo(
    () =>
      Array.from({ length: 180 }, (_, i) => {
        const a = (i / 180) * Math.PI * 2;
        return { x: CX + Math.cos(a) * 111, y: CY + Math.sin(a) * 111, light: i % 2 === 0 };
      }),
    [],
  );
  return (
    <g clipPath={`url(#${id}-dialclip)`} opacity={dark ? 1 : 0.6}>
      {rays.map((p, i) => (
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
  );
}

function SubDial({ cx, cy, fill, print, labels, ticks }: { cx: number; cy: number; fill: string; print: string; labels: string[]; ticks: number }) {
  const step = 360 / ticks;
  const major = ticks === 60 ? 5 : 5;
  return (
    <g>
      <circle cx={cx} cy={cy} r={SUB_R_SIZE} fill={fill} />
      {/* azurage: fine concentric grooves */}
      {Array.from({ length: 10 }, (_, i) => (
        <circle key={i} cx={cx} cy={cy} r={4 + i * 2.2} fill="none" stroke={i % 2 ? '#fff' : '#000'} strokeOpacity="0.07" strokeWidth="1" />
      ))}
      <circle cx={cx} cy={cy} r={SUB_R_SIZE} fill="none" stroke={print} strokeOpacity="0.3" strokeWidth="0.8" />
      {Array.from({ length: ticks }, (_, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy - 25.5}
          x2={cx}
          y2={cy - (i % major === 0 ? 21.5 : 23.5)}
          stroke={print}
          strokeOpacity={i % major === 0 ? 0.9 : 0.5}
          strokeWidth={i % major === 0 ? 0.9 : 0.5}
          transform={`rotate(${i * step} ${cx} ${cy})`}
        />
      ))}
      {labels.map((l, i) => {
        const a = (i * 120 * Math.PI) / 180;
        return (
          <text
            key={l}
            x={cx + Math.sin(a) * 15.5}
            y={cy - Math.cos(a) * 15.5 + 2.2}
            textAnchor="middle"
            fontSize="6"
            fontWeight="600"
            fill={print}
            fillOpacity="0.85"
            fontFamily={FONT}
          >
            {l}
          </text>
        );
      })}
    </g>
  );
}

function Strap({ id, strap }: { id: string; strap: StrapId }) {
  const top = 'M136,300 L136,40 Q137,-20 140,-40 L260,-40 Q263,-20 264,40 L264,300 Z';
  const bottom = 'M136,500 L136,760 Q137,820 140,840 L260,840 Q263,820 264,760 L264,500 Z';

  if (strap === 'bracelet') {
    return (
      <g>
        <path d={top} fill={`url(#${id}-links)`} />
        <path d={bottom} fill={`url(#${id}-links)`} />
        <path d={top} fill="none" stroke="#3E4145" strokeWidth="1" />
        <path d={bottom} fill="none" stroke="#3E4145" strokeWidth="1" />
        {/* fitted end links, flush with the case between the lugs */}
        <rect x="137" y="252" width="126" height="48" rx="4" fill={`url(#${id}-lug)`} />
        <rect x="137" y="500" width="126" height="48" rx="4" fill={`url(#${id}-lug)`} />
        <rect x="141" y="255" width="118" height="2" rx="1" fill="#fff" opacity="0.5" />
        <rect x="141" y="543" width="118" height="2" rx="1" fill="#000" opacity="0.25" />
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
