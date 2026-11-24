import { useEffect, useMemo, useRef, useState } from 'react';
import { COUNTRIES, SHIP_CUTOFF_HOUR } from '../data/product';
import { countryName, useI18n } from '../i18n';
import { addWorkingDays, deliveryWindow, sameDay } from '../lib/shipping';
import { Select } from './Select';

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export function Delivery() {
  const { t } = useI18n();
  const fmt = t.shortDate;
  const dayWord = (d: Date, now: Date) => (sameDay(d, now) ? t.delivery.today : sameDay(d, addDays(now, 1)) ? t.delivery.tomorrow : fmt(d));
  const countries = useMemo(
    () => [...COUNTRIES].sort((a, b) => countryName(t, a).localeCompare(countryName(t, b), t.locale)),
    [t],
  );
  const [country, setCountry] = useState('Bulgaria');
  const [open, setOpen] = useState<number | null>(0);
  const [run, setRun] = useState(0); // restarts the parcel animation
  const ref = useRef<HTMLElement>(null);

  const plan = useMemo(() => deliveryWindow(country), [country]);
  const zone = plan.zone;

  // play the parcel's trip the first time the section comes into view
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setRun((r) => (r === 0 ? 1 : r));
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const pick = (c: string) => {
    setCountry(c);
    setRun((r) => r + 1);
  };

  return (
    <section className="section delivery" id="delivery" ref={ref}>
      <div className="wrap delivery__wrap">
        <div className="delivery__head">
          <h2 className="h2">{t.delivery.title}</h2>
          <p className="lead">{t.delivery.lead(t.brand.street)}</p>
        </div>

        <div className="delivery__grid">
          {/* estimator */}
          <div className="eta">
            <div className="eta__top">
              <Select label={t.delivery.deliverTo} value={country} options={countries} format={(c) => countryName(t, c)} placeholder={t.common.choose} onChange={pick} />
              <p className="eta__fee">
                <span>{t.common.delivery}</span>
                <strong>{zone.fee ? t.money(zone.fee) : t.common.free}</strong>
              </p>
            </div>

            <p className="eta__when" aria-live="polite">
              {t.delivery.when(sameDay(plan.leaves, plan.now))}
              <strong>
                {fmt(plan.earliest)} – {fmt(plan.latest)}
              </strong>
            </p>

            <ol className={`route ${run ? 'is-run' : ''}`} key={run}>
              <span className="route__line" aria-hidden="true">
                <span className="route__fill" />
                <span className="route__parcel">
                  <svg viewBox="0 0 24 24">
                    <path d="M4 8l8-4 8 4v8l-8 4-8-4z M4 8l8 4 8-4 M12 12v8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  </svg>
                </span>
              </span>
              <li>
                <span className="route__dot" />
                <strong>{t.delivery.packed}</strong>
                <span>{dayWord(plan.leaves, plan.now)}</span>
              </li>
              <li>
                <span className="route__dot" />
                <strong>{t.delivery.courier}</strong>
                <span>{dayWord(addWorkingDays(plan.leaves, 1), plan.now)}</span>
              </li>
              <li>
                <span className="route__dot" />
                <strong>{t.delivery.door}</strong>
                <span>
                  {fmt(plan.earliest)} – {fmt(plan.latest)}
                </span>
              </li>
            </ol>

            <p className="eta__note">
              {zone.duties ? t.delivery.duties : t.delivery.cutoff(SHIP_CUTOFF_HOUR)}
            </p>
          </div>

          {/* promises */}
          <ul className="promises">
            <li>
              <span className="promises__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M3 6h11v9H3z M14 9h4l3 3v3h-7 M6.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M17.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
              </span>
              <strong className="promises__big">{t.delivery.promises[0].big}</strong>
              <span className="promises__title">{t.delivery.promises[0].title}</span>
              <span className="promises__body">{t.delivery.promises[0].body}</span>
            </li>
            <li>
              <span className="promises__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M4 12a8 8 0 1 0 2.4-5.7 M4 4v4h4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <strong className="promises__big">{t.delivery.promises[1].big}</strong>
              <span className="promises__title">{t.delivery.promises[1].title}</span>
              <span className="promises__body">{t.delivery.promises[1].body}</span>
            </li>
            <li>
              <span className="promises__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z M8.5 12l2.5 2.5 4.5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <strong className="promises__big">{t.delivery.promises[2].big}</strong>
              <span className="promises__title">{t.delivery.promises[2].title}</span>
              <span className="promises__body">{t.delivery.promises[2].body}</span>
            </li>
          </ul>
        </div>

        <div className="faq">
          {t.delivery.faq.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className={`faq__item ${isOpen ? 'is-open' : ''}`}>
                <h3>
                  <button className="faq__q" aria-expanded={isOpen} aria-controls={`faq-${i}`} id={`faq-q-${i}`} onClick={() => setOpen(isOpen ? null : i)}>
                    {f.q}
                    <span className="faq__icon" aria-hidden="true" />
                  </button>
                </h3>
                <div className="faq__a" id={`faq-${i}`} role="region" aria-labelledby={`faq-q-${i}`}>
                  <div>
                    <p>{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
