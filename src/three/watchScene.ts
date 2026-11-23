import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Dial } from '../data/product';

/**
 * A procedural 3D model of the Meridian 39, built from primitives so it needs
 * no model file. Units are millimetres; the dial faces +Z, 12 o'clock is +Y
 * and the crown sits at +X.
 */

const CASE_R = 19.5;
const DIAL_R = 16.4;
const DIAL_Z = 1.8;
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
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(26, 1, 1, 1000);
  camera.position.set(0, 4, 190);
  camera.lookAt(0, 0, 0);

  const key = new THREE.DirectionalLight('#ffffff', 2.2);
  key.position.set(-60, 90, 120);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#ffd9bf', 1.4);
  rim.position.set(80, -40, -90);
  scene.add(rim);
  scene.add(new THREE.AmbientLight('#ffffff', 0.15));

  /* ───── materials ───── */
  const brushed = new THREE.MeshPhysicalMaterial({ color: '#d9dadc', metalness: 1, roughness: 0.32, clearcoat: 0.2, side: THREE.DoubleSide });
  const polished = new THREE.MeshPhysicalMaterial({ color: '#f2f2f2', metalness: 1, roughness: 0.08, side: THREE.DoubleSide });
  const darkMetal = new THREE.MeshStandardMaterial({ color: '#2a2c30', metalness: 0.6, roughness: 0.45, side: THREE.DoubleSide });
  const lume = new THREE.MeshStandardMaterial({ color: LUME, roughness: 0.6, emissive: '#9fb08a', emissiveIntensity: 0.06 });
  const orange = new THREE.MeshStandardMaterial({ color: ORANGE, metalness: 0.3, roughness: 0.35 });
  const blackHand = new THREE.MeshStandardMaterial({ color: '#1b1d20', metalness: 0.5, roughness: 0.3 });
  const leather = new THREE.MeshStandardMaterial({ color: '#5e341d', roughness: 0.62, metalness: 0 });
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
        [16.6, -4.6],
        [18.4, -4.6],
        [19.3, -3.9],
        [CASE_R, -3.0],
        [CASE_R, 3.2],
        [19.1, 4.0],
        [17.0, 4.0],
      ],
      brushed,
    ),
  );
  watch.add(
    lathe(
      [
        [19.0, 4.0],
        [18.9, 4.9],
        [18.3, 5.5],
        [16.9, 5.6],
        [16.9, 4.0],
      ],
      polished,
    ),
  );
  // rehaut: the slanted ring between dial and crystal
  watch.add(
    lathe(
      [
        [DIAL_R, DIAL_Z],
        [16.95, 4.0],
        [16.95, 5.3],
      ],
      darkMetal,
    ),
  );
  // domed crystal (spherical cap)
  const crystalGeo = new THREE.SphereGeometry(40, 96, 24, 0, Math.PI * 2, 0, Math.asin(16.9 / 40));
  crystalGeo.rotateX(Math.PI / 2);
  crystalGeo.translate(0, 0, 5.4 - 40 * Math.cos(Math.asin(16.9 / 40)));
  const crystal = new THREE.Mesh(crystalGeo, sapphire);
  watch.add(crystal);

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
    const len = long ? 3.6 : 2.9;
    const m = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.05, len, 0.55), markerMats.body);
    const ins = new THREE.Mesh(new THREE.BoxGeometry(0.46, len - 0.6, 0.2), lume);
    ins.position.z = 0.32;
    m.add(body, ins);
    const r = 13.0 - len / 2 + 0.2;
    m.position.set(Math.sin(angle) * r + Math.cos(angle) * x, Math.cos(angle) * r - Math.sin(angle) * x, DIAL_Z + 0.3);
    m.rotation.z = -angle;
    markers.add(m);
  };
  for (let i = 0; i < 12; i++) {
    if (i === 3) continue; // date window
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
  frame.position.set(11.9, 0, DIAL_Z);
  watch.add(frame);

  /* ───── hands ───── */
  const sword = (len: number, w: number, tail: number) => {
    const s = new THREE.Shape();
    s.moveTo(0, len);
    s.lineTo(w / 2, len - w * 1.6);
    s.lineTo(w * 0.42, -tail);
    s.lineTo(-w * 0.42, -tail);
    s.lineTo(-w / 2, len - w * 1.6);
    s.closePath();
    return s;
  };
  const handGroup = (len: number, w: number, z: number) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(new THREE.ExtrudeGeometry(sword(len, w, 1.2), { depth: 0.22, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.06, bevelSegments: 2 }), polished);
    const ins = new THREE.Mesh(new THREE.ExtrudeGeometry(sword(len - 1.0, w * 0.52, -1.8), { depth: 0.1, bevelEnabled: false }), lume);
    ins.position.z = 0.3;
    g.add(body, ins);
    g.position.z = z;
    watch.add(g);
    return { g, body };
  };
  const hourHand = handGroup(8.6, 1.5, DIAL_Z + 0.9);
  const minuteHand = handGroup(12.6, 1.25, DIAL_Z + 1.3);
  const second = new THREE.Group();
  const secBar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 16.2, 0.12), orange);
  secBar.position.y = 5.6;
  const secTail = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.14, 32), orange);
  secTail.rotation.x = Math.PI / 2;
  secTail.position.y = -2.1;
  second.add(secBar, secTail);
  second.position.z = DIAL_Z + 1.75;
  watch.add(second);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.5, 32), polished);
  cap.rotation.x = Math.PI / 2;
  cap.position.z = DIAL_Z + 1.9;
  watch.add(cap);

  /* ───── crown ───── */
  const crown = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.8, 32), brushed);
  stem.position.y = 0.9;
  const head = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.1, 3.4, 48), brushed);
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
      lug.position.set(sx * 11.3, sy * 14.2, 0);
      lug.scale.y = sy; // mirror for the 6 o'clock side
      watch.add(lug);
    }
  }

  /* ───── strap ───── */
  const strapCurve = (sy: number) =>
    new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0, sy * 21.0, -1.0),
        new THREE.Vector3(0, sy * 28.0, -2.6),
        new THREE.Vector3(0, sy * 35.0, -7.5),
        new THREE.Vector3(0, sy * 40.0, -15.5),
        new THREE.Vector3(0, sy * 42.0, -25.0),
        new THREE.Vector3(0, sy * 41.0, -34.0),
      ],
      false,
      'centripetal',
    );
  const strapShape = (w: number, t: number) => {
    // ExtrudeGeometry puts shape-x on the path's normal (here the X axis, across
    // the wrist) and shape-y on the binormal (the strap's thickness)
    const s = new THREE.Shape();
    const r = t / 2;
    s.moveTo(-w / 2 + r, -r);
    s.lineTo(w / 2 - r, -r);
    s.quadraticCurveTo(w / 2, -r, w / 2, 0);
    s.quadraticCurveTo(w / 2, r, w / 2 - r, r);
    s.lineTo(-w / 2 + r, r);
    s.quadraticCurveTo(-w / 2, r, -w / 2, 0);
    s.quadraticCurveTo(-w / 2, -r, -w / 2 + r, -r);
    return s;
  };
  for (const sy of [-1, 1]) {
    const curve = strapCurve(sy);
    const geo = new THREE.ExtrudeGeometry(strapShape(19.6, 3.4), { steps: 80, extrudePath: curve, bevelEnabled: false });
    watch.add(new THREE.Mesh(geo, leather));
    // spring bar between the lugs
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 21.6, 16), polished);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, sy * 21.8, -1.0); // hidden inside the strap end
    watch.add(bar);
  }

  /* ───── caseback ───── */
  watch.add(
    lathe(
      [
        [16.6, -4.6],
        [16.4, -5.6],
        [15.2, -6.3],
        [12.8, -6.3],
        [12.8, -5.6],
      ],
      polished,
    ),
  );
  const notches = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, 1.0, 0.5), darkMetal, 8);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    tmp.position.set(Math.cos(a) * 14.6, Math.sin(a) * 14.6, -6.3);
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
  movementDisc.position.z = -5.4;
  watch.add(movementDisc);
  const backGlass = new THREE.Mesh(new THREE.CircleGeometry(12.8, 96), sapphire);
  backGlass.rotation.y = Math.PI;
  backGlass.position.z = -5.9;
  watch.add(backGlass);

  /* ───── dial painting ───── */
  const paintDial = (d: Dial) => {
    const c = dialCanvas.getContext('2d')!;
    const S = 1024;
    const C = S / 2;
    const k = C / DIAL_R; // px per mm
    c.clearRect(0, 0, S, S);
    const g = c.createRadialGradient(C * 0.8, C * 0.7, 0, C, C, C);
    g.addColorStop(0, d.glow);
    g.addColorStop(1, d.base);
    c.fillStyle = g;
    c.fillRect(0, 0, S, S);
    // sunburst
    for (let i = 0; i < 360; i++) {
      const a = (i / 360) * Math.PI * 2;
      c.strokeStyle = i % 2 ? `rgba(0,0,0,${d.dark ? 0.06 : 0.035})` : `rgba(255,255,255,${d.dark ? 0.045 : 0.05})`;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(C, C);
      c.lineTo(C + Math.cos(a) * C, C + Math.sin(a) * C);
      c.stroke();
    }
    // minute track
    c.strokeStyle = d.print;
    for (let i = 0; i < 60; i++) {
      const five = i % 5 === 0;
      const a = (i / 60) * Math.PI * 2;
      const r1 = 15.6 * k;
      const r2 = (five ? 14.5 : 15.0) * k;
      c.globalAlpha = five ? 0.9 : 0.55;
      c.lineWidth = five ? 5 : 2.4;
      c.beginPath();
      c.moveTo(C + Math.sin(a) * r1, C - Math.cos(a) * r1);
      c.lineTo(C + Math.sin(a) * r2, C - Math.cos(a) * r2);
      c.stroke();
    }
    c.globalAlpha = 1;
    // printing
    c.fillStyle = d.print;
    c.textAlign = 'center';
    c.font = `700 ${1.75 * k}px "Manrope Variable", Manrope, sans-serif`;
    if ('letterSpacing' in c) (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${0.55 * k}px`;
    c.fillText('MERID', C + 0.27 * k, C - 5.6 * k);
    c.font = `600 ${0.85 * k}px "Manrope Variable", Manrope, sans-serif`;
    if ('letterSpacing' in c) (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${0.35 * k}px`;
    c.globalAlpha = 0.8;
    c.fillText('AUTOMATIC', C + 0.17 * k, C + 7.0 * k);
    c.globalAlpha = 1;
    c.fillStyle = ORANGE;
    c.font = `700 ${0.72 * k}px "Manrope Variable", Manrope, sans-serif`;
    c.fillText('100 M', C + 0.14 * k, C + 8.3 * k);
    // date window
    c.fillStyle = '#f6f3ec';
    const dx = C + 11.9 * k;
    c.fillRect(dx - 1.5 * k, C - 1.15 * k, 3.0 * k, 2.3 * k);
    c.fillStyle = '#17191c';
    if ('letterSpacing' in c) (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px';
    c.font = `600 ${1.6 * k}px "Manrope Variable", Manrope, sans-serif`;
    c.textBaseline = 'middle';
    c.fillText(String(new Date().getDate()), dx, C + 0.1 * k);
    c.textBaseline = 'alphabetic';
    dialTex.needsUpdate = true;

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
    second.rotation.z = -(s / 60) * Math.PI * 2;
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
    const fitW = 62;
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
      [brushed, polished, darkMetal, lume, orange, blackHand, leather, sapphire, dialMat, moveMat].forEach((m) => m.dispose());
      dialTex.dispose();
      moveTex.dispose();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
