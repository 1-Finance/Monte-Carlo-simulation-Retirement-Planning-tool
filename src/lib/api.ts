import type { ChartData } from '../engine/chartCalculations';
import type { UserExpenseRow } from '../engine/excelParser';

const BASE = '/api';

export interface QuarterlyReturnsResponse {
  data: Array<{ date: string; equity: number; realEstate: number; commodity: number; debt: number; alternative: number }>;
  fileName?: string;
}

// Quarterly returns are shared globally across all users, not scoped per user.
export async function fetchQuarterlyReturns(): Promise<QuarterlyReturnsResponse> {
  const res = await fetch(`${BASE}/quarterly-returns`);
  if (!res.ok) throw new Error('Failed to fetch quarterly returns');
  return res.json();
}

export async function saveQuarterlyReturns(data: QuarterlyReturnsResponse['data'], fileName: string): Promise<void> {
  const res = await fetch(`${BASE}/quarterly-returns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, fileName }),
  });
  if (!res.ok) throw new Error('Failed to save quarterly returns');
}

export interface ParametersDTO {
  age?: number;
  withdrawal_start_age?: number;
  withdrawal_amount?: number;
  withdrawal_year?: number;
  initial_corpus?: number;
  equity_allocation?: number;
  real_estate_allocation?: number;
  passive_allocation?: number;
  debt_allocation?: number;
  alt_allocation?: number;
}

export async function fetchParameters(userId: string): Promise<ParametersDTO> {
  const res = await fetch(`${BASE}/parameters/${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch parameters');
  return res.json();
}

export async function saveParameters(userId: string, params: ParametersDTO): Promise<void> {
  const res = await fetch(`${BASE}/parameters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, ...params }),
  });
  if (!res.ok) throw new Error('Failed to save parameters');
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
