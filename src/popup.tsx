import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { getDashboardStats, listRecentProducts, listRecentScans, listRecentScores } from './storage/nutriscore-db';
import type { ProductRecord, ScanRecord, ScoreRecord } from './storage/nutriscore-db';

type PopupState = {
  loading: boolean;
  products: ProductRecord[];
  scans: ScanRecord[];
  scores: ScoreRecord[];
  stats: { products: number; scans: number; scores: number; history: number; lookups: number } | null;
};

const appStyles = `
  :root {
    color-scheme: light;
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
    background:
      radial-gradient(circle at top, rgba(34, 197, 94, 0.14), transparent 42%),
      linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
    color: #0f172a;
  }
  body {
    margin: 0;
    min-width: 360px;
  }
  .shell {
    padding: 16px;
  }
  .card {
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
    padding: 16px;
  }
  .title {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
  }
  .subtitle {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 13px;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-top: 16px;
  }
  .stat {
    border-radius: 16px;
    background: linear-gradient(180deg, rgba(240, 253, 244, 0.98), rgba(255,255,255,0.95));
    padding: 12px;
    border: 1px solid rgba(34, 197, 94, 0.16);
  }
  .stat strong {
    display: block;
    font-size: 22px;
    line-height: 1;
  }
  .stat span {
    color: #64748b;
    font-size: 12px;
  }
  .actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }
  button {
    appearance: none;
    border: 0;
    border-radius: 999px;
    padding: 10px 14px;
    background: #0f172a;
    color: white;
    font-weight: 600;
    cursor: pointer;
  }
  .list {
    margin-top: 16px;
    display: grid;
    gap: 10px;
  }
  .item {
    display: grid;
    gap: 4px;
    padding: 12px;
    border-radius: 14px;
    background: white;
    border: 1px solid rgba(15, 23, 42, 0.08);
  }
  .item strong {
    font-size: 14px;
  }
  .item small {
    color: #64748b;
    font-size: 12px;
  }
`;

function PopupApp() {
  const [state, setState] = useState<PopupState>({
    loading: true,
    products: [],
    scans: [],
    scores: [],
    stats: null
  });

  useEffect(() => {
    let active = true;

    Promise.all([listRecentProducts(6), listRecentScans(6), listRecentScores(6), getDashboardStats()])
      .then(([products, scans, scores, stats]) => {
        if (!active) {
          return;
        }

        setState({ loading: false, products, scans, scores, stats });
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setState({ loading: false, products: [], scans: [], scores: [], stats: null });
      });

    return () => {
      active = false;
    };
  }, []);

  const recentProduct = state.products[0];
  const bestScore = state.scores[0];

  return (
    <>
      <style>{appStyles}</style>
      <div class="shell">
        <section class="card">
          <h1 class="title">NutriScore</h1>
          <p class="subtitle">Live IndexedDB view for the checkout widget</p>

          <div class="stats">
            <div class="stat"><strong>{state.stats?.products ?? state.products.length}</strong><span>Products</span></div>
            <div class="stat"><strong>{state.stats?.scans ?? state.scans.length}</strong><span>Scans</span></div>
            <div class="stat"><strong>{state.stats?.scores ?? state.scores.length}</strong><span>Scores</span></div>
          </div>

          <div class="actions">
            <button type="button" onClick={() => chrome.runtime.openOptionsPage()}>Open dashboard</button>
          </div>

          <div class="list">
            {state.loading ? (
              <div class="item">
                <strong>Loading IndexedDB</strong>
                <small>Reading products, scans, and scores from the live schema.</small>
              </div>
            ) : recentProduct ? (
              <div class="item">
                <strong>{recentProduct.name}</strong>
                <small>{recentProduct.barcode ?? recentProduct.normalizedName}</small>
                <small>{recentProduct.priceText ?? 'No price captured yet'} {recentProduct.currency ?? ''}</small>
                <small>{recentProduct.packSize ?? 'No pack size captured yet'}</small>
              </div>
            ) : bestScore ? (
              <div class="item">
                <strong>Latest score: {bestScore.nutriScoreLetter}</strong>
                <small>Formula version {bestScore.formulaVersion}</small>
                <small>{JSON.stringify(bestScore.rawPoints)}</small>
              </div>
            ) : (
              <div class="item">
                <strong>No stored products yet</strong>
                <small>Run the Carrefour scraper to populate the local store.</small>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

render(<PopupApp />, document.getElementById('app') as HTMLElement);
