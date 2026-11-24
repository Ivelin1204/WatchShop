import { useI18n, type Lang } from '../i18n';

/** EN / BG toggle. Remembers the choice for the next visit. */
export function LangSwitch({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div className={`lang ${className}`} role="group" aria-label={t.lang.label}>
      {(['en', 'bg'] as Lang[]).map((l) => (
        <button key={l} type="button" lang={l} className={lang === l ? 'is-on' : ''} aria-pressed={lang === l} aria-label={t.lang[l]} onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
