import { useEffect, useState } from 'react';
import { useCart } from '../cart/CartContext';
import { BRAND } from '../data/product';
import { useI18n } from '../i18n';
import { LangSwitch } from './LangSwitch';
import { LogoMark } from './Logo';

const HREFS = ['#buy', '#details', '#movement', '#delivery'];

export function Nav() {
  const { count, setOpen } = useCart();
  const { t } = useI18n();
  const LINKS = HREFS.map((href, i) => ({ href, label: t.nav.links[i] }));
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);
  const [menu, setMenu] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const on = () => {
      setScrolled(window.scrollY > 24);
      // switch to the dark bar while the dark movement band sits under it
      const band = document.getElementById('movement')?.getBoundingClientRect();
      const mid = 36;
      setDark(!!band && band.top <= mid && band.bottom >= mid);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('no-scroll', menu);
    if (!menu) return;
    // mark the section that fills the middle of the screen right now
    const mid = window.innerHeight / 2;
    const hit = HREFS.find((href) => {
      const r = document.querySelector(href)?.getBoundingClientRect();
      return r && r.top <= mid && r.bottom >= mid;
    });
    setActive(hit ?? null);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [menu]);

  return (
    <>
    <header className={`nav ${scrolled ? 'is-scrolled' : ''} ${dark && !menu ? 'is-dark' : ''} ${menu ? 'is-menu' : ''}`}>
      <div className="wrap nav__row">
        <a className="nav__logo" href="#top" aria-label={t.nav.home(BRAND.name)} onClick={() => setMenu(false)}>
          <LogoMark className="nav__mark" />
          <span>{BRAND.name}</span>
        </a>

        <nav className="nav__links" aria-label={t.nav.main}>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="link">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="nav__end">
          <LangSwitch />
          <button className="nav__bag" onClick={() => setOpen(true)} aria-label={t.nav.bag(count)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 8h14l-1.2 12H6.2L5 8Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M9 8V6.5a3 3 0 0 1 6 0V8" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            <span className={`nav__count ${count ? 'is-on' : ''}`} key={count} aria-hidden="true">
              {count}
            </span>
          </button>
          <button
            className="nav__burger"
            aria-expanded={menu}
            aria-controls="mobile-menu"
            aria-label={menu ? t.nav.closeMenu : t.nav.openMenu}
            onClick={() => setMenu((m) => !m)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

    </header>

      {/* The menu panel lives outside <header> on purpose: once scrolled, the header
          gets backdrop-filter, which makes it the containing block for position: fixed
          children, so a panel inside it would be squeezed into the 72 px bar. */}
      <div id="mobile-menu" className={`mmenu ${menu ? 'is-open' : ''}`} aria-hidden={!menu} inert={!menu}>
        <nav className="wrap mmenu__links" aria-label={t.nav.mobile}>
          {LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenu(false)}
              className={active === l.href ? 'is-current' : ''}
              aria-current={active === l.href ? 'location' : undefined}
              style={{ transitionDelay: menu ? `${80 + i * 60}ms` : '0ms' }}
            >
              {l.label}
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </a>
          ))}
        </nav>
        <div className="wrap mmenu__foot" style={{ transitionDelay: menu ? '340ms' : '0ms' }}>
          <p>{t.nav.menuFoot}</p>
        </div>
      </div>
    </>
  );
}
