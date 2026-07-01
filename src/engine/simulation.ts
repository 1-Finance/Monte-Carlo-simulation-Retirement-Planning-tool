/**
 * Monte Carlo Simulation Engine for Retirement Planning
 * Ported from the original server/simulation.ts
 */

export interface AssetReturns {
  equity: number[];
  realEstate: number[];
  commodity: number[];
  debt: number[];
  alternative: number[];
}

export interface SimulationParams {
  initialCorpus: number;
  currentAge: number;
  withdrawalStartAge: number;
  targetAge: number;
  equityAllocation: number;
  realEstateAllocation: number;
  commodityAllocation: number;
  debtAllocation: number;
  alternativeAllocation: number;
  baseSWRList: number[];
  swrInflationRate: number;
  numSimulations: number;
  simulationType: 'expenses' | 'swr';
  expensesDict: Record<number, number>;
  assetReturns: AssetReturns;
}

export interface YearlySummaryData {
  baseSWR: number;
  simulationNumber: number;
  year: number;
  corpusValue: number;
}

export interface SWRResult {
  baseSWR: number;
  survivalRate: number;
  exhaustionProbability: number;
  numFailures: number;
  yearlySummary: YearlySummaryData[];
}

export interface SimulationOutput {
  results: SWRResult[];
}

function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

export function runMonteCarloSimulation(
  params: SimulationParams,
  onProgress?: (current: number, total: number) => void
): SimulationOutput {
  const {
    initialCorpus,
    currentAge,
    withdrawalStartAge,
    targetAge,
    equityAllocation,
    realEstateAllocation,
    commodityAllocation,
    debtAllocation,
    alternativeAllocation,
    baseSWRList,
    swrInflationRate,
    numSimulations,
    simulationType,
    expensesDict,
    assetReturns,
  } = params;

  // Use a fixed seed to ensure deterministic results across multiple runs
  const prng = mulberry32(42);

  function randomChoice<T>(array: T[]): T {
    return array[Math.floor(prng() * array.length)];
  }

  const years = targetAge - currentAge;
  const quarters = years * 4;

  // Weights used when distributing Real Estate injection back into the proportional pool
  const sumAlloc = equityAllocation + debtAllocation + alternativeAllocation + commodityAllocation;
  const eqWeight = sumAlloc > 0 ? equityAllocation / sumAlloc : 0;
  const altWeight = sumAlloc > 0 ? alternativeAllocation / sumAlloc : 0;
  const debtWeight = sumAlloc > 0 ? debtAllocation / sumAlloc : 0;
  const commodityWeight = sumAlloc > 0 ? commodityAllocation / sumAlloc : 0;

  const results: SWRResult[] = [];

  for (const baseSWR of baseSWRList) {
    let failures = 0;
    const yearlySummary: YearlySummaryData[] = [];

    for (let simNum = 0; simNum < numSimulations; simNum++) {
      let currentSWR = baseSWR;
      // Report progress every 100 iterations (only for first SWR to avoid spam)
      if (onProgress && simNum % 100 === 0 && baseSWR === baseSWRList[0]) {
        onProgress(simNum, numSimulations);
      }

      let eqVal = equityAllocation * initialCorpus;
      let altVal = alternativeAllocation * initialCorpus;
      let debtVal = debtAllocation * initialCorpus;
      let realEstateVal = realEstateAllocation * initialCorpus;
      let commodityVal = commodityAllocation * initialCorpus;

      let realEstateUsedAt: number | null = null;
      let failed = false;

      for (let q = 0; q < quarters; q++) {
        const currentAgeInQuarter = currentAge + Math.floor(q / 4);

        let eqWithdrawal = 0;
        let altWithdrawal = 0;
        let debtWithdrawal = 0;
        let realEstateWithdrawal = 0;
        let commodityWithdrawal = 0;

        let postWithdrawEq = eqVal;
        let postWithdrawAlt = altVal;
        let postWithdrawDebt = debtVal;
        let postWithdrawCommodity = commodityVal;

        // Withdrawal logic
        if (currentAgeInQuarter >= withdrawalStartAge) {
          let quarterlyWithdrawal = 0;
          if (simulationType === 'expenses') {
            const annualExpense = expensesDict[currentAgeInQuarter] || 0;
            quarterlyWithdrawal = annualExpense / 4.0;
          } else {
            // Type 2 Logic: SWR based
            quarterlyWithdrawal = (currentSWR * initialCorpus) / 4.0;
          }

          // Proportional pool: Equity, Alternative, Debt, Commodity
          const totalOpening = eqVal + altVal + debtVal + commodityVal;

          let eqWeightQtr = 0;
          let altWeightQtr = 0;
          let debtWeightQtr = 0;
          let commodityWeightQtr = 0;

          if (totalOpening > 0) {
            eqWeightQtr = eqVal / totalOpening;
            altWeightQtr = altVal / totalOpening;
            debtWeightQtr = debtVal / totalOpening;
            commodityWeightQtr = commodityVal / totalOpening;
          }

          const eqW = quarterlyWithdrawal * eqWeightQtr;
          const altW = quarterlyWithdrawal * altWeightQtr;
          const debtW = quarterlyWithdrawal * debtWeightQtr;
          const commodityW = quarterlyWithdrawal * commodityWeightQtr;

          eqVal -= eqW;
          altVal -= altW;
          debtVal -= debtW;
          commodityVal -= commodityW;

          eqWithdrawal += eqW;
          altWithdrawal += altW;
          debtWithdrawal += debtW;
          commodityWithdrawal += commodityW;

          postWithdrawEq = Math.max(0, eqVal);
          postWithdrawAlt = Math.max(0, altVal);
          postWithdrawDebt = Math.max(0, debtVal);
          postWithdrawCommodity = Math.max(0, commodityVal);

          eqVal = postWithdrawEq;
          altVal = postWithdrawAlt;
          debtVal = postWithdrawDebt;
          commodityVal = postWithdrawCommodity;

          // Real estate injection only after Equity, Alternative, Debt, and Commodity are depleted
          if (totalOpening < quarterlyWithdrawal && realEstateVal > 0 && realEstateUsedAt === null) {
            const distributeAmount = realEstateVal;
            eqVal += distributeAmount * eqWeight;
            altVal += distributeAmount * altWeight;
            debtVal += distributeAmount * debtWeight;
            commodityVal += distributeAmount * commodityWeight;
            realEstateVal -= distributeAmount;
            realEstateUsedAt = currentAgeInQuarter;
            realEstateWithdrawal += distributeAmount;
          }
        }

        const totalCorpus = eqVal + altVal + debtVal + realEstateVal + commodityVal;
        if (totalCorpus <= 0) {
          failures++;
          failed = true;
          break;
        }

        // Apply returns
        const equityReturnUsed = randomChoice(assetReturns.equity);
        const altReturnUsed = randomChoice(assetReturns.alternative);
        const debtReturnUsed = randomChoice(assetReturns.debt);
        const realEstateReturnUsed = randomChoice(assetReturns.realEstate);
        const commodityReturnUsed = randomChoice(assetReturns.commodity);

        eqVal += eqVal * equityReturnUsed;
        altVal += altVal * altReturnUsed;
        debtVal += debtVal * debtReturnUsed;
        realEstateVal += realEstateVal * realEstateReturnUsed;
        commodityVal += commodityVal * commodityReturnUsed;

        // Track yearly corpus values (at end of each year)
        if ((q + 1) % 4 === 0) {
          const year = currentAge + Math.floor(q / 4);
          const yearlyCorpus = eqVal + altVal + debtVal + realEstateVal + commodityVal;

          // Save memory: Only store yearly summary for baseSWR = 0.04 in Type 1, but store all in Type 2
          if (simulationType === 'swr' || baseSWR === 0.04) {
            yearlySummary.push({
              baseSWR,
              simulationNumber: simNum + 1,
              year,
              corpusValue: totalCorpus,
            });
          }

          if (simulationType === 'swr') {
            currentSWR *= (1 + swrInflationRate);
          }
        }
      }
    }

    const survivalRate = (numSimulations - failures) / numSimulations;
    const exhaustionProbability = failures / numSimulations;

    results.push({
      baseSWR,
      survivalRate,
      exhaustionProbability,
      numFailures: failures,
      yearlySummary: (simulationType === 'swr' || baseSWR === 0.04) ? yearlySummary : [],
    });
  }

  return { results };
}
