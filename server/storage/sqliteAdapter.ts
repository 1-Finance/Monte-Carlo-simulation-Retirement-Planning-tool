import type { Database } from 'sqlite';
import type {
  StorageAdapter,
  QuarterlyReturnsPayload,
  ExpenseProfile,
  SavedSimulationPayload,
} from './types';

export class SqliteStorageAdapter implements StorageAdapter {
  constructor(private db: Database) {}

  async getQuarterlyReturns(): Promise<QuarterlyReturnsPayload | null> {
    const rows = await this.db.all('SELECT * FROM quarterly_returns');
    if (rows.length === 0) return null;

    return {
      fileName: rows[0].file_name,
      data: rows.map((r: any) => ({
        date: r.date,
        equity: r.equity,
        realEstate: r.real_estate,
        commodity: r.passive_income,
        debt: r.debt,
        alternative: r.alternative,
      })),
    };
  }

  async saveQuarterlyReturns(payload: QuarterlyReturnsPayload): Promise<void> {
    await this.db.run('BEGIN TRANSACTION');
    try {
      await this.db.run('DELETE FROM quarterly_returns');

      const stmt = await this.db.prepare(
        'INSERT INTO quarterly_returns (date, equity, real_estate, passive_income, debt, alternative, file_name) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      for (const row of payload.data) {
        await stmt.run(row.date, row.equity, row.realEstate, row.commodity, row.debt, row.alternative, payload.fileName);
      }
      await stmt.finalize();

      await this.db.run('COMMIT');
    } catch (e) {
      await this.db.run('ROLLBACK');
      throw e;
    }
  }

  async deleteQuarterlyReturns(): Promise<void> {
    await this.db.run('DELETE FROM quarterly_returns');
  }

  async getExpenseProfiles(userId: string): Promise<ExpenseProfile[]> {
    const profiles = await this.db.all('SELECT * FROM user_expenses_profiles WHERE user_id = ?', [userId]);
    const result: ExpenseProfile[] = [];

    for (const profile of profiles) {
      const rows = await this.db.all(
        'SELECT age, total_withdrawal as totalWithdrawal FROM user_expenses WHERE profile_id = ?',
        [profile.id]
      );

      const dict: Record<number, number> = {};
      rows.forEach((r: any) => { dict[r.age] = r.totalWithdrawal; });

      result.push({
        name: profile.profile_name,
        fileName: profile.file_name,
        data: rows,
        dict,
      });
    }

    return result;
  }

  async saveExpenseProfile(userId: string, profile: ExpenseProfile): Promise<void> {
    await this.db.run('BEGIN TRANSACTION');
    try {
      let existing = await this.db.get(
        'SELECT id FROM user_expenses_profiles WHERE user_id = ? AND profile_name = ?',
        [userId, profile.name]
      );
      if (existing) {
        await this.db.run('DELETE FROM user_expenses WHERE profile_id = ?', [existing.id]);
      } else {
        const result = await this.db.run(
          'INSERT INTO user_expenses_profiles (user_id, profile_name, file_name) VALUES (?, ?, ?)',
          [userId, profile.name, profile.fileName]
        );
        existing = { id: result.lastID };
      }

      const stmt = await this.db.prepare(
        'INSERT INTO user_expenses (profile_id, age, total_withdrawal) VALUES (?, ?, ?)'
      );
      for (const row of profile.data) {
        await stmt.run(existing.id, row.age, row.totalWithdrawal);
      }
      await stmt.finalize();

      await this.db.run('COMMIT');
    } catch (e) {
      await this.db.run('ROLLBACK');
      throw e;
    }
  }

  async deleteExpenseProfile(userId: string, profileName: string): Promise<void> {
    const profile = await this.db.get(
      'SELECT id FROM user_expenses_profiles WHERE user_id = ? AND profile_name = ?',
      [userId, profileName]
    );
    if (profile) {
      await this.db.run('DELETE FROM user_expenses WHERE profile_id = ?', [profile.id]);
      await this.db.run('DELETE FROM user_expenses_profiles WHERE id = ?', [profile.id]);
    }
  }

  async getSavedSimulation(userId: string, profileName: string): Promise<SavedSimulationPayload | null> {
    const row = await this.db.get(
      'SELECT chart_data, yearly_summary, swr_results FROM saved_simulations WHERE user_id = ? AND profile_name = ?',
      [userId, profileName]
    );
    if (!row || !row.chart_data || !row.yearly_summary || !row.swr_results) return null;

    return {
      chartData: JSON.parse(row.chart_data),
      yearlySummary: JSON.parse(row.yearly_summary),
      swrResults: JSON.parse(row.swr_results),
    };
  }

  async saveSavedSimulation(userId: string, profileName: string, payload: SavedSimulationPayload): Promise<void> {
    await this.db.run(
      `INSERT INTO saved_simulations (user_id, profile_name, chart_data, yearly_summary, swr_results)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, profile_name) DO UPDATE SET chart_data = excluded.chart_data, yearly_summary = excluded.yearly_summary, swr_results = excluded.swr_results`,
      [userId, profileName, JSON.stringify(payload.chartData), JSON.stringify(payload.yearlySummary), JSON.stringify(payload.swrResults)]
    );
  }

  async getParameters(userId: string): Promise<Record<string, unknown> | null> {
    const row = await this.db.get('SELECT * FROM parameters WHERE user_id = ?', [userId]);
    return row || null;
  }

  async saveParameters(userId: string, params: Record<string, unknown>): Promise<void> {
    const {
      age, withdrawal_start_age, withdrawal_amount, withdrawal_year, initial_corpus,
      equity_allocation, real_estate_allocation, passive_allocation, debt_allocation, alt_allocation,
    } = params;
    await this.db.run(`
      INSERT INTO parameters (user_id, age, withdrawal_start_age, withdrawal_amount, withdrawal_year, initial_corpus, equity_allocation, real_estate_allocation, passive_allocation, debt_allocation, alt_allocation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        age=excluded.age,
        withdrawal_start_age=excluded.withdrawal_start_age,
        withdrawal_amount=excluded.withdrawal_amount,
        withdrawal_year=excluded.withdrawal_year,
        initial_corpus=excluded.initial_corpus,
        equity_allocation=excluded.equity_allocation,
        real_estate_allocation=excluded.real_estate_allocation,
        passive_allocation=excluded.passive_allocation,
        debt_allocation=excluded.debt_allocation,
        alt_allocation=excluded.alt_allocation
    `, [userId, age, withdrawal_start_age, withdrawal_amount, withdrawal_year, initial_corpus, equity_allocation, real_estate_allocation, passive_allocation, debt_allocation, alt_allocation]);
  }
}
