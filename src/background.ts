import { addScan, findProductByBarcode, findProductByNormalizedName, getLookupCache, openDatabase, pruneExpiredLookups, productIdFromName, recordHistory, saveScore, upsertLookupCache, upsertProduct } from './storage/nutriscore-db';
import { computeNutriScore, type NutritionFacts } from './shared/nutriscore';
import { normalizeBarcode, normalizeText } from './shared/normalize';
import type { MessageRequest, OpenFoodFactsHit, ScrapedProduct } from './shared/messages';

const OFF_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const FORMULA_VERSION = 'nutriscore-v2026.1';

function cacheKeyForLookup(barcode: string | undefined, normalizedQuery: string) {
  return barcode ? `barcode:${barcode}` : `query:${normalizedQuery}`;
}

function nutritionFactsFromOffProduct(product: OpenFoodFactsHit): NutritionFacts {
  const nutriments = (product as { nutriments?: Record<string, number | string> }).nutriments ?? {};

  return {
    energyKj: Number(nutriments['energy-kj_100g'] ?? NaN),
    sugarsG: Number(nutriments['sugars_100g'] ?? NaN),
    saturatedFatG: Number(nutriments['saturated-fat_100g'] ?? NaN),
    sodiumMg: Number(nutriments['sodium_100g'] ?? NaN) * 1000,
    fiberG: Number(nutriments['fiber_100g'] ?? NaN),
    proteinG: Number(nutriments['proteins_100g'] ?? NaN),
    fruitVegNutsPercent: Number(nutriments['fruits-vegetables-nuts-estimate-from-ingredients_100g'] ?? NaN)
  };
}

async function lookupOpenFoodFacts(query: string, barcode?: string) {
  const normalizedQuery = normalizeText(query);
  const normalizedBarcode = normalizeBarcode(barcode);
  const cacheKey = cacheKeyForLookup(normalizedBarcode || undefined, normalizedQuery);

  await pruneExpiredLookups();
  const cached = await getLookupCache(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    const response = cached.response as { products?: OpenFoodFactsHit[] };
    return {
      products: response.products ?? [],
      score: response.products?.[0] ? buildScoreFromOffHit(response.products[0]) : undefined
    };
  }

  const endpoint = new URL('https://world.openfoodfacts.org/cgi/search.pl');
  endpoint.searchParams.set('search_terms', normalizedBarcode || normalizedQuery || query);
  endpoint.searchParams.set('search_simple', '1');
  endpoint.searchParams.set('action', 'process');
  endpoint.searchParams.set('json', '1');
  endpoint.searchParams.set('fields', 'code,product_name,brands,quantity,categories,nutriscore_grade,image_small_url,nutriments,ingredients_text,ingredients_text_with_allergens,ecoscore_grade');
  if (normalizedBarcode) {
    endpoint.searchParams.set('barcode', normalizedBarcode);
  }

  const response = await fetch(endpoint.toString());
  if (!response.ok) {
    throw new Error(`Open Food Facts lookup failed with ${response.status}`);
  }

  const payload = await response.json() as { products?: OpenFoodFactsHit[] };
  const result = {
    products: payload.products ?? [],
    score: payload.products?.[0] ? buildScoreFromOffHit(payload.products[0]) : undefined
  };
  await upsertLookupCache({
    cacheKey,
    normalizedQuery,
    barcode: normalizedBarcode || undefined,
    response: result,
    fetchedAt: Date.now(),
    expiresAt: Date.now() + OFF_CACHE_TTL_MS
  });
  return result;
}

function buildScoreFromOffHit(product: OpenFoodFactsHit) {
  const score = computeNutriScore(nutritionFactsFromOffProduct(product));

  return {
    letter: score.letter,
    scoreValue: score.score,
    rawPoints: score.components,
    formulaVersion: FORMULA_VERSION,
    source: 'formula' as const
  };
}

async function persistScrape(product: ScrapedProduct, score?: { letter: 'A' | 'B' | 'C' | 'D' | 'E'; scoreValue: number; rawPoints: Record<string, number>; formulaVersion: string; source: 'formula' | 'open-food-facts' }) {
  const id = productIdFromName(product.retailer, product.barcode, product.normalizedName);
  const existing = product.barcode ? await findProductByBarcode(product.barcode) : await findProductByNormalizedName(product.normalizedName);
  const merged = existing ? { ...existing, ...product, id: existing.id, updatedAt: Date.now(), lastSeenAt: Date.now() } : { ...product, id, source: 'carrefour' as const, updatedAt: Date.now(), lastSeenAt: Date.now() };

  await upsertProduct(merged);

  await addScan({
    retailer: 'carrefour',
    productId: id,
    scannedAt: Date.now(),
    pageUrl: product.url,
    surface: 'unknown',
    dedupeKey: `${product.retailer}:${product.barcode ?? product.normalizedName}:${new Date().toISOString().slice(0, 10)}`
  });

  if (score) {
    await saveScore({
      productId: id,
      nutriScoreLetter: score.letter,
      scoreValue: score.scoreValue,
      rawPoints: score.rawPoints,
      createdAt: Date.now(),
      source: score.source,
      formulaVersion: score.formulaVersion
    });
  }

  await recordHistory({
    productId: id,
    retailer: 'carrefour',
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
    lookupOpenFoodFacts(message.query, message.barcode)
      .then((result) => sendResponse(result))
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
