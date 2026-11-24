import { useEffect, useState } from 'react';
import { useCart } from '../cart/CartContext';
import { DIALS, SIZES, STRAPS, dialById, priceFor, strapById, type DialId, type SizeId, type StrapId } from '../data/product';
import { useI18n } from '../i18n';
import { deliveryWindow } from '../lib/shipping';
import { ConfigWatch3D, type View } from './ConfigWatch3D';

/** Other sections can preselect a dial in the builder by dispatching this event. */
export const DIAL_EVENT = 'merid:choose-dial';

export function Configurator() {
  const [dial, setDial] = useState<DialId>('slate');
  const [strap, setStrap] = useState<StrapId>('bracelet');
  const [size, setSize] = useState<SizeId>(SIZES[SIZES.length - 1].id);
  const [added, setAdded] = useState(false);
  const [engraving, setEngraving] = useState('');
  const [view, setView] = useState<View>('front');
  const eta = deliveryWindow('Bulgaria');
  const etaEU = deliveryWindow('Germany');
  const { add, setOpen } = useCart();
  const { t } = useI18n();
  const money = t.money;
  const dialName = t.dials[dialById(dial).id];
  const strapName = t.straps[strapById(strap).id].name;

  const price = priceFor(strap);

  useEffect(() => {
    const on = (e: Event) => setDial((e as CustomEvent<DialId>).detail);
    window.addEventListener(DIAL_EVENT, on);
    return () => window.removeEventListener(DIAL_EVENT, on);
  }, []);

  const onAdd = () => {
    add(dial, strap, size, engraving.trim().replace(/\s+/g, ' ').toUpperCase());
    setAdded(true);
    window.setTimeout(() => setOpen(true), 380);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <section className="section config" id="buy">
      <div className="wrap config__grid">
        <div className="config__stage">
          <ConfigWatch3D
            dial={dial}
            strap={strap}
            engraving={engraving}
            view={view}
            onView={setView}
            title={t.watchTitle(dialName, strapName)}
          />
          <div className="views" role="group" aria-label={t.config.turn}>
            {(['front', 'side', 'back'] as View[]).map((v) => (
              <button key={v} className={view === v ? 'is-on' : ''} aria-pressed={view === v} onClick={() => setView(v)}>
                {t.config.views[v]}
              </button>
            ))}
          </div>
          <p className="config__hint" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M7 12h10M7 12l3-3M7 12l3 3M17 12l-3-3M17 12l-3 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.config.drag}
          </p>
        </div>

        <div className="config__panel">
          <h2 className="h2">{t.config.title}</h2>
          <p className="config__price" aria-live="polite">
            {money(price)}
            <span>{t.config.priceNote}</span>
          </p>

          <fieldset className="opt">
            <legend>
              {t.config.dial} <span>{dialName}</span>
            </legend>
            <div className="swatches">
              {DIALS.map((d) => (
                <label key={d.id} className="swatch" title={t.dials[d.id]}>
                  <input type="radio" name="dial" value={d.id} checked={dial === d.id} onChange={() => setDial(d.id)} />
                  <span className="swatch__dot" style={{ background: `radial-gradient(circle at 35% 30%, ${d.glow}, ${d.swatch})` }} />
                  <span className="sr-only">{t.dialLabel(t.dials[d.id])}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="opt">
            <legend>
              {t.config.strap} <span>{strapName}</span>
            </legend>
            <div className="segs">
              {STRAPS.map((s) => (
                <label key={s.id} className="seg">
                  <input type="radio" name="strap" value={s.id} checked={strap === s.id} onChange={() => setStrap(s.id)} />
                  <span>
                    {t.straps[s.id].short}
                    {s.surcharge > 0 && <small>+{money(s.surcharge)}</small>}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {SIZES.length > 1 && (
          <fieldset className="opt">
            <legend>
              {t.config.case} <span>{size} {t.units.mm}</span>
            </legend>
            <div className="segs segs--two">
              {SIZES.map((s) => (
                <label key={s.id} className="seg">
                  <input type="radio" name="size" value={s.id} checked={size === s.id} onChange={() => setSize(s.id)} />
                  <span>
                    {s.name}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          )}

          <div className="opt engrave">
            <label htmlFor="engraving" className="engrave__label">
              {t.config.engraving} <span>{t.config.engravingTag}</span>
            </label>
            <div className="engrave__field">
              <input
                id="engraving"
                type="text"
                maxLength={24}
                placeholder={t.config.placeholder}
                value={engraving}
                onChange={(e) => setEngraving(e.target.value.replace(/[^\p{L}\p{N} .,&'·\-/]/gu, ''))}
                onFocus={() => setView('back')}
                aria-describedby="engraving-help"
              />
              <span className="engrave__count" aria-hidden="true">
                {engraving.length}/24
              </span>
            </div>
            <p id="engraving-help" className="engrave__help">
              {t.config.engravingHelp}
            </p>
          </div>

          <button className={`btn btn--solid btn--wide ${added ? 'is-done' : ''}`} onClick={onAdd}>
            <span className="btn__label">{added ? t.config.added : t.config.add(money(price))}</span>
          </button>
          <p className="config__eta">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 6h11v9H3z M14 9h4l3 3v3h-7 M6.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M17.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            <span>{t.config.eta(t.shortDate(eta.latest), t.shortDate(etaEU.latest))}</span>
          </p>
          <p className="config__note">{engraving.trim() ? t.config.noteEngraved : t.config.note}</p>
        </div>
      </div>
    </section>
  );
}
