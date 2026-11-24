/**
 * Everything the shop sells lives here. Change names, prices and specs in this
 * one file and the whole site follows.
 *
 * NOTE: the brand "Merid", the model, the specs and the prices are stand-ins.
 * Replace them with the client's real data before going live.
 */

export type DialId = 'slate' | 'midnight' | 'bone';
export type StrapId = 'bracelet' | 'leather' | 'rubber';
export type SizeId = '40';

export interface Dial {
  id: DialId;
  name: string;
  /** dial base colour */
  base: string;
  /** lighter centre of the sunburst */
  glow: string;
  /** sub-dial colour (tone on tone, a step darker than the dial) */
  sub: string;
  /** colour of printed text and tracks */
  print: string;
  /** colour used for the swatch button */
  swatch: string;
  /** light dials get dark markers, dark dials get polished steel */
  dark: boolean;
}

export interface Strap {
  id: StrapId;
  name: string;
  short: string;
  surcharge: number;
}

export interface Size {
  id: SizeId;
  name: string;
  /** render scale relative to the 40 mm case */
  scale: number;
}

export const BRAND = {
  name: 'Merid',
  legal: 'Merid Watch Co.',
  city: 'Sofia',
  street: 'Vitosha Boulevard',
  email: 'hello@merid.example',
};

export const MODEL = {
  name: 'Meridian Chronograph',
  short: 'Meridian',
  size: '40 mm',
  basePrice: 1190,
  currency: 'EUR',
  shipping: '2–4 working days',
};

export const DIALS: Dial[] = [
  { id: 'slate', name: 'Slate', base: '#33363B', glow: '#5E636A', sub: '#2A2D31', print: '#F1EEE7', swatch: '#45494F', dark: true },
  { id: 'midnight', name: 'Midnight', base: '#101C38', glow: '#2C4677', sub: '#0B1428', print: '#ECE7DD', swatch: '#1A2A4E', dark: true },
  { id: 'bone', name: 'Bone', base: '#E6DFD1', glow: '#F6F2EA', sub: '#D6CDBC', print: '#1A1C1F', swatch: '#E6DFD1', dark: false },
];

export const STRAPS: Strap[] = [
  { id: 'bracelet', name: 'Steel bracelet', short: 'Bracelet', surcharge: 100 },
  { id: 'leather', name: 'Tan leather', short: 'Leather', surcharge: 0 },
  { id: 'rubber', name: 'Black rubber', short: 'Rubber', surcharge: 0 },
];

export const SIZES: Size[] = [{ id: '40', name: '40 mm', scale: 1 }];

export const SPECS: { label: string; value: string }[] = [
  { label: 'Movement', value: 'Swiss automatic chronograph' },
  { label: 'Counters', value: 'Small seconds at 9, 30 minutes at 3' },
  { label: 'Crystal', value: 'Domed sapphire, anti-reflective inside' },
  { label: 'Date', value: 'At 6 o’clock, quick-set from the crown' },
  { label: 'Case', value: '316L steel, brushed with polished bevels' },
  { label: 'Water', value: '100 m, screw-down crown' },
];

export const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I use the chronograph?',
    a: 'Press the top pusher to start the orange hand, press it again to stop. The lower pusher sends the hand and the 30-minute counter back to zero.',
  },
  {
    q: 'Does it need a battery?',
    a: 'No. The movement winds itself as you wear it. Left off the wrist it runs for about 42 hours; after that, give the crown twenty turns or wear it again.',
  },
  {
    q: 'Can I size the bracelet myself?',
    a: 'Links come out with a small screwdriver, and the clasp has five micro-adjust holes. Or send us your wrist size with the order and we size it before it ships.',
  },
  {
    q: 'Do you ship outside the EU?',
    a: 'We ship to the UK, Switzerland and Norway for a flat €25. Import duties are paid by the buyer and collected by the courier.',
  },
];

/**
 * Customer reviews. The entries below are SAMPLES so the section can be
 * designed and previewed: the site labels them "Sample" until they are
 * replaced with real reviews (set `sample: false` on each real one, or drop
 * the flag). Never publish invented reviews as real ones.
 */
export interface Review {
  name: string;
  city: string;
  dial: DialId;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  date: string; // ISO date
  verified?: boolean;
  sample?: boolean;
}

export const REVIEWS: Review[] = [
  {
    name: 'Sample reviewer',
    city: 'Sofia',
    dial: 'slate',
    rating: 5,
    title: 'Example: what a five-star review looks like',
    body: 'A real customer’s words go here, for example about how the bracelet wears, how easy the chronograph is to use, or how the watch arrived.',
    date: '2026-11-10',
    sample: true,
  },
  {
    name: 'Sample reviewer',
    city: 'Berlin',
    dial: 'midnight',
    rating: 5,
    title: 'Example: a review about the dial',
    body: 'Replace this with a customer’s review. Keep their own wording; short reviews of two or three sentences read best in this card.',
    date: '2026-10-28',
    sample: true,
  },
  {
    name: 'Sample reviewer',
    city: 'Athens',
    dial: 'bone',
    rating: 4,
    title: 'Example: a four-star review',
    body: 'Mixed reviews belong here too. Showing a four-star review with an honest small criticism makes the others more believable.',
    date: '2026-10-15',
    sample: true,
  },
];

/**
 * Where we ship, how many working days the courier takes and what it costs.
 * Stand-in values: replace with the client's courier contract.
 */
export interface ShippingZone {
  country: string;
  days: [number, number];
  fee: number;
  /** outside the EU: duties are collected by the courier */
  duties?: boolean;
}

const zone = (days: [number, number], fee = 0, duties = false) => (country: string): ShippingZone => ({ country, days, fee, duties });
const home = zone([1, 2]);
const near = zone([2, 3]);
const eu = zone([2, 4]);
const outside = zone([3, 5], 25, true);

export const SHIPPING: ShippingZone[] = [
  eu('Austria'), eu('Belgium'), home('Bulgaria'), eu('Croatia'), eu('Cyprus'), eu('Czechia'), eu('Denmark'), eu('Estonia'),
  eu('Finland'), eu('France'), eu('Germany'), near('Greece'), eu('Hungary'), eu('Ireland'), eu('Italy'), eu('Latvia'),
  eu('Lithuania'), eu('Luxembourg'), eu('Malta'), eu('Netherlands'), outside('Norway'), eu('Poland'), eu('Portugal'),
  near('Romania'), eu('Slovakia'), eu('Slovenia'), eu('Spain'), eu('Sweden'), outside('Switzerland'), outside('United Kingdom'),
];
export const COUNTRIES = SHIPPING.map((z) => z.country);
/** orders placed before this hour (Sofia time) leave the workshop the same working day */
export const SHIP_CUTOFF_HOUR = 14;

export const priceFor = (strap: StrapId) =>
  MODEL.basePrice + (STRAPS.find((s) => s.id === strap)?.surcharge ?? 0);

export const dialById = (id: DialId) => DIALS.find((d) => d.id === id) ?? DIALS[0];
export const strapById = (id: StrapId) => STRAPS.find((s) => s.id === id) ?? STRAPS[0];
export const sizeById = (id: SizeId) => SIZES.find((s) => s.id === id) ?? SIZES[0];
