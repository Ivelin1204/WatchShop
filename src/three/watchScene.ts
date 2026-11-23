import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Dial } from '../data/product';

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

export interface WatchScene {
  /** target turn around the vertical axis, in radians (0 = dial to camera) */
  setTurn: (radians: number) => void;
  setDial: (dial: Dial) => void;
  setMovementTexture: (img: CanvasImageSource) => void;
  setActive: (active: boolean) => void;
  resize: () => void;
  dispose: () => void;
}

export function createWatchScene(canvas: HTMLCanvasElement, dial: Dial, reduced: boolean): WatchScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(26, 1, 1, 1000);
  camera.position.set(0, 4, 190);
  camera.lookAt(0, 0, 0);

  const key = new THREE.DirectionalLight('#ffffff', 1.6);
  key.position.set(-60, 90, 120);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#ffd9bf', 1.4);
  rim.position.set(80, -40, -90);
  scene.add(rim);
  scene.add(new THREE.AmbientLight('#ffffff', 0.15));

  /* ───── materials ───── */
  const brushed = new THREE.MeshPhysicalMaterial({ color: '#c4c7cb', metalness: 1, roughness: 0.4, clearcoat: 0.2, side: THREE.DoubleSide });
  const polished = new THREE.MeshPhysicalMaterial({ color: '#e4e6e9', metalness: 1, roughness: 0.1, side: THREE.DoubleSide });
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
  const dialMat = new THREE.MeshPhysicalMaterial({ map: dialTex, metalness: 0.15, roughness: 0.55, envMapIntensity: 0.12 });
  const dialMesh = new THREE.Mesh(new THREE.CircleGeometry(DIAL_R, 128), dialMat);
  dialMesh.position.z = DIAL_Z;
  watch.add(dialMesh);

  // applied markers
  const markers = new THREE.Group();
  watch.add(markers);
  const markerMats = { body: polished as THREE.Material };
  const addMarker = (angle: number, x: number, long: boolean) => {
    const len = long ? 3.6 : 3.2;
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
    if (i === 3 || i === 6 || i === 9) continue; // counters and date
    const a = (i / 12) * Math.PI * 2;
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
  const baton = (len: number, w: number, tail: number) => {
    const sh = new THREE.Shape();
    sh.moveTo(0, len);
    sh.lineTo(w / 2, len - w * 0.9);
    sh.lineTo(w / 2, -tail);
    sh.lineTo(-w / 2, -tail);
    sh.lineTo(-w / 2, len - w * 0.9);
    sh.closePath();
    return sh;
  };
  const handGroup = (len: number, w: number, z: number) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(
      new THREE.ExtrudeGeometry(baton(len, w, 1.3), { depth: 0.22, bevelEnabled: true, bevelSize: 0.07, bevelThickness: 0.06, bevelSegments: 2 }),
      polished,
    );
    const ins = new THREE.Mesh(new THREE.BoxGeometry(w * 0.48, len - 3.2, 0.1), lume);
    ins.position.set(0, 1.2 + (len - 3.2) / 2, 0.32);
    g.add(body, ins);
    g.position.z = z;
    watch.add(g);
    return { g, body };
  };
  const hourHand = handGroup(9.4, 1.4, DIAL_Z + 0.9);
  const minuteHand = handGroup(13.9, 1.15, DIAL_Z + 1.3);

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
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.5, 32), polished);
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
  const crownEnd = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.1, 0.4, 48), polished);
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
  const lugGeo = new THREE.ExtrudeGeometry(lugShape, { depth: 2.2, bevelEnabled: true, bevelSize: 0.35, bevelThickness: 0.35, bevelSegments: 3 });
  lugGeo.translate(0, 0, -1.1);
  // (x, y, z) -> (z, x, y): shape x becomes +Y, shape y becomes +Z, extrusion becomes X
  lugGeo.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
  lugGeo.computeVertexNormals();
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const lug = new THREE.Mesh(lugGeo, brushed);
      lug.position.set(sx * 11.3, sy * 14.8, 0);
      lug.scale.y = sy; // mirror for the 6 o'clock side
      watch.add(lug);
    }
  }

  /* ───── bracelet: beads of rice ───── */
  // five rows of links: flat brushed outer links and three rows of small
  // polished "rice" links between them, on a dark core that shows in the gaps.
  // A solid end link is fitted to the case between the lugs.
  const braceletCurve = (sy: number) =>
    new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0, sy * 22.4, -1.3),
        new THREE.Vector3(0, sy * 28.6, -2.9),
        new THREE.Vector3(0, sy * 35.2, -7.8),
        new THREE.Vector3(0, sy * 40.0, -15.5),
        new THREE.Vector3(0, sy * 42.0, -25.0),
        new THREE.Vector3(0, sy * 41.0, -34.0),
      ],
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
  for (const sy of [-1, 1]) {
    const end = new THREE.Mesh(endGeo, brushed);
    end.scale.y = sy;
    watch.add(end);
  }

  const ROW_PITCH = 2.9;
  const outerGeo = new RoundedBoxGeometry(4.6, 2.7, 2.6, 3, 0.55);
  const riceGeo = new THREE.SphereGeometry(1, 24, 16);
  riceGeo.scale(1.05, 1.32, 0.78); // a grain of rice, long along the bracelet
  const rows: { pos: THREE.Vector3; tan: THREE.Vector3; taper: number; i: number }[] = [];
  for (const sy of [-1, 1]) {
    const curve = braceletCurve(sy);
    const len = curve.getLength();
    const n = Math.floor(len / ROW_PITCH);
    for (let i = 0; i < n; i++) {
      const u = (i * ROW_PITCH + ROW_PITCH / 2) / len;
      rows.push({ pos: curve.getPointAt(u), tan: curve.getTangentAt(u), taper: 1 - 0.2 * u, i });
    }
    // dark core under the links, seen in the gaps
    const core = new THREE.Shape();
    core.moveTo(-5.2, -0.5);
    core.lineTo(5.2, -0.5);
    core.lineTo(5.2, 0.5);
    core.lineTo(-5.2, 0.5);
    core.closePath();
    watch.add(new THREE.Mesh(new THREE.ExtrudeGeometry(core, { steps: 80, extrudePath: curve, bevelEnabled: false }), darkMetal));
  }
  const outers = new THREE.InstancedMesh(outerGeo, brushed, rows.length * 2);
  const rice = new THREE.InstancedMesh(riceGeo, polished, rows.length * 3);
  const X = new THREE.Vector3(1, 0, 0);
  const m = new THREE.Matrix4();
  rows.forEach((r, i) => {
    const y = r.tan.clone().normalize();
    // z must face away from the wrist on both halves of the bracelet
    const sy = r.pos.y >= 0 ? 1 : -1;
    const z = new THREE.Vector3().crossVectors(X, y).multiplyScalar(sy).normalize();
    const x = new THREE.Vector3().crossVectors(y, z).normalize();
    const place = (dx: number, lift: number) =>
      m.makeBasis(x, y, z).scale(new THREE.Vector3(r.taper, 1, 1)).setPosition(r.pos.clone().addScaledVector(X, dx * r.taper).addScaledVector(z, lift));
    [-1, 1].forEach((side, j) => outers.setMatrixAt(i * 2 + j, place(side * 7.3, 0)));
    [-2.75, 0, 2.75].forEach((dx, j) => rice.setMatrixAt(i * 3 + j, place(dx, 0.35)));
  });
  watch.add(outers, rice);

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
  const notches = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, 1.0, 0.5), darkMetal, 8);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    tmp.position.set(Math.cos(a) * 14.8, Math.sin(a) * 14.8, -7.1);
    tmp.rotation.set(0, 0, a + Math.PI / 2);
    tmp.updateMatrix();
    notches.setMatrixAt(i, tmp.matrix);
  }
  watch.add(notches);
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
    // sunburst
    for (let i = 0; i < 360; i++) {
      const a = (i / 360) * Math.PI * 2;
      tick(C, C, a, 0, C * 1.1, 2, i % 2 ? (d.dark ? 0.06 : 0.035) : d.dark ? 0.045 : 0.05, i % 2 ? '#000' : '#fff');
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
      for (let i = 0; i < 12; i++) {
        c.strokeStyle = i % 2 ? '#fff' : '#000';
        c.globalAlpha = 0.07;
        c.lineWidth = 3;
        c.beginPath();
        c.arc(cx, cy, (0.6 + i * 0.3) * k, 0, Math.PI * 2);
        c.stroke();
      }
      c.globalAlpha = 0.35;
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
    c.font = font(700, 1.9);
    spacing(0.6);
    c.fillText('MERID', C + 0.3 * k, C - 7.6 * k);
    c.globalAlpha = 0.78;
    c.font = font(600, 0.85);
    spacing(0.36);
    c.fillText('AUTOMATIC', C + 0.18 * k, C - 6.1 * k);
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
  document.fonts?.ready.then(() => paintDial(currentDial));
  let currentDial = dial;

  /* ───── loop ───── */
  let turnTarget = 0;
  let turn = 0;
  let active = true;
  let raf = 0;
  const baseTilt = 0.1;

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
    turn += (turnTarget - turn) * (reduced ? 1 : 0.09);
    watch.rotation.set(baseTilt, turn, 0);
    setHands();
    renderer.render(scene, camera);
    if (active && (!reduced || Math.abs(turnTarget - turn) > 0.0005)) raf = requestAnimationFrame(frameLoop);
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
    // keep the whole watch (about 90 mm tall, 50 mm wide) in frame at any aspect
    const fitH = 100;
    const fitW = 66;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const distH = fitH / 2 / Math.tan(vFov / 2);
    const distW = fitW / 2 / (Math.tan(vFov / 2) * camera.aspect);
    camera.position.z = Math.max(distH, distW);
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
    setDial: (d) => {
      currentDial = d;
      paintDial(d);
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
      [brushed, polished, darkMetal, lume, orange, blackHand, sapphire, dialMat, moveMat, subPrint].forEach((m) => m.dispose());
      dialTex.dispose();
      moveTex.dispose();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
