import { initDb } from '../db';
import { SqliteStorageAdapter } from './sqliteAdapter';
import { BlobsStorageAdapter } from './blobsAdapter';
import type { StorageAdapter } from './types';

export function isNetlify(): boolean {
  return process.env.NETLIFY === 'true';
}

let cachedAdapter: StorageAdapter | null = null;

export async function getStorageAdapter(): Promise<StorageAdapter> {
  if (cachedAdapter) return cachedAdapter;

  if (isNetlify()) {
    cachedAdapter = new BlobsStorageAdapter();
  } else {
    const db = await initDb();
    cachedAdapter = new SqliteStorageAdapter(db);
  }

  return cachedAdapter;
}
