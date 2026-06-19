import type { DBSchema } from 'idb';
import type { NutriScoreLetter } from '../shared/nutriscore';

export const NUTRISCORE_DB_NAME = 'nutriscore';
export const NUTRISCORE_DB_VERSION = 2;

export type ProductRecord = {
  id: string;
  retailer: 'carrefour';
  url: string;
  name: string;
  normalizedName: string;
  barcode?: string;
  priceText?: string;
  priceValue?: number;
  currency?: string;
  packSize?: string;
  category?: string;
  imageUrl?: string;
  source: 'carrefour' | 'open-food-facts';
  updatedAt: number;
  lastSeenAt: number;
};

export type ScanRecord = {
  id?: number;
  retailer: 'carrefour';
  productId: string;
  scannedAt: number;
  pageUrl: string;
  surface: 'grid' | 'detail' | 'basket' | 'unknown';
  dedupeKey: string;
};

export type ScoreRecord = {
  id?: number;
  productId: string;
  nutriScoreLetter: NutriScoreLetter;
  scoreValue: number;
  rawPoints: Record<string, number>;
  createdAt: number;
  source: 'formula' | 'open-food-facts';
  formulaVersion: string;
};

export type HistoryRecord = {
  id?: number;
  productId: string;
  retailer: 'carrefour';
  day: string;
  lastSeenAt: number;
  totalScans: number;
};

export type LookupCacheRecord = {
  cacheKey: string;
  normalizedQuery: string;
  barcode?: string;
  response: unknown;
  fetchedAt: number;
  expiresAt: number;
};

export interface NutriScoreSchema extends DBSchema {
  products: {
    key: string;
    value: ProductRecord;
    indexes: {
      by_name: string;
      by_category: string;
      by_barcode: string;
      by_normalizedName: string;
    };
  };
  scans: {
    key: number;
    value: ScanRecord;
    indexes: {
      by_productId: string;
      by_scannedAt: number;
      by_dedupeKey: string;
    };
  };
  scores: {
    key: number;
    value: ScoreRecord;
    indexes: {
      by_productId: string;
      by_letter: string;
      by_createdAt: number;
    };
  };
  history: {
    key: number;
    value: HistoryRecord;
    indexes: {
      by_productId: string;
      by_day: string;
    };
  };
  lookups: {
    key: string;
    value: LookupCacheRecord;
    indexes: {
      by_normalizedQuery: string;
      by_barcode: string;
      by_expiresAt: number;
    };
  };
}
