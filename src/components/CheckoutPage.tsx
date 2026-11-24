import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useCart } from '../cart/CartContext';
import { BRAND, COUNTRIES, MODEL, dialById, strapById } from '../data/product';
import { startCheckout, type CheckoutFailure, type ShippingDetails } from '../lib/checkout';
import { countryName, useI18n } from '../i18n';
import { goTo } from '../lib/route';
import { deliveryWindow } from '../lib/shipping';
import { LangSwitch } from './LangSwitch';
import { LogoMark } from './Logo';
import { Select } from './Select';
import { WatchFace } from './watch/WatchFace';

type Errors = Partial<Record<keyof ShippingDetails, true>>;

const EMPTY: ShippingDetails = { name: '', email: '', address: '', city: '', country: 'Bulgaria' };

function validate(d: ShippingDetails): Errors {
  const e: Errors = {};
  if (d.name.trim().length < 2) e.name = true;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) e.email = true;
  if (d.address.trim().length < 4) e.address = true;
  if (d.city.trim().length < 2) e.city = true;
  if (!d.country) e.country = true;
  return e;
}

/** Full-page checkout: delivery details on the left, the order on the right. */
export function CheckoutPage() {
  const { items, subtotal, setQty, remove } = useCart();
  const [form, setForm] = useState<ShippingDetails>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<CheckoutFailure | null>(null);
  const { t } = useI18n();
  const money = t.money;
  const err = (k: keyof ShippingDetails) => (errors[k] ? t.checkout.errors[k] : undefined);
  // countries in the visitor's language, in that language's alphabetical order
  const countries = useMemo(
    () => [...COUNTRIES].sort((a, b) => countryName(t, a).localeCompare(countryName(t, b), t.locale)),
    [t],
  );
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
  }, []);

  useEffect(() => {
    document.title = t.meta.checkout;
    return () => {
      document.title = t.meta.title;
    };
  }, [t]);

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
          <a className="nav__logo" href="#top" onClick={(e) => (e.preventDefault(), goTo('shop'))} aria-label={t.checkout.home(BRAND.name)}>
            <LogoMark className="nav__mark" />
            <span>{BRAND.name}</span>
          </a>
          <ol className="co__steps" aria-label={t.checkout.steps}>
            <li className="is-done">
              <span aria-hidden="true">1</span>
              {t.checkout.bag}
            </li>
            <li className="is-now" aria-current="step">
              <span aria-hidden="true">2</span>
              {t.checkout.delivery}
            </li>
            <li>
              <span aria-hidden="true">3</span>
              {t.checkout.payment}
            </li>
          </ol>
          <div className="co__end">
            <LangSwitch />
          <button className="co__back link" onClick={() => goTo('shop')}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M13 8H3M7 4L3 8l4 4" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            {t.checkout.back}
          </button>
          </div>
        </div>
      </header>

      <main className="wrap co__main" id="main">
        <h1 className="co__title" ref={heading} tabIndex={-1}>
          {t.checkout.title}
        </h1>

        {items.length === 0 ? (
          <div className="co__empty">
            <p>{t.checkout.empty}</p>
            <button className="btn btn--solid" onClick={() => goTo('shop')}>
              {t.common.chooseWatch}
            </button>
          </div>
        ) : (
          <div className="co__grid">
            <form id="checkout" ref={formRef} className="co__form" onSubmit={submit} noValidate>
              <fieldset className="co__group">
                <legend>{t.checkout.contact}</legend>
                <Field label={t.checkout.name} name="name" value={form.name} onChange={update('name')} error={err('name')} autoComplete="name" />
                <Field label={t.checkout.email} name="email" type="email" value={form.email} onChange={update('email')} error={err('email')} autoComplete="email" hint={t.checkout.emailHint} />
              </fieldset>

              <fieldset className="co__group">
                <legend>{t.checkout.address}</legend>
                <Field label={t.checkout.street} name="address" value={form.address} onChange={update('address')} error={err('address')} autoComplete="street-address" />
                <div className="co__row">
                  <Field label={t.checkout.city} name="city" value={form.city} onChange={update('city')} error={err('city')} autoComplete="address-level2" />
                  <Select
                    label={t.checkout.country}
                    value={form.country}
                    options={countries}
                    format={(c) => countryName(t, c)}
                    placeholder={t.common.choose}
                    onChange={update('country')}
                    error={err('country')}
                  />
                </div>
              </fieldset>

              <div className="co__eta" aria-live="polite">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 6h11v9H3z M14 9h4l3 3v3h-7 M6.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M17.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
                <div>
                  <strong>{t.checkout.arrives(t.shortDate(eta.earliest), t.shortDate(eta.latest))}</strong>
                  <span>{t.checkout.insured(!!fee)}</span>
                </div>
                <b>{fee ? money(fee) : t.common.free}</b>
              </div>
            </form>

            <aside className="co__summary" aria-label={t.checkout.order}>
              <h2>
                {t.checkout.order} <span>{t.checkout.watches(count)}</span>
              </h2>
              <ul className="co__lines">
                {items.map((i) => (
                  <li key={i.key}>
                    <div className="line__thumb">
                      <WatchFace dial={i.dial} strap={i.strap} size={i.size} view="head" live={false} title={t.dialLabel(t.dials[dialById(i.dial).id])} />
                    </div>
                    <div>
                      <p className="line__name">
                        {MODEL.short} · {t.dials[dialById(i.dial).id]}
                      </p>
                      <p className="line__meta">{t.straps[strapById(i.strap).id].name}</p>
                      {i.engraving && <p className="line__meta line__engr">{t.common.engraved(i.engraving)}</p>}
                      <div className="qty">
                        <button type="button" onClick={() => setQty(i.key, i.qty - 1)} aria-label={t.common.fewer(`${MODEL.short} ${t.dials[dialById(i.dial).id]}`)}>
                          −
                        </button>
                        <span aria-live="polite">{i.qty}</span>
                        <button type="button" onClick={() => setQty(i.key, i.qty + 1)} aria-label={t.common.more(`${MODEL.short} ${t.dials[dialById(i.dial).id]}`)} disabled={i.qty >= 5}>
                          +
                        </button>
                      </div>
                    </div>
                    <div className="line__end">
                      <p>{money(i.unitPrice * i.qty)}</p>
                      <button type="button" className="link link--small" onClick={() => remove(i.key)}>
                        {t.common.remove}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <dl className="co__totals">
                <div>
                  <dt>{t.common.subtotal}</dt>
                  <dd>{money(subtotal)}</dd>
                </div>
                <div>
                  <dt>{t.checkout.deliveryTo(countryName(t, form.country))}</dt>
                  <dd>{fee ? money(fee) : t.common.free}</dd>
                </div>
                <div className="co__total">
                  <dt>{t.checkout.total}</dt>
                  <dd>{money(total)}</dd>
                </div>
              </dl>
              <p className="co__vat">{t.checkout.vat}</p>
              <button type="submit" form="checkout" className="btn btn--solid btn--wide" disabled={busy}>
                {busy ? t.checkout.busy : t.checkout.pay(money(total))}
              </button>
              {notice && (
                <p className="checkout__notice" role="status">
                  {t.checkout.reasons[notice]} {t.checkout.reserve(BRAND.email)}
                </p>
              )}
              <ul className="co__trust">
                {t.checkout.trust.map((line) => (
                  <li key={line}>{line}</li>
                ))}
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
