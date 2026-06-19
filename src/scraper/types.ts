// Shared types for the retailer-adapter scraper pattern.
//
// Phase 1 ships a single-retailer scraper (Jumia). Phase 5 generalizes this
// into a real adapter pattern for a second/third retailer. The interface
// below is written with that already in mind so Phase 5 is a matter of
// adding adapters, not restructuring the content script.

export interface ScrapedProduct {
  name: string;
  /** Raw price text as shown on the page, e.g. "KSh 380". Left unparsed —
   *  parsing into a number is a scoring-engine concern, not a scraper one. */
  price: string | null;
  packSize: string | null;
  sourceUrl: string;
  /** The DOM node the badge gets anchored near. Not serializable — only
   *  used in-page, never sent across the runtime-messaging boundary. */
  element: Element;
}

export interface RetailerAdapter {
  /** Hostname this adapter applies to, e.g. "www.jumia.co.ke". */
  hostname: string;
  /** Selector used to find candidate product cards on the page. */
  productCardSelector: string;
  /** Pull structured data out of a single card. Return null for anything
   *  that doesn't actually look like a product card — defensive against
   *  the retailer reusing the same class name for unrelated UI. */
  extract: (card: Element) => ScrapedProduct | null;
  /** Element within the card to place the badge next to. Defaults to the
   *  card itself when omitted. */
  getAnchor?: (card: Element) => Element | null;
}
