import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { bg } from './bg';
import { en, type Dict } from './en';

export type Lang = 'en' | 'bg';

const DICTS: Record<Lang, Dict> = { en, bg };
const KEY = 'merid.lang';

/** Saved choice first, then the browser's language, then English. */
function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'en' || saved === 'bg') return saved;
  } catch {
    /* storage can be blocked; fall through */
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('bg') ? 'bg' : 'en';
}

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}

const LangContext = createContext<Ctx>({ lang: 'en', setLang: () => {}, t: en });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const t = DICTS[lang];

  useEffect(() => {
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      /* not saved; the switch still works for this visit */
    }
    document.documentElement.lang = lang;
    // the checkout page sets its own title
    document.title = window.location.hash === '#checkout' ? t.meta.checkout : t.meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.meta.description);
  }, [lang, t]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useI18n = () => useContext(LangContext);

/** A country's name in the current language (shipping data keeps English keys). */
export const countryName = (t: Dict, country: string) => t.countries[country] ?? country;
