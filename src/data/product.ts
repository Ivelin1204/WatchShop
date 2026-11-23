/**
 * Everything the shop sells lives here. Change names, prices and specs in this
 * one file and the whole site follows.
 *
 * NOTE: the brand "Merid", the model, the specs and the prices are stand-ins.
 * Replace them with the client's real data before going live.
 */

export type DialId = 'bone' | 'navy' | 'forest';
export type StrapId = 'leather' | 'rubber' | 'bracelet';
export type SizeId = '36' | '39';

export interface Dial {
  id: DialId;
  name: string;
  /** dial base colour */
  base: string;
  /** lighter centre of the sunburst */
  glow: string;
  /** colour of printed text and minute track */
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
  /** render scale relative to the 39 mm case */
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
  name: 'Meridian',
  basePrice: 690,
  currency: 'EUR',
  shipping: '2–4 working days',
};

export const DIALS: Dial[] = [
  { id: 'bone', name: 'Bone', base: '#E7E0D2', glow: '#F4EFE6', print: '#1A1C1F', swatch: '#E7E0D2', dark: false },
  { id: 'navy', name: 'Navy', base: '#16233B', glow: '#2C4468', print: '#E9E4DA', swatch: '#1E3052', dark: true },
  { id: 'forest', name: 'Forest', base: '#1C2F26', glow: '#36554A', print: '#E9E4DA', swatch: '#27423A', dark: true },
];

export const STRAPS: Strap[] = [
  { id: 'leather', name: 'Tan leather', short: 'Leather', surcharge: 0 },
  { id: 'rubber', name: 'Black rubber', short: 'Rubber', surcharge: 0 },
  { id: 'bracelet', name: 'Steel bracelet', short: 'Bracelet', surcharge: 120 },
];

export const SIZES: Size[] = [
  { id: '36', name: '36 mm', scale: 36 / 39 },
  { id: '39', name: '39 mm', scale: 1 },
];

export const SPECS: { label: string; value: string }[] = [
  { label: 'Crystal', value: 'Domed sapphire, anti-reflective inside' },
  { label: 'Lume', value: 'Super-LumiNova on hands and markers' },
  { label: 'Date', value: 'At 3 o’clock, quick-set from the crown' },
  { label: 'Case', value: '316L steel, brushed with polished bevels' },
  { label: 'Water', value: '100 m, screw-down crown' },
  { label: 'Strap', value: '20 mm, quick-release pins' },
];

export const FAQ: { q: string; a: string }[] = [
  {
    q: 'Does it need a battery?',
    a: 'No. The movement winds itself as you wear it. Left off the wrist it runs for about 38 hours; after that, give the crown twenty turns or wear it again.',
  },
  {
    q: 'How do I set the date?',
    a: 'Unscrew the crown and pull it to the first position, then turn it forward. Avoid changing the date between 9 pm and 3 am, while the date wheel is engaged.',
  },
  {
    q: 'Can I change the strap myself?',
    a: 'Yes. Every strap has quick-release pins: slide the small lever and the strap comes off without tools. Any 20 mm strap fits.',
  },
  {
    q: 'Do you ship outside the EU?',
    a: 'We ship to the UK, Switzerland and Norway for a flat €25. Import duties are paid by the buyer and collected by the courier.',
  },
];

export const priceFor = (strap: StrapId) =>
  MODEL.basePrice + (STRAPS.find((s) => s.id === strap)?.surcharge ?? 0);

export const dialById = (id: DialId) => DIALS.find((d) => d.id === id)!;
export const strapById = (id: StrapId) => STRAPS.find((s) => s.id === id)!;
export const sizeById = (id: SizeId) => SIZES.find((s) => s.id === id)!;
