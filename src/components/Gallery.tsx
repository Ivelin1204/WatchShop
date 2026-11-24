import caseback from '../assets/photos/caseback.webp';
import dials from '../assets/photos/dials.webp';
import studio from '../assets/photos/studio.webp';
import wrist from '../assets/photos/wrist.webp';

const PHOTOS = [
  { src: wrist, w: 1024, h: 1280, cls: 'wrist', alt: 'The Meridian with a slate dial on a tan leather strap, worn at a café table next to an espresso' },
  { src: studio, w: 1536, h: 1024, cls: 'studio', alt: 'The Meridian on its steel bracelet, slate dial, three-quarter view on black' },
  { src: caseback, w: 1024, h: 1024, cls: 'back', alt: 'The back of the Meridian: the movement behind sapphire and the words FOR MARIA 2026 engraved round the window' },
  { src: dials, w: 1536, h: 1024, cls: 'dials', alt: 'Three Meridians side by side: slate dial on the bracelet, midnight on leather, bone on rubber' },
];

/** Photographs of the watch: worn, in the studio, from the back, and all three dials. */
export function Gallery() {
  return (
    <section className="section gallery" id="photos" aria-labelledby="photos-title">
      <div className="wrap">
        <div className="gallery__head">
          <h2 className="h2" id="photos-title">
            Out in the world.
          </h2>
          <p className="lead">
            On a café table, under a coat sleeve, face down with a name on the back. One 40&nbsp;mm case, three dials,
            three straps.
          </p>
        </div>
        <div className="gallery__grid">
          {PHOTOS.map((p) => (
            <figure key={p.cls} className={`shot shot--${p.cls}`}>
              <img src={p.src} width={p.w} height={p.h} alt={p.alt} loading="lazy" decoding="async" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
