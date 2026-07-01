/**
 * Chart data calculations for Corpus Survival Probability Chart
 * Ported from the original server/routers.ts generateChartFromExcel logic
 */

import type { YearlySummaryData } from './simulation';

export interface ChartSimulation {
  simulationNumber: number;
  rank: number;
  data: Array<{ year: number; corpusValue: number }>;
}

export interface ChartData {
  percentile80: Array<{ year: number; corpusValue: number }>;
  sampleSimulations: ChartSimulation[];
  survivalAge: number;
  survivesPast90: boolean;
}

/**
 * Calculate chart data from yearly simulation summary
 * - 80th percentile (20th from bottom) corpus values per year
 * - 10-11 sample simulations ranked by age-90 corpus
 * - Survival age determination
 */
export function calculateChartData(yearlySummary: YearlySummaryData[], baseRank: number = 7500): ChartData {
  // Build yearlyData structure: { simulationNumber: { year: corpusValue } }
  const yearlyData: Record<number, Record<number, number>> = {};

  for (const item of yearlySummary) {
    if (!yearlyData[item.simulationNumber]) {
      yearlyData[item.simulationNumber] = {};
    }
    yearlyData[item.simulationNumber][item.year] = item.corpusValue;
  }

  // Get all unique years
  const allYears = new Set<number>();
  for (const simData of Object.values(yearlyData)) {
    for (const year of Object.keys(simData)) {
      allYears.add(Number(year));
    }
  }
  const years = Array.from(allYears).sort((a, b) => a - b);

  // Sort simulations by corpus value at age 90 (descending) to assign ranks
  const simulationNumbers = Object.keys(yearlyData).map(Number);
  const simulationsWithFinalCorpus = simulationNumbers
    .map(simNum => ({
      simNum,
      finalCorpus: yearlyData[simNum][90] || 0,
    }))
    .sort((a, b) => b.finalCorpus - a.finalCorpus); // Descending order

  // Assign ranks (1 = highest corpus at age 90)
  const rankMap = new Map<number, number>();
  simulationsWithFinalCorpus.forEach((item, index) => {
    rankMap.set(item.simNum, index + 1);
  });

  // Calculate 80th percentile (20th percentile from bottom)
  // CRITICAL: Include ALL simulations at each year, treating missing values as 0
  const percentile80Data: Array<{ year: number; corpusValue: number }> = [];

  for (const year of years) {
    const values: number[] = [];
    for (const simNum of simulationNumbers) {
      const corpus = yearlyData[simNum][year];
      values.push(corpus !== undefined ? corpus : 0);
    }

    if (values.length > 0) {
      values.sort((a, b) => a - b); // Ascending order
      // 80th percentile = 20th percentile from bottom
      const index = Math.floor(values.length * 0.2);
      const percentileValue = values[index];
      percentile80Data.push({ year, corpusValue: percentileValue });
    }
  }

  // Find survival age (where 80th percentile corpus drops to 0)
  let survivalAge = 90;
  for (let i = 0; i < percentile80Data.length; i++) {
    if (percentile80Data[i].corpusValue <= 0) {
      survivalAge = percentile80Data[i].year;
      break;
    }
  }

  // Select sample simulations by rank starting from baseRank
  const sampleSimNumbers: number[] = [];
  const rankEntries = Array.from(rankMap.entries());
  for (let i = 0; i < 11; i++) {
    const targetRank = baseRank + i * 100;
    const entry = rankEntries.find(([, rank]) => rank === targetRank);
    if (entry) {
      sampleSimNumbers.push(entry[0]);
    }
  }

  const sampleSimulations: ChartSimulation[] = sampleSimNumbers.map(simNum => ({
    simulationNumber: simNum,
    rank: rankMap.get(simNum) || 0,
    data: Object.entries(yearlyData[simNum])
      .map(([year, corpus]) => ({
        year: Number(year),
        corpusValue: corpus,
      }))
      .sort((a, b) => a.year - b.year),
  }));

  return {
    percentile80: percentile80Data,
    sampleSimulations,
    survivalAge,
    survivesPast90: survivalAge >= 90,
  };
}
