import { DIALS, REVIEWS, dialById, type Review } from '../data/product';
import { useI18n } from '../i18n';


function Stars({ value, size = 18 }: { value: number; size?: number }) {
  const { t } = useI18n();
  return (
    <span className="stars" role="img" aria-label={t.reviews.stars(t.reviews.decimal(value).replace(/[.,]0$/, ''))} style={{ height: size }}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <svg key={i} viewBox="0 0 20 20" width={size} height={size} aria-hidden="true">
            <defs>
              <linearGradient id={`star-${i}-${Math.round(fill * 100)}`}>
                <stop offset={fill} stopColor="var(--accent)" />
                <stop offset={fill} stopColor="currentColor" stopOpacity="0.18" />
              </linearGradient>
            </defs>
            <path
              d="M10 1.8l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.7l-5.1 2.8L6 11.8l-4.3-4 5.8-.7z"
              fill={`url(#star-${i}-${Math.round(fill * 100)})`}
            />
          </svg>
        );
      })}
    </span>
  );
}

/** Reviews: a rating summary and three cards. Sample entries are labelled as such. */
export function Reviews() {
  const { t } = useI18n();
  if (!REVIEWS.length) return null;
  const avg = REVIEWS.reduce((n, r) => n + r.rating, 0) / REVIEWS.length;
  const anySample = REVIEWS.some((r) => r.sample);
  const counts = [5, 4, 3, 2, 1].map((star) => ({ star, n: REVIEWS.filter((r) => r.rating === star).length }));

  return (
    <section className="section reviews" id="reviews" aria-labelledby="reviews-title">
      <div className="wrap reviews__wrap">
        <div className="reviews__head">
          <div>
            <h2 className="h2" id="reviews-title">
              {t.reviews.title}
            </h2>
            {anySample && (
              <p className="reviews__sample-note">
                <span className="sample-tag">{t.reviews.sample}</span>
                {t.reviews.sampleNote}
              </p>
            )}
          </div>

          <div className="reviews__summary">
            <p className="reviews__avg">{t.reviews.decimal(avg)}</p>
            <div>
              <Stars value={avg} size={20} />
              <p className="reviews__count">
                {t.reviews.count(REVIEWS.length)}
              </p>
            </div>
            <ul className="reviews__bars" aria-label={t.reviews.breakdown}>
              {counts.map((c) => (
                <li key={c.star}>
                  <span>{c.star}</span>
                  <span className="reviews__bar" aria-hidden="true">
                    <span style={{ transform: `scaleX(${c.n / REVIEWS.length})` }} />
                  </span>
                  <span className="reviews__n">{c.n}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ul className="reviews__row">
          {REVIEWS.slice(0, 3).map((r, i) => (
            <ReviewCard key={i} r={r} i={i} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function ReviewCard({ r, i }: { r: Review; i: number }) {
  const { t } = useI18n();
  const dial = dialById(r.dial) ?? DIALS[0];
  // sample copy is translated; a real review keeps the customer's own words
  const words = r.sample && t.reviews.items[i] ? t.reviews.items[i] : r;
  return (
    <li className="review">
      <div className="review__top">
        <Stars value={r.rating} />
        {r.sample ? <span className="sample-tag">{t.reviews.sample}</span> : r.verified ? <span className="review__verified">{t.reviews.verified}</span> : null}
      </div>
      <h3 className="review__title">{words.title}</h3>
      <p className="review__body">{words.body}</p>
      <div className="review__who">
        <span className="review__avatar" aria-hidden="true">
          {words.name
            .split(' ')
            .map((w) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
        </span>
        <div>
          <p className="review__name">
            {words.name}, {words.city}
          </p>
          <p className="review__meta">
            <span className="review__dial" style={{ background: `radial-gradient(circle at 35% 30%, ${dial.glow}, ${dial.swatch})` }} aria-hidden="true" />
            {t.reviews.meta(t.dials[dial.id], t.longDate(new Date(r.date)))}
          </p>
        </div>
      </div>
    </li>
  );
}
