/**
 * Formats a raw rupee amount using Indian numbering units, scaled to whichever
 * unit fits: Cr (≥1,00,00,000), L (≥1,00,000), K (≥1,000), or plain ₹ below that.
 * Shared by every chart label/tooltip and value display that shows a corpus amount.
 */
export function formatINRDynamic(value: number): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);

  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(1).replace(/\.0$/, '')} Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1).replace(/\.0$/, '')} L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1).replace(/\.0$/, '')} K`;
  return `${sign}₹${Math.round(abs).toLocaleString('en-IN')}`;
}
