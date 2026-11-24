import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

interface Props {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  error?: string;
  /** how a value is shown (e.g. a country key in the visitor's language) */
  format?: (v: string) => string;
  placeholder?: string;
}

/** Custom listbox with full keyboard support (arrows, Home/End, type-ahead, Esc). */
export function Select({ label, value, options, onChange, error, format = (v) => v, placeholder = 'Choose…' }: Props) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(Math.max(0, options.indexOf(value)));
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: '', t: 0 });

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!btn.current?.parentElement?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    list.current?.focus();
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const choose = (i: number) => {
    onChange(options[i]);
    setOpen(false);
    btn.current?.focus();
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') setActive((a) => Math.min(options.length - 1, a + 1));
    else if (e.key === 'ArrowUp') setActive((a) => Math.max(0, a - 1));
    else if (e.key === 'Home') setActive(0);
    else if (e.key === 'End') setActive(options.length - 1);
    else if (e.key === 'Enter' || e.key === ' ') choose(active);
    else if (e.key === 'Escape' || e.key === 'Tab') {
      e.stopPropagation(); // keep Esc from also closing the drawer
      setOpen(false);
      if (e.key === 'Escape') btn.current?.focus();
      return;
    } else if (e.key.length === 1) {
      const now = Date.now();
      typed.current.text = (now - typed.current.t > 600 ? '' : typed.current.text) + e.key.toLowerCase();
      typed.current.t = now;
      const i = options.findIndex((o) => format(o).toLowerCase().startsWith(typed.current.text));
      if (i >= 0) setActive(i);
    } else return;
    e.preventDefault();
  };

  return (
    <div className={`field select ${open ? 'is-open' : ''} ${error ? 'has-error' : ''}`}>
      <span className="field__label" id={`${uid}-l`}>
        {label}
      </span>
      <button
        ref={btn}
        type="button"
        className="select__btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${uid}-l ${uid}-v`}
        onClick={() => {
          setActive(Math.max(0, options.indexOf(value)));
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span id={`${uid}-v`}>{value ? format(value) : placeholder}</span>
        <svg viewBox="0 0 12 8" aria-hidden="true">
          <path d="M1 1.5 6 6.5l5-5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      {open && (
        <ul
          ref={list}
          className="select__list"
          role="listbox"
          tabIndex={-1}
          aria-labelledby={`${uid}-l`}
          aria-activedescendant={`${uid}-o${active}`}
          onKeyDown={onKey}
        >
          {options.map((o, i) => (
            <li
              key={o}
              id={`${uid}-o${i}`}
              data-i={i}
              role="option"
              aria-selected={o === value}
              className={i === active ? 'is-active' : ''}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(i)}
            >
              {format(o)}
            </li>
          ))}
        </ul>
      )}
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}
