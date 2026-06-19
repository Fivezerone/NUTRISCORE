import { openDB, type IDBPDatabase } from 'idb';
import { NUTRISCORE_DB_NAME, NUTRISCORE_DB_VERSION, type HistoryRecord, type LookupCacheRecord, type NutriScoreSchema, type ProductRecord, type ScanRecord, type ScoreRecord } from './schema';

export type { HistoryRecord, LookupCacheRecord, ProductRecord, ScanRecord, ScoreRecord } from './schema';

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
        products.createIndex('by_normalizedName', 'normalizedName');

        const scans = database.createObjectStore('scans', { keyPath: 'id', autoIncrement: true });
        scans.createIndex('by_productId', 'productId');
        scans.createIndex('by_scannedAt', 'scannedAt');
        scans.createIndex('by_dedupeKey', 'dedupeKey', { unique: true });

        const scores = database.createObjectStore('scores', { keyPath: 'id', autoIncrement: true });
        scores.createIndex('by_productId', 'productId');
        scores.createIndex('by_letter', 'nutriScoreLetter');
        scores.createIndex('by_createdAt', 'createdAt');

        const history = database.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
        history.createIndex('by_productId', 'productId');
        history.createIndex('by_day', 'day');

        const lookups = database.createObjectStore('lookups', { keyPath: 'cacheKey' });
        lookups.createIndex('by_normalizedQuery', 'normalizedQuery');
        lookups.createIndex('by_barcode', 'barcode');
        lookups.createIndex('by_expiresAt', 'expiresAt');
      }
    });
  }

  return databasePromise;
}

export function productIdFromName(retailer: string, barcode: string | undefined, normalizedName: string) {
  const basis = barcode ? `barcode-${barcode}` : normalizedName;
  return `${retailer}:${basis.replace(/[^a-z0-9]+/g, '-')}`;
}

export function upsertProduct(product: ProductRecord) {
  return withDatabase(async (database) => {
    const existing = product.barcode
      ? await database.getFromIndex('products', 'by_barcode', product.barcode)
      : await database.getFromIndex('products', 'by_normalizedName', product.normalizedName);

    const merged = existing
      ? { ...existing, ...product, id: existing.id, updatedAt: Date.now(), lastSeenAt: Date.now() }
      : { ...product, updatedAt: Date.now(), lastSeenAt: Date.now() };

    await database.put('products', merged);
    return merged;
  });
}

export function listProducts() {
  return withDatabase((database) => database.getAll('products'));
}

export function findProductByBarcode(barcode: string) {
  return withDatabase((database) => database.getFromIndex('products', 'by_barcode', barcode));
}

export function findProductByNormalizedName(normalizedName: string) {
  return withDatabase((database) => database.getFromIndex('products', 'by_normalizedName', normalizedName));
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

export function listLookups() {
  return withDatabase((database) => database.getAll('lookups'));
}

export function getDashboardStats() {
  return withDatabase(async (database) => ({
    products: await database.count('products'),
    scans: await database.count('scans'),
    scores: await database.count('scores'),
    history: await database.count('history'),
    lookups: await database.count('lookups')
  }));
}

export function listRecentProducts(limit = 8) {
  return withDatabase(async (database) => {
    const all = await database.getAll('products');
    return all.sort((left, right) => right.lastSeenAt - left.lastSeenAt).slice(0, limit);
  });
}

export function listRecentScans(limit = 12) {
  return withDatabase(async (database) => {
    const all = await database.getAll('scans');
    return all.sort((left, right) => right.scannedAt - left.scannedAt).slice(0, limit);
  });
}

export function listRecentScores(limit = 12) {
  return withDatabase(async (database) => {
    const all = await database.getAll('scores');
    return all.sort((left, right) => right.createdAt - left.createdAt).slice(0, limit);
  });
}

export function listRecentHistory(limit = 12) {
  return withDatabase(async (database) => {
    const all = await database.getAll('history');
    return all.sort((left, right) => right.lastSeenAt - left.lastSeenAt).slice(0, limit);
  });
}

export async function upsertLookupCache(record: LookupCacheRecord) {
  return withDatabase(async (database) => {
    await database.put('lookups', record);
    return record;
  });
}

export async function getLookupCache(cacheKey: string) {
  return withDatabase((database) => database.get('lookups', cacheKey));
}

export function pruneExpiredLookups() {
  return withDatabase(async (database) => {
    const expired = await database.getAllFromIndex('lookups', 'by_expiresAt');
    const now = Date.now();
    await Promise.all(expired.filter((entry) => entry.expiresAt <= now).map((entry) => database.delete('lookups', entry.cacheKey)));
  });
}

export function addScan(scan: ScanRecord) {
  return withDatabase(async (database) => {
    try {
      const key = await database.add('scans', scan);
      return { ...scan, id: Number(key) };
    } catch (error) {
      const existing = await database.getFromIndex('scans', 'by_dedupeKey', scan.dedupeKey);
      if (existing) {
        return existing;
      }

      throw error;
    }
  });
}

export function saveScore(score: ScoreRecord) {
  return withDatabase(async (database) => {
    const existing = await database.getAllFromIndex('scores', 'by_productId', score.productId);
    const matching = existing.find((entry) => entry.formulaVersion === score.formulaVersion && entry.nutriScoreLetter === score.nutriScoreLetter && entry.scoreValue === score.scoreValue);
    if (matching) {
      return matching;
    }

    const key = await database.add('scores', score);
    return { ...score, id: Number(key) };
  });
}

export function recordHistory(historyEntry: HistoryRecord) {
  return withDatabase(async (database) => {
    const existing = await database.getAllFromIndex('history', 'by_productId', historyEntry.productId);
    const sameDay = existing.find((entry) => entry.day === historyEntry.day);
    if (sameDay) {
      const merged = { ...sameDay, lastSeenAt: historyEntry.lastSeenAt, totalScans: sameDay.totalScans + historyEntry.totalScans };
      await database.put('history', merged);
      return merged;
    }

    const key = await database.put('history', historyEntry);
    return { ...historyEntry, id: Number(key) };
  });
}
