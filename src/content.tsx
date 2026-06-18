import { h, render } from 'preact';
import { kenyaOpenFoodFactsSeeds } from './data/kenya-open-food-facts-seeds';
import { InlineWidget } from './ui/InlineWidget';
import { observeDomMutations } from './scraper/observer';
import { scrapeJumiaPage } from './scraper/jumia';
import type { InlineWidgetState } from './ui/InlineWidget';

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

function requestOpenFoodFacts(productName: string) {
  chrome.runtime.sendMessage({ type: 'LOOKUP_OFF', query: productName }, (response) => {
    if (chrome.runtime.lastError) {
      renderWidget(createBlockedState(`OFF lookup unavailable: ${chrome.runtime.lastError.message}`));
      return;
    }

    if (!response?.products?.length) {
      const seed = kenyaOpenFoodFactsSeeds[0];
      renderWidget({
        ...currentState,
        status: `No OFF match yet. Seed catalog starts with ${seed?.label ?? 'Kenya products'}`
      });
      return;
    }

    const bestMatch = response.products[0] as { product_name?: string; nutriscore_grade?: string };
    renderWidget({
      surface: currentState.surface,
      product: {
        retailer: 'jumia',
        url: location.href,
        name: bestMatch.product_name ?? productName
      },
      status: `Matched Open Food Facts product: ${bestMatch.product_name ?? 'unknown'}`,
      nutriScore: bestMatch.nutriscore_grade?.toUpperCase() ?? currentState.nutriScore
    });
  });
}

function scanAndRender() {
  const result = scrapeJumiaPage(document);

  if (result.surface === 'blocked') {
    renderWidget(createBlockedState('Jumia is serving a protection shell in this environment; waiting for a real browser session.'));
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
    requestOpenFoodFacts(firstProduct.name);
    return;
  }

  renderWidget({
    surface: result.surface,
    product: null,
    status: 'Waiting for Jumia product markup',
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
