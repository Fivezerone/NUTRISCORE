import type { ScrapedProduct } from '../shared/messages';
import { normalizeBarcode, normalizeText, parsePrice } from '../shared/normalize';

const CARREFOUR_SELECTORS = {
  productCard: [
    '[data-testid*="product"]',
    '[data-product-id]',
    'article',
    '.product-card',
    '.product-item',
    'li[class*="product"]',
    'a[href*="/product/"]'
  ].join(', '),
  productName: [
    '[data-testid*="name"]',
    'h1',
    'h2',
    'h3',
    '.product-name',
    '[class*="name"]',
    '[title]'
  ].join(', '),
  productPrice: [
    '[data-testid*="price"]',
    '.price',
    '.product-price',
    '[class*="price"]',
    '[aria-label*="price"]'
  ].join(', '),
  packSize: [
    '[data-testid*="size"]',
    '.package-size',
    '.size',
    '[class*="size"]'
  ].join(', '),
  barcodeCandidates: [
    '[data-barcode]',
    '[data-gtin]',
    '[data-ean]',
    'meta[itemprop="gtin13"]',
    'meta[itemprop="gtin12"]',
    'meta[itemprop="gtin8"]'
  ].join(', ')
} as const;

function cleanText(value: string | null | undefined) {
  return value?.replace(/\s+/g, ' ').trim() ?? '';
}

function firstMatch(root: ParentNode, selector: string) {
  return root.querySelector<HTMLElement | HTMLMetaElement>(selector);
}

function extractBarcode(root: ParentNode) {
  const candidate = firstMatch(root, CARREFOUR_SELECTORS.barcodeCandidates);
  if (!candidate) {
    return '';
  }

  const raw = candidate instanceof HTMLMetaElement ? candidate.content : candidate.getAttribute('data-barcode') ?? candidate.getAttribute('data-gtin') ?? candidate.getAttribute('data-ean') ?? candidate.textContent;
  return normalizeBarcode(raw);
}

function extractJsonLdBarcode(documentRef: Document) {
  const scripts = Array.from(documentRef.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'));
  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script.textContent ?? 'null');
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        const candidates = [node?.gtin13, node?.gtin12, node?.gtin8, node?.sku, node?.productID];
        for (const candidate of candidates) {
          const barcode = normalizeBarcode(String(candidate ?? ''));
          if (barcode) {
            return barcode;
          }
        }
      }
    } catch {
      continue;
    }
  }

  return '';
}

function extractStructuredName(documentRef: Document) {
  const titleNode = firstMatch(documentRef, 'meta[property="og:title"], meta[name="title"]');
  if (titleNode instanceof HTMLMetaElement && titleNode.content) {
    return cleanText(titleNode.content);
  }

  const heading = firstMatch(documentRef, 'h1') ?? firstMatch(documentRef, 'h2');
  if (heading) {
    return cleanText(heading.textContent);
  }

  const itemName = firstMatch(documentRef, '[itemprop="name"]');
  return cleanText(itemName?.textContent);
}

function extractProductFromCard(card: Element): ScrapedProduct | null {
  const name = cleanText(firstMatch(card, CARREFOUR_SELECTORS.productName)?.textContent ?? card.getAttribute('aria-label') ?? card.getAttribute('title'));
  if (!name) {
    return null;
  }

  const price = parsePrice(firstMatch(card, CARREFOUR_SELECTORS.productPrice)?.textContent);
  const packSize = cleanText(firstMatch(card, CARREFOUR_SELECTORS.packSize)?.textContent);
  const barcode = extractBarcode(card);
  const normalizedName = normalizeText(name);
  const url = (card as HTMLElement).querySelector<HTMLAnchorElement>('a[href]')?.href ?? location.href;
  const imageUrl = (card as HTMLElement).querySelector<HTMLImageElement>('img')?.src ?? undefined;

  return {
    retailer: 'carrefour',
    url,
    name,
    normalizedName,
    barcode: barcode || undefined,
    source: 'carrefour',
    priceText: price.text || undefined,
    priceValue: price.value,
    currency: price.currency,
    packSize: packSize || undefined,
    imageUrl: imageUrl?.trim() || undefined,
    category: document.body.dataset.category ?? undefined
  };
}

function inferSurface(documentRef: Document) {
  const url = documentRef.location?.href ?? '';
  const bodyText = documentRef.body?.innerText ?? '';
  if (/just a moment|cloudflare|checking your browser/i.test(documentRef.title + ' ' + bodyText)) {
    return 'blocked' as const;
  }

  if (/\/cart|basket|checkout/i.test(url)) {
    return 'basket' as const;
  }

  if (documentRef.querySelector('h1') && (documentRef.querySelector(CARREFOUR_SELECTORS.productPrice) || documentRef.querySelector(CARREFOUR_SELECTORS.barcodeCandidates))) {
    return 'detail' as const;
  }

  if (documentRef.querySelector(CARREFOUR_SELECTORS.productCard)) {
    return 'grid' as const;
  }

  return 'unknown' as const;
}

export function scrapeCarrefourPage(documentRef: Document) {
  const surface = inferSurface(documentRef);

  if (surface === 'blocked') {
    return { retailer: 'carrefour' as const, surface, products: [] };
  }

  const cards = Array.from(documentRef.querySelectorAll(CARREFOUR_SELECTORS.productCard));
  const products = cards.map(extractProductFromCard).filter((product): product is ScrapedProduct => product !== null);

  const detailName = extractStructuredName(documentRef);
  const detailPrice = parsePrice(firstMatch(documentRef, CARREFOUR_SELECTORS.productPrice)?.textContent);
  const detailBarcode = extractBarcode(documentRef) || extractJsonLdBarcode(documentRef);

  if (!products.length && detailName) {
    products.push({
      retailer: 'carrefour',
      url: location.href,
      name: detailName,
      normalizedName: normalizeText(detailName),
      barcode: detailBarcode || undefined,
      source: 'carrefour',
      priceText: detailPrice.text || undefined,
      priceValue: detailPrice.value,
      currency: detailPrice.currency,
      packSize: cleanText(firstMatch(documentRef, CARREFOUR_SELECTORS.packSize)?.textContent) || undefined,
      category: documentRef.body.dataset.category ?? undefined,
      imageUrl: (documentRef.querySelector('meta[property="og:image"]') as HTMLMetaElement | null)?.content ?? undefined
    });
  }

  return { retailer: 'carrefour' as const, surface, products };
}
