import type { ScrapedProduct } from '../shared/messages';

const JUMIA_SELECTORS = {
  productCard: '[data-sku], article, .prd, .card',
  productName: 'h1, h2, h3, .name, [data-name]',
  productPrice: '.prc, .price, [data-price], [aria-label*="price"]',
  packSize: '.pack-size, .size, [data-pack-size], [data-variant]'
} as const;

function cleanText(value: string | null | undefined) {
  return value?.replace(/\s+/g, ' ').trim() ?? '';
}

function firstMatch(root: ParentNode, selector: string) {
  return root.querySelector<HTMLElement>(selector);
}

function extractCard(card: Element): ScrapedProduct | null {
  const name = cleanText(firstMatch(card, JUMIA_SELECTORS.productName)?.textContent);
  if (!name) {
    return null;
  }

  return {
    retailer: 'jumia',
    url: (card as HTMLElement).querySelector<HTMLAnchorElement>('a[href]')?.href ?? location.href,
    name,
    priceText: cleanText(firstMatch(card, JUMIA_SELECTORS.productPrice)?.textContent),
    packSize: cleanText(firstMatch(card, JUMIA_SELECTORS.packSize)?.textContent),
    category: document.body.dataset.category ?? undefined
  };
}

export function detectJumiaSurface(documentRef: Document) {
  const url = documentRef.location?.href ?? '';
  const bodyText = documentRef.body?.innerText ?? '';

  if (/just a moment|cloudflare|checking your browser/i.test(documentRef.title + ' ' + bodyText)) {
    return 'blocked';
  }

  if (url.includes('/sp/')) {
    return 'basket';
  }

  if (documentRef.querySelector('h1') && documentRef.querySelector(JUMIA_SELECTORS.productPrice)) {
    return 'detail';
  }

  if (documentRef.querySelector(JUMIA_SELECTORS.productCard)) {
    return 'grid';
  }

  return 'unknown';
}

export function scrapeJumiaPage(documentRef: Document) {
  const surface = detectJumiaSurface(documentRef);

  if (surface === 'blocked') {
    return {
      retailer: 'jumia' as const,
      surface,
      products: []
    };
  }

  const cards = Array.from(documentRef.querySelectorAll(JUMIA_SELECTORS.productCard));
  const products = cards.map(extractCard).filter((product): product is ScrapedProduct => product !== null);

  return {
    retailer: 'jumia' as const,
    surface,
    products
  };
}
