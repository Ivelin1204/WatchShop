import { useEffect, useState } from 'react';
import { useCart } from '../cart/CartContext';
import { DIALS, MODEL, SIZES, STRAPS, dialById, priceFor, strapById, type DialId, type SizeId, type StrapId } from '../data/product';
import { money } from '../lib/format';
import { WatchFace } from './watch/WatchFace';

/** Other sections can preselect a dial in the builder by dispatching this event. */
export const DIAL_EVENT = 'merid:choose-dial';

export function Configurator() {
  const [dial, setDial] = useState<DialId>('slate');
  const [strap, setStrap] = useState<StrapId>('bracelet');
  const [size, setSize] = useState<SizeId>(SIZES[SIZES.length - 1].id);
  const [added, setAdded] = useState(false);
  const { add, setOpen } = useCart();

  const price = priceFor(strap);

  useEffect(() => {
    const on = (e: Event) => setDial((e as CustomEvent<DialId>).detail);
    window.addEventListener(DIAL_EVENT, on);
    return () => window.removeEventListener(DIAL_EVENT, on);
  }, []);

  const onAdd = () => {
    add(dial, strap, size);
    setAdded(true);
    window.setTimeout(() => setOpen(true), 380);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <section className="section config" id="buy">
      <div className="wrap config__grid">
        <div className="config__stage">
          <WatchFace
            key={`${dial}-${strap}-${size}`}
            dial={dial}
            strap={strap}
            size={size}
            view="head"
            className="config__watch"
            title={`${MODEL.name} with ${dialById(dial).name.toLowerCase()} dial on ${strapById(strap).name.toLowerCase()}`}
          />
        </div>

        <div className="config__panel">
          <h2 className="h2">Choose your Meridian.</h2>
          <p className="config__price" aria-live="polite">
            {money(price)}
            <span>incl. VAT · ships in {MODEL.shipping}</span>
          </p>

          <fieldset className="opt">
            <legend>
              Dial <span>{dialById(dial).name}</span>
            </legend>
            <div className="swatches">
              {DIALS.map((d) => (
                <label key={d.id} className="swatch" title={d.name}>
                  <input type="radio" name="dial" value={d.id} checked={dial === d.id} onChange={() => setDial(d.id)} />
                  <span className="swatch__dot" style={{ background: `radial-gradient(circle at 35% 30%, ${d.glow}, ${d.swatch})` }} />
                  <span className="sr-only">{d.name} dial</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="opt">
            <legend>
              Strap <span>{strapById(strap).name}</span>
            </legend>
            <div className="segs">
              {STRAPS.map((s) => (
                <label key={s.id} className="seg">
                  <input type="radio" name="strap" value={s.id} checked={strap === s.id} onChange={() => setStrap(s.id)} />
                  <span>
                    {s.short}
                    {s.surcharge > 0 && <small>+{money(s.surcharge)}</small>}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {SIZES.length > 1 && (
          <fieldset className="opt">
            <legend>
              Case <span>{size} mm</span>
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

          <button className={`btn btn--solid btn--wide ${added ? 'is-done' : ''}`} onClick={onAdd}>
            <span className="btn__label">{added ? 'Added to your bag' : `Add to bag — ${money(price)}`}</span>
          </button>
          <p className="config__note">30 days to return it unworn. Free delivery across the EU.</p>
        </div>
      </div>
    </section>
  );
}
