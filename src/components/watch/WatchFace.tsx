import { useMemo, useRef, type KeyboardEvent, type RefObject } from 'react';
import { dialById, sizeById, type DialId, type SizeId, type StrapId } from '../../data/product';
import { useI18n } from '../../i18n';
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

export type WatchView = 'full' | 'head' | 'macro' | 'dial';

const VIEWBOX: Record<WatchView, string> = {
  full: '0 0 400 800',
  head: '40 215 320 370',
  macro: '214 362 170 170',
  dial: '52 252 316 296',
};

interface Props {
  dial: DialId;
  strap: StrapId;
  size?: SizeId;
  view?: WatchView;
  live?: boolean;
  className?: string;
  title?: string;
  /** lights off: the dial goes dark and the lume glows */
  night?: boolean;
  /** groups the caller rotates to run the chronograph (centre hand, 30-minute counter) */
  chronoHandRef?: RefObject<SVGGElement | null>;
  chronoCounterRef?: RefObject<SVGGElement | null>;
  /** makes the pushers pressable: top = start/stop, bottom = reset */
  onPusher?: (which: 'start' | 'reset') => void;
}

const HOUR_MARKERS = [0, 1, 2, 4, 5, 7, 8, 10, 11]; // 3, 6 and 9 hold the counters and the date

export function WatchFace({ dial: dialId, strap, size = '40', view = 'full', live = true, className, title, night = false, chronoHandRef, chronoCounterRef, onPusher }: Props) {
  const id = useSvgId('w');
  const { t } = useI18n();
  const dial = dialById(dialId);
  const scale = sizeById(size).scale;
  const svgRef = useRef<SVGSVGElement>(null);
  const hour = useRef<SVGGElement>(null);
  const minute = useRef<SVGGElement>(null);
  const second = useRef<SVGGElement>(null);
  const hands = useMemo(() => ({ hour, minute, second }), []);
  useWatchHands(svgRef, hands, CX, CY, live, SUB_L);

  const date = new Date().getDate();
  const facet = dial.dark ? `url(#${id}-facet)` : `url(#${id}-facetDark)`;
  const lume = '#EFEBDD';

  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox={VIEWBOX[view]}
      role="img"
      aria-label={title ?? t.watchTitle(t.dials[dial.id])}
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
        <pattern id={`${id}-links`} width="400" height="28" patternUnits="userSpaceOnUse" y="2">
          <rect x="0" y="0" width="400" height="28" fill="#1E2023" />
          {[136, 233].map((x) => (
            <g key={x}>
              <rect x={x} y="1" width="31" height="26" rx="2.5" fill={`url(#${id}-lug)`} />
              <rect x={x + 1} y="1.6" width="29" height="1.2" rx="0.6" fill="#fff" opacity="0.55" />
              <rect x={x + 1} y="25" width="29" height="1.2" rx="0.6" fill="#000" opacity="0.3" />
            </g>
          ))}
          {[169.5, 190, 210.5].map((x) => (
            <rect key={x} x={x} y="1.5" width="19" height="25" rx="9" fill={`url(#${id}-rice)`} />
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
        <filter id={`${id}-glow`} x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* brushed steel across a lug or the hood: light down the middle, darker at the edges */}
        <linearGradient id={`${id}-hood`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8E9297" />
          <stop offset="0.35" stopColor="#D9DCDF" />
          <stop offset="0.75" stopColor="#B7BBBF" />
          <stop offset="1" stopColor="#7A7E83" />
        </linearGradient>
        <linearGradient id={`${id}-bezel`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.22" stopColor="#B9BCC0" />
          <stop offset="0.42" stopColor="#5F6368" />
          <stop offset="0.6" stopColor="#F2F3F4" />
          <stop offset="0.8" stopColor="#8D9196" />
          <stop offset="1" stopColor="#E4E6E8" />
        </linearGradient>
        <radialGradient id={`${id}-rehaut`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.9" stopColor={dial.sub} />
          <stop offset="1" stopColor={dial.dark ? '#0E0F11' : '#8F8B82'} />
        </radialGradient>
        {/* faceted hands and markers: one side lit, the other in shade */}
        <linearGradient id={`${id}-facet`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.49" stopColor="#D3D6D9" />
          <stop offset="0.51" stopColor="#7C8085" />
          <stop offset="1" stopColor="#A9ADB1" />
        </linearGradient>
        <linearGradient id={`${id}-facetDark`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4A4D52" />
          <stop offset="0.49" stopColor="#2A2C30" />
          <stop offset="0.51" stopColor="#0F1012" />
          <stop offset="1" stopColor="#1E2023" />
        </linearGradient>
        <linearGradient id={`${id}-pump`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6F7378" />
          <stop offset="0.25" stopColor="#F5F6F7" />
          <stop offset="0.5" stopColor="#A3A7AB" />
          <stop offset="0.8" stopColor="#E1E3E5" />
          <stop offset="1" stopColor="#5E6267" />
        </linearGradient>
        <radialGradient id={`${id}-dome`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.8" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </radialGradient>
        <filter id={`${id}-soft`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <clipPath id={`${id}-dialclip`}>
          <circle cx={CX} cy={CY} r="111" />
        </clipPath>
      </defs>

      <g transform={`translate(${CX} ${CY}) scale(${scale}) translate(${-CX} ${-CY})`}>
        <Strap id={id} strap={strap} />

        {/* the case's hood between the lugs at 12 and 6, sloping down to the strap */}
        {[false, true].map((flip) => (
          <g key={String(flip)} transform={flip ? `translate(0 ${CY * 2}) scale(1 -1)` : undefined}>
            <rect x="136" y="244" width="128" height="70" fill={`url(#${id}-hood)`} />
            <rect x="136" y="244" width="128" height="2.4" fill="#2A2C30" opacity="0.7" />
            <rect x="136" y="246.4" width="128" height="1" fill="#fff" opacity="0.5" />
          </g>
        ))}

        {/* lugs: tapered, brushed on top, a polished bevel down the outside */}
        {[
          [false, false],
          [true, false],
          [false, true],
          [true, true],
        ].map(([fx, fy]) => (
          <g
            key={`${fx}${fy}`}
            transform={`${fx ? `translate(${CX * 2} 0) scale(-1 1)` : ''} ${fy ? `translate(0 ${CY * 2}) scale(1 -1)` : ''}`}
          >
            <path d="M138.5,330 L138.5,230 Q138.5,220 130,220 Q122,220 121,230 L114.5,330 Z" fill={`url(#${id}-lug)`} />
            <path d="M116,326 L121.6,232" stroke="#fff" strokeOpacity="0.75" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M114.6,330 L120.8,230" stroke="#3C3F43" strokeOpacity="0.6" strokeWidth="0.6" />
            <path d="M137.6,326 L137.6,232" stroke="#000" strokeOpacity="0.25" strokeWidth="1.2" />
          </g>
        ))}

        {/* pushers at 2 and 4 o'clock */}
        {[-30, 30].map((a) => {
          const which = a < 0 ? 'start' : 'reset';
          const press = onPusher
            ? {
                role: 'button',
                tabIndex: 0,
                'aria-label': which === 'start' ? t.common.startStop : t.common.reset,
                className: 'pusher',
                onClick: () => onPusher(which),
                onKeyDown: (e: KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPusher(which);
                  }
                },
              }
            : {};
          return (
            <g key={a} transform={`rotate(${a} ${CX} ${CY})`}>
              <g {...press}>
                <rect x="328" y="392.5" width="13" height="15" rx="1.5" fill={`url(#${id}-pump)`} />
                <rect x="339" y="386" width="14" height="28" rx="3" fill={`url(#${id}-pump)`} />
                <rect x="352" y="387" width="3.2" height="26" rx="1.4" fill={`url(#${id}-pump)`} />
                <rect x="339" y="386" width="14" height="28" rx="3" fill="none" stroke="#4A4D52" strokeWidth="0.5" />
              </g>
            </g>
          );
        })}

        {/* crown */}
        <rect x="324" y="389" width="12" height="22" rx="1.5" fill={`url(#${id}-pump)`} />
        <rect x="333" y="376" width="22" height="48" rx="4" fill={`url(#${id}-pump)`} />
        {Array.from({ length: 22 }, (_, i) => (
          <rect key={i} x="333.5" y={377.5 + i * 2.1} width="21" height="0.9" fill="#4E5156" opacity="0.55" />
        ))}
        <rect x="353" y="377" width="3.4" height="46" rx="1.6" fill={`url(#${id}-pump)`} />
        <rect x="333" y="376" width="22" height="48" rx="4" fill="none" stroke="#45484C" strokeWidth="0.5" />

        {/* case and bezel */}
        <circle cx={CX} cy={CY + 2} r="134" fill="#000" opacity="0.35" />
        <circle cx={CX} cy={CY} r="134" fill={`url(#${id}-brushed)`} />
        <circle cx={CX} cy={CY} r="133.2" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="0.9" />
        <circle cx={CX} cy={CY} r="129.5" fill="#4A4D52" />
        <circle cx={CX} cy={CY} r="129" fill={`url(#${id}-bezel)`} />
        <circle cx={CX} cy={CY} r="122.5" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="0.8" />
        <circle cx={CX} cy={CY} r="121" fill={dial.dark ? '#0E0F11' : '#5E6166'} />
        <circle cx={CX} cy={CY} r="119.6" fill={`url(#${id}-rehaut)`} />
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
        <g clipPath={`url(#${id}-dialclip)`} filter={`url(#${id}-soft)`}>
          <path d={sector(-62, -18)} fill="#fff" opacity={dial.dark ? 0.2 : 0.35} />
          <path d={sector(118, 162)} fill="#fff" opacity={dial.dark ? 0.16 : 0.3} />
          <path d={sector(28, 72)} fill="#000" opacity={dial.dark ? 0.28 : 0.08} />
          <path d={sector(208, 252)} fill="#000" opacity={dial.dark ? 0.28 : 0.08} />
        </g>

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
                    <rect x={CX + dx - 3.3} y={CY - 98} width="6.6" height="24" rx="1.2" fill={facet} />
                    <rect className="lume" x={CX + dx - 1.3} y={CY - 95.5} width="2.6" height="19" rx="0.8" fill={lume} />
                  </g>
                ))}
              </g>
            ) : (
              <g key={i} transform={`rotate(${i * 30} ${CX} ${CY})`}>
                <rect x={CX - 3.3} y={CY - 98} width="6.6" height="21" rx="1.2" fill={facet} />
                <rect className="lume" x={CX - 1.3} y={CY - 95.5} width="2.6" height="16" rx="0.8" fill={lume} />
              </g>
            ),
          )}
          {[3, 6, 9].map((i) => (
            <g key={i} transform={`rotate(${i * 30} ${CX} ${CY})`}>
              <rect x={CX - 3} y={CY - 98} width="6" height="10" rx="1.1" fill={facet} />
              <rect className="lume" x={CX - 1.1} y={CY - 96} width="2.2" height="6" rx="0.6" fill={lume} />
            </g>
          ))}
        </g>

        {/* date at 6 */}
        <rect x="188" y="461" width="24" height="20" rx="2" fill={`url(#${id}-polish)`} />
        <rect x="190" y="463" width="20" height="16" rx="1.2" fill="#F6F3EC" />
        <text x="200" y="475.3" textAnchor="middle" fontSize="11" fontWeight="600" fill="#17191C" fontFamily={FONT}>
          {date}
        </text>

        {/* printing */}
        <text x={CX + 1.6} y={CY - 50} textAnchor="middle" fontSize="15" fontWeight="600" letterSpacing="3.4" fill={dial.print} fontFamily={FONT}>
          MERID
        </text>
        <text x={CX + 1.2} y={CY - 38} textAnchor="middle" fontSize="6.2" fontWeight="600" letterSpacing="2.2" fill={dial.print} fillOpacity="0.85" fontFamily={FONT}>
          AUTOMATIC
        </text>
        <text x={CX + 1} y={CY + 50} textAnchor="middle" fontSize="5.4" fontWeight="700" letterSpacing="2" fill={ORANGE} fontFamily={FONT}>
          CHRONOGRAPH
        </text>

        {night && (
          <g>
            <rect x="0" y="0" width="400" height="800" fill="var(--bg, #0b0c0e)" opacity="0.9" />
            <g filter={`url(#${id}-glow)`} fill="#C9F7C6">
              {HOUR_MARKERS.map((i) =>
                i === 0 ? (
                  [-5.5, 5.5].map((dx) => <rect key={dx} x={CX + dx - 1.3} y={CY - 95} width="2.6" height="18" rx="0.8" />)
                ) : (
                  <rect key={i} x={CX - 1.3} y={CY - 95} width="2.6" height="15" rx="0.8" transform={`rotate(${i * 30} ${CX} ${CY})`} />
                ),
              )}
            </g>
          </g>
        )}

        {/* hands */}
        <g filter={`url(#${id}-shadow)`} className={night ? 'is-night' : undefined}>
          {/* running seconds in the sub-dial at 9 */}
          <g ref={second}>
            <rect x={SUB_L[0] - 0.6} y={SUB_L[1] - 23} width="1.2" height="28" rx="0.6" fill={dial.print} />
          </g>
          <circle cx={SUB_L[0]} cy={SUB_L[1]} r="2.2" fill={dial.print} />
          {/* 30-minute counter at rest */}
          <g ref={chronoCounterRef}>
            <rect x={SUB_R[0] - 0.6} y={SUB_R[1] - 23} width="1.2" height="28" rx="0.6" fill={dial.print} />
          </g>
          <circle cx={SUB_R[0]} cy={SUB_R[1]} r="2.2" fill={dial.print} />

          <g ref={hour}>
            <path className="hand-body" d="M200,332 L206.5,354 L202.8,400 Q203.8,406 202.2,411 L197.8,411 Q196.2,406 197.2,400 L193.5,354 Z" fill={facet} />
            <path className="lume" d="M200,345 L202.3,357 L200.8,390 L199.2,390 L197.7,357 Z" fill={night ? '#C9F7C6' : lume} filter={night ? `url(#${id}-glow)` : undefined} />
          </g>
          <g ref={minute}>
            <path className="hand-body" d="M200,298 L205,326 L202.3,400 Q203.2,406 201.9,412 L198.1,412 Q196.8,406 197.7,400 L195,326 Z" fill={facet} />
            <path className="lume" d="M200,311 L201.8,329 L200.7,388 L199.3,388 L198.2,329 Z" fill={night ? '#C9F7C6' : lume} filter={night ? `url(#${id}-glow)` : undefined} />
          </g>
          {/* chronograph seconds, resting at 12 unless the caller runs it */}
          <g ref={chronoHandRef}>
            <rect x="199.4" y="290" width="1.2" height="134" rx="0.6" fill={ORANGE} />
            <rect x="198.6" y="410" width="2.8" height="14" rx="1.2" fill={ORANGE} />
          </g>
          <circle cx={CX} cy={CY} r="4.6" fill={ORANGE} />
          <circle cx={CX} cy={CY} r="1.6" fill="#7A2E0C" />
        </g>

        {/* crystal */}
        <circle cx={CX} cy={CY} r="119.6" fill={`url(#${id}-dome)`} pointerEvents="none" />
        <circle cx={CX} cy={CY} r="119.6" fill={`url(#${id}-glass)`} pointerEvents="none" />
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

/** A wedge of the dial between two clock angles (degrees from 12), for the sunburst's light and shade. */
function sector(a1: number, a2: number, r = 130) {
  const p = (a: number) => {
    const t = (a * Math.PI) / 180;
    return `${(CX + Math.sin(t) * r).toFixed(1)},${(CY - Math.cos(t) * r).toFixed(1)}`;
  };
  return `M ${CX},${CY} L ${p(a1)} A ${r},${r} 0 0 1 ${p(a2)} Z`;
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
