import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { listHistory, listProducts, listScans, listScores } from './storage/nutriscore-db';
import type { HistoryRecord, ProductRecord, ScanRecord, ScoreRecord } from './storage/nutriscore-db';

type DashboardState = {
  loading: boolean;
  products: ProductRecord[];
  scans: ScanRecord[];
  scores: ScoreRecord[];
  history: HistoryRecord[];
};

const styles = `
  :root {
    color-scheme: light;
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
    color: #0f172a;
    background:
      radial-gradient(circle at top left, rgba(251, 191, 36, 0.16), transparent 32%),
      radial-gradient(circle at top right, rgba(34, 197, 94, 0.12), transparent 28%),
      linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
  }
  body { margin: 0; }
  .page { padding: 24px; }
  .hero {
    border-radius: 28px;
    padding: 24px;
    background: rgba(255, 255, 255, 0.84);
    border: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow: 0 30px 80px rgba(15, 23, 42, 0.12);
  }
  h1 { margin: 0; font-size: 30px; }
  p { color: #64748b; }
  .grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-top: 20px;
  }
  .metric {
    padding: 16px;
    border-radius: 18px;
    background: white;
    border: 1px solid rgba(15, 23, 42, 0.08);
  }
  .metric strong { display: block; font-size: 28px; line-height: 1; }
  .metric span { color: #64748b; font-size: 12px; }
  .section { margin-top: 24px; }
  table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
  }
  th, td {
    text-align: left;
    padding: 12px 14px;
    border-bottom: 1px solid rgba(15, 23, 42, 0.06);
    vertical-align: top;
    font-size: 13px;
  }
  th { background: #f8fafc; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
  .tables { display: grid; gap: 20px; margin-top: 20px; }
`;

function DashboardApp() {
  const [state, setState] = useState<DashboardState>({
    loading: true,
    products: [],
    scans: [],
    scores: [],
    history: []
  });

  useEffect(() => {
    let active = true;

    Promise.all([listProducts(), listScans(), listScores(), listHistory()])
      .then(([products, scans, scores, history]) => {
        if (!active) {
          return;
        }

        setState({ loading: false, products, scans, scores, history });
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setState({ loading: false, products: [], scans: [], scores: [], history: [] });
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <style>{styles}</style>
      <main class="page">
        <section class="hero">
          <h1>NutriScore Dashboard</h1>
          <p>Reading from the frozen IndexedDB schema version 1.</p>

          <div class="grid">
            <div class="metric"><strong>{state.products.length}</strong><span>Products</span></div>
            <div class="metric"><strong>{state.scans.length}</strong><span>Scans</span></div>
            <div class="metric"><strong>{state.scores.length}</strong><span>Scores</span></div>
            <div class="metric"><strong>{state.history.length}</strong><span>History rows</span></div>
          </div>

          <div class="tables">
            <section class="section">
              <h2>Products</h2>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Pack size</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {state.products.length ? state.products.map((product) => (
                    <tr>
                      <td>{product.name}</td>
                      <td>{product.priceText ?? '-'}</td>
                      <td>{product.packSize ?? '-'}</td>
                      <td>{product.category ?? '-'}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4}>No stored products yet.</td></tr>
                  )}
                </tbody>
              </table>
            </section>

            <section class="section">
              <h2>Scans</h2>
              <table>
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Surface</th>
                    <th>Page URL</th>
                    <th>Scanned at</th>
                  </tr>
                </thead>
                <tbody>
                  {state.scans.length ? state.scans.map((scan) => (
                    <tr>
                      <td>{scan.productId}</td>
                      <td>{scan.surface}</td>
                      <td>{scan.pageUrl}</td>
                      <td>{new Date(scan.scannedAt).toLocaleString()}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4}>No scans recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </section>

            <section class="section">
              <h2>Scores</h2>
              <table>
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Score</th>
                    <th>Raw points</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {state.scores.length ? state.scores.map((score) => (
                    <tr>
                      <td>{score.productId}</td>
                      <td>{score.nutriScoreLetter}</td>
                      <td>{JSON.stringify(score.rawPoints)}</td>
                      <td>{new Date(score.createdAt).toLocaleString()}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4}>No scores computed yet.</td></tr>
                  )}
                </tbody>
              </table>
            </section>

            <section class="section">
              <h2>History</h2>
              <table>
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Day</th>
                    <th>Last seen</th>
                    <th>Total scans</th>
                  </tr>
                </thead>
                <tbody>
                  {state.history.length ? state.history.map((entry) => (
                    <tr>
                      <td>{entry.productId}</td>
                      <td>{entry.day}</td>
                      <td>{new Date(entry.lastSeenAt).toLocaleString()}</td>
                      <td>{entry.totalScans}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4}>No history rows yet.</td></tr>
                  )}
                </tbody>
              </table>
            </section>
          </div>
        </section>
      </main>
    </>
  );
}

render(<DashboardApp />, document.getElementById('app') as HTMLElement);
