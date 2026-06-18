import { openDB, type IDBPDatabase } from 'idb';
import type { ScrapedProduct } from '../shared/messages';
import { NUTRISCORE_DB_NAME, NUTRISCORE_DB_VERSION, type NutriScoreSchema } from './schema';

export type ProductRecord = ScrapedProduct & {
  id: string;
  barcode?: string;
  source?: 'jumia' | 'open-food-facts';
  updatedAt: number;
};

export type ScanRecord = {
  id?: number;
  productId: string;
  scannedAt: number;
  pageUrl: string;
  surface: 'grid' | 'detail' | 'basket' | 'unknown';
};

export type ScoreRecord = {
  id?: number;
  productId: string;
  nutriScoreLetter: string;
  rawPoints: Record<string, number>;
  createdAt: number;
};

export type HistoryRecord = {
  id?: number;
  productId: string;
  day: string;
  lastSeenAt: number;
  totalScans: number;
};

let databasePromise: Promise<IDBPDatabase<NutriScoreSchema>> | undefined;

function withDatabase<T>(operation: (database: IDBPDatabase<NutriScoreSchema>) => Promise<T>) {
  return openDatabase().then(operation).catch((error: unknown) => {
    throw error instanceof Error ? error : new Error(String(error));
  });
}

export function openDatabase() {
  if (!databasePromise) {
    databasePromise = openDB<NutriScoreSchema>(NUTRISCORE_DB_NAME, NUTRISCORE_DB_VERSION, {
      upgrade(database) {
        const products = database.createObjectStore('products', { keyPath: 'id' });
        products.createIndex('by_name', 'name');
        products.createIndex('by_category', 'category');
        products.createIndex('by_barcode', 'barcode');

        const scans = database.createObjectStore('scans', { keyPath: 'id', autoIncrement: true });
        scans.createIndex('by_productId', 'productId');
        scans.createIndex('by_scannedAt', 'scannedAt');

        const scores = database.createObjectStore('scores', { keyPath: 'id', autoIncrement: true });
        scores.createIndex('by_productId', 'productId');
        scores.createIndex('by_letter', 'nutriScoreLetter');

        const history = database.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
        history.createIndex('by_productId', 'productId');
        history.createIndex('by_day', 'day');
      }
    });
  }

  return databasePromise;
}

export function productIdFromName(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function upsertProduct(product: ProductRecord) {
  return withDatabase(async (database) => {
    await database.put('products', product);
    return product;
  });
}

export function listProducts() {
  return withDatabase((database) => database.getAll('products'));
}

export function listScans() {
  return withDatabase((database) => database.getAll('scans'));
}

export function listScores() {
  return withDatabase((database) => database.getAll('scores'));
}

export function listHistory() {
  return withDatabase((database) => database.getAll('history'));
}

export function addScan(scan: ScanRecord) {
  return withDatabase(async (database) => {
    const key = await database.add('scans', scan);
    return { ...scan, id: Number(key) };
  });
}

export function saveScore(score: ScoreRecord) {
  return withDatabase(async (database) => {
    const key = await database.add('scores', score);
    return { ...score, id: Number(key) };
  });
}

export function recordHistory(historyEntry: HistoryRecord) {
  return withDatabase(async (database) => {
    const key = await database.put('history', historyEntry);
    return { ...historyEntry, id: Number(key) };
  });
}
