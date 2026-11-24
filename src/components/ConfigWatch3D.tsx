import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { dialById, type DialId, type StrapId } from '../data/product';
import { movementImage } from '../three/movementImage';
import type { WatchScene } from '../three/watchScene';
import { WatchBack } from './watch/WatchBack';
import { WatchFace } from './watch/WatchFace';
import { usePrefersReducedMotion } from './watch/useClock';

export type View = 'front' | 'side' | 'back';
const VIEWS: Record<View, { turn: number; tilt: number }> = {
  front: { turn: -0.32, tilt: 0.12 },
  side: { turn: -Math.PI / 2 + 0.25, tilt: 0.12 },
  back: { turn: Math.PI - 0.22, tilt: 0.12 },
};

interface Props {
  dial: DialId;
  strap: StrapId;
  engraving: string;
  view: View;
  onView: (v: View) => void;
  title: string;
}

/** The builder's watch: the live 3D model, dragged to turn, following the chosen dial, strap and engraving. */
export function ConfigWatch3D({ dial, strap, engraving, view, onView, title }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const backSvg = useRef<HTMLDivElement>(null);
  const scene = useRef<WatchScene | null>(null);
  const pose = useRef({ ...VIEWS.front });
  const drag = useRef<{ x: number; y: number; turn: number; tilt: number } | null>(null);
  const reduced = usePrefersReducedMotion();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let disposed = false;
    let io: IntersectionObserver | null = null;
    let ro: ResizeObserver | null = null;
    (async () => {
      try {
        const { createWatchScene } = await import('../three/watchScene');
        if (disposed || !canvas.current) return;
        const s = createWatchScene(canvas.current, dialById(dial), reduced, {
          margin: 1.04,
          openStrap: true,
          tilt: VIEWS.front.tilt,
          initial: { turn: VIEWS.front.turn - 0.8, tilt: VIEWS.front.tilt },
        });
        s.setTurn(VIEWS.front.turn);
        s.setStrap(strap);
        s.setEngraving(engraving);
        scene.current = s;
        setReady(true);
        const svg = backSvg.current?.querySelector('svg');
        if (svg) movementImage(svg).then((img) => !disposed && s.setMovementTexture(img), () => {});
        io = new IntersectionObserver(([e]) => s.setActive(e.isIntersecting));
        io.observe(canvas.current);
        ro = new ResizeObserver(() => s.resize());
        ro.observe(canvas.current);
      } catch {
        if (!disposed) setFailed(true);
      }
    })();
    return () => {
      disposed = true;
      io?.disconnect();
      ro?.disconnect();
      scene.current?.dispose();
      scene.current = null;
    };
    // built once; the options below update it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  useEffect(() => scene.current?.setDial(dialById(dial)), [dial, ready]);
  useEffect(() => scene.current?.setStrap(strap), [strap, ready]);
  useEffect(() => scene.current?.setEngraving(engraving), [engraving, ready]);

  // the view buttons turn the watch to a set pose
  useEffect(() => {
    pose.current = { ...VIEWS[view] };
    scene.current?.setTurn(pose.current.turn);
    scene.current?.setTilt(pose.current.tilt);
  }, [view, ready]);

  const down = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!scene.current) return;
    drag.current = { x: e.clientX, y: e.clientY, ...pose.current };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const move = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d || !scene.current) return;
    const turn = d.turn + (e.clientX - d.x) * 0.011;
    const tilt = Math.max(-0.7, Math.min(0.8, d.tilt + (e.clientY - d.y) * 0.006));
    pose.current = { turn, tilt };
    scene.current.setTurn(turn);
    scene.current.setTilt(tilt);
  };
  const up = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    // let the buttons show which side is facing you
    const t = ((pose.current.turn % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI; // -π..π
    const facing: View = Math.abs(t) > 2.2 ? 'back' : Math.abs(t) > 0.9 ? 'side' : 'front';
    if (facing !== view) onView(facing);
  };

  if (failed) {
    return <WatchFace dial={dial} strap={strap} view="head" className="config__watch" title={title} />;
  }

  return (
    <>
      <canvas
        ref={canvas}
        className={`config__canvas ${ready ? 'is-ready' : ''} ${dragging ? 'is-dragging' : ''}`}
        role="img"
        aria-label={title}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      />
      <div ref={backSvg} className="showcase__source" aria-hidden="true">
        <WatchBack />
      </div>
    </>
  );
}
