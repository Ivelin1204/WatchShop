import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { priceFor, type DialId, type SizeId, type StrapId } from '../data/product';

export interface CartItem {
  key: string;
  dial: DialId;
  strap: StrapId;
  size: SizeId;
  qty: number;
  unitPrice: number;
}

type Action =
  | { type: 'add'; dial: DialId; strap: StrapId; size: SizeId }
  | { type: 'qty'; key: string; qty: number }
  | { type: 'remove'; key: string }
  | { type: 'clear' };

const STORAGE_KEY = 'merid.cart.v2'; // v2: chronograph line-up
const MAX_QTY = 5;

function reducer(items: CartItem[], a: Action): CartItem[] {
  switch (a.type) {
    case 'add': {
      const key = `${a.dial}-${a.strap}-${a.size}`;
      const found = items.find((i) => i.key === key);
      if (found) return items.map((i) => (i.key === key ? { ...i, qty: Math.min(MAX_QTY, i.qty + 1) } : i));
      return [...items, { key, dial: a.dial, strap: a.strap, size: a.size, qty: 1, unitPrice: priceFor(a.strap) }];
    }
    case 'qty':
      return a.qty <= 0
        ? items.filter((i) => i.key !== a.key)
        : items.map((i) => (i.key === a.key ? { ...i, qty: Math.min(MAX_QTY, a.qty) } : i));
    case 'remove':
      return items.filter((i) => i.key !== a.key);
    case 'clear':
      return [];
  }
}

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface CartValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (dial: DialId, strap: StrapId, size: SizeId) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const CartCtx = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(reducer, undefined, load);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage can be unavailable (private mode, sandboxed frames) */
    }
  }, [items]);

  const add = useCallback((dial: DialId, strap: StrapId, size: SizeId) => dispatch({ type: 'add', dial, strap, size }), []);
  const setQty = useCallback((key: string, qty: number) => dispatch({ type: 'qty', key, qty }), []);
  const remove = useCallback((key: string) => dispatch({ type: 'remove', key }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  const value = useMemo<CartValue>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      subtotal: items.reduce((n, i) => n + i.qty * i.unitPrice, 0),
      open,
      setOpen,
      add,
      setQty,
      remove,
      clear,
    }),
    [items, open, add, setQty, remove, clear],
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
