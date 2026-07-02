export interface QuarterlyReturnRow {
  date: string;
  equity: number;
  realEstate: number;
  commodity: number;
  debt: number;
  alternative: number;
}

export interface QuarterlyReturnsPayload {
  data: QuarterlyReturnRow[];
  fileName: string;
}

export interface ExpenseRow {
  age: number;
  totalWithdrawal: number;
}

export interface ExpenseProfile {
  name: string;
  fileName: string;
  data: ExpenseRow[];
  dict: Record<number, number>;
}

export interface SavedSimulationPayload {
  chartData: unknown;
  yearlySummary: unknown[];
  swrResults: unknown[];
}

export interface StorageAdapter {
  // Quarterly returns are shared globally across all users, not scoped per user.
  // No delete: uploading a new file always replaces the existing one instead.
  getQuarterlyReturns(): Promise<QuarterlyReturnsPayload | null>;
  saveQuarterlyReturns(payload: QuarterlyReturnsPayload): Promise<void>;

  getExpenseProfiles(userId: string): Promise<ExpenseProfile[]>;
  saveExpenseProfile(userId: string, profile: ExpenseProfile): Promise<void>;
  deleteExpenseProfile(userId: string, profileName: string): Promise<void>;

  getSavedSimulation(userId: string, profileName: string): Promise<SavedSimulationPayload | null>;
  saveSavedSimulation(userId: string, profileName: string, payload: SavedSimulationPayload): Promise<void>;

  getParameters(userId: string): Promise<Record<string, unknown> | null>;
  saveParameters(userId: string, params: Record<string, unknown>): Promise<void>;
}
