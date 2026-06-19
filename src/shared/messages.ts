export type RetailerName = 'carrefour';

export type ScrapedProduct = {
  retailer: RetailerName;
  url: string;
  name: string;
  normalizedName: string;
  barcode?: string;
  source?: 'carrefour' | 'open-food-facts';
  priceText?: string;
  priceValue?: number;
  currency?: string;
  packSize?: string;
  category?: string;
  imageUrl?: string;
};

export type OpenFoodFactsHit = {
  code: string;
  product_name?: string;
  brands?: string;
  quantity?: string;
  categories?: string;
  nutriscore_grade?: string;
  image_small_url?: string;
};

export type LookupRequest = {
  type: 'LOOKUP_OFF';
  barcode?: string;
  query: string;
  normalizedQuery: string;
};

export type SaveScanRequest = {
  type: 'SAVE_SCAN';
  product: ScrapedProduct;
  score?: {
    letter: 'A' | 'B' | 'C' | 'D' | 'E';
    scoreValue: number;
    rawPoints: Record<string, number>;
    formulaVersion: string;
    source: 'formula' | 'open-food-facts';
  };
};

export type MessageRequest = LookupRequest | SaveScanRequest;
