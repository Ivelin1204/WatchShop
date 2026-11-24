import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useCart } from '../cart/CartContext';
import { BRAND, COUNTRIES, MODEL, dialById, strapById } from '../data/product';
import { startCheckout, type ShippingDetails } from '../lib/checkout';
import { money } from '../lib/format';
import { goTo } from '../lib/route';
import { deliveryWindow, shortDate } from '../lib/shipping';
import { LogoMark } from './Logo';
import { Select } from './Select';
import { WatchFace } from './watch/WatchFace';

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

/** Full-page checkout: delivery details on the left, the order on the right. */
export function CheckoutPage() {
  const { items, subtotal, setQty, remove } = useCart();
  const [form, setForm] = useState<ShippingDetails>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  const eta = useMemo(() => deliveryWindow(form.country), [form.country]);
  const fee = eta.zone.fee;
  const total = subtotal + (items.length ? fee : 0);
  const count = items.reduce((n, i) => n + i.qty, 0);

  // a new page: start at the top, with focus on its heading
  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
    const prev = document.title;
    document.title = `Checkout | ${BRAND.name}`;
    return () => {
      document.title = prev;
    };
  }, []);

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
      formRef.current?.querySelector<HTMLElement>(`[name="${Object.keys(found)[0]}"]`)?.focus();
      return;
    }
    setBusy(true);
    const res = await startCheckout(items, form);
    setBusy(false);
    if (res.ok) window.location.href = res.redirectUrl;
    else setNotice(res.reason);
  };

  return (
    <div className="co">
      <header className="co__bar">
        <div className="wrap co__bar-row">
          <a className="nav__logo" href="#top" onClick={(e) => (e.preventDefault(), goTo('shop'))} aria-label={`${BRAND.name}, back to the shop`}>
            <LogoMark className="nav__mark" />
            <span>{BRAND.name}</span>
          </a>
          <ol className="co__steps" aria-label="Checkout steps">
            <li className="is-done">
              <span aria-hidden="true">1</span>Bag
            </li>
            <li className="is-now" aria-current="step">
              <span aria-hidden="true">2</span>Delivery
            </li>
            <li>
              <span aria-hidden="true">3</span>Payment
            </li>
          </ol>
          <button className="co__back link" onClick={() => goTo('shop')}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M13 8H3M7 4L3 8l4 4" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            Back to shop
          </button>
        </div>
      </header>

      <main className="wrap co__main" id="main">
        <h1 className="co__title" ref={heading} tabIndex={-1}>
          Delivery details
        </h1>

        {items.length === 0 ? (
          <div className="co__empty">
            <p>Your bag is empty, so there is nothing to deliver yet.</p>
            <button className="btn btn--solid" onClick={() => goTo('shop')}>
              Choose a watch
            </button>
          </div>
        ) : (
          <div className="co__grid">
            <form id="checkout" ref={formRef} className="co__form" onSubmit={submit} noValidate>
              <fieldset className="co__group">
                <legend>Contact</legend>
                <Field label="Full name" name="name" value={form.name} onChange={update('name')} error={errors.name} autoComplete="name" />
                <Field label="Email" name="email" type="email" value={form.email} onChange={update('email')} error={errors.email} autoComplete="email" hint="We send the tracking link here." />
              </fieldset>

              <fieldset className="co__group">
                <legend>Delivery address</legend>
                <Field label="Street and number" name="address" value={form.address} onChange={update('address')} error={errors.address} autoComplete="street-address" />
                <div className="co__row">
                  <Field label="Town or city" name="city" value={form.city} onChange={update('city')} error={errors.city} autoComplete="address-level2" />
                  <Select label="Country" value={form.country} options={COUNTRIES} onChange={update('country')} error={errors.country} />
                </div>
              </fieldset>

              <div className="co__eta" aria-live="polite">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 6h11v9H3z M14 9h4l3 3v3h-7 M6.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M17.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
                <div>
                  <strong>
                    Arrives {shortDate.format(eta.earliest)} – {shortDate.format(eta.latest)}
                  </strong>
                  <span>
                    Insured, tracked and signed for{fee ? `. Import duties are collected by the courier.` : '.'}
                  </span>
                </div>
                <b>{fee ? money(fee) : 'Free'}</b>
              </div>
            </form>

            <aside className="co__summary" aria-label="Your order">
              <h2>
                Your order <span>{count === 1 ? '1 watch' : `${count} watches`}</span>
              </h2>
              <ul className="co__lines">
                {items.map((i) => (
                  <li key={i.key}>
                    <div className="line__thumb">
                      <WatchFace dial={i.dial} strap={i.strap} size={i.size} view="head" live={false} title={`${dialById(i.dial).name} dial`} />
                    </div>
                    <div>
                      <p className="line__name">
                        {MODEL.short} · {dialById(i.dial).name}
                      </p>
                      <p className="line__meta">{strapById(i.strap).name}</p>
                      <div className="qty">
                        <button type="button" onClick={() => setQty(i.key, i.qty - 1)} aria-label={`One fewer ${dialById(i.dial).name} ${MODEL.short}`}>
                          −
                        </button>
                        <span aria-live="polite">{i.qty}</span>
                        <button type="button" onClick={() => setQty(i.key, i.qty + 1)} aria-label={`One more ${dialById(i.dial).name} ${MODEL.short}`} disabled={i.qty >= 5}>
                          +
                        </button>
                      </div>
                    </div>
                    <div className="line__end">
                      <p>{money(i.unitPrice * i.qty)}</p>
                      <button type="button" className="link link--small" onClick={() => remove(i.key)}>
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <dl className="co__totals">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{money(subtotal)}</dd>
                </div>
                <div>
                  <dt>Delivery to {form.country}</dt>
                  <dd>{fee ? money(fee) : 'Free'}</dd>
                </div>
                <div className="co__total">
                  <dt>Total</dt>
                  <dd>{money(total)}</dd>
                </div>
              </dl>
              <p className="co__vat">Prices include VAT.</p>
              <button type="submit" form="checkout" className="btn btn--solid btn--wide" disabled={busy}>
                {busy ? 'Opening payment…' : `Continue to payment · ${money(total)}`}
              </button>
              {notice && (
                <p className="checkout__notice" role="status">
                  {notice} Email us at {BRAND.email} and we will reserve your watch.
                </p>
              )}
              <ul className="co__trust">
                <li>30 days to return it unworn</li>
                <li>5-year warranty on the movement</li>
              </ul>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

interface FieldProps {
  label: string;
  name: keyof ShippingDetails;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  type?: string;
  autoComplete?: string;
}

function Field({ label, name, value, onChange, error, hint, type = 'text', autoComplete }: FieldProps) {
  const id = `f-${name}`;
  const described = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <input id={id} name={name} type={type} value={value} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={described} />
      {hint && !error && (
        <span className="field__hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
      {error && (
        <span className="field__error" id={`${id}-err`}>
          {error}
        </span>
      )}
    </div>
  );
}
