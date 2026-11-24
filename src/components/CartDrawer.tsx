import { useEffect, useRef } from 'react';
import { useCart } from '../cart/CartContext';
import { MODEL, dialById, strapById } from '../data/product';
import { money } from '../lib/format';
import { goTo } from '../lib/route';
import { WatchFace } from './watch/WatchFace';


export function CartDrawer() {
  const { items, subtotal, open, setOpen, setQty, remove } = useCart();
  const panel = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  // focus management, Esc to close, simple focus trap
  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement;
    document.body.classList.add('no-scroll');
    const t = window.setTimeout(() => panel.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('button, a[href], input, [tabindex="0"]');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
      lastFocus.current?.focus();
    };
  }, [open, setOpen]);

  const checkout = () => {
    setOpen(false);
    goTo('checkout');
  };

  return (
    <div className={`drawer ${open ? 'is-open' : ''}`} aria-hidden={!open} inert={!open}>
      <div className="drawer__scrim" onClick={() => setOpen(false)} />
      <div ref={panel} className="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title" tabIndex={-1} data-autofocus>
        <div className="drawer__head">
          <h2 id="drawer-title">Your bag</h2>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close bag">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
              <div className="drawer__empty">
                <p>Your bag is empty.</p>
                <a className="btn btn--ghost" href="#buy" onClick={() => setOpen(false)}>
                  Choose a watch
                </a>
              </div>
            ) : (
              <ul className="lines">
                {items.map((i) => (
                  <li key={i.key} className="line">
                    <div className="line__thumb">
                      <WatchFace dial={i.dial} strap={i.strap} size={i.size} view="head" live={false} title={`${dialById(i.dial).name} dial`} />
                    </div>
                    <div className="line__info">
                      <p className="line__name">
                        {MODEL.short} · {dialById(i.dial).name}
                      </p>
                      <p className="line__meta">{strapById(i.strap).name}</p>
                      {i.engraving && <p className="line__meta line__engr">Engraved: “{i.engraving}”</p>}
                      <div className="qty">
                        <button onClick={() => setQty(i.key, i.qty - 1)} aria-label={`One fewer ${dialById(i.dial).name} ${MODEL.short}`}>
                          −
                        </button>
                        <span aria-live="polite">{i.qty}</span>
                        <button onClick={() => setQty(i.key, i.qty + 1)} aria-label={`One more ${dialById(i.dial).name} ${MODEL.short}`} disabled={i.qty >= 5}>
                          +
                        </button>
                      </div>
                    </div>
                    <div className="line__end">
                      <p>{money(i.unitPrice * i.qty)}</p>
                      <button className="link link--small" onClick={() => remove(i.key)}>
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

        {items.length > 0 && (
          <div className="drawer__foot">
            <div className="sum">
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <div className="sum sum--muted">
              <span>Delivery</span>
              <span>Worked out at the next step</span>
            </div>
            <button className="btn btn--solid btn--wide" onClick={checkout}>
              Continue to delivery
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
