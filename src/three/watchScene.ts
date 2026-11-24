import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Dial, StrapId } from '../data/product';
import { LOGO_PATHS } from '../components/Logo';

/**
 * A procedural 3D model of the Meridian Chronograph, built from primitives so
 * it needs no model file. Units are millimetres; the dial faces +Z, 12 o'clock
 * is +Y and the crown sits at +X, between pushers at 2 and 4.
 */

const CASE_R = 20;
const DIAL_R = 16.8;
const DIAL_Z = 2.0;
const SUB_X = 6.96; // sub-dials at 9 (small seconds) and 3 (30-minute counter)
const SUB_R = 4.1;
const DATE_Y = -10.7;
const ORANGE = '#d2591f';
const LUME = '#ede8d6';

export interface WatchSceneOptions {
  /** breathing room around the watch: 1 = touching the frame edges, default 1.08 */
  margin?: number;
  /** starting pose, eased from here to the first target */
  initial?: { turn: number; tilt: number };
  /** resting tilt towards the camera, in radians */
  tilt?: number;
  /** a slow float up and down */
  float?: boolean;
  /** strap unbuckled and open under the wrist, so the caseback can be seen from behind */
  openStrap?: boolean;
}

export interface WatchScene {
  /** target turn around the vertical axis, in radians (0 = dial to camera) */
  setTurn: (radians: number) => void;
  /** target tilt around the horizontal axis, in radians */
  setTilt: (radians: number) => void;
  /** target roll around the axis through the dial, in radians */
  setRoll: (radians: number) => void;
  setDial: (dial: Dial) => void;
  /** bracelet, tan leather or black rubber */
  setStrap: (strap: StrapId) => void;
  /** text engraved round the caseback window; empty for the standard engraving */
  setEngraving: (text: string) => void;
  setMovementTexture: (img: CanvasImageSource) => void;
  setActive: (active: boolean) => void;
  resize: () => void;
  dispose: () => void;
}

/**
 * A dark photo studio for the reflections: black all round, a large softbox
 * above and in front, two tall strip lights either side and a dim bounce card
 * below. Polished steel then shows crisp white bands on black, like a product shot.
 */
function studioEnvironment() {
  const room = new THREE.Scene();
  room.background = new THREE.Color('#1c1d20');
  const panel = (w: number, h: number, intensity: number, pos: [number, number, number], tint = '#ffffff') => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(tint).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    room.add(m);
  };
  panel(14, 8, 3.4, [-2, 7, 6]); // main softbox, above and towards the camera
  panel(3, 12, 2.6, [-8, 0, 3]); // strip, left
  panel(3, 12, 2.2, [8, 0, -1], '#fff1e6'); // strip, right, slightly warm
  panel(10, 3, 0.9, [0, -7, 4]); // bounce card below
  panel(6, 6, 1.4, [3, 4, -8]); // kicker behind
  panel(8, 4, 1.1, [0, 0, 9]); // fill from the camera side
  return room;
}

export function createWatchScene(canvas: HTMLCanvasElement, dial: Dial, reduced: boolean, opts: WatchSceneOptions = {}): WatchScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(studioEnvironment(), 0.02).texture;
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(26, 1, 1, 1000);
  camera.position.set(0, 0, 190); // framed every frame by frameToFit()

  const key = new THREE.DirectionalLight('#ffffff', 1.6);
  key.position.set(-60, 90, 120);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#ffd9bf', 1.4);
  rim.position.set(80, -40, -90);
  scene.add(rim);
  scene.add(new THREE.AmbientLight('#ffffff', 0.15));

  /* ───── materials ───── */
  const brushed = new THREE.MeshPhysicalMaterial({ color: '#cfd2d6', metalness: 1, roughness: 0.3, clearcoat: 0.15, side: THREE.DoubleSide });
  const polished = new THREE.MeshPhysicalMaterial({ color: '#eef0f2', metalness: 1, roughness: 0.06, side: THREE.DoubleSide });
  const darkMetal = new THREE.MeshStandardMaterial({ color: '#2a2c30', metalness: 0.6, roughness: 0.45, side: THREE.DoubleSide });
  const lume = new THREE.MeshStandardMaterial({ color: LUME, roughness: 0.6, emissive: '#9fb08a', emissiveIntensity: 0.06 });
  const orange = new THREE.MeshStandardMaterial({ color: ORANGE, metalness: 0.3, roughness: 0.35 });
  const blackHand = new THREE.MeshStandardMaterial({ color: '#1b1d20', metalness: 0.5, roughness: 0.3 });
  // sapphire: a thin, mostly clear coat with a faint reflection; real
  // transmission blurred the dial into a bright patch, so it is not used
  const sapphire = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    metalness: 0,
    roughness: 0.02,
    transparent: true,
    opacity: 0.08,
    envMapIntensity: 0.9,
    depthWrite: false,
  });

  const watch = new THREE.Group();
  scene.add(watch);

  const lathe = (pts: [number, number][], mat: THREE.Material, segments = 128) => {
    const g = new THREE.LatheGeometry(
      pts.map(([r, z]) => new THREE.Vector2(r, z)),
      segments,
    );
    g.rotateX(Math.PI / 2); // lathe runs round Y; turn it so its axis is Z
    return new THREE.Mesh(g, mat);
  };

  /* ───── case, bezel, crystal ───── */
  watch.add(
    lathe(
      [
        [17.0, -5.4],
        [18.9, -5.4],
        [19.8, -4.6],
        [CASE_R, -3.6],
        [CASE_R, 3.6],
        [19.6, 4.4],
        [17.4, 4.4],
      ],
      brushed,
    ),
  );
  // sloped polished bezel
  watch.add(
    lathe(
      [
        [19.6, 4.4],
        [19.5, 5.0],
        [18.6, 5.9],
        [17.4, 6.0],
        [17.4, 4.4],
      ],
      polished,
    ),
  );
  // rehaut: the slanted ring between dial and crystal
  watch.add(
    lathe(
      [
        [DIAL_R, DIAL_Z],
        [17.35, 4.6],
        [17.35, 5.8],
      ],
      darkMetal,
    ),
  );
  const capR = 60;
  const capA = Math.asin(17.4 / capR);
  const crystalGeo = new THREE.SphereGeometry(capR, 96, 24, 0, Math.PI * 2, 0, capA);
  crystalGeo.rotateX(Math.PI / 2);
  crystalGeo.translate(0, 0, 5.8 - capR * Math.cos(capA));
  watch.add(new THREE.Mesh(crystalGeo, sapphire));

  /* ───── dial ───── */
  const dialCanvas = document.createElement('canvas');
  dialCanvas.width = dialCanvas.height = 1024;
  const dialTex = new THREE.CanvasTexture(dialCanvas);
  dialTex.colorSpace = THREE.SRGBColorSpace;
  dialTex.anisotropy = 8;
  // low env reflection on the dial: the studio light box would otherwise show as a bright patch
  const dialMat = new THREE.MeshPhysicalMaterial({ map: dialTex, metalness: 0.15, roughness: 0.55, envMapIntensity: 0.35 });
  const dialMesh = new THREE.Mesh(new THREE.CircleGeometry(DIAL_R, 128), dialMat);
  dialMesh.position.z = DIAL_Z;
  watch.add(dialMesh);

  // applied markers
  const markers = new THREE.Group();
  watch.add(markers);
  const markerMats = { body: polished as THREE.Material };
  const addMarker = (angle: number, x: number, long: boolean, short = false) => {
    const len = short ? 1.5 : long ? 3.6 : 3.2;
    const m = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.05, len, 0.55), markerMats.body);
    const ins = new THREE.Mesh(new THREE.BoxGeometry(0.46, len - 0.6, 0.2), lume);
    ins.position.z = 0.32;
    m.add(body, ins);
    const r = 14.6 - len / 2;
    m.position.set(Math.sin(angle) * r + Math.cos(angle) * x, Math.cos(angle) * r - Math.sin(angle) * x, DIAL_Z + 0.3);
    m.rotation.z = -angle;
    markers.add(m);
  };
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    if (i === 3 || i === 6 || i === 9) {
      addMarker(a, 0, false, true); // short, clear of the counters and the date
      continue;
    }
    if (i === 0) {
      addMarker(a, -0.95, true);
      addMarker(a, 0.95, true);
    } else addMarker(a, 0, i % 3 === 0);
  }
  // date window frame
  const frameShape = new THREE.Shape();
  frameShape.moveTo(-1.85, -1.5);
  frameShape.lineTo(1.85, -1.5);
  frameShape.lineTo(1.85, 1.5);
  frameShape.lineTo(-1.85, 1.5);
  frameShape.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-1.5, -1.15);
  hole.lineTo(-1.5, 1.15);
  hole.lineTo(1.5, 1.15);
  hole.lineTo(1.5, -1.15);
  hole.closePath();
  frameShape.holes.push(hole);
  const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(frameShape, { depth: 0.25, bevelEnabled: false }), polished);
  frame.position.set(0, DATE_Y, DIAL_Z);
  watch.add(frame);

  /* ───── hands ───── */
  const sword = (len: number, w: number, tail: number) => {
    const sh = new THREE.Shape();
    const shoulder = len * 0.68;
    sh.moveTo(0, len);
    sh.lineTo(w / 2, shoulder);
    sh.lineTo(w * 0.22, 0.9);
    sh.quadraticCurveTo(w * 0.42, 0, w * 0.22, -tail);
    sh.lineTo(-w * 0.22, -tail);
    sh.quadraticCurveTo(-w * 0.42, 0, -w * 0.22, 0.9);
    sh.lineTo(-w / 2, shoulder);
    sh.closePath();
    return sh;
  };
  const swordLume = (len: number, w: number) => {
    const sh = new THREE.Shape();
    const shoulder = len * 0.68;
    sh.moveTo(0, len - w * 0.9);
    sh.lineTo(w * 0.2, shoulder);
    sh.lineTo(w * 0.09, 2.4);
    sh.lineTo(-w * 0.09, 2.4);
    sh.lineTo(-w * 0.2, shoulder);
    sh.closePath();
    return sh;
  };
  const handGroup = (len: number, w: number, z: number) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(
      new THREE.ExtrudeGeometry(sword(len, w, 1.6), { depth: 0.2, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.1, bevelSegments: 2 }),
      polished,
    );
    const ins = new THREE.Mesh(new THREE.ShapeGeometry(swordLume(len, w)), lume);
    ins.position.z = 0.33;
    g.add(body, ins);
    g.position.z = z;
    watch.add(g);
    return { g, body };
  };
  const hourHand = handGroup(9.6, 2.0, DIAL_Z + 0.9);
  const minuteHand = handGroup(14.2, 1.6, DIAL_Z + 1.3);

  // chronograph seconds: orange, resting at 12 until started
  const chrono = new THREE.Group();
  const chronoBar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 18.4, 0.12), orange);
  chronoBar.position.y = 6.6;
  const chronoTail = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.4, 3), orange);
  chronoTail.position.y = -3.1;
  chronoTail.rotation.z = Math.PI;
  chrono.add(chronoBar, chronoTail);
  chrono.position.z = DIAL_Z + 1.75;
  watch.add(chrono);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.5, 32), orange);
  cap.rotation.x = Math.PI / 2;
  cap.position.z = DIAL_Z + 1.9;
  watch.add(cap);

  // sub-dial hands: running seconds at 9, the 30-minute counter at rest at 3
  const subHand = (x: number, mat: THREE.Material) => {
    const g = new THREE.Group();
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 4.3, 0.08), mat);
    bar.position.y = 1.35;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.2, 24), mat);
    hub.rotation.x = Math.PI / 2;
    g.add(bar, hub);
    g.position.set(x, 0, DIAL_Z + 0.35);
    watch.add(g);
    return { g, bar, hub };
  };
  const subPrint = new THREE.MeshStandardMaterial({ color: dial.print, metalness: 0.4, roughness: 0.35 });
  const second = subHand(-SUB_X, subPrint).g;
  subHand(SUB_X, subPrint);

  /* ───── crown ───── */
  const crown = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.8, 32), brushed);
  stem.position.y = 0.9;
  const head = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 3.6, 48), brushed);
  head.position.y = 3.3;
  crown.add(stem, head);
  const ridges = new THREE.InstancedMesh(new THREE.BoxGeometry(0.35, 3.0, 0.4), polished, 36);
  const tmp = new THREE.Object3D();
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    tmp.position.set(Math.cos(a) * 3.12, 3.3, Math.sin(a) * 3.12);
    tmp.rotation.set(0, -a, 0);
    tmp.updateMatrix();
    ridges.setMatrixAt(i, tmp.matrix);
  }
  crown.add(ridges);
  // the crown's end carries the Merid mark, engraved
  const markCanvas = document.createElement('canvas');
  markCanvas.width = markCanvas.height = 256;
  {
    const c = markCanvas.getContext('2d')!;
    c.fillStyle = '#d4d6d9';
    c.fillRect(0, 0, 256, 256);
    c.save();
    c.translate(128, 128);
    c.rotate(Math.PI); // the cylinder cap maps the texture upside down
    c.scale(4.2, 4.2);
    c.translate(-24, -24);
    c.strokeStyle = '#3a3d42';
    c.lineWidth = 2.6;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.beginPath();
    c.arc(LOGO_PATHS.ring.cx, LOGO_PATHS.ring.cy, LOGO_PATHS.ring.r, 0, Math.PI * 2);
    c.stroke();
    c.stroke(new Path2D(LOGO_PATHS.m));
    c.fillStyle = ORANGE;
    c.beginPath();
    c.arc(LOGO_PATHS.pin.cx, LOGO_PATHS.pin.cy, LOGO_PATHS.pin.r, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  const markTex = new THREE.CanvasTexture(markCanvas);
  markTex.colorSpace = THREE.SRGBColorSpace;
  const markMat = new THREE.MeshStandardMaterial({ map: markTex, metalness: 0.8, roughness: 0.3 });
  const crownEnd = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.1, 0.4, 48), [polished, markMat, polished]);
  crownEnd.position.y = 5.1;
  crown.add(crownEnd);
  crown.rotation.z = -Math.PI / 2; // point along +X
  crown.position.set(CASE_R - 0.4, 0, 0.2);
  watch.add(crown);

  // pushers at 2 and 4 o'clock
  for (const a of [Math.PI / 6, -Math.PI / 6]) {
    const pusher = new THREE.Group();
    const pStem = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 2.4, 32), brushed);
    pStem.position.y = 1.2;
    const pCap = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 2.6, 48), polished);
    pCap.position.y = 3.3;
    const pTop = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.9, 0.35, 48), polished);
    pTop.position.y = 4.75;
    pusher.add(pStem, pCap, pTop);
    pusher.rotation.z = a - Math.PI / 2;
    pusher.position.set(Math.cos(a) * (CASE_R - 0.6), Math.sin(a) * (CASE_R - 0.6), 0.2);
    watch.add(pusher);
  }

  /* ───── lugs ───── */
  // side profile drawn as (outward along Y, height along Z), extruded across X
  const lugShape = new THREE.Shape();
  lugShape.moveTo(0, 3.7);
  lugShape.lineTo(6.2, 2.7);
  lugShape.quadraticCurveTo(8.9, 2.2, 8.7, 0.2);
  lugShape.lineTo(8.3, -2.4);
  lugShape.quadraticCurveTo(7.6, -3.6, 5.6, -3.4);
  lugShape.lineTo(0, -2.6);
  lugShape.closePath();
  const lugGeo = new THREE.ExtrudeGeometry(lugShape, { depth: 2.6, bevelEnabled: true, bevelSize: 0.4, bevelThickness: 0.4, bevelSegments: 3 });
  lugGeo.translate(0, 0, -1.3);
  // (x, y, z) -> (z, x, y): shape x becomes +Y, shape y becomes +Z, extrusion becomes X
  lugGeo.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
  lugGeo.computeVertexNormals();
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      // flanks polished, top and ends brushed, like the photographs
      const lug = new THREE.Mesh(lugGeo, [polished, brushed]);
      lug.position.set(sx * 11.55, sy * 14.8, 0);
      lug.scale.y = sy; // mirror for the 6 o'clock side
      watch.add(lug);
    }
  }

  /* ───── bracelet: beads of rice ───── */
  // five rows of links: flat brushed outer links and three rows of wide
  // polished centre links, packed tight.
  // A solid end link is fitted to the case between the lugs.
  // one continuous loop round an oval wrist: out of the 12 o'clock end link,
  // down round the wrist to the clasp underneath, and back up to 6 o'clock
  const WRIST_CENTRE_Z = -26;
  const loop = new THREE.CatmullRomCurve3(
    (
      [
        [22.4, -1.3],
        [28.4, -3.4],
        [32.6, -9.6],
        [34.0, -19.5],
        [31.4, -30.5],
        [24.6, -40.2],
        [13.4, -46.8],
        [0, -48.8],
        [-13.4, -46.8],
        [-24.6, -40.2],
        [-31.4, -30.5],
        [-34.0, -19.5],
        [-32.6, -9.6],
        [-28.4, -3.4],
        [-22.4, -1.3],
      ] as [number, number][]
    ).map(([y, z]) => new THREE.Vector3(0, y, z)),
    false,
    'centripetal',
  );
  const CLASP_HALF = 13.5; // the clasp covers this much of the loop either side of the bottom
  const loopLen = loop.getLength();
  // open strap: the loop is cut under the wrist between GAP_A and GAP_B
  const OPEN = !!opts.openStrap;
  const GAP_A = 0.35;
  const GAP_B = 0.65;
  const CLASP_U = OPEN ? GAP_A - CLASP_HALF / loopLen : 0.5;
  // open bracelet: the free end finishes in the clasp blade that tucks under the cover
  const BLADE_LEN = 19;
  const BLADE_U = GAP_B + BLADE_LEN / loopLen;
  const subCurve = (u0: number, u1: number) =>
    new THREE.CatmullRomCurve3(
      Array.from({ length: 41 }, (_, i) => loop.getPointAt(u0 + ((u1 - u0) * i) / 40)),
      false,
      'centripetal',
    );

  // fitted end link: fills the space between the lugs and hugs the case
  const endShape = new THREE.Shape();
  const ER = CASE_R + 0.2;
  const EX = 9.9;
  const EY = Math.sqrt(ER * ER - EX * EX);
  endShape.moveTo(-EX, 23.0);
  endShape.lineTo(EX, 23.0);
  endShape.lineTo(EX, EY);
  endShape.absarc(0, 0, ER, Math.atan2(EY, EX), Math.atan2(EY, -EX), false);
  endShape.closePath();
  const endGeo = new THREE.ExtrudeGeometry(endShape, { depth: 2.6, bevelEnabled: true, bevelSize: 0.4, bevelThickness: 0.4, bevelSegments: 3, curveSegments: 32 });
  endGeo.translate(0, 0, -2.6);
  const braceletParts = new THREE.Group();
  watch.add(braceletParts);
  for (const sy of [-1, 1]) {
    const end = new THREE.Mesh(endGeo, brushed);
    end.scale.y = sy;
    braceletParts.add(end);
  }

  const ROW_PITCH = 2.9;
  const outerGeo = new RoundedBoxGeometry(4.6, 2.7, 2.6, 3, 0.55);
  // centre links: long polished pills packed tight, so the middle of the
  // bracelet reads as one smooth surface with fine dark seams between links
  const riceGeo = new RoundedBoxGeometry(3.15, 2.78, 2.5, 4, 0.9);
  const rows: { pos: THREE.Vector3; tan: THREE.Vector3; taper: number }[] = [];
  const nRows = Math.floor(loopLen / ROW_PITCH);
  for (let i = 0; i < nRows; i++) {
    const u = (i * ROW_PITCH + ROW_PITCH / 2) / loopLen;
    const pos = loop.getPointAt(u);
    if (!OPEN && pos.z < -40 && Math.abs(pos.y) < CLASP_HALF) continue; // under the clasp
    if (OPEN && u > CLASP_U - CLASP_HALF / loopLen && u < BLADE_U + 0.6 / loopLen) continue; // clasp, gap and blade
    const f = Math.min(u, 1 - u) * 2; // 0 at the case, 1 at the clasp
    rows.push({ pos, tan: loop.getTangentAt(u), taper: 1 - 0.2 * Math.min(1, f * 1.15) });
  }
  const outers = new THREE.InstancedMesh(outerGeo, brushed, rows.length * 2);
  const rice = new THREE.InstancedMesh(riceGeo, polished, rows.length * 3);
  const X = new THREE.Vector3(1, 0, 0);
  const m = new THREE.Matrix4();
  // basis for a link: x across the wrist, y along the bracelet, z facing away from the wrist
  const basis = (pos: THREE.Vector3, tan: THREE.Vector3) => {
    const y = tan.clone().normalize();
    const z = new THREE.Vector3().crossVectors(X, y).normalize();
    const away = new THREE.Vector3(0, pos.y, pos.z - WRIST_CENTRE_Z);
    if (z.dot(away) < 0) z.negate();
    const x = new THREE.Vector3().crossVectors(y, z).normalize();
    return { x, y, z };
  };
  rows.forEach((r, i) => {
    const { x, y, z } = basis(r.pos, r.tan);
    const place = (dx: number, lift: number) =>
      m.makeBasis(x, y, z).scale(new THREE.Vector3(r.taper, 1, 1)).setPosition(r.pos.clone().addScaledVector(X, dx * r.taper).addScaledVector(z, lift));
    [-1, 1].forEach((side, j) => outers.setMatrixAt(i * 2 + j, place(side * 7.3, 0)));
    [-3.32, 0, 3.32].forEach((dx, j) => rice.setMatrixAt(i * 3 + j, place(dx, 0.1)));
  });
  braceletParts.add(outers, rice);

  // fold-over clasp under the wrist: polished cover, brushed inlay with the
  // Merid mark, and a release button either side
  {
    const u = CLASP_U;
    const pos = loop.getPointAt(u);
    const { x, y, z } = basis(pos, loop.getTangentAt(u));
    const clasp = new THREE.Group();
    clasp.matrixAutoUpdate = false;
    clasp.matrix.makeBasis(x, y, z).setPosition(pos);
    const cover = new THREE.Mesh(new RoundedBoxGeometry(17.2, 27, 3.2, 4, 1.2), brushed);
    cover.position.z = 0.2;
    const inlay = new THREE.Mesh(new RoundedBoxGeometry(11, 19, 0.6, 3, 0.25), polished);
    inlay.position.z = 1.75;
    const plaque = new THREE.Mesh(new THREE.CircleGeometry(3.2, 48), markMat);
    plaque.position.z = 2.08;
    clasp.add(cover, inlay, plaque);
    for (const side of [-1, 1]) {
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 1.6, 24), polished);
      btn.rotation.z = Math.PI / 2;
      btn.position.set(side * 9.1, 0, 0.2);
      clasp.add(btn);
    }
    // the hinge bars where the bracelet meets the clasp
    for (const end of [-1, 1]) {
      const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 16.4, 20), brushed);
      hinge.rotation.z = Math.PI / 2;
      hinge.position.set(0, end * 13.9, -0.2);
      clasp.add(hinge);
    }
    braceletParts.add(clasp);
  }

  /* ───── leather and rubber straps on the same loop, with a tang buckle ───── */
  const strapShape = (w: number, t: number) => {
    // shape-x runs across the wrist (the path's normal is the X axis), shape-y is the thickness
    const sh = new THREE.Shape();
    const r = t / 2;
    sh.moveTo(-w / 2 + r, -r);
    sh.lineTo(w / 2 - r, -r);
    sh.quadraticCurveTo(w / 2, -r, w / 2, 0);
    sh.quadraticCurveTo(w / 2, r, w / 2 - r, r);
    sh.lineTo(-w / 2 + r, r);
    sh.quadraticCurveTo(-w / 2, r, -w / 2, 0);
    sh.quadraticCurveTo(-w / 2, -r, -w / 2 + r, -r);
    return sh;
  };
  // clasp blade on the free end of an open bracelet: a brushed plate that follows
  // the curve, a rounded tip, a polished locking lip and the hinge bar to the links
  if (OPEN) {
    const blade = new THREE.ExtrudeGeometry(strapShape(15.2, 1.5), { steps: 24, extrudePath: subCurve(GAP_B + 7.6 / loopLen, BLADE_U), bevelEnabled: false });
    const bladeMesh = new THREE.Mesh(blade, brushed);
    // the blade sits on the inner side of the links, under where the cover folds over
    const at = (u: number, lift: number) => {
      const pos = loop.getPointAt(u);
      const b = basis(pos, loop.getTangentAt(u));
      return { pos: pos.clone().addScaledVector(b.z, lift), ...b };
    };
    bladeMesh.position.copy(at(GAP_B + 10 / loopLen, -0.5).z.clone().multiplyScalar(-0.5));
    braceletParts.add(bladeMesh);
    // rounded tip: half of a flat disc, flush with the plate
    {
      const { pos, x, y, z } = at(GAP_B + 7.6 / loopLen, -0.5);
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(7.6, 7.6, 1.5, 48, 1, false, Math.PI / 2, Math.PI), brushed);
      tip.matrixAutoUpdate = false;
      // cylinder axis (local y) along the bracelet's normal, the half disc pointing away from the links
      tip.matrix.makeBasis(x.clone().negate(), z, y).setPosition(pos);
      braceletParts.add(tip);
      const lip = new THREE.Mesh(new RoundedBoxGeometry(9, 1.4, 1.6, 2, 0.5), polished);
      const l = at(GAP_B + 9.5 / loopLen, 0.9);
      lip.matrixAutoUpdate = false;
      lip.matrix.makeBasis(l.x, l.y, l.z).setPosition(l.pos);
      braceletParts.add(lip);
    }
    // hinge: a knuckle across the width where the blade meets the first row of links
    {
      const { pos, x, y, z } = at(BLADE_U, 0);
      const knuckle = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 16.6, 24), polished);
      knuckle.matrixAutoUpdate = false;
      knuckle.matrix.makeBasis(y, x.clone().negate(), z).setPosition(pos);
      braceletParts.add(knuckle);
      for (const side of [-1, 1]) {
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.8, 24), brushed);
        cap.matrixAutoUpdate = false;
        cap.matrix.makeBasis(y, x.clone().negate(), z).setPosition(pos.clone().addScaledVector(x, side * 8.7));
        braceletParts.add(cap);
      }
    }
  }
  const strapGeos = OPEN
    ? [
        new THREE.ExtrudeGeometry(strapShape(19.4, 3.2), { steps: 80, extrudePath: subCurve(0, GAP_A), bevelEnabled: false }),
        new THREE.ExtrudeGeometry(strapShape(19.4, 3.2), { steps: 80, extrudePath: subCurve(GAP_B, 1), bevelEnabled: false }),
      ]
    : [new THREE.ExtrudeGeometry(strapShape(19.4, 3.2), { steps: 160, extrudePath: loop, bevelEnabled: false })];
  const holeMat = new THREE.MeshBasicMaterial({ color: '#050505' });
  // the punched holes on the free end of an open strap
  const holes = () => {
    const g = new THREE.Group();
    if (!OPEN) return g;
    const geo = new THREE.CircleGeometry(1.15, 24);
    for (let i = 0; i < 5; i++) {
      const u = GAP_B + (9 + i * 6.5) / loopLen;
      const pos = loop.getPointAt(u);
      const { x, y, z } = basis(pos, loop.getTangentAt(u));
      const h = new THREE.Mesh(geo, holeMat);
      h.matrixAutoUpdate = false;
      h.matrix.makeBasis(x, y, z).setPosition(pos.clone().addScaledVector(z, 1.62));
      g.add(h);
    }
    return g;
  };
  const leather = new THREE.MeshStandardMaterial({ color: '#7a4526', roughness: 0.62, metalness: 0 });
  const rubber = new THREE.MeshStandardMaterial({ color: '#1b1d20', roughness: 0.85, metalness: 0 });
  const buckle = () => {
    // closed: under the wrist; open: on the end of the 12 o'clock half
    const u = OPEN ? GAP_A - 4 / loopLen : 0.5;
    const pos = loop.getPointAt(u);
    const { x, y, z } = basis(pos, loop.getTangentAt(u));
    const g = new THREE.Group();
    g.matrixAutoUpdate = false;
    g.matrix.makeBasis(x, y, z).setPosition(pos);
    const frame = new THREE.Shape();
    frame.moveTo(-11.6, -6.5);
    frame.lineTo(11.6, -6.5);
    frame.lineTo(11.6, 6.5);
    frame.lineTo(-11.6, 6.5);
    frame.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-9.6, -4.5);
    hole.lineTo(-9.6, 4.5);
    hole.lineTo(9.6, 4.5);
    hole.lineTo(9.6, -4.5);
    hole.closePath();
    frame.holes.push(hole);
    const ring = new THREE.Mesh(new THREE.ExtrudeGeometry(frame, { depth: 1.4, bevelEnabled: true, bevelSize: 0.4, bevelThickness: 0.4, bevelSegments: 3 }), polished);
    ring.position.z = 1.4;
    const tang = new THREE.Mesh(new RoundedBoxGeometry(1.4, 8.4, 1, 2, 0.4), polished);
    tang.position.set(0, -1.2, 2.6);
    g.add(ring, tang);
    return g;
  };
  const leatherParts = new THREE.Group();
  leatherParts.add(...strapGeos.map((g) => new THREE.Mesh(g, leather)), buckle(), holes());
  const rubberParts = new THREE.Group();
  rubberParts.add(...strapGeos.map((g) => new THREE.Mesh(g, rubber)), buckle(), holes());
  for (const sy of [-1, 1]) {
    // spring bars where the strap wraps round between the lugs
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 21.6, 16), polished);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, sy * 22.4, -1.3);
    leatherParts.add(bar.clone());
    rubberParts.add(bar);
  }
  leatherParts.visible = false;
  rubberParts.visible = false;
  watch.add(leatherParts, rubberParts);
  const setStrapParts = (id: StrapId) => {
    braceletParts.visible = id === 'bracelet';
    leatherParts.visible = id === 'leather';
    rubberParts.visible = id === 'rubber';
  };

  /* ───── caseback ───── */
  watch.add(
    lathe(
      [
        [17.0, -5.4],
        [16.8, -6.4],
        [15.4, -7.1],
        [12.8, -7.1],
        [12.8, -6.4],
      ],
      polished,
    ),
  );
  // engraving round the window: the standard text, or the buyer's own on the upper arc
  const engraveCanvas = document.createElement('canvas');
  engraveCanvas.width = engraveCanvas.height = 1024;
  const engraveTex = new THREE.CanvasTexture(engraveCanvas);
  engraveTex.colorSpace = THREE.SRGBColorSpace;
  engraveTex.anisotropy = 8;
  const engraveMat = new THREE.MeshStandardMaterial({ map: engraveTex, transparent: true, metalness: 0.6, roughness: 0.45, depthWrite: false });
  const engraveRing = new THREE.Mesh(new THREE.RingGeometry(12.85, 15.35, 128), engraveMat);
  engraveRing.rotation.y = Math.PI; // faces the back, like the caseback
  engraveRing.position.z = -7.13;
  watch.add(engraveRing);
  const STANDARD_TOP = 'MERID  ·  SOFIA  ·  AUTOMATIC CHRONOGRAPH';
  const STANDARD_BOTTOM = 'SAPPHIRE  ·  100 M  ·  316L STEEL';
  const paintEngraving = (text: string) => {
    const c = engraveCanvas.getContext('2d')!;
    const S = 1024;
    const C = S / 2;
    const k = C / 15.35; // px per mm
    c.clearRect(0, 0, S, S);
    // the ring is turned to face the back, which already shows the canvas the right way round
    c.save();
    const arc = (str: string, radiusMm: number, top: boolean, sizeMm: number, weight: number) => {
      c.font = `${weight} ${sizeMm * k}px "Manrope Variable", Manrope, sans-serif`;
      const chars = [...str];
      const widths = chars.map((ch) => c.measureText(ch).width + 0.06 * k);
      const total = widths.reduce((a, w) => a + w, 0);
      const r = radiusMm * k;
      let a = (top ? -Math.PI / 2 : Math.PI / 2) + (top ? -1 : 1) * (total / r) / 2;
      chars.forEach((ch, i) => {
        const w = widths[i];
        const mid = a + ((top ? 1 : -1) * (w / 2)) / r;
        c.save();
        c.translate(C + Math.cos(mid) * r, C + Math.sin(mid) * r);
        c.rotate(mid + (top ? Math.PI / 2 : -Math.PI / 2));
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        // an engraved line: a dark cut with a light edge under it
        c.fillStyle = 'rgba(255,255,255,0.55)';
        c.fillText(ch, 0, 1.2);
        c.fillStyle = '#1f2226';
        c.fillText(ch, 0, 0);
        c.restore();
        a += ((top ? 1 : -1) * w) / r;
      });
    };
    const custom = text.trim().toUpperCase();
    arc(custom || STANDARD_TOP, 14.05, true, custom ? 1.85 : 0.95, custom ? 800 : 600);
    arc(STANDARD_BOTTOM, 14.1, false, 0.95, 600);
    c.restore();
    engraveTex.needsUpdate = true;
  };
  let currentEngraving = '';
  paintEngraving('');
  const moveCanvas = document.createElement('canvas');
  moveCanvas.width = moveCanvas.height = 768;
  const moveTex = new THREE.CanvasTexture(moveCanvas);
  moveTex.colorSpace = THREE.SRGBColorSpace;
  const moveMat = new THREE.MeshStandardMaterial({ map: moveTex, metalness: 0.55, roughness: 0.38, color: '#ffffff' });
  const movementDisc = new THREE.Mesh(new THREE.CircleGeometry(12.8, 96), moveMat);
  movementDisc.rotation.y = Math.PI; // faces -Z
  movementDisc.position.z = -6.2;
  watch.add(movementDisc);
  const backGlass = new THREE.Mesh(new THREE.CircleGeometry(12.8, 96), sapphire);
  backGlass.rotation.y = Math.PI;
  backGlass.position.z = -6.7;
  watch.add(backGlass);

  /* ───── dial painting ───── */
  const paintDial = (d: Dial) => {
    const c = dialCanvas.getContext('2d')!;
    const S = 1024;
    const C = S / 2;
    const k = C / DIAL_R; // px per mm
    const font = (w: number, mm: number) => `${w} ${mm * k}px "Manrope Variable", Manrope, sans-serif`;
    const spacing = (mm: number) => {
      if ('letterSpacing' in c) (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${mm * k}px`;
    };
    const tick = (cx: number, cy: number, a: number, r1: number, r2: number, width: number, alpha: number, colour: string) => {
      c.strokeStyle = colour;
      c.globalAlpha = alpha;
      c.lineWidth = width;
      c.beginPath();
      c.moveTo(cx + Math.sin(a) * r1, cy - Math.cos(a) * r1);
      c.lineTo(cx + Math.sin(a) * r2, cy - Math.cos(a) * r2);
      c.stroke();
      c.globalAlpha = 1;
    };
    c.clearRect(0, 0, S, S);
    const g = c.createRadialGradient(C * 0.8, C * 0.7, 0, C, C, C);
    g.addColorStop(0, d.glow);
    g.addColorStop(1, d.base);
    c.fillStyle = g;
    c.fillRect(0, 0, S, S);
    // sunburst: fine radial brushing, and the two bright wedges a brushed
    // dial throws back from a light above (top right and bottom left)
    for (let i = 0; i < 720; i++) {
      const a = (i / 720) * Math.PI * 2;
      tick(C, C, a, 0, C * 1.1, 1.2, i % 2 ? (d.dark ? 0.07 : 0.03) : d.dark ? 0.05 : 0.045, i % 2 ? '#000' : '#fff');
    }
    if ('createConicGradient' in c) {
      const sheen = c.createConicGradient(-Math.PI / 2, C, C);
      const hi = d.dark ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.32)';
      const lo = d.dark ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.06)';
      [
        [0, lo],
        [0.1, hi],
        [0.22, lo],
        [0.38, 'rgba(0,0,0,0)'],
        [0.5, lo],
        [0.6, hi],
        [0.72, lo],
        [0.88, 'rgba(0,0,0,0)'],
        [1, lo],
      ].forEach(([o, col]) => sheen.addColorStop(o as number, col as string));
      c.fillStyle = sheen;
      c.fillRect(0, 0, S, S);
    }
    // fifth-of-a-second track
    for (let i = 0; i < 240; i++) {
      const five = i % 20 === 0;
      const sec = i % 4 === 0;
      tick(C, C, (i / 240) * Math.PI * 2, 16.5 * k, (five ? 15.3 : sec ? 15.8 : 16.1) * k, five ? 5 : sec ? 2.6 : 1.4, five ? 0.9 : sec ? 0.6 : 0.35, d.print);
    }
    // sub-dials
    const subDial = (sx: number, labels: string[], ticks: number) => {
      const cx = C + sx * k;
      const cy = C;
      c.fillStyle = d.sub;
      c.beginPath();
      c.arc(cx, cy, SUB_R * k, 0, Math.PI * 2);
      c.fill();
      // azurage: fine concentric grooves
      for (let i = 0; i < 40; i++) {
        c.strokeStyle = i % 2 ? '#fff' : '#000';
        c.globalAlpha = 0.045;
        c.lineWidth = 1.2;
        c.beginPath();
        c.arc(cx, cy, (0.3 + i * 0.095) * k, 0, Math.PI * 2);
        c.stroke();
      }
      c.globalAlpha = 0.18;
      c.strokeStyle = d.print;
      c.lineWidth = 2.5;
      c.beginPath();
      c.arc(cx, cy, SUB_R * k, 0, Math.PI * 2);
      c.stroke();
      c.globalAlpha = 1;
      for (let i = 0; i < ticks; i++) {
        const major = i % 5 === 0;
        tick(cx, cy, (i / ticks) * Math.PI * 2, 3.9 * k, (major ? 3.3 : 3.6) * k, major ? 3 : 1.6, major ? 0.9 : 0.5, d.print);
      }
      c.fillStyle = d.print;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = font(600, 0.9);
      spacing(0);
      labels.forEach((l, i) => {
        const a = (i * 2 * Math.PI) / 3;
        c.fillText(l, cx + Math.sin(a) * 2.35 * k, cy - Math.cos(a) * 2.35 * k);
      });
      c.textBaseline = 'alphabetic';
    };
    subDial(-SUB_X, ['60', '20', '40'], 60);
    subDial(SUB_X, ['30', '10', '20'], 30);
    // printing
    c.fillStyle = d.print;
    c.textAlign = 'center';
    c.font = font(600, 2.25);
    spacing(0.55);
    c.fillText('MERID', C + 0.28 * k, C - 7.3 * k);
    c.globalAlpha = 0.85;
    c.font = font(600, 0.95);
    spacing(0.34);
    c.fillText('AUTOMATIC', C + 0.17 * k, C - 5.5 * k);
    c.globalAlpha = 1;
    c.fillStyle = ORANGE;
    c.font = font(700, 0.8);
    spacing(0.3);
    c.fillText('CHRONOGRAPH', C + 0.15 * k, C + 7.6 * k);
    // date window at 6
    c.fillStyle = '#f6f3ec';
    const dy = C - DATE_Y * k;
    c.fillRect(C - 1.5 * k, dy - 1.15 * k, 3.0 * k, 2.3 * k);
    c.fillStyle = '#17191c';
    spacing(0);
    c.font = font(600, 1.6);
    c.textBaseline = 'middle';
    c.fillText(String(new Date().getDate()), C, dy + 0.1 * k);
    c.textBaseline = 'alphabetic';
    dialTex.needsUpdate = true;
    subPrint.color.set(d.print);

    const handMat: THREE.Material = d.dark ? polished : blackHand;
    hourHand.body.material = handMat;
    minuteHand.body.material = handMat;
    markerMats.body = d.dark ? polished : blackHand;
    markers.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material !== lume) o.material = markerMats.body;
    });
  };
  paintDial(dial);
  // repaint once the web font is ready, so the dial text uses Manrope
  document.fonts?.ready.then(() => {
    paintDial(currentDial);
    paintEngraving(currentEngraving);
    kick();
  });
  let currentDial = dial;

  /* ───── framing ───── */
  // The watch's own bounding box, measured once. Every frame its eight corners
  // are turned with the watch and the camera is placed so all of them are in
  // view, centred, whatever the pose: no part of the bracelet can leave the frame.
  const localBox = new THREE.Box3();
  watch.rotation.set(0, 0, 0);
  watch.updateMatrixWorld(true);
  watch.traverse((o) => {
    if (o instanceof THREE.InstancedMesh) {
      o.computeBoundingBox();
      if (o.boundingBox) localBox.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld));
    } else if (o instanceof THREE.Mesh) {
      o.geometry.computeBoundingBox();
      if (o.geometry.boundingBox) localBox.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
    }
  });
  const corners = Array.from({ length: 8 }, (_, i) =>
    new THREE.Vector3(i & 1 ? localBox.max.x : localBox.min.x, i & 2 ? localBox.max.y : localBox.min.y, i & 4 ? localBox.max.z : localBox.min.z),
  );
  const rot = new THREE.Matrix4();
  const tmpV = new THREE.Vector3();
  const margin = opts.margin ?? 1.08;
  const frameToFit = () => {
    rot.makeRotationFromEuler(watch.rotation);
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    const pts = corners.map((c) => {
      tmpV.copy(c).applyMatrix4(rot);
      minX = Math.min(minX, tmpV.x);
      maxX = Math.max(maxX, tmpV.x);
      minY = Math.min(minY, tmpV.y);
      maxY = Math.max(maxY, tmpV.y);
      return tmpV.clone();
    });
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) / margin;
    const tanH = tanV * camera.aspect;
    let d = 0;
    for (const p of pts) d = Math.max(d, p.z + Math.max(Math.abs(p.x - cx) / tanH, Math.abs(p.y - cy) / tanV));
    camera.position.set(cx, cy, d);
  };

  /* ───── loop ───── */
  let turnTarget = 0;
  let tiltTarget = opts.tilt ?? 0.1;
  let turn = reduced ? 0 : (opts.initial?.turn ?? 0);
  let tilt = reduced ? tiltTarget : (opts.initial?.tilt ?? tiltTarget);
  let rollTarget = 0;
  let roll = 0;
  let active = true;
  let raf = 0;
  const floating = !!opts.float && !reduced;
  const t0 = performance.now();

  const setHands = () => {
    const d = new Date();
    const ms = d.getMilliseconds();
    const s = d.getSeconds() + (reduced ? 0 : Math.floor(ms / 125) / 8);
    const m = d.getMinutes() + s / 60;
    const h = (d.getHours() % 12) + m / 60;
    hourHand.g.rotation.z = -(h / 12) * Math.PI * 2;
    minuteHand.g.rotation.z = -(m / 60) * Math.PI * 2;
    second.rotation.z = -(s / 60) * Math.PI * 2; // running seconds at 9
  };

  const frameLoop = () => {
    raf = 0;
    const k = reduced ? 1 : 0.07;
    turn += (turnTarget - turn) * k;
    tilt += (tiltTarget - tilt) * k;
    roll += (rollTarget - roll) * k;
    watch.rotation.set(tilt, turn, roll);
    frameToFit();
    if (floating) watch.position.y = Math.sin((performance.now() - t0) / 1400) * 0.9;
    setHands();
    renderer.render(scene, camera);
    if (active && (!reduced || Math.abs(turnTarget - turn) + Math.abs(tiltTarget - tilt) + Math.abs(rollTarget - roll) > 0.0005))
      raf = requestAnimationFrame(frameLoop);
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(frameLoop);
  };

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    kick();
  };
  resize();
  kick();

  // reduced motion: hands still tell the time, refreshed each minute
  const minuteTimer = reduced ? window.setInterval(kick, 60_000) : 0;

  return {
    setTurn: (r) => {
      turnTarget = r;
      kick();
    },
    setTilt: (r) => {
      tiltTarget = r;
      kick();
    },
    setRoll: (r) => {
      rollTarget = r;
      kick();
    },
    setDial: (d) => {
      currentDial = d;
      paintDial(d);
      kick();
    },
    setStrap: (id) => {
      setStrapParts(id);
      kick();
    },
    setEngraving: (text) => {
      currentEngraving = text;
      paintEngraving(text);
      kick();
    },
    setMovementTexture: (img) => {
      const c = moveCanvas.getContext('2d')!;
      c.clearRect(0, 0, moveCanvas.width, moveCanvas.height);
      c.drawImage(img, 0, 0, moveCanvas.width, moveCanvas.height);
      moveTex.needsUpdate = true;
      kick();
    },
    setActive: (a) => {
      active = a;
      if (a) kick();
    },
    resize,
    dispose: () => {
      cancelAnimationFrame(raf);
      window.clearInterval(minuteTimer);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      [brushed, polished, darkMetal, lume, orange, blackHand, sapphire, dialMat, moveMat, subPrint, markMat, leather, rubber, engraveMat, holeMat].forEach((m) => m.dispose());
      engraveTex.dispose();
      markTex.dispose();
      dialTex.dispose();
      moveTex.dispose();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
