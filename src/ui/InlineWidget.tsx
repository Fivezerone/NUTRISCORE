import type { ScrapedProduct } from '../shared/messages';

export type InlineWidgetState = {
  surface: string;
  product?: ScrapedProduct | null;
  status: string;
  nutriScore?: string;
};

export type InlineWidgetProps = {
  state: InlineWidgetState;
};

export function InlineWidget({ state }: InlineWidgetProps) {
  const name = state.product?.name ?? 'Waiting for Carrefour product markup';
  const normalizedName = state.product?.normalizedName ?? 'normalized product name pending';
  const barcode = state.product?.barcode ?? 'barcode pending';
  const price = state.product?.priceText ?? 'No price captured yet';
  const packSize = state.product?.packSize ?? 'Pack size pending';
  const score = state.nutriScore ?? 'N';
  const source = state.product?.source ?? 'carrefour';

  return (
    <section class="panel">
      <style>{`
        :host {
          all: initial;
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
        }
        .panel {
          box-sizing: border-box;
          border: 1px solid rgba(15, 23, 42, 0.12);
          border-radius: 16px;
          background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96));
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18);
          padding: 16px;
          color: #0f172a;
        }
        .eyebrow {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #64748b;
        }
        .score {
          margin-top: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 72px;
          height: 72px;
          border-radius: 999px;
          font-size: 28px;
          font-weight: 700;
          color: white;
          background: linear-gradient(135deg, #16a34a, #22c55e);
        }
        .meta {
          margin-top: 12px;
          display: grid;
          gap: 8px;
          font-size: 13px;
        }
        .caption {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(15, 23, 42, 0.08);
          color: #475569;
          font-size: 12px;
          line-height: 1.45;
        }
        .meta strong {
          display: block;
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
      `}</style>
      <div class="eyebrow">NutriScore checkout tool</div>
      <div class="score" aria-label="NutriScore letter">{score}</div>
      <div class="meta">
        <div><strong>Retailer</strong>{source}</div>
        <div><strong>Surface</strong>{state.surface}</div>
        <div><strong>Product</strong>{name}</div>
        <div><strong>Normalized</strong>{normalizedName}</div>
        <div><strong>Barcode</strong>{barcode}</div>
        <div><strong>Price</strong>{price}</div>
        <div><strong>Pack size</strong>{packSize}</div>
        <div><strong>Status</strong>{state.status}</div>
      </div>
      <div class="caption">
        Carrefour Kenya products are normalized with barcode-first enrichment, cached Open Food Facts lookups, and formula-based Nutri-Score scoring.
      </div>
    </section>
  );
}
