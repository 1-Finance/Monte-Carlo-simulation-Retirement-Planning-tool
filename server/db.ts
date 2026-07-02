import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let db: Database | null = null;

export async function initDb() {
  if (db) return db;
  
  db = await open({
    filename: process.env.DATABASE_PATH || './database.sqlite',
    driver: sqlite3.Database
  });

  // WAL lets reads proceed while a write transaction is in flight; busy_timeout makes
  // any remaining lock conflict retry instead of failing instantly with SQLITE_BUSY —
  // both matter here since several endpoints read/write concurrently right after login.
  await db.exec('PRAGMA journal_mode = WAL;');
  await db.exec('PRAGMA busy_timeout = 5000;');

  await db.exec(`
    CREATE TABLE IF NOT EXISTS parameters (
      user_id TEXT PRIMARY KEY,
      age INTEGER,
      withdrawal_start_age INTEGER,
      withdrawal_amount REAL,
      withdrawal_year INTEGER,
      initial_corpus REAL,
      equity_allocation REAL,
      real_estate_allocation REAL,
      passive_allocation REAL,
      debt_allocation REAL,
      alt_allocation REAL
    );

    CREATE TABLE IF NOT EXISTS quarterly_returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      equity REAL,
      real_estate REAL,
      passive_income REAL,
      debt REAL,
      alternative REAL,
      file_name TEXT
    );

    CREATE TABLE IF NOT EXISTS user_expenses_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      profile_name TEXT,
      file_name TEXT,
      UNIQUE(user_id, profile_name)
    );

    CREATE TABLE IF NOT EXISTS user_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER,
      age INTEGER,
      total_withdrawal REAL,
      FOREIGN KEY(profile_id) REFERENCES user_expenses_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS saved_simulations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      profile_name TEXT,
      chart_data TEXT,
      yearly_summary TEXT,
      swr_results TEXT,
      UNIQUE(user_id, profile_name)
    );
  `);

  try {
    await db.exec(`ALTER TABLE saved_simulations ADD COLUMN yearly_summary TEXT;`);
  } catch (e) {
    // Column already exists, safe to ignore
  }

  try {
    await db.exec(`ALTER TABLE saved_simulations ADD COLUMN swr_results TEXT;`);
  } catch (e) {
    // Column already exists, safe to ignore
  }

  try {
    await db.exec(`ALTER TABLE quarterly_returns ADD COLUMN user_id TEXT;`);
  } catch (e) {
    // Column already exists, safe to ignore
  }

  await db.exec(`CREATE INDEX IF NOT EXISTS idx_quarterly_returns_user ON quarterly_returns(user_id);`);

  return db;
}
