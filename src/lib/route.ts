import { useEffect, useState } from 'react';

/**
 * Two pages, kept in the address as a plain hash: the shop (any other hash,
 * including the section anchors) and #checkout. Back and forward work.
 */
export type Route = 'shop' | 'checkout';

const current = (): Route => (window.location.hash === '#checkout' ? 'checkout' : 'shop');

export function useRoute() {
  const [route, setRoute] = useState<Route>(current);
  useEffect(() => {
    const on = () => setRoute(current());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

let openedFromShop = false;

export function goTo(route: Route) {
  if (route === 'checkout') {
    openedFromShop = true;
    window.location.hash = 'checkout';
  } else if (window.location.hash === '#checkout') {
    // back to the shop: step back in history when we came from it (so the
    // browser's Back button and ours agree), otherwise go to the top of the shop
    if (openedFromShop) {
      openedFromShop = false;
      window.history.back();
    } else window.location.hash = 'top';
  }
}
