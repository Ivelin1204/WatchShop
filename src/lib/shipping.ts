import { SHIPPING, SHIP_CUTOFF_HOUR, type ShippingZone } from '../data/product';

const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

export const addWorkingDays = (from: Date, n: number) => {
  const d = new Date(from);
  let left = n;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (!isWeekend(d)) left--;
  }
  return d;
};

/** the day the parcel leaves Sofia: today before the cut-off on a weekday, otherwise the next working day */
export const dispatchDay = (now: Date) => (isWeekend(now) || now.getHours() >= SHIP_CUTOFF_HOUR ? addWorkingDays(now, 1) : new Date(now));

export const zoneFor = (country: string): ShippingZone => SHIPPING.find((z) => z.country === country) ?? SHIPPING[0];

export function deliveryWindow(country: string, now = new Date()) {
  const zone = zoneFor(country);
  const leaves = dispatchDay(now);
  return { zone, now, leaves, earliest: addWorkingDays(leaves, zone.days[0]), latest: addWorkingDays(leaves, zone.days[1]) };
}

export const shortDate = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
export const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
