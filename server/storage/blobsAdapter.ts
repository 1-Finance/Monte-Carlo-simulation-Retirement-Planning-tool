import { getStore } from '@netlify/blobs';
import type {
  StorageAdapter,
  QuarterlyReturnsPayload,
  ExpenseProfile,
  SavedSimulationPayload,
} from './types';

const quarterlyStore = () => getStore('quarterly-returns');
const expenseStore = () => getStore('expense-profiles');
const simStore = () => getStore('saved-simulations');
const paramsStore = () => getStore('parameters');

// Quarterly returns are shared globally across all users, so they live under a single fixed key.
const GLOBAL_QUARTERLY_KEY = 'shared';

export class BlobsStorageAdapter implements StorageAdapter {
  async getQuarterlyReturns(): Promise<QuarterlyReturnsPayload | null> {
    return (await quarterlyStore().get(GLOBAL_QUARTERLY_KEY, { type: 'json' })) as QuarterlyReturnsPayload | null;
  }

  async saveQuarterlyReturns(payload: QuarterlyReturnsPayload): Promise<void> {
    await quarterlyStore().setJSON(GLOBAL_QUARTERLY_KEY, payload);
  }

  async getExpenseProfiles(userId: string): Promise<ExpenseProfile[]> {
    const index = (await expenseStore().get(`${userId}/_index`, { type: 'json' })) as string[] | null;
    if (!index || index.length === 0) return [];

    const profiles = await Promise.all(
      index.map((name) => expenseStore().get(`${userId}/${name}`, { type: 'json' }) as Promise<ExpenseProfile | null>)
    );
    return profiles.filter((p): p is ExpenseProfile => p !== null);
  }

  async saveExpenseProfile(userId: string, profile: ExpenseProfile): Promise<void> {
    const index = ((await expenseStore().get(`${userId}/_index`, { type: 'json' })) as string[] | null) ?? [];
    if (!index.includes(profile.name)) index.push(profile.name);
    await expenseStore().setJSON(`${userId}/_index`, index);
    await expenseStore().setJSON(`${userId}/${profile.name}`, profile);
  }

  async deleteExpenseProfile(userId: string, profileName: string): Promise<void> {
    const index = ((await expenseStore().get(`${userId}/_index`, { type: 'json' })) as string[] | null) ?? [];
    await expenseStore().setJSON(`${userId}/_index`, index.filter((n) => n !== profileName));
    await expenseStore().delete(`${userId}/${profileName}`);
  }

  async getSavedSimulation(userId: string, profileName: string): Promise<SavedSimulationPayload | null> {
    return (await simStore().get(`${userId}/${profileName}`, { type: 'json' })) as SavedSimulationPayload | null;
  }

  async saveSavedSimulation(userId: string, profileName: string, payload: SavedSimulationPayload): Promise<void> {
    await simStore().setJSON(`${userId}/${profileName}`, payload);
  }

  async getParameters(userId: string): Promise<Record<string, unknown> | null> {
    return (await paramsStore().get(userId, { type: 'json' })) as Record<string, unknown> | null;
  }

  async saveParameters(userId: string, params: Record<string, unknown>): Promise<void> {
    await paramsStore().setJSON(userId, params);
  }
}
