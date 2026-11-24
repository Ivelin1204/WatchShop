import { useEffect, useRef } from 'react';
import { useCart } from '../cart/CartContext';
import { MODEL, dialById, strapById } from '../data/product';
import { useI18n } from '../i18n';
import { goTo } from '../lib/route';
import { WatchFace } from './watch/WatchFace';


export function CartDrawer() {
  const { items, subtotal, open, setOpen, setQty, remove } = useCart();
  const { t } = useI18n();
  const money = t.money;
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
          <h2 id="drawer-title">{t.cart.title}</h2>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label={t.cart.close}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
              <div className="drawer__empty">
                <p>{t.cart.empty}</p>
                <a className="btn btn--ghost" href="#buy" onClick={() => setOpen(false)}>
                  {t.common.chooseWatch}
                </a>
              </div>
            ) : (
              <ul className="lines">
                {items.map((i) => (
                  <li key={i.key} className="line">
                    <div className="line__thumb">
                      <WatchFace dial={i.dial} strap={i.strap} size={i.size} view="head" live={false} title={t.dialLabel(t.dials[dialById(i.dial).id])} />
                    </div>
                    <div className="line__info">
                      <p className="line__name">
                        {MODEL.short} · {t.dials[dialById(i.dial).id]}
                      </p>
                      <p className="line__meta">{t.straps[strapById(i.strap).id].name}</p>
                      {i.engraving && <p className="line__meta line__engr">{t.common.engraved(i.engraving)}</p>}
                      <div className="qty">
                        <button onClick={() => setQty(i.key, i.qty - 1)} aria-label={t.common.fewer(`${MODEL.short} ${t.dials[dialById(i.dial).id]}`)}>
                          −
                        </button>
                        <span aria-live="polite">{i.qty}</span>
                        <button onClick={() => setQty(i.key, i.qty + 1)} aria-label={t.common.more(`${MODEL.short} ${t.dials[dialById(i.dial).id]}`)} disabled={i.qty >= 5}>
                          +
                        </button>
                      </div>
                    </div>
                    <div className="line__end">
                      <p>{money(i.unitPrice * i.qty)}</p>
                      <button className="link link--small" onClick={() => remove(i.key)}>
                        {t.common.remove}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

        {items.length > 0 && (
          <div className="drawer__foot">
            <div className="sum">
              <span>{t.common.subtotal}</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <div className="sum sum--muted">
              <span>{t.common.delivery}</span>
              <span>{t.cart.later}</span>
            </div>
            <button className="btn btn--solid btn--wide" onClick={checkout}>
              {t.cart.next}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
