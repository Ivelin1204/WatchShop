import type { ReactNode } from 'react';
import type { DialId, StrapId } from '../data/product';

/**
 * English copy. Every string on the site lives here and in bg.tsx; the
 * Bulgarian file is typed against this one, so a missing translation is a
 * build error rather than a gap on the page.
 */

const money = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const short = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const long = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export const en = {
  code: 'en',
  locale: 'en-GB',
  money: (n: number) => money.format(n),
  shortDate: (d: Date) => short.format(d),
  longDate: (d: Date) => long.format(d),

  meta: {
    title: 'Meridian Chronograph — automatic chronograph from Sofia | Merid',
    description:
      'Meridian Chronograph: a 40 mm automatic chronograph with sapphire crystal and 100 m water resistance. Made in small batches in Sofia. From €1,190, free EU delivery.',
    checkout: 'Checkout | Merid',
  },

  brand: {
    city: 'Sofia',
    street: 'Vitosha Boulevard',
  },

  lang: {
    label: 'Language',
    en: 'English',
    bg: 'Български',
  },

  units: { mm: 'mm', m: 'm', h: 'h', g: 'g' },

  dials: { slate: 'Slate', midnight: 'Midnight', bone: 'Bone' } as Record<DialId, string>,
  dialLabel: (name: string) => `${name} dial`,
  straps: {
    bracelet: { name: 'Steel bracelet', short: 'Bracelet' },
    leather: { name: 'Tan leather', short: 'Leather' },
    rubber: { name: 'Black rubber', short: 'Rubber' },
  } as Record<StrapId, { name: string; short: string }>,
  watchTitle: (dial: string, strap?: string) =>
    strap ? `Meridian Chronograph with ${dial.toLowerCase()} dial on ${strap.toLowerCase()}` : `Meridian Chronograph with ${dial.toLowerCase()} dial`,

  countries: {} as Record<string, string>,

  common: {
    skip: 'Skip to content',
    toTop: 'Back to the top',
    choose: 'Choose…',
    free: 'Free',
    remove: 'Remove',
    subtotal: 'Subtotal',
    delivery: 'Delivery',
    chooseWatch: 'Choose a watch',
    engraved: (text: string) => `Engraved: “${text}”`,
    fewer: (name: string) => `One fewer ${name}`,
    more: (name: string) => `One more ${name}`,
    startStop: 'Start or stop the chronograph',
    reset: 'Reset the chronograph',
    caseback: 'Sapphire caseback showing the decorated automatic chronograph movement',
  },

  nav: {
    links: ['The watch', 'Details', 'Movement', 'Delivery'],
    home: (brand: string) => `${brand}, back to top`,
    bag: (n: number) => `Open bag, ${n} ${n === 1 ? 'item' : 'items'}`,
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    main: 'Main',
    mobile: 'Mobile',
    menuFoot: 'Free EU delivery · 30-day returns · Sofia',
  },

  hero: {
    lead1: 'Every day,',
    lead2: 'timed to the second.',
    body: (street: string) => `A Swiss automatic chronograph with two counters and a date, assembled on ${street}.`,
    cta: 'Choose your Meridian',
    more: 'See it turn',
    from: 'from',
    cue: 'Scroll to turn it over',
    canvas: '3D model of the Meridian Chronograph with midnight dial on the steel bracelet, showing the time now',
  },

  showcase: {
    eyebrow: 'Turn it over',
    steps: [
      {
        title: 'Two counters and a timer you read at a glance.',
        body: 'Running seconds sit at 9, the 30-minute counter at 3. The orange hand rests at 12 until you start the timer.',
      },
      {
        title: 'Start, stop, reset.',
        body: 'The top pusher starts and stops the timer, the lower one sends it back to zero. The crown between them screws down to 100 m.',
      },
      {
        title: 'The chronograph calibre, on show through the back.',
        body: 'A sapphire caseback shows the rotor that winds the spring every time your wrist moves.',
      },
      {
        title: 'A steel bracelet with polished centre links.',
        body: 'Solid links taper from 20 to 16 mm and wrap close round the wrist, so the watch sits flat and stays put.',
      },
    ],
    views: 'Views of the watch',
    dots: ['Dial', 'Crown and pushers', 'Caseback', 'Bracelet side'],
    canvas: (dial: string) => `3D model of the Meridian Chronograph with ${dial.toLowerCase()} dial, turning as you scroll`,
    dialColour: 'Dial colour',
  },

  gallery: {
    title: 'Out in the world.',
    lead: 'On a café table, under a coat sleeve, face down with a name on the back. One 40 mm case, three dials, three straps.',
    alts: {
      wrist: 'The Meridian with a slate dial on a tan leather strap, worn at a café table next to an espresso',
      studio: 'The Meridian on its steel bracelet, slate dial, three-quarter view on black',
      back: 'The back of the Meridian: the movement behind sapphire and the words FOR MARIA 2026 engraved round the window',
      dials: 'Three Meridians side by side: slate dial on the bracelet, midnight on leather, bone on rubber',
    },
  },

  config: {
    turn: 'Turn the watch',
    views: { front: 'Front', side: 'Side', back: 'Back' },
    drag: 'Drag to turn',
    title: 'Choose your Meridian.',
    priceNote: 'incl. VAT · ships in 2–4 working days',
    dial: 'Dial',
    strap: 'Strap',
    case: 'Case',
    engraving: 'Engraving',
    engravingTag: 'optional, free',
    placeholder: 'Initials or a date, e.g. A.P. 24.11.2026',
    engravingHelp: 'Cut into the caseback around the window. Engraved watches can’t be returned.',
    added: 'Added to your bag',
    add: (price: string) => `Add to bag — ${price}`,
    eta: (home: ReactNode, eu: string): ReactNode => (
      <>
        Order today, it arrives by <strong>{home}</strong> in Bulgaria, by {eu} across the EU.
      </>
    ),
    noteEngraved: 'Free delivery across the EU.',
    note: '30 days to return it unworn. Free delivery across the EU.',
  },

  details: {
    title: 'A timer you can read at a glance, even in the dark.',
    lead: 'Try it. The top pusher starts and stops the orange hand, the lower one sends it back to zero. Then switch the lights off.',
    start: 'Start timer',
    stop: 'Stop timer',
    reset: 'Reset',
    lights: 'Lights off',
    dialTitle: 'Meridian Chronograph dial. The top pusher starts and stops the timer, the lower one resets it.',
  },

  specs: [
    { label: 'Movement', value: 'Swiss automatic chronograph' },
    { label: 'Counters', value: 'Small seconds at 9, 30 minutes at 3' },
    { label: 'Crystal', value: 'Domed sapphire, anti-reflective inside' },
    { label: 'Date', value: 'At 6 o’clock, quick-set from the crown' },
    { label: 'Case', value: '316L steel, brushed with polished bevels' },
    { label: 'Water', value: '100 m, screw-down crown' },
  ],

  profile: {
    title: '12.9 mm from crystal to caseback.',
    lead: 'Slim for a chronograph, so it slides under a shirt cuff. It weighs 138 g on the bracelet, which tapers from 20 to 16 mm at the clasp.',
    thick: ['12.9 mm', 'thick'],
    case: ['40 mm', 'case'],
    lugs: ['47 mm', 'lug to lug'],
    drawing: 'Technical drawing of the Meridian Chronograph from the crown side: 12.9 mm thick, 40 mm case, 47 mm lug to lug',
    drawThick: 'mm thick',
    drawCase: '40 mm case',
    drawLugs: '47 mm lug to lug',
    decimal: '12.9',
    parts: [
      { title: 'Domed sapphire', body: 'Curved crystal, anti-reflective inside, 2.9 mm of the height.' },
      { title: 'Two pushers', body: 'Start and stop at 2 o’clock, reset at 4.' },
      { title: 'Screw-down crown', body: 'Engraved with the Merid mark, sealed to 100 m.' },
      { title: 'Display caseback', body: 'Sapphire window onto the movement, flush with the wrist.' },
    ],
  },

  movement: {
    title: 'A Swiss chronograph calibre you can watch through the back.',
    lead: 'Turn the watch over and the movement is behind sapphire. The rotor swings as your wrist moves and winds the spring, so it never needs a battery.',
    figures: [
      { big: '28,800', text: 'beats an hour, so the seconds hand sweeps' },
      { big: '42 h', text: 'power reserve off the wrist' },
      { big: '27', text: 'jewels at the points of wear' },
    ],
  },

  workshop: {
    eyebrow: (street: string) => `The workshop on ${street}`,
    statement: 'Every Meridian is assembled and regulated by hand in our workshop in Sofia, then timed for five days in five positions.',
    days: [
      { name: 'Dial up', note: 'Lying flat, as on a bedside table.' },
      { name: 'Dial down', note: 'Face down on its crystal, clasp up.' },
      { name: 'Crown up', note: 'Standing on its side, crown to the sky.' },
      { name: 'Crown down', note: 'As it hangs on a resting arm.' },
      { name: 'Crown left', note: 'As it sits on a raised wrist.' },
    ],
    day: (n: number) => `Day ${n}`,
    result: (
      <>
        <strong>Within −4 and +6 seconds a day</strong> in every position, or it goes back on the bench.
      </>
    ) as ReactNode,
    position: (name: string) => `The watch in the ${name.toLowerCase()} position`,
    passed: 'Passed in all five positions',
    ready: 'Ready to ship',
    machine: 'Timing machine',
  },

  reviews: {
    title: 'What owners say.',
    sample: 'Sample',
    sampleNote: 'These are placeholder reviews. Replace them with real customer reviews before going live.',
    count: (n: number) => `${n} ${n === 1 ? 'review' : 'reviews'}`,
    breakdown: 'Ratings breakdown',
    stars: (v: string) => `${v} out of 5 stars`,
    verified: 'Verified buyer',
    meta: (dial: string, date: string) => `${dial} dial · ${date}`,
    decimal: (n: number) => n.toFixed(1),
    items: [
      {
        name: 'Sample reviewer',
        city: 'Sofia',
        title: 'Example: what a five-star review looks like',
        body: 'A real customer’s words go here, for example about how the bracelet wears, how easy the chronograph is to use, or how the watch arrived.',
      },
      {
        name: 'Sample reviewer',
        city: 'Berlin',
        title: 'Example: a review about the dial',
        body: 'Replace this with a customer’s review. Keep their own wording; short reviews of two or three sentences read best in this card.',
      },
      {
        name: 'Sample reviewer',
        city: 'Athens',
        title: 'Example: a four-star review',
        body: 'Mixed reviews belong here too. Showing a four-star review with an honest small criticism makes the others more believable.',
      },
    ],
  },

  delivery: {
    title: 'Delivery, returns and the warranty.',
    lead: (street: string) =>
      `Every Meridian leaves our workshop on ${street} insured, tracked and signed for. Pick your country to see when it reaches you.`,
    deliverTo: 'Deliver to',
    when: (today: boolean) => `Order ${today ? 'today' : 'now'}, it arrives`,
    today: 'Today',
    tomorrow: 'Tomorrow',
    packed: 'Packed in Sofia',
    courier: 'With the courier',
    door: 'At your door',
    duties: 'Outside the EU, import duties are collected by the courier on delivery.',
    cutoff: (h: number) => `Orders before ${h}:00 on a working day leave the same day.`,
    promises: [
      { big: 'Free', title: 'delivery across the EU', body: 'Insured, tracked and signed for.' },
      { big: '30 days', title: 'to change your mind', body: 'Send it back unworn in its box for a full refund.' },
      { big: '5 years', title: 'on the movement', body: 'If it stops keeping time, we service it free.' },
    ],
    faq: [
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
    ],
  },

  close: {
    title: 'Three dials. Pick yours.',
    lead: (from: string, bracelet: string) => `From ${from} on leather or rubber, ${bracelet} on the steel bracelet. Free delivery across the EU.`,
    choose: (name: string) => `Choose ${name}`,
  },

  footer: {
    tagline: 'Automatic watches, made in small batches.',
    workshop: 'Workshop',
    write: 'Write to us',
    shop: 'Shop',
    watch: 'The watch',
    returns: 'Delivery and returns',
    care: 'Care',
    movement: 'The movement',
    warranty: 'Warranty',
    base: 'Prices include VAT · Product photos are AI-generated illustrations',
  },

  cart: {
    title: 'Your bag',
    close: 'Close bag',
    empty: 'Your bag is empty.',
    later: 'Worked out at the next step',
    next: 'Continue to delivery',
  },

  checkout: {
    home: (brand: string) => `${brand}, back to the shop`,
    steps: 'Checkout steps',
    bag: 'Bag',
    delivery: 'Delivery',
    payment: 'Payment',
    back: 'Back to shop',
    title: 'Delivery details',
    empty: 'Your bag is empty, so there is nothing to deliver yet.',
    contact: 'Contact',
    name: 'Full name',
    email: 'Email',
    emailHint: 'We send the tracking link here.',
    address: 'Delivery address',
    street: 'Street and number',
    city: 'Town or city',
    country: 'Country',
    errors: {
      name: 'Enter your full name.',
      email: 'Enter an email like name@domain.com.',
      address: 'Enter the street and number.',
      city: 'Enter your town or city.',
      country: 'Choose a country.',
    },
    arrives: (a: string, b: string) => `Arrives ${a} – ${b}`,
    insured: (duties: boolean): string => (duties ? 'Insured, tracked and signed for. Import duties are collected by the courier.' : 'Insured, tracked and signed for.'),
    order: 'Your order',
    watches: (n: number) => (n === 1 ? '1 watch' : `${n} watches`),
    deliveryTo: (country: string) => `Delivery to ${country}`,
    total: 'Total',
    vat: 'Prices include VAT.',
    busy: 'Opening payment…',
    pay: (total: string) => `Continue to payment · ${total}`,
    reasons: {
      notConnected: 'Online payment is not connected yet.',
      failed: 'The payment page could not be opened. Please try again.',
      offline: 'No connection. Check your internet and try again.',
    },
    reserve: (email: string) => `Email us at ${email} and we will reserve your watch.`,
    trust: ['30 days to return it unworn', '5-year warranty on the movement'],
  },
};

export type Dict = typeof en;
