import type { DBSchema } from 'idb';
import type { ProductRecord, ScanRecord, ScoreRecord, HistoryRecord } from './nutriscore-db';

export const NUTRISCORE_DB_NAME = 'nutriscore';
export const NUTRISCORE_DB_VERSION = 1;

export interface NutriScoreSchema extends DBSchema {
  products: {
    key: string;
    value: ProductRecord;
    indexes: {
      by_name: string;
      by_category: string;
      by_barcode: string;
    };
  };
  scans: {
    key: number;
    value: ScanRecord;
    indexes: {
      by_productId: string;
      by_scannedAt: number;
    };
  };
  scores: {
    key: number;
    value: ScoreRecord;
    indexes: {
      by_productId: string;
      by_letter: string;
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
}
