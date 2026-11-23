import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useCart } from '../cart/CartContext';
import { BRAND, dialById, strapById } from '../data/product';
import { startCheckout, type ShippingDetails } from '../lib/checkout';
import { money } from '../lib/format';
import { Select } from './Select';
import { WatchFace } from './watch/WatchFace';

const COUNTRIES = [
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia', 'Denmark', 'Estonia', 'Finland', 'France',
  'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands',
  'Norway', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'United Kingdom',
];

type Step = 'bag' | 'details';
type Errors = Partial<Record<keyof ShippingDetails, string>>;

const EMPTY: ShippingDetails = { name: '', email: '', address: '', city: '', country: 'Bulgaria' };

function validate(d: ShippingDetails): Errors {
  const e: Errors = {};
  if (d.name.trim().length < 2) e.name = 'Enter your full name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) e.email = 'Enter an email like name@domain.com.';
  if (d.address.trim().length < 4) e.address = 'Enter the street and number.';
  if (d.city.trim().length < 2) e.city = 'Enter your town or city.';
  if (!d.country) e.country = 'Choose a country.';
  return e;
}

export function CartDrawer() {
  const { items, subtotal, open, setOpen, setQty, remove } = useCart();
  const [step, setStep] = useState<Step>('bag');
  const [form, setForm] = useState<ShippingDetails>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
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

  useEffect(() => {
    if (!open) {
      setStep('bag');
      setNotice(null);
    }
  }, [open]);

  useEffect(() => {
    if (!items.length) setStep('bag');
  }, [items.length]);

  const update = (k: keyof ShippingDetails) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    setNotice(null);
    if (Object.keys(found).length) {
      const firstKey = Object.keys(found)[0];
      panel.current?.querySelector<HTMLElement>(`[name="${firstKey}"]`)?.focus();
      return;
    }
    setBusy(true);
    const res = await startCheckout(items, form);
    setBusy(false);
    if (res.ok) window.location.href = res.redirectUrl;
    else setNotice(res.reason);
  };

  return (
    <div className={`drawer ${open ? 'is-open' : ''}`} aria-hidden={!open} inert={!open}>
      <div className="drawer__scrim" onClick={() => setOpen(false)} />
      <div ref={panel} className="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title" tabIndex={-1} data-autofocus>
        <div className="drawer__head">
          <h2 id="drawer-title">{step === 'bag' ? 'Your bag' : 'Delivery details'}</h2>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close bag">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </div>

        {step === 'bag' && (
          <>
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
                        Meridian {i.size} · {dialById(i.dial).name}
                      </p>
                      <p className="line__meta">{strapById(i.strap).name}</p>
                      <div className="qty">
                        <button onClick={() => setQty(i.key, i.qty - 1)} aria-label={`One fewer ${dialById(i.dial).name} Meridian`}>
                          −
                        </button>
                        <span aria-live="polite">{i.qty}</span>
                        <button onClick={() => setQty(i.key, i.qty + 1)} aria-label={`One more ${dialById(i.dial).name} Meridian`} disabled={i.qty >= 5}>
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
          </>
        )}

        {step === 'details' && (
          <form id="checkout" className="checkout" onSubmit={submit} noValidate>
            <Field label="Full name" name="name" value={form.name} onChange={update('name')} error={errors.name} autoComplete="name" />
            <Field label="Email" name="email" type="email" value={form.email} onChange={update('email')} error={errors.email} autoComplete="email" />
            <Field label="Street and number" name="address" value={form.address} onChange={update('address')} error={errors.address} autoComplete="street-address" />
            <div className="checkout__row">
              <Field label="Town or city" name="city" value={form.city} onChange={update('city')} error={errors.city} autoComplete="address-level2" />
              <Select label="Country" value={form.country} options={COUNTRIES} onChange={update('country')} error={errors.country} />
            </div>
            {notice && (
              <p className="checkout__notice" role="status">
                {notice}{' '}
                <a className="link" href={`mailto:${BRAND.email}?subject=Meridian order`}>
                  Write to us
                </a>
              </p>
            )}
          </form>
        )}

        {items.length > 0 && (
          <div className="drawer__foot">
            <div className="sum">
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <div className="sum sum--muted">
              <span>Delivery</span>
              <span>Free in the EU</span>
            </div>
            {step === 'bag' ? (
              <button className="btn btn--solid btn--wide" onClick={() => setStep('details')}>
                Continue to delivery
              </button>
            ) : (
              <div className="drawer__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setStep('bag')}>
                  Back to bag
                </button>
                <button type="submit" form="checkout" className="btn btn--solid" disabled={busy}>
                  {busy ? 'Opening payment…' : 'Continue to payment'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  name: keyof ShippingDetails;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
}

function Field({ label, name, value, onChange, error, type = 'text', autoComplete }: FieldProps) {
  const id = `f-${name}`;
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
      />
      {error && (
        <span className="field__error" id={`${id}-err`}>
          {error}
        </span>
      )}
    </div>
  );
}
