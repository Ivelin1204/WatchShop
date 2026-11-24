import caseback from '../assets/photos/caseback.webp';
import dials from '../assets/photos/dials.webp';
import studio from '../assets/photos/studio.webp';
import wrist from '../assets/photos/wrist.webp';
import { useI18n } from '../i18n';

const PHOTOS = [
  { src: wrist, w: 1024, h: 1280, cls: 'wrist' },
  { src: studio, w: 1536, h: 1024, cls: 'studio' },
  { src: caseback, w: 1024, h: 1024, cls: 'back' },
  { src: dials, w: 1536, h: 1024, cls: 'dials' },
] as const;

/** Photographs of the watch: worn, in the studio, from the back, and all three dials. */
export function Gallery() {
  const { t } = useI18n();
  return (
    <section className="section gallery" id="photos" aria-labelledby="photos-title">
      <div className="wrap">
        <div className="gallery__head">
          <h2 className="h2" id="photos-title">
            {t.gallery.title}
          </h2>
          <p className="lead">{t.gallery.lead}</p>
        </div>
        <div className="gallery__grid">
          {PHOTOS.map((p) => (
            <figure key={p.cls} className={`shot shot--${p.cls}`}>
              <img src={p.src} width={p.w} height={p.h} alt={t.gallery.alts[p.cls]} loading="lazy" decoding="async" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
