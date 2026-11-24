import { useEffect, useMemo, useRef, useState } from 'react';
import { BRAND, COUNTRIES, FAQ, MODEL, SHIP_CUTOFF_HOUR } from '../data/product';
import { addWorkingDays, deliveryWindow, sameDay, shortDate } from '../lib/shipping';
import { Select } from './Select';

const fmt = shortDate;
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const dayWord = (d: Date, now: Date) => (sameDay(d, now) ? 'Today' : sameDay(d, addDays(now, 1)) ? 'Tomorrow' : fmt.format(d));

export function Delivery() {
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
          <h2 className="h2">Delivery, returns and the warranty.</h2>
          <p className="lead">
            Every {MODEL.short} leaves our workshop on {BRAND.street} insured, tracked and signed for. Pick your country to see when
            it reaches you.
          </p>
        </div>

        <div className="delivery__grid">
          {/* estimator */}
          <div className="eta">
            <div className="eta__top">
              <Select label="Deliver to" value={country} options={COUNTRIES} onChange={pick} />
              <p className="eta__fee">
                <span>Delivery</span>
                <strong>{zone.fee ? `€${zone.fee}` : 'Free'}</strong>
              </p>
            </div>

            <p className="eta__when" aria-live="polite">
              Order {sameDay(plan.leaves, plan.now) ? 'today' : 'now'}, it arrives
              <strong>
                {fmt.format(plan.earliest)} – {fmt.format(plan.latest)}
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
                <strong>Packed in Sofia</strong>
                <span>{dayWord(plan.leaves, plan.now)}</span>
              </li>
              <li>
                <span className="route__dot" />
                <strong>With the courier</strong>
                <span>{dayWord(addWorkingDays(plan.leaves, 1), plan.now)}</span>
              </li>
              <li>
                <span className="route__dot" />
                <strong>At your door</strong>
                <span>
                  {fmt.format(plan.earliest)} – {fmt.format(plan.latest)}
                </span>
              </li>
            </ol>

            <p className="eta__note">
              {zone.duties
                ? 'Outside the EU, import duties are collected by the courier on delivery.'
                : `Orders before ${SHIP_CUTOFF_HOUR}:00 on a working day leave the same day.`}
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
              <strong className="promises__big">Free</strong>
              <span className="promises__title">delivery across the EU</span>
              <span className="promises__body">Insured, tracked and signed for.</span>
            </li>
            <li>
              <span className="promises__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M4 12a8 8 0 1 0 2.4-5.7 M4 4v4h4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <strong className="promises__big">30 days</strong>
              <span className="promises__title">to change your mind</span>
              <span className="promises__body">Send it back unworn in its box for a full refund.</span>
            </li>
            <li>
              <span className="promises__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z M8.5 12l2.5 2.5 4.5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <strong className="promises__big">5 years</strong>
              <span className="promises__title">on the movement</span>
              <span className="promises__body">If it stops keeping time, we service it free.</span>
            </li>
          </ul>
        </div>

        <div className="faq">
          {FAQ.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className={`faq__item ${isOpen ? 'is-open' : ''}`}>
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
