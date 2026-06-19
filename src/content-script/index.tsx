// Content script — runs in the context of Jumia product/category/checkout
// pages. This is what makes the extension actually work in a browser tab.
//
// What this does:
//   1. Finds product cards matching the Jumia adapter's selector
//   2. For each card, creates a Shadow DOM host element so the widget CSS
//      is fully isolated from Jumia's own stylesheet (no bleed either way)
//   3. Mounts a React root inside that Shadow DOM
//   4. Sends a SCORE_PRODUCT message to the background service worker
//   5. Renders NutriScoreBadge with the response state
//   6. Sets up a MutationObserver to catch cards added after page load
//      (Jumia's listing and cart pages render asynchronously via XHR)
//
// What this deliberately does NOT do yet (Phase 2+):
//   - Real score lookup (background worker stubs `unscored` for now)
//   - Checkout-page cart-item detection (CHECKOUT_SELECTORS not yet filled in)
//   - IndexedDB writes (Phase 3 / dashboard feed)

import React from "react";
import { createRoot } from "react-dom/client";

import { getAdapterForHostname } from "../scraper/adapters";
import type { ScoreRequestMessage, ScoreResponseMessage } from "../shared/messaging";
import type { BadgeState } from "../shared/nutriscore/widget/NutriScoreBadge";
import { NutriScoreBadge } from "../shared/nutriscore/widget/NutriScoreBadge";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const INJECTED_ATTR = "data-nutriscore-injected";

/**
 * Build a Shadow DOM host element, append it into `anchor`, and return a
 * React root ready to render into it — plus a mechanism to push an updated
 * CSS URL in once the build knows the final hashed filename.
 */
function createShadowRoot(anchor: Element): {
  root: ReturnType<typeof createRoot>;
  shadowRoot: ShadowRoot;
} {
  const host = document.createElement("span");
  // Positioning: sit to the right of the price element without shifting
  // Jumia's existing layout. `display: inline-block` + relative lets the
  // badge's absolute-positioned expansion panel escape without scrolling.
  host.style.cssText = "display:inline-block;position:relative;vertical-align:middle;margin-left:8px;z-index:9999;";

  const shadowRoot = host.attachShadow({ mode: "open" });

  // Inject the widget's compiled CSS into the Shadow DOM. Tailwind classes
  // used inside `NutriScoreBadge` only work if the stylesheet is scoped
  // inside the shadow root — the host page's `<head>` stylesheet doesn't
  // reach in. `chrome.runtime.getURL` gives us the extension-bundle path.
  // Vite names this `assets/widget.css` (see vite.config.ts).
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL("assets/widget.css");
  shadowRoot.appendChild(link);

  // Mount point for React
  const mountPoint = document.createElement("div");
  shadowRoot.appendChild(mountPoint);

  anchor.appendChild(host);

  return { root: createRoot(mountPoint), shadowRoot };
}

/**
 * Render the badge for one product card. Fires off a message to the
 * background worker and re-renders when the response arrives.
 */
function injectBadge(card: Element, adapter: ReturnType<typeof getAdapterForHostname>): void {
  if (!adapter) return;
  if (card.hasAttribute(INJECTED_ATTR)) return; // idempotent
  card.setAttribute(INJECTED_ATTR, "true");

  const scraped = adapter.extract(card);
  if (!scraped) {
    // Card matched the selector but extract() decided it wasn't a product
    card.removeAttribute(INJECTED_ATTR);
    return;
  }

  const anchor = adapter.getAnchor ? adapter.getAnchor(card) : card;
  if (!anchor) return;

  const { root } = createShadowRoot(anchor);

  // Initial render — show the spinner while we wait for the score
  const render = (state: BadgeState) =>
    root.render(React.createElement(NutriScoreBadge, { state }));

  render({ status: "loading" });

  const request: ScoreRequestMessage = {
    type: "SCORE_PRODUCT",
    payload: {
      name: scraped.name,
      price: scraped.price,
      packSize: scraped.packSize,
      sourceUrl: scraped.sourceUrl,
    },
  };

  chrome.runtime.sendMessage(request, (response: ScoreResponseMessage | undefined) => {
    if (chrome.runtime.lastError) {
      render({ status: "error", message: chrome.runtime.lastError.message });
      return;
    }
    if (!response) {
      render({ status: "error", message: "No response from background" });
      return;
    }

    if (response.status === "scored") {
      render({ status: "scored", product: response.product });
    } else if (response.status === "unscored") {
      render({ status: "unscored" });
    } else {
      render({ status: "error", message: response.message });
    }
  });
}

// ─── Main entry ──────────────────────────────────────────────────────────────

function main() {
  const hostname = window.location.hostname;
  const adapter = getAdapterForHostname(hostname);

  if (!adapter) {
    // Not a supported retailer. This shouldn't happen because manifest.json
    // already restricts content_scripts.matches to supported hostnames, but
    // guard defensively so a future manifest error doesn't crash loudly.
    return;
  }

  // ── First pass: inject into all cards already in the DOM ──
  document.querySelectorAll(adapter.productCardSelector).forEach((card) => {
    injectBadge(card, adapter);
  });

  // ── MutationObserver: catch cards added after first render ──
  // Jumia loads product grids asynchronously (XHR + DOM insertion), so we
  // can't rely on the first-pass querySelectorAll alone. The observer fires
  // on any subtree change and runs a fast selector check — no-op if there
  // are no new cards (most mutations on Jumia are minor UI updates).
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue;

        // The added node might BE a product card
        if (node.matches(adapter.productCardSelector)) {
          injectBadge(node, adapter);
        }

        // …or it might CONTAIN product cards
        node.querySelectorAll(adapter.productCardSelector).forEach((card) => {
          injectBadge(card, adapter);
        });
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

main();
