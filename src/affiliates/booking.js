// Booking.com (CJ Affiliate) — Whistler Business Solutions
// Evergreen link is deep-link enabled; use bookingDeepLink() for destination pages.
// Session-based attribution: visitor must book in the same browser session after click.

export const BOOKING_LINKS = {
  evergreen: 'https://www.kqzyfj.com/click-101831150-17293132',
  homepage: 'https://www.dpbolvw.net/click-101831150-17288959',
  getawayDeals: 'https://www.kqzyfj.com/click-101831150-17288985',
  flights: 'https://www.anrdoezrs.net/click-101831150-17288982',
  cars: 'https://www.anrdoezrs.net/click-101831150-17288983',
  attractions: 'https://www.tkqlhce.com/click-101831150-17288984',
  taxis: 'https://www.tkqlhce.com/click-101831150-17322565',
};

/** Destination-level Whistler stays — broader inventory converts better than a single hotel. */
export const WHISTLER_STAYS_URL = 'https://www.booking.com/city/ca/whistler.html';

/**
 * Build a CJ deep link to a Booking.com page.
 * @param {string} pageUrl Absolute Booking.com URL
 * @param {string} [sid] Optional shopper/source id for your own reporting
 */
export function bookingDeepLink(pageUrl, sid = 'wbs') {
  const params = new URLSearchParams();
  if (sid) params.set('sid', sid);
  params.set('url', pageUrl);
  return `${BOOKING_LINKS.evergreen}?${params.toString()}`;
}

export function whistlerStaysLink(sid = 'wbs') {
  return bookingDeepLink(WHISTLER_STAYS_URL, sid);
}
