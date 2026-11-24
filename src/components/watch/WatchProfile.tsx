import { useI18n } from '../../i18n';
import { useSvgId } from './useClock';

/**
 * Crown-side elevation of the Meridian Chronograph, drawn to scale
 * (13 px = 1 mm) as a technical drawing: case, bezel, domed crystal,
 * crown with the engraved mark, both pushers, lugs and bracelet, plus
 * dimension lines and numbered part markers.
 *
 * Dimension lines and markers animate in when the parent gets `.is-drawn`.
 */

const MM = 13;
const CX = 500;
const BASE = 300; // caseback bottom
const TOP = BASE - 12.9 * MM; // crystal top, 12.9 mm up
const CASE_L = CX - 20 * MM;
const CASE_R = CX + 20 * MM;
const LUG_L = CX - 23.5 * MM;
const LUG_R = CX + 23.5 * MM;
const BAND_TOP = 196;
const BAND_BOT = 278;
const MID = (BAND_TOP + BAND_BOT) / 2;

export function WatchProfile({ className }: { className?: string }) {
  const id = useSvgId('p');
  const { t } = useI18n();
  // label backgrounds sized to the words, which are longer in Bulgarian
  const pill = (text: string) => text.length * 11.6 + 26;
  const steel = `url(#${id}-band)`;

  return (
    <svg className={className} viewBox="0 0 1000 440" role="img" aria-label={t.profile.drawing}>
      <defs>
        <linearGradient id={`${id}-band`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4F4F2" />
          <stop offset="0.35" stopColor="#B9BCBF" />
          <stop offset="0.55" stopColor="#E9E9E7" />
          <stop offset="1" stopColor="#74777C" />
        </linearGradient>
        <linearGradient id={`${id}-bezel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#8E9195" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#B8C4CC" stopOpacity="0.25" />
          <stop offset="0.3" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="0.65" stopColor="#C9D3DA" stopOpacity="0.35" />
          <stop offset="1" stopColor="#B8C4CC" stopOpacity="0.25" />
        </linearGradient>
        <radialGradient id={`${id}-knob`} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.55" stopColor="#C9CBCE" />
          <stop offset="1" stopColor="#7B7E83" />
        </radialGradient>
        <pattern id={`${id}-grid`} width={2 * MM} height={2 * MM} patternUnits="userSpaceOnUse" x={CX} y={BASE}>
          <path d={`M ${2 * MM} 0 H 0 V ${2 * MM}`} fill="none" stroke="currentColor" strokeOpacity="0.07" />
        </pattern>
        <radialGradient id={`${id}-fade`} cx="0.5" cy="0.5" r="0.55">
          <stop offset="0.55" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-braceletfade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.6" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-braceletmask`} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="460">
          <rect x="0" y={BAND_BOT} width="1000" height={452 - BAND_BOT} fill={`url(#${id}-braceletfade)`} />
        </mask>
        <mask id={`${id}-gridmask`}>
          <rect width="1000" height="440" fill={`url(#${id}-fade)`} />
        </mask>
        <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 1 L9 5 L0 9" fill="none" stroke="var(--accent)" strokeWidth="1.6" />
        </marker>
      </defs>

      {/* drawing grid, 2 mm squares */}
      <rect width="1000" height="440" fill={`url(#${id}-grid)`} mask={`url(#${id}-gridmask)`} className="prof__grid" />
      <line x1="60" y1={BASE} x2="940" y2={BASE} stroke="currentColor" strokeOpacity="0.14" strokeDasharray="6 6" className="prof__grid" />

      {/* the watch */}
      <g className="prof__watch">
        {/* bracelet links curving round the wrist, fading out */}
        <g mask={`url(#${id}-braceletmask)`}>
        {[
          `M ${LUG_L + 8} ${BAND_BOT + 6} C ${LUG_L - 30} ${BAND_BOT + 40} ${LUG_L - 70} ${BAND_BOT + 90} ${LUG_L - 110} 452`,
          `M ${LUG_R - 8} ${BAND_BOT + 6} C ${LUG_R + 30} ${BAND_BOT + 40} ${LUG_R + 70} ${BAND_BOT + 90} ${LUG_R + 110} 452`,
        ].map((d) => (
          <g key={d}>
            <path d={d} fill="none" stroke="#55585D" strokeWidth="30" strokeLinecap="butt" />
            <path d={d} fill="none" stroke={steel} strokeWidth="28" strokeDasharray="34 5" strokeLinecap="butt" />
            <path d={d} fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="2" strokeDasharray="34 5" transform="translate(0 -9)" />
          </g>
        ))}
        </g>

        {/* lugs */}
        <path
          d={`M ${CASE_L + 10} ${BAND_TOP + 4} C ${CASE_L - 20} ${BAND_TOP + 2} ${LUG_L + 10} ${BAND_TOP + 30} ${LUG_L} ${BAND_BOT + 4} L ${LUG_L + 22} ${BAND_BOT + 14} C ${LUG_L + 30} ${BAND_BOT - 18} ${CASE_L - 6} ${BAND_BOT - 26} ${CASE_L + 10} ${BAND_BOT - 22} Z`}
          fill={steel}
        />
        <path
          d={`M ${CASE_R - 10} ${BAND_TOP + 4} C ${CASE_R + 20} ${BAND_TOP + 2} ${LUG_R - 10} ${BAND_TOP + 30} ${LUG_R} ${BAND_BOT + 4} L ${LUG_R - 22} ${BAND_BOT + 14} C ${LUG_R - 30} ${BAND_BOT - 18} ${CASE_R + 6} ${BAND_BOT - 26} ${CASE_R - 10} ${BAND_BOT - 22} Z`}
          fill={steel}
        />

        {/* caseback with its sapphire window */}
        <path d={`M ${CX - 200} ${BAND_BOT} L ${CX + 200} ${BAND_BOT} L ${CX + 184} ${BASE - 6} Q ${CX} ${BASE + 6} ${CX - 184} ${BASE - 6} Z`} fill="#9EA1A5" />
        <path d={`M ${CX - 150} ${BASE - 7} Q ${CX} ${BASE + 3} ${CX + 150} ${BASE - 7}`} fill="none" stroke="#C9D3DA" strokeOpacity="0.7" strokeWidth="2" />

        {/* case band */}
        <rect x={CASE_L} y={BAND_TOP} width={CASE_R - CASE_L} height={BAND_BOT - BAND_TOP} rx="16" fill={steel} />
        <rect x={CASE_L + 10} y={BAND_TOP + 5} width={CASE_R - CASE_L - 20} height="3" rx="1.5" fill="#fff" opacity="0.7" />

        {/* sloped bezel */}
        <path d={`M ${CASE_L + 6} ${BAND_TOP + 1} L ${CASE_L + 22} 172 Q ${CX} 166 ${CASE_R - 22} 172 L ${CASE_R - 6} ${BAND_TOP + 1} Z`} fill={`url(#${id}-bezel)`} />
        {/* domed crystal */}
        <path d={`M ${CASE_L + 34} 172 Q ${CX} ${TOP - 26} ${CASE_R - 34} 172 Z`} fill={`url(#${id}-glass)`} stroke="#AEB8BF" strokeOpacity="0.6" />

        {/* pushers at 2 and 4 o'clock, seen end on */}
        {[CX - 10 * MM, CX + 10 * MM].map((x) => (
          <g key={x}>
            <circle cx={x} cy={MID} r="25" fill="#5F6267" />
            <circle cx={x} cy={MID} r="22" fill={`url(#${id}-knob)`} />
            <circle cx={x} cy={MID} r="14" fill="none" stroke="#fff" strokeOpacity="0.5" />
          </g>
        ))}

        {/* crown with the engraved mark */}
        <circle cx={CX} cy={MID} r="45" fill="#5F6267" />
        {Array.from({ length: 36 }, (_, i) => (
          <rect key={i} x={CX - 2} y={MID - 45} width="4" height="9" rx="1.5" fill="#D8DADD" transform={`rotate(${i * 10} ${CX} ${MID})`} />
        ))}
        <circle cx={CX} cy={MID} r="35" fill={`url(#${id}-knob)`} />
        <g transform={`translate(${CX - 20} ${MID - 20}) scale(${40 / 48})`} opacity="0.85">
          <circle cx="24" cy="24" r="19" fill="none" stroke="#3A3D42" strokeWidth="2.2" />
          <path d="M14.5 33 V15 L24 27 L33.5 15 V33" fill="none" stroke="#3A3D42" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx="24" cy="27" r="2.6" fill="var(--accent)" />
        </g>
      </g>

      {/* dimension lines */}
      <g className="prof__dims" stroke="var(--accent)" fill="none" strokeWidth="1.4">
        {/* extension lines */}
        <g stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="3 4">
          <line x1={CX + 40} y1={TOP} x2="900" y2={TOP} pathLength={1} />
          <line x1={CASE_R + 10} y1={BASE} x2="900" y2={BASE} pathLength={1} />
          <line x1={CASE_L} y1={BAND_TOP - 6} x2={CASE_L} y2="70" pathLength={1} />
          <line x1={CASE_R} y1={BAND_TOP - 6} x2={CASE_R} y2="70" pathLength={1} />
          <line x1={LUG_L} y1={BAND_BOT + 12} x2={LUG_L} y2="402" pathLength={1} />
          <line x1={LUG_R} y1={BAND_BOT + 12} x2={LUG_R} y2="402" pathLength={1} />
        </g>
        <line className="dim" x1="886" y1={TOP + 3} x2="886" y2={BASE - 3} markerStart={`url(#${id}-arrow)`} markerEnd={`url(#${id}-arrow)`} pathLength={1} />
        <line className="dim" x1={CASE_L + 3} y1="80" x2={CASE_R - 3} y2="80" markerStart={`url(#${id}-arrow)`} markerEnd={`url(#${id}-arrow)`} pathLength={1} />
        <line className="dim" x1={LUG_L + 3} y1="392" x2={LUG_R - 3} y2="392" markerStart={`url(#${id}-arrow)`} markerEnd={`url(#${id}-arrow)`} pathLength={1} />
      </g>

      <g className="prof__labels" fill="currentColor" fontFamily="Manrope Variable, Manrope, sans-serif">
        <text x="904" y={(TOP + BASE) / 2 - 4} fontSize="26" fontWeight="500" letterSpacing="-0.5">{t.profile.decimal}</text>
        <text x="904" y={(TOP + BASE) / 2 + 18} fontSize="14" fillOpacity="0.6">{t.profile.drawThick}</text>
        <rect x={CX - pill(t.profile.drawCase) / 2} y="62" width={pill(t.profile.drawCase)} height="34" fill="var(--surface)" />
        <text x={CX} y="87" textAnchor="middle" fontSize="22" fontWeight="500">{t.profile.drawCase}</text>
        <rect x={CX - pill(t.profile.drawLugs) / 2} y="375" width={pill(t.profile.drawLugs)} height="34" fill="var(--surface)" />
        <text x={CX} y="400" textAnchor="middle" fontSize="22" fontWeight="500">{t.profile.drawLugs}</text>
      </g>

      {/* numbered part markers */}
      <g className="prof__marks" fontFamily="Manrope Variable, Manrope, sans-serif" fontSize="14" fontWeight="700" textAnchor="middle">
        {[
          { n: 1, x: CX - 150, y: 158 },
          { n: 2, x: CX - 10 * MM + 20, y: MID - 20 },
          { n: 3, x: CX + 34, y: MID - 34 },
          { n: 4, x: CX + 160, y: BASE - 6 },
        ].map((m, i) => (
          <g key={m.n} className="mark" style={{ transitionDelay: `${700 + i * 120}ms` }}>
            <circle cx={m.x} cy={m.y} r="15" fill="var(--accent)" />
            <text x={m.x} y={m.y + 5} fill="#fff">
              {m.n}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
