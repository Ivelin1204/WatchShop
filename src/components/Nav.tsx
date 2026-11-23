import { useEffect, useState } from 'react';
import { useCart } from '../cart/CartContext';
import { BRAND } from '../data/product';

const LINKS = [
  { href: '#buy', label: 'The watch' },
  { href: '#details', label: 'Details' },
  { href: '#movement', label: 'Movement' },
  { href: '#delivery', label: 'Delivery' },
];

export function Nav() {
  const { count, setOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);
  const [menu, setMenu] = useState(false);

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
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [menu]);

  return (
    <header className={`nav ${scrolled ? 'is-scrolled' : ''} ${dark && !menu ? 'is-dark' : ''} ${menu ? 'is-menu' : ''}`}>
      <div className="wrap nav__row">
        <a className="nav__logo" href="#top" aria-label={`${BRAND.name}, back to top`} onClick={() => setMenu(false)}>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="nav__mark">
            <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 12V5.5M12 12l4.2 2.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="12" r="1.4" fill="var(--accent)" />
          </svg>
          <span>{BRAND.name}</span>
        </a>

        <nav className="nav__links" aria-label="Main">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="link">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="nav__end">
          <button className="nav__bag" onClick={() => setOpen(true)} aria-label={`Open bag, ${count} ${count === 1 ? 'item' : 'items'}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 8h14l-1.2 12H6.2L5 8Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M9 8V6.5a3 3 0 0 1 6 0V8" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            <span>Bag</span>
            <span className={`nav__count ${count ? 'is-on' : ''}`} key={count}>
              {count}
            </span>
          </button>
          <button
            className="nav__burger"
            aria-expanded={menu}
            aria-controls="mobile-menu"
            aria-label={menu ? 'Close menu' : 'Open menu'}
            onClick={() => setMenu((m) => !m)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      <div id="mobile-menu" className="mmenu" hidden={!menu}>
        <nav className="wrap mmenu__links" aria-label="Mobile">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMenu(false)}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
