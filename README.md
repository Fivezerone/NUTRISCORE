# NutriScore Checkout Tool

A Chrome extension (Manifest V3) that scores grocery products nutritionally at checkout on Jumia Kenya — built during the AfyaVentures internship program at JHUB Africa, JKUAT.

**Project:** NUT-04 | AfyaVentures Nutrition Theme

---

## Architecture

Three independent browser execution contexts, each its own entry point and bundle:

| Context | Entry | What it does |
|---|---|---|
| Content Script | `src/content-script/index.tsx` | Scrapes Jumia product cards, injects NutriScore badges into a **Shadow DOM** root per card, messages the background worker for scores |
| Background Service Worker | `src/background/service-worker.ts` | Receives `SCORE_PRODUCT` messages, queries Open Food Facts + curated Kenyan dataset, runs Nutri-Score formula, returns result |
| Popup | `src/popup/` | Toolbar popup — lists products scanned on the current tab with their grades |
| Dashboard | `src/dashboard/` | Full-page trend history and category breakdown read from IndexedDB |

Shared primitives, types, constants, and the production badge component live in `src/shared/`.

---

## Local Development

```bash
npm install
npm run type-check
npm run build

# Load in Chrome:
# chrome://extensions → Developer mode ON → Load unpacked → select dist/
```

`npm run dev` works for previewing popup and dashboard in a browser tab. The content script and service worker need a real build + sideload cycle.

---

## Phase Map (12-week plan)

| Phase | Weeks | Status |
|---|---|---|
| 1. Foundations & Jumia scraper | 1–3 | 🔨 In progress |
| 2. Nutrition data & score engine | 3–5 | ⏳ Pending |
| 3. Score widget (Shadow DOM) | 5–6 | ✅ Structure done, wires real scores in Phase 2 |
| 4. Comparison & alternatives | 6–8 | ⏳ Pending |
| 5. History dashboard, multi-retailer | 8–10 | ⏳ Pending |
| 6. Privacy docs & store submission | 10–12 | ⏳ Pending |

---

## Target Retailer — Phase 1

**Jumia Kenya** (`www.jumia.co.ke`)

Scraper adapter: `src/scraper/adapters/jumia.ts`
- Listing card: `a.core` → name `.name`, price `.prc`
- Checkout selectors: **TODO** — verify in Chrome DevTools on live cart page (Week 1)
