// Jumia adapter (Kenya target retailer, locked in per the attachment
// management strategy).
//
// Jumia runs the same storefront frontend across its country sites, so the
// listing-page selectors below — sourced from publicly documented Jumia
// scraping examples rather than guessed — are a reasonable starting point
// for jumia.co.ke too:
//
//   product card  -> a.core
//   product name  -> .name
//   price         -> .prc
//   discount tag  -> .tag._dsct
//
// What this file deliberately does NOT pretend to know: the checkout/cart
// page markup. That hasn't been verified against the live site yet — do
// that with Chrome DevTools during Phase 1 week 1, then fill in
// CHECKOUT_SELECTORS below. Scraper selectors are inherently fragile
// (retailers change markup without notice); re-verify the moment badges
// stop appearing.

import type { RetailerAdapter, ScrapedProduct } from "../types";

const LISTING_SELECTORS = {
  card: "a.core",
  name: ".name",
  price: ".prc",
};

// TODO(Phase 1 / week 1): verify against the live cart & checkout flow and
// fill these in. Left null on purpose — a wrong guess that "looks done" is
// worse than an honest gap, since it would silently fail at checkout, the
// one place this extension actually needs to work.
export const CHECKOUT_SELECTORS = {
  card: null as string | null,
  name: null as string | null,
  price: null as string | null,
};

function extractFromListingCard(card: Element): ScrapedProduct | null {
  const nameEl = card.querySelector(LISTING_SELECTORS.name);
  const priceEl = card.querySelector(LISTING_SELECTORS.price);

  const name = nameEl?.textContent?.trim();
  if (!name) return null; // not a real product card — don't inject anything

  const href = card.getAttribute("href");
  const sourceUrl = href ? new URL(href, window.location.origin).toString() : window.location.href;

  return {
    name,
    price: priceEl?.textContent?.trim() ?? null,
    // Jumia listing cards don't surface pack size directly; that lives on
    // the product detail page. Acceptable gap for Phase 1 — the score
    // lookup falls back to name-based matching in the meantime.
    packSize: null,
    sourceUrl,
    element: card,
  };
}

export const jumiaAdapter: RetailerAdapter = {
  hostname: "www.jumia.co.ke",
  productCardSelector: LISTING_SELECTORS.card,
  extract: extractFromListingCard,
  getAnchor: (card) => card.querySelector(LISTING_SELECTORS.price) ?? card,
};
