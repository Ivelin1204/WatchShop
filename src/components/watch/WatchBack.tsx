import { useMemo } from 'react';
import { useI18n } from '../../i18n';
import { useSvgId } from './useClock';

/* ───────────────────────── geometry helpers ───────────────────────── */

const C = 200; // centre of the caseback
const WIN = 124; // radius of the sapphire window

const pt = (cx: number, cy: number, r: number, a: number) => [cx + Math.sin(a) * r, cy - Math.cos(a) * r] as const;

/** A wheel's outline: fine trapezoid teeth round a circle. */
function gearPath(cx: number, cy: number, r: number, teeth: number, depth = 1.6) {
  const step = (Math.PI * 2) / teeth;
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const p = [
      pt(cx, cy, r - depth, a),
      pt(cx, cy, r, a + step * 0.18),
      pt(cx, cy, r, a + step * 0.48),
      pt(cx, cy, r - depth, a + step * 0.66),
    ];
    d += `${i === 0 ? 'M' : 'L'}${p[0][0].toFixed(2)},${p[0][1].toFixed(2)} L${p[1][0].toFixed(2)},${p[1][1].toFixed(2)} L${p[2][0].toFixed(2)},${p[2][1].toFixed(2)} L${p[3][0].toFixed(2)},${p[3][1].toFixed(2)} `;
  }
  return `${d}Z`;
}

/** A ring with a hole: outer teeth, inner circle (even-odd), so the plate shows through. */
function wheelRing(cx: number, cy: number, r: number, teeth: number, rim: number) {
  const ri = r - rim;
  return `${gearPath(cx, cy, r, teeth)} M${cx + ri},${cy} A${ri},${ri} 0 1 0 ${cx - ri},${cy} A${ri},${ri} 0 1 0 ${cx + ri},${cy} Z`;
}

/** The skeleton rotor: a heavy rim on the top half and three arms, open in between. */
function rotorPath() {
  const R = 116;
  const r = 98;
  const hub = 20;
  // outer rim, 9 o'clock round to 3 o'clock over the top
  let d = `M ${C - R},${C} A ${R},${R} 0 0 1 ${C + R},${C} L ${C + r},${C} A ${r},${r} 0 0 0 ${C - r},${C} Z`;
  // three arms from the hub to the rim
  for (const a of [-60, 0, 60]) {
    const t = (a * Math.PI) / 180;
    const w = 0.13;
    const [x1, y1] = pt(C, C, hub, t - w * 2.2);
    const [x2, y2] = pt(C, C, r + 1, t - w * 0.55);
    const [x3, y3] = pt(C, C, r + 1, t + w * 0.55);
    const [x4, y4] = pt(C, C, hub, t + w * 2.2);
    d += ` M ${x1},${y1} L ${x2},${y2} L ${x3},${y3} L ${x4},${y4} Z`;
  }
  // flat bar across the bottom of the hub, as on real rotors
  d += ` M ${C - 34},${C - 4} L ${C + 34},${C - 4} L ${C + 30},${C + 6} L ${C - 30},${C + 6} Z`;
  return d;
}

/* ───────────────────────── parts ───────────────────────── */

function Screw({ x, y, r = 4.6, id, angle = 30 }: { x: number; y: number; r?: number; id: string; angle?: number }) {
  return (
    <g>
      <circle cx={x} cy={y + 0.6} r={r + 0.9} fill="#2a2c30" opacity="0.55" />
      <circle cx={x} cy={y} r={r} fill={`url(#${id}-blue)`} />
      <rect x={x - r * 0.86} y={y - 0.65} width={r * 1.72} height="1.3" rx="0.4" fill="#0d1a33" transform={`rotate(${angle} ${x} ${y})`} />
      <circle cx={x - r * 0.35} cy={y - r * 0.4} r={r * 0.28} fill="#cfe0ff" opacity="0.55" />
    </g>
  );
}

function Jewel({ x, y, r = 3.4, id }: { x: number; y: number; r?: number; id: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r + 2.3} fill={`url(#${id}-chaton)`} />
      <circle cx={x} cy={y} r={r + 2.3} fill="none" stroke="#7a5d22" strokeWidth="0.5" />
      <circle cx={x} cy={y} r={r} fill={`url(#${id}-ruby)`} />
      <circle cx={x} cy={y} r={r * 0.32} fill="#3a0612" />
      <circle cx={x - r * 0.38} cy={y - r * 0.42} r={r * 0.26} fill="#ffd9e1" opacity="0.85" />
    </g>
  );
}

/** A brass wheel: toothed rim, spokes, polished hub with a jewel. */
function Wheel({ x, y, r, teeth, spokes = 4, id, turn = 0 }: { x: number; y: number; r: number; teeth: number; spokes?: number; id: string; turn?: number }) {
  return (
    <g>
      <path d={wheelRing(x, y, r, teeth, Math.max(2.2, r * 0.16))} fill={`url(#${id}-gold)`} fillRule="evenodd" stroke="#6d5320" strokeWidth="0.35" />
      {Array.from({ length: spokes }, (_, i) => (
        <rect
          key={i}
          x={x - 1.3}
          y={y - r + 2}
          width="2.6"
          height={r - 2}
          fill={`url(#${id}-gold)`}
          stroke="#6d5320"
          strokeWidth="0.3"
          transform={`rotate(${turn + (i * 360) / spokes} ${x} ${y})`}
        />
      ))}
      <circle cx={x} cy={y} r={Math.max(3.4, r * 0.24)} fill={`url(#${id}-gold)`} stroke="#6d5320" strokeWidth="0.4" />
      <Jewel x={x} y={y} r={Math.max(1.6, r * 0.11)} id={id} />
    </g>
  );
}

/* ───────────────────────── caseback ───────────────────────── */

/**
 * Exhibition caseback: a decorated automatic chronograph calibre behind
 * sapphire. Côtes de Genève on the bridges, perlage on the plate, polished
 * bevels, blued screws, jewels in gold chatons, a column wheel and a skeleton
 * rotor. The rotor (.rotor) and balance (.balance) can be animated from CSS.
 * The same artwork is cropped to the window for the 3D model's caseback.
 */
export function WatchBack({ className }: { className?: string }) {
  const id = useSvgId('b');
  const { t } = useI18n();
  const caseScrews = useMemo(() => Array.from({ length: 6 }, (_, i) => pt(C, C, 146, (i * Math.PI) / 3 + Math.PI / 6)), []);
  const columnWheel = useMemo(() => {
    // seven columns round a castellated wheel
    const cx = 286;
    const cy = 226;
    return { cx, cy, cols: Array.from({ length: 7 }, (_, i) => pt(cx, cy, 8.6, (i * Math.PI * 2) / 7)) };
  }, []);
  const rotor = useMemo(rotorPath, []);
  const hairspring = useMemo(() => {
    // an Archimedean spiral for the balance spring
    const cx = 132;
    const cy = 262;
    let d = '';
    for (let i = 0; i <= 260; i++) {
      const a = (i / 260) * Math.PI * 2 * 9;
      const r = 3 + (i / 260) * 13;
      const [x, y] = pt(cx, cy, r, a);
      d += `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)} `;
    }
    return d;
  }, []);

  const bevel = (d: string, fill: string) => (
    <>
      <path d={d} fill="#2c2e32" transform="translate(0.8 1.6)" opacity="0.6" />
      <path d={d} fill={fill} stroke={`url(#${id}-bevel)`} strokeWidth="2.2" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#45484d" strokeWidth="0.5" strokeLinejoin="round" />
    </>
  );

  // bridges (drawn in the 400 × 400 caseback space, window radius 124 round 200,200)
  const barrelBridge =
    'M 84,170 Q 92,104 150,86 Q 214,70 262,98 Q 292,116 300,150 L 262,176 Q 232,160 206,164 Q 176,168 160,196 L 118,214 Q 92,204 84,170 Z';
  const chronoBridge = 'M 300,150 Q 322,180 322,222 Q 320,262 300,288 L 262,278 Q 270,252 262,232 L 248,214 Q 244,196 262,176 Z';
  const balanceCock = 'M 78,284 Q 84,300 100,306 L 128,268 Q 134,258 128,254 Q 120,252 114,260 L 86,280 Z';
  const trainBridge = 'M 172,246 L 206,232 Q 232,226 250,238 L 262,278 Q 246,306 214,314 Q 184,318 166,302 L 160,286 Z';

  return (
    <svg className={className} viewBox="0 0 400 400" role="img" aria-label={t.common.caseback}>
      <defs>
        {/* case steel */}
        <linearGradient id={`${id}-case`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2f3f4" />
          <stop offset="0.28" stopColor="#8e9297" />
          <stop offset="0.52" stopColor="#e4e6e8" />
          <stop offset="0.78" stopColor="#6c7075" />
          <stop offset="1" stopColor="#c9ccd0" />
        </linearGradient>
        <linearGradient id={`${id}-polish`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7d8186" />
          <stop offset="0.38" stopColor="#fafbfb" />
          <stop offset="0.62" stopColor="#9da1a6" />
          <stop offset="1" stopColor="#eceeef" />
        </linearGradient>
        {/* perlage on the main plate: overlapping grained circles */}
        <radialGradient id={`${id}-pearl`} cx="0.42" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#dadde0" />
          <stop offset="0.55" stopColor="#a9adb2" />
          <stop offset="1" stopColor="#7f8389" />
        </radialGradient>
        <pattern id={`${id}-perlage`} width="7" height="7" patternUnits="userSpaceOnUse">
          <rect width="7" height="7" fill="#8d9197" />
          <circle cx="3.5" cy="3.5" r="4.2" fill={`url(#${id}-pearl)`} />
          <circle cx="0" cy="0" r="4.2" fill={`url(#${id}-pearl)`} opacity="0.7" />
          <circle cx="7" cy="7" r="4.2" fill={`url(#${id}-pearl)`} opacity="0.7" />
        </pattern>
        {/* Côtes de Genève: soft-edged parallel waves across the bridges */}
        <linearGradient id={`${id}-cote`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7f848a" />
          <stop offset="0.08" stopColor="#9a9fa5" />
          <stop offset="0.42" stopColor="#dfe2e5" />
          <stop offset="0.58" stopColor="#eef0f2" />
          <stop offset="0.92" stopColor="#a2a7ad" />
          <stop offset="1" stopColor="#868b91" />
        </linearGradient>
        <pattern id={`${id}-cotes`} width="11" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
          <rect width="11" height="40" fill={`url(#${id}-cote)`} />
        </pattern>
        {/* bevel (anglage): a bright polished edge with a dark line under it */}
        <linearGradient id={`${id}-bevel`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#9ea2a7" />
          <stop offset="0.7" stopColor="#f4f5f6" />
          <stop offset="1" stopColor="#80848a" />
        </linearGradient>
        {/* black-polished steel for levers */}
        <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f5f6f7" />
          <stop offset="0.4" stopColor="#5d6167" />
          <stop offset="0.6" stopColor="#d9dcdf" />
          <stop offset="1" stopColor="#3f4247" />
        </linearGradient>
        <radialGradient id={`${id}-blue`} cx="0.38" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#7ea6f0" />
          <stop offset="0.45" stopColor="#2c55a8" />
          <stop offset="1" stopColor="#13285a" />
        </radialGradient>
        <radialGradient id={`${id}-ruby`} cx="0.36" cy="0.34" r="0.75">
          <stop offset="0" stopColor="#ff9fb3" />
          <stop offset="0.45" stopColor="#c21f45" />
          <stop offset="1" stopColor="#5a0719" />
        </radialGradient>
        <radialGradient id={`${id}-chaton`} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#f8e2a4" />
          <stop offset="0.6" stopColor="#c99b47" />
          <stop offset="1" stopColor="#8a6625" />
        </radialGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6dc98" />
          <stop offset="0.45" stopColor="#c0903f" />
          <stop offset="0.7" stopColor="#ecc876" />
          <stop offset="1" stopColor="#9c7430" />
        </linearGradient>
        {/* rotor: brushed steel with côtes, a dark heavy-metal rim */}
        <pattern id={`${id}-rotorCotes`} width="11" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(-62)">
          <rect width="11" height="40" fill={`url(#${id}-cote)`} />
        </pattern>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2b2d31" />
          <stop offset="0.35" stopColor="#5d6167" />
          <stop offset="0.5" stopColor="#8a8f95" />
          <stop offset="0.65" stopColor="#575b61" />
          <stop offset="1" stopColor="#2b2d31" />
        </linearGradient>
        <radialGradient id={`${id}-shade`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.82" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
        <linearGradient id={`${id}-glare`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.32" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="0.36" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-win`}>
          <circle cx={C} cy={C} r={WIN} />
        </clipPath>
        <path id={`${id}-rotorArc`} d={`M ${C - 108.6},${C} A 108.6,108.6 0 0 1 ${C + 108.6},${C}`} />
        <path id={`${id}-caseTop`} d={`M ${C - 136},${C} A 136,136 0 0 1 ${C + 136},${C}`} />
        <path id={`${id}-caseBottom`} d={`M ${C - 143},${C} A 143,143 0 0 0 ${C + 143},${C}`} />
        <path id={`${id}-cockArc`} d="M 100,250 Q 124,224 160,238" />
      </defs>

      {/* ───── case ───── */}
      <circle cx={C} cy={C} r="170" fill="#1d1f22" />
      <circle cx={C} cy={C} r="167" fill={`url(#${id}-case)`} />
      <circle cx={C} cy={C} r="154" fill={`url(#${id}-polish)`} />
      <circle cx={C} cy={C} r="154" fill="none" stroke="#5f6368" strokeWidth="0.6" />
      <g fontFamily="Manrope Variable, Manrope, sans-serif" fontWeight="700" fill="#3c3f44" letterSpacing="2.6">
        <text fontSize="7.4">
          <textPath href={`#${id}-caseTop`} startOffset="50%" textAnchor="middle">
            MERID · SOFIA · AUTOMATIC CHRONOGRAPH
          </textPath>
        </text>
        <text fontSize="7.4">
          <textPath href={`#${id}-caseBottom`} startOffset="50%" textAnchor="middle">
            SAPPHIRE · 100 M · 316L STEEL
          </textPath>
        </text>
      </g>
      {caseScrews.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="5.6" fill="#3a3d41" />
          <circle cx={x} cy={y} r="4.6" fill={`url(#${id}-polish)`} />
          <rect x={x - 3.6} y={y - 0.6} width="7.2" height="1.2" fill="#43464b" transform={`rotate(${i * 60 + 20} ${x} ${y})`} />
        </g>
      ))}
      {/* gasket and window frame */}
      <circle cx={C} cy={C} r={WIN + 8} fill="#d8dadd" />
      <circle cx={C} cy={C} r={WIN + 3} fill="#16171a" />

      {/* ───── movement ───── */}
      <g clipPath={`url(#${id}-win)`}>
        <rect x="60" y="60" width="280" height="280" fill={`url(#${id}-perlage)`} />

        {/* train wheels under the bridges */}
        <Wheel x={226} y={268} r={20} teeth={72} spokes={5} id={id} turn={12} />
        <Wheel x={186} y={290} r={13} teeth={52} spokes={4} id={id} turn={30} />

        {/* bridges with côtes de Genève and polished bevels */}
        {bevel(barrelBridge, `url(#${id}-cotes)`)}
        {bevel(chronoBridge, `url(#${id}-cotes)`)}
        {bevel(trainBridge, `url(#${id}-cotes)`)}

        {/* chronograph runner on top of the train bridge */}
        <Wheel x={238} y={236} r={23} teeth={90} spokes={5} id={id} turn={0} />
        {/* minute counter wheel */}
        <Wheel x={282} y={268} r={11} teeth={40} spokes={4} id={id} turn={20} />

        {/* coupling lever and hammer: black-polished steel */}
        <path d="M 262,206 Q 276,200 290,206 L 312,240 Q 314,250 306,252 L 296,250 L 280,222 Q 270,216 262,216 Z" fill={`url(#${id}-steel)`} stroke="#2e3034" strokeWidth="0.5" />
        <path d="M 252,290 Q 276,300 300,286 L 306,294 Q 280,312 250,300 Z" fill={`url(#${id}-steel)`} stroke="#2e3034" strokeWidth="0.5" />

        {/* column wheel: blued, with seven columns and a cap */}
        <circle cx={columnWheel.cx} cy={columnWheel.cy} r="13" fill="#1d2b4d" />
        <path d={gearPath(columnWheel.cx, columnWheel.cy, 13, 21, 1.4)} fill={`url(#${id}-blue)`} />
        {columnWheel.cols.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.7" fill={`url(#${id}-blue)`} stroke="#0d1a33" strokeWidth="0.5" />
        ))}
        <circle cx={columnWheel.cx} cy={columnWheel.cy} r="4.6" fill={`url(#${id}-polish)`} stroke="#3d4045" strokeWidth="0.4" />

        {/* the balance in its recess, then the cock over it */}
        <circle cx="132" cy="262" r="31" fill="#4a4d52" />
        <circle cx="132" cy="262" r="31" fill={`url(#${id}-shade)`} />
        <g className="balance" style={{ transformOrigin: '132px 262px', transformBox: 'view-box' }}>
          <circle cx="132" cy="262" r="25" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="4.4" />
          <circle cx="132" cy="262" r="25" fill="none" stroke="#6d5320" strokeWidth="0.4" />
          {[0, 120, 240].map((a) => (
            <rect key={a} x="131" y="238" width="2.2" height="24" fill={`url(#${id}-gold)`} transform={`rotate(${a} 132 262)`} />
          ))}
          {Array.from({ length: 8 }, (_, i) => {
            const [x, y] = pt(132, 262, 27.6, (i * Math.PI) / 4 + 0.2);
            return <circle key={i} cx={x} cy={y} r="1.7" fill={`url(#${id}-gold)`} stroke="#6d5320" strokeWidth="0.3" />;
          })}
          <path d={hairspring} fill="none" stroke="#3d66c4" strokeWidth="0.55" />
        </g>
        {bevel(balanceCock, `url(#${id}-cotes)`)}
        {/* regulator index and its swan-neck spring */}
        <path d="M 132,262 L 160,240" stroke={`url(#${id}-steel)`} strokeWidth="2" strokeLinecap="round" />
        <path d="M 150,232 Q 166,226 168,238 Q 168,246 160,240" fill="none" stroke={`url(#${id}-steel)`} strokeWidth="1.4" />
        <circle cx="132" cy="262" r="6.4" fill={`url(#${id}-polish)`} stroke="#45484d" strokeWidth="0.5" />
        <Jewel x={132} y={262} r={3} id={id} />

        {/* jewels and screws */}
        {(
          [
            [120, 120],
            [176, 104],
            [266, 128],
            [112, 194],
            [304, 200],
            [302, 262],
            [236, 300],
            [150, 296],
          ] as const
        ).map(([x, y]) => (
          <Jewel key={`${x}-${y}`} x={x} y={y} id={id} />
        ))}
        {(
          [
            [100, 152, 20],
            [228, 92, -10],
            [286, 160, 55],
            [146, 206, 80],
            [314, 232, 10],
            [292, 284, 40],
            [180, 312, -30],
            [94, 292, 65],
            [164, 232, 15],
          ] as const
        ).map(([x, y, a]) => (
          <Screw key={`${x}-${y}`} x={x} y={y} angle={a} id={id} />
        ))}

        {/* engraving on the train bridge, filled in gold */}
        <g fontFamily="Manrope Variable, Manrope, sans-serif" fontWeight="700" fill="#c79b45" letterSpacing="1.4" textAnchor="middle">
          <text x="208" y="282" fontSize="6" transform="rotate(-14 208 282)">
            CALIBRE M-1
          </text>
          <text x="211" y="292" fontSize="4.8" transform="rotate(-14 211 292)">
            27 JEWELS · SWISS
          </text>
        </g>

        {/* skeleton rotor over everything */}
        <g className="rotor" style={{ transformOrigin: '200px 200px', transformBox: 'view-box' }}>
          <path d={rotor} fill="#1f2124" opacity="0.5" transform="translate(1.5 3)" />
          <path d={rotor} fill={`url(#${id}-rotorCotes)`} stroke={`url(#${id}-bevel)`} strokeWidth="1.6" strokeLinejoin="round" />
          {/* heavy rim on the outer edge */}
          <path d={`M ${C - 116},${C} A 116,116 0 0 1 ${C + 116},${C} L ${C + 106},${C} A 106,106 0 0 0 ${C - 106},${C} Z`} fill={`url(#${id}-rim)`} />
          <path d={`M ${C - 116},${C} A 116,116 0 0 1 ${C + 116},${C}`} fill="none" stroke="#f2f3f4" strokeOpacity="0.6" strokeWidth="0.8" />
          <text fontFamily="Manrope Variable, Manrope, sans-serif" fontSize="6.6" fontWeight="800" letterSpacing="3.2" fill="#e9c36f">
            <textPath href={`#${id}-rotorArc`} startOffset="50%" textAnchor="middle">
              MERID · SOFIA
            </textPath>
          </text>
          {/* hub with three blued screws */}
          <circle cx={C} cy={C} r="20" fill={`url(#${id}-polish)`} stroke="#45484d" strokeWidth="0.6" />
          <circle cx={C} cy={C} r="13" fill="none" stroke="#8b8f94" strokeWidth="0.5" />
          {[0, 120, 240].map((a) => {
            const [x, y] = pt(C, C, 13.5, (a * Math.PI) / 180);
            return <Screw key={a} x={x} y={y} r={2.8} angle={a + 20} id={id} />;
          })}
          <Jewel x={C} y={C} r={2.6} id={id} />
        </g>

        {/* depth: shadow under the window edge, and the sapphire's reflection */}
        <circle cx={C} cy={C} r={WIN} fill={`url(#${id}-shade)`} />
        <circle cx={C} cy={C} r={WIN} fill={`url(#${id}-glare)`} />
      </g>
      <circle cx={C} cy={C} r={WIN + 0.6} fill="none" stroke="#0e0f11" strokeWidth="1.6" />
      <path d={`M ${C - 98},${C - 44} A 108 108 0 0 1 ${C - 36},${C - 100}`} stroke="#fff" strokeOpacity="0.28" strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  );
}
