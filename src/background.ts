import { addScan, openDatabase, productIdFromName, recordHistory, saveScore, upsertProduct } from './storage/nutriscore-db';
import type { MessageRequest, OpenFoodFactsHit, ScrapedProduct } from './shared/messages';

async function lookupOpenFoodFacts(query: string) {
  const endpoint = new URL('https://world.openfoodfacts.org/cgi/search.pl');
  endpoint.searchParams.set('search_terms', query);
  endpoint.searchParams.set('search_simple', '1');
  endpoint.searchParams.set('action', 'process');
  endpoint.searchParams.set('json', '1');
  endpoint.searchParams.set('fields', 'code,product_name,brands,quantity,categories,nutriscore_grade,image_small_url');

  const response = await fetch(endpoint.toString());
  if (!response.ok) {
    throw new Error(`Open Food Facts lookup failed with ${response.status}`);
  }

  const payload = await response.json() as { products?: OpenFoodFactsHit[] };
  return payload.products ?? [];
}

async function persistScrape(product: ScrapedProduct, score?: string) {
  const id = productIdFromName(product.name);

  await upsertProduct({
    ...product,
    id,
    source: 'jumia',
    updatedAt: Date.now()
  });

  await addScan({
    productId: id,
    scannedAt: Date.now(),
    pageUrl: product.url,
    surface: 'unknown'
  });

  if (score) {
    await saveScore({
      productId: id,
      nutriScoreLetter: score,
      rawPoints: { score: score === 'A' ? 1 : 0 },
      createdAt: Date.now()
    });
  }

  await recordHistory({
    productId: id,
    day: new Date().toISOString().slice(0, 10),
    lastSeenAt: Date.now(),
    totalScans: 1
  });
}

chrome.runtime.onInstalled.addListener(() => {
  openDatabase().catch((error: unknown) => {
    console.error('Failed to initialize NutriScore database', error);
  });
});

chrome.runtime.onMessage.addListener((message: MessageRequest, _sender, sendResponse) => {
  if (message.type === 'LOOKUP_OFF') {
    lookupOpenFoodFacts(message.query)
      .then((products) => sendResponse({ products }))
      .catch((error: unknown) => sendResponse({ error: error instanceof Error ? error.message : String(error) }));

    return true;
  }

  if (message.type === 'SAVE_SCAN') {
    persistScrape(message.product, message.score)
      .then(() => sendResponse({ ok: true }))
      .catch((error: unknown) => sendResponse({ error: error instanceof Error ? error.message : String(error) }));

    return true;
  }

  return false;
});
