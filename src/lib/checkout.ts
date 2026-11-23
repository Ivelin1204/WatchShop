import type { CartItem } from '../cart/CartContext';

export interface ShippingDetails {
  name: string;
  email: string;
  address: string;
  city: string;
  country: string;
}

export type CheckoutResult = { ok: true; redirectUrl: string } | { ok: false; reason: string };

/**
 * Payment integration point.
 *
 * Point CHECKOUT_ENDPOINT at your backend (e.g. a serverless function that
 * creates a Stripe Checkout Session and returns { url }). Until it is set,
 * the checkout form validates and tells the shopper payments are not live.
 */
const CHECKOUT_ENDPOINT: string | null = import.meta.env.VITE_CHECKOUT_ENDPOINT ?? null;

export async function startCheckout(items: CartItem[], shipping: ShippingDetails): Promise<CheckoutResult> {
  if (!CHECKOUT_ENDPOINT) {
    return { ok: false, reason: 'Online payment is not connected yet. Write to us and we will reserve your watch.' };
  }
  try {
    const res = await fetch(CHECKOUT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, shipping }),
    });
    if (!res.ok) return { ok: false, reason: 'The payment page could not be opened. Please try again.' };
    const data = (await res.json()) as { url?: string };
    return data.url ? { ok: true, redirectUrl: data.url } : { ok: false, reason: 'The payment page could not be opened.' };
  } catch {
    return { ok: false, reason: 'No connection. Check your internet and try again.' };
  }
}
