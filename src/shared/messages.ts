export type RetailerName = 'jumia';

export type ScrapedProduct = {
  retailer: RetailerName;
  url: string;
  name: string;
  priceText?: string;
  packSize?: string;
  category?: string;
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
  query: string;
};

export type SaveScanRequest = {
  type: 'SAVE_SCAN';
  product: ScrapedProduct;
  score?: string;
};

export type MessageRequest = LookupRequest | SaveScanRequest;
