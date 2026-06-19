// Background service worker (Manifest V3).
//
// Responsibilities this file owns RIGHT NOW (Phase 1):
//   - Listen for SCORE_PRODUCT messages from the content script
//   - Stub-respond with `status: "unscored"` so the badge shows its
//     "not scored yet" state rather than hanging on loading forever
//   - Keep the chrome.storage.session alive across event-page restarts
//
// Phase 2 wires in real scoring here:
//   - Call Open Food Facts REST API
//   - Fall back to the curated Kenyan-products JSON dataset
//   - Run the Nutri-Score calculation
//   - Cache results in chrome.storage.local so repeat page loads are instant
//
// Do NOT import any DOM APIs here — service workers have no window/document.
// Do NOT use Manifest V2 persistent background page patterns (addListener
// must be called at the top level, not inside a Promise).

import type { ScoreRequestMessage, ScoreResponseMessage } from "../shared/messaging";

chrome.runtime.onMessage.addListener(
  (message: ScoreRequestMessage, _sender, sendResponse): boolean => {
    if (message.type !== "SCORE_PRODUCT") return false;

    // --- Phase 1 stub -------------------------------------------------------
    // Returns `unscored` immediately. Phase 2 replaces this block with a
    // real async lookup. The boolean `true` return tells Chrome we intend
    // to call sendResponse asynchronously (required even when we respond
    // synchronously via a nested function, to keep the port open).
    const response: ScoreResponseMessage = { status: "unscored" };
    sendResponse(response);
    return true;
    // ------------------------------------------------------------------------

    // Phase 2 async block (uncomment when score engine is ready):
    // handleScoreRequest(message.payload).then(sendResponse).catch(() => {
    //   sendResponse({ status: "error", message: "Score engine failure" });
    // });
    // return true;
  }
);

// Keep service worker alive during development.
// Swap this out for a proper keep-alive strategy before store submission.
chrome.runtime.onInstalled.addListener(() => {
  console.log("[NutriScore] Extension installed. Background worker ready.");
});
