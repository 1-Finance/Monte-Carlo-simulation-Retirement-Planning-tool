/**
 * Excel file parser and generator using SheetJS (xlsx)
 */
import * as XLSX from 'xlsx';
import type { AssetReturns, YearlySummaryData } from './simulation';

export interface QuarterlyReturnRow {
  date: string;
  equity: number;
  realEstate: number;
  commodity: number;
  debt: number;
  alternative: number;
}

export interface UserExpenseRow {
  age: number;
  totalWithdrawal: number;
}

/**
 * Parse a Quarterly Returns Excel file
 * Expected columns: Date, Equity, Real Estate, Passive Income Assets, Debt, Alternative Investments
 */
export function parseQuarterlyReturnsExcel(file: ArrayBuffer): {
  data: QuarterlyReturnRow[];
  assetReturns: AssetReturns;
} {
  const workbook = XLSX.read(file, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('No sheets found in Excel file');

  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

  if (rawData.length === 0) throw new Error('No data found in Excel file');

  // Validate columns
  const firstRow = rawData[0];
  const requiredColumns = ['Date', 'Equity', 'Real Estate', 'Commodity', 'Debt', 'Alternative Investments'];
  const missingColumns = requiredColumns.filter(col => !(col in firstRow));

  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  const data: QuarterlyReturnRow[] = rawData.map((row, index) => {
    let dateStr: string;
    if (typeof row.Date === 'number') {
      const dateObj = XLSX.SSF.parse_date_code(row.Date) as any;
      dateStr = `${dateObj.d}-${dateObj.m}-${dateObj.y}`;
    } else {
      dateStr = String(row.Date);
    }

    return {
      date: dateStr,
      equity: Number(row.Equity) || 0,
      realEstate: Number(row['Real Estate']) || 0,
      commodity: Number(row['Commodity']) || 0,
      debt: Number(row.Debt) || 0,
      alternative: Number(row['Alternative Investments']) || 0,
    };
  });

  const assetReturns: AssetReturns = {
    equity: data.map(r => r.equity),
    realEstate: data.map(r => r.realEstate),
    commodity: data.map(r => r.commodity),
    debt: data.map(r => r.debt),
    alternative: data.map(r => r.alternative),
  };

  return { data, assetReturns };
}

/**
 * Parse a User Expenses Excel file
 * Expected columns: Age, Total Withdrawal
 */
export function parseUserExpensesExcel(file: ArrayBuffer): {
  data: UserExpenseRow[];
  expensesDict: Record<number, number>;
} {
  const workbook = XLSX.read(file, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('No sheets found in Excel file');

  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

  if (rawData.length === 0) throw new Error('No data found in Excel file');

  const firstRow = rawData[0];
  if (!('Age' in firstRow) || !('Total Withdrawal' in firstRow)) {
    throw new Error('Excel file must contain "Age" and "Total Withdrawal" columns');
  }

  const data: UserExpenseRow[] = rawData.map(row => ({
    age: Number(row.Age) || 0,
    totalWithdrawal: Math.round(Number(row['Total Withdrawal']) || 0),
  }));

  const expensesDict: Record<number, number> = {};
  data.forEach(row => {
    expensesDict[row.age] = row.totalWithdrawal;
  });

  return { data, expensesDict };
}

/**
 * Generate an Excel file from simulation yearly summary data
 * Columns: Base SWR, Simulation Number, Year, Corpus Value
 */
export function generateResultsExcel(yearlySummary: YearlySummaryData[]): Blob {
  const transformedData = yearlySummary.map(row => ({
    'Base SWR': row.baseSWR,
    'Simulation Number': row.simulationNumber,
    'Year': row.year,
    'Corpus Value': row.corpusValue,
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(transformedData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Simulations Input');

  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Parse a results Excel file for chart generation
 * Expected sheet: "Simulations Input" with columns: Base SWR, Simulation Number, Year, Corpus Value
 */
export function parseResultsExcel(file: ArrayBuffer): YearlySummaryData[] {
  const workbook = XLSX.read(file, { type: 'array' });
  const worksheet = workbook.Sheets['Simulations Input'];

  if (!worksheet) {
    throw new Error('Excel file must contain "Simulations Input" sheet');
  }

  const data = XLSX.utils.sheet_to_json(worksheet) as Array<{
    'Base SWR': number;
    'Simulation Number': number;
    'Year': number;
    'Corpus Value': number;
  }>;

  return data.map(row => ({
    baseSWR: row['Base SWR'],
    simulationNumber: row['Simulation Number'],
    year: Number(row['Year']),
    corpusValue: Number(row['Corpus Value']),
  }));
}

/**
 * Generate a sample Expense Profile Excel file for users to download and fill out
 */
export function generateSampleExpenseExcel(): Blob {
  const sampleData = [
    { 'Age': 55, 'Total Withdrawal': 600000 },
    { 'Age': 56, 'Total Withdrawal': 650000 },
    { 'Age': 57, 'Total Withdrawal': 700000 },
    { 'Age': 58, 'Total Withdrawal': 750000 },
    { 'Age': 59, 'Total Withdrawal': 800000 },
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 10 }, // Age
    { wch: 20 }, // Total Withdrawal
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'User Expenses');

  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
