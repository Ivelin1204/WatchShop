# Merid — Meridian Chronograph watch store

React 19 + TypeScript + Vite + Three.js. One-product storefront for an automatic chronograph with a live configurator, bag and checkout form.

## Run

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build in dist/ (static, deploy to GitHub Pages, Netlify, etc.)
npm run build:single # everything inlined into dist-single/index.html
```

## Where things live

| What | File |
|---|---|
| Brand, model, prices, dials, straps, specs, FAQ | `src/data/product.ts` |
| Watch renders (front, side, caseback), live hands | `src/components/watch/` |
| Page sections | `src/components/Hero.tsx`, `Configurator.tsx`, `Sections.tsx` |
| Bag state (saved in localStorage) | `src/cart/CartContext.tsx` |
| Bag drawer + delivery form | `src/components/CartDrawer.tsx` |
| Payment hook-up | `src/lib/checkout.ts` |
| Styles and design tokens | `src/styles/global.css` |

## Connecting payments

Set `VITE_CHECKOUT_ENDPOINT` in a `.env` file to a backend URL that accepts
`POST { items, shipping }` and returns `{ url }` (e.g. a serverless function that
creates a Stripe Checkout Session). Until it is set, the form validates and tells
the shopper online payment isn't live yet.

## Before going live

- The brand name "Merid", model, specs, prices and the Sofia address are stand-ins: edit `src/data/product.ts`.
- The watch is drawn in SVG. When real product photography exists, swap `<WatchFace>` for `<img>` in the sections you want.
- Replace `hello@merid.example` with the real contact address.
