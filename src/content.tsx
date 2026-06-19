import { h, render } from 'preact';
import { carrefourKenyaOpenFoodFactsSeeds } from './data/kenya-open-food-facts-seeds';
import { InlineWidget } from './ui/InlineWidget';
import { observeDomMutations } from './scraper/observer';
import { scrapeCarrefourPage } from './scraper/carrefour';
import type { InlineWidgetState } from './ui/InlineWidget';
import { normalizeBarcode, normalizeText } from './shared/normalize';
import { computeNutriScore } from './shared/nutriscore';
import type { ScrapedProduct } from './shared/messages';

const HOST_ID = 'nutriscore-extension-root';

let shadowRoot: ShadowRoot | null = null;
let currentState: InlineWidgetState = {
  surface: 'unknown',
  product: null,
  status: 'Booting NutriScore',
  nutriScore: 'N'
};

function ensureShadowRoot() {
  const existingHost = document.getElementById(HOST_ID);
  const host = existingHost ?? document.createElement('div');

  host.id = HOST_ID;
  host.style.all = 'initial';
  host.style.position = 'fixed';
  host.style.right = '16px';
  host.style.bottom = '16px';
  host.style.zIndex = '2147483647';
  host.style.width = '320px';

  if (!existingHost) {
    document.documentElement.appendChild(host);
  }

  if (!shadowRoot) {
    shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  }

  return shadowRoot;
}

function renderWidget(nextState: InlineWidgetState) {
  currentState = nextState;
  const root = ensureShadowRoot();
  if (!root) {
    return;
  }

  render(h(InlineWidget, { state: currentState }), root);
}

function createBlockedState(reason: string): InlineWidgetState {
  return {
    surface: 'blocked',
    product: null,
    status: reason,
    nutriScore: 'N'
  };
}

function requestOpenFoodFacts(product: ScrapedProduct) {
  const normalizedQuery = product.normalizedName || normalizeText(product.name);
  const barcode = normalizeBarcode(product.barcode) || undefined;

  chrome.runtime.sendMessage({ type: 'LOOKUP_OFF', query: product.name, normalizedQuery, barcode }, (response) => {
    if (chrome.runtime.lastError) {
      renderWidget(createBlockedState(`OFF lookup unavailable: ${chrome.runtime.lastError.message}`));
      return;
    }

    if (!response?.products?.length) {
      const seed = carrefourKenyaOpenFoodFactsSeeds[0];
      renderWidget({
        ...currentState,
        status: `No OFF match yet. Seed catalog starts with ${seed?.label ?? 'Kenyan products'}`
      });
      return;
    }

    const bestMatch = response.products[0] as { product_name?: string; nutriscore_grade?: string; nutriments?: Record<string, number | string> };
    const computedScore = response.score ?? computeNutriScore({
      energyKj: Number(bestMatch.nutriments?.['energy-kj_100g'] ?? NaN),
      sugarsG: Number(bestMatch.nutriments?.['sugars_100g'] ?? NaN),
      saturatedFatG: Number(bestMatch.nutriments?.['saturated-fat_100g'] ?? NaN),
      sodiumMg: Number(bestMatch.nutriments?.['sodium_100g'] ?? NaN) * 1000,
      fiberG: Number(bestMatch.nutriments?.['fiber_100g'] ?? NaN),
      proteinG: Number(bestMatch.nutriments?.['proteins_100g'] ?? NaN),
      fruitVegNutsPercent: Number(bestMatch.nutriments?.['fruits-vegetables-nuts-estimate-from-ingredients_100g'] ?? NaN)
    });

    renderWidget({
      surface: currentState.surface,
      product: {
        retailer: 'carrefour',
        url: location.href,
        name: bestMatch.product_name ?? product.name,
        normalizedName: normalizedQuery,
        barcode,
        source: 'open-food-facts',
        priceText: product.priceText,
        priceValue: product.priceValue,
        currency: product.currency,
        packSize: product.packSize,
        category: product.category,
        imageUrl: product.imageUrl
      },
      status: `Matched Open Food Facts product: ${bestMatch.product_name ?? product.name}`,
      nutriScore: (bestMatch.nutriscore_grade?.toUpperCase() as InlineWidgetState['nutriScore']) ?? computedScore.letter
    });

    chrome.runtime.sendMessage({
      type: 'SAVE_SCAN',
      product: {
        retailer: 'carrefour',
        url: location.href,
        name: bestMatch.product_name ?? product.name,
        normalizedName: normalizedQuery,
        barcode,
        source: 'open-food-facts',
        priceText: product.priceText,
        priceValue: product.priceValue,
        currency: product.currency,
        packSize: product.packSize,
        category: product.category,
        imageUrl: product.imageUrl
      },
      score: {
        letter: computedScore.letter,
        scoreValue: computedScore.score,
        rawPoints: computedScore.components,
        formulaVersion: 'nutriscore-v2026.1',
        source: 'formula'
      }
    }, () => void chrome.runtime.lastError);
  });
}

function scanAndRender() {
  const result = scrapeCarrefourPage(document);

  if (result.surface === 'blocked') {
    renderWidget(createBlockedState('Carrefour Kenya is serving a protection shell in this environment; waiting for a real browser session.'));
    return;
  }

  const firstProduct = result.products[0] ?? null;
  if (firstProduct) {
    renderWidget({
      surface: result.surface,
      product: firstProduct,
      status: `Detected ${result.products.length} product card(s)`,
      nutriScore: currentState.nutriScore
    });
    chrome.runtime.sendMessage({ type: 'SAVE_SCAN', product: firstProduct }, () => void chrome.runtime.lastError);
    requestOpenFoodFacts({ ...firstProduct, normalizedName: firstProduct.normalizedName || normalizeText(firstProduct.name) });
    return;
  }

  renderWidget({
    surface: result.surface,
    product: null,
    status: 'Waiting for Carrefour product markup',
    nutriScore: currentState.nutriScore
  });
}

function boot() {
  scanAndRender();
  if (document.body) {
    observeDomMutations(document.body, scanAndRender);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
