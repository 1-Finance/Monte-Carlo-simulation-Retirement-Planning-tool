import type { ChartData } from '../engine/chartCalculations';
import type { UserExpenseRow } from '../engine/excelParser';

const BASE = '/api';

export interface QuarterlyReturnsResponse {
  data: Array<{ date: string; equity: number; realEstate: number; commodity: number; debt: number; alternative: number }>;
  fileName?: string;
}

export async function fetchQuarterlyReturns(userId: string): Promise<QuarterlyReturnsResponse> {
  const res = await fetch(`${BASE}/quarterly-returns/${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch quarterly returns');
  return res.json();
}

export async function saveQuarterlyReturns(userId: string, data: QuarterlyReturnsResponse['data'], fileName: string): Promise<void> {
  const res = await fetch(`${BASE}/quarterly-returns/${encodeURIComponent(userId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, fileName }),
  });
  if (!res.ok) throw new Error('Failed to save quarterly returns');
}

export async function deleteQuarterlyReturns(userId: string): Promise<void> {
  const res = await fetch(`${BASE}/quarterly-returns/${encodeURIComponent(userId)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete quarterly returns');
}

export interface ExpenseProfileDTO {
  name: string;
  data: UserExpenseRow[];
  dict: Record<number, number>;
}

export async function fetchExpenseProfiles(userId: string): Promise<ExpenseProfileDTO[]> {
  const res = await fetch(`${BASE}/expenses/${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch expense profiles');
  return res.json();
}

export async function saveExpenseProfile(userId: string, profileName: string, fileName: string, data: UserExpenseRow[]): Promise<void> {
  const res = await fetch(`${BASE}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, profileName, fileName, data }),
  });
  if (!res.ok) throw new Error('Failed to save expense profile');
}

export async function deleteExpenseProfile(userId: string, profileName: string): Promise<void> {
  const res = await fetch(`${BASE}/expenses/${encodeURIComponent(userId)}/${encodeURIComponent(profileName)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete expense profile');
}

export interface SavedSimulationDTO {
  chartData: ChartData | Record<number, ChartData> | null;
  yearlySummary: unknown[] | null;
  swrResults: unknown[] | null;
}

export async function fetchSavedSimulation(userId: string, profileName: string): Promise<SavedSimulationDTO> {
  const res = await fetch(`${BASE}/simulations/${encodeURIComponent(userId)}/${encodeURIComponent(profileName)}`);
  if (!res.ok) throw new Error('Failed to fetch saved simulation');
  return res.json();
}

export async function saveSimulation(
  userId: string,
  profileName: string,
  payload: { chartData: unknown; yearlySummary: unknown[]; swrResults: unknown[] }
): Promise<void> {
  const res = await fetch(`${BASE}/simulations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, profileName, ...payload }),
  });
  if (!res.ok) throw new Error('Failed to save simulation');
}
