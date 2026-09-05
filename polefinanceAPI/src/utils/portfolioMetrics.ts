/**
 * Live/simulated portfolio dashboard metrics.
 *
 * These metrics are intentionally separate from backtest metrics. They operate on
 * current positions, previous closes and portfolio cash/capital flows.
 */

export type PortfolioPositionSnapshot = {
  symbol: string;
  quantity: number;
  /** Current mark in the portfolio base currency. */
  currentPrice: number;
  /** Previous trading day's close in the same base currency. */
  previousClose?: number | null;
  /** Average acquisition price in the same base currency. */
  averageCost?: number | null;
};

export type PortfolioMetricInput = {
  cash: number;
  positions: PortfolioPositionSnapshot[];
  /**
   * Optional cumulative net deposits (deposits minus withdrawals).
   * Preferred performance denominator because it is not distorted by cash flows.
   */
  netContributions?: number | null;
  /**
   * Optional portfolio value at the previous close. When supplied, this is the
   * authoritative base for daily portfolio variation.
   */
  previousTotalValue?: number | null;
  /** Cash flows that occurred after the previous close. */
  dailyNetCashFlow?: number;
  /** Realized trading/income P&L already booked in the portfolio base currency. */
  realizedPnl?: number;
  /** Cumulative fees paid. Informational; realizedPnl should already be net of fees if supplied. */
  feesPaid?: number;
  deposits?: number;
  withdrawals?: number;
};

export type PortfolioDashboardMetrics = {
  totalValue: number;
  cash: number;
  invested: number;
  investedPct: number;
  cashPct: number;
  realizedPnl: number;
  unrealizedPnl: number | null;
  unrealizedPnlPct: number | null;
  totalPnl: number | null;
  totalPnlPct: number | null;
  totalReturn: number | null;
  totalReturnPct: number | null;
  dailyPnl: number | null;
  dailyPnlPct: number | null;
  /** Alias used by the dashboard for "variation du jour". */
  dailyVariation: number | null;
  dailyVariationPct: number | null;
  dailyReturn: number | null;
  feesPaid: number;
  deposits: number;
  withdrawals: number;
  netContributions: number | null;
  performance: number | null;
  performancePct: number | null;
};

const finiteOrZero = (x: number): number => (Number.isFinite(x) ? x : 0);

/** Market value of all open positions. */
export function calculateInvestedValue(positions: PortfolioPositionSnapshot[]): number {
  return positions.reduce(
    (sum, p) => sum + finiteOrZero(p.quantity) * finiteOrZero(p.currentPrice),
    0,
  );
}

/** Cash + marked-to-market positions. */
export function calculateTotalValue(cash: number, positions: PortfolioPositionSnapshot[]): number {
  return finiteOrZero(cash) + calculateInvestedValue(positions);
}

/**
 * Unrealized P&L versus average acquisition cost.
 * Returns null when no position has a usable average cost, rather than fabricating 0.
 */
export function calculateUnrealizedPnl(
  positions: PortfolioPositionSnapshot[],
): { amount: number | null; pct: number | null; costBasis: number } {
  let pnl = 0;
  let costBasis = 0;
  let covered = 0;

  for (const p of positions) {
    if (p.averageCost == null || !Number.isFinite(p.averageCost) || p.averageCost < 0) continue;
    const qty = finiteOrZero(p.quantity);
    const current = finiteOrZero(p.currentPrice);
    const cost = qty * p.averageCost;
    costBasis += cost;
    pnl += qty * (current - p.averageCost);
    covered += 1;
  }

  if (!covered) return { amount: null, pct: null, costBasis: 0 };
  return { amount: pnl, pct: costBasis !== 0 ? pnl / costBasis : null, costBasis };
}

/**
 * Position-level daily P&L: sum(qty * (current - previous close)).
 * Returns null if none of the positions has a previous close.
 */
export function calculatePositionDailyPnl(
  positions: PortfolioPositionSnapshot[],
): { amount: number | null; pct: number | null; previousInvested: number } {
  let amount = 0;
  let previousInvested = 0;
  let covered = 0;

  for (const p of positions) {
    if (p.previousClose == null || !Number.isFinite(p.previousClose) || p.previousClose < 0) continue;
    const qty = finiteOrZero(p.quantity);
    amount += qty * (finiteOrZero(p.currentPrice) - p.previousClose);
    previousInvested += qty * p.previousClose;
    covered += 1;
  }

  if (!covered) return { amount: null, pct: null, previousInvested: 0 };
  return {
    amount,
    pct: previousInvested !== 0 ? amount / previousInvested : null,
    previousInvested,
  };
}

/**
 * Portfolio daily variation using yesterday's total portfolio value.
 * Cash flows are neutralized: current - previous - today's net cash flow.
 */
export function calculatePortfolioDailyVariation(
  currentTotalValue: number,
  previousTotalValue: number | null | undefined,
  dailyNetCashFlow = 0,
): { amount: number | null; pct: number | null } {
  if (previousTotalValue == null || !Number.isFinite(previousTotalValue) || previousTotalValue <= 0) {
    return { amount: null, pct: null };
  }
  const amount = finiteOrZero(currentTotalValue) - previousTotalValue - finiteOrZero(dailyNetCashFlow);
  return { amount, pct: amount / previousTotalValue };
}

/**
 * Time-zero / contribution-based performance.
 * If netContributions is unavailable, returns null instead of using current cash as a denominator.
 */
export function calculatePerformance(
  totalValue: number,
  netContributions: number | null | undefined,
): { amount: number | null; pct: number | null } {
  if (netContributions == null || !Number.isFinite(netContributions) || netContributions <= 0) {
    return { amount: null, pct: null };
  }
  const amount = finiteOrZero(totalValue) - netContributions;
  return { amount, pct: amount / netContributions };
}

/** Build all dashboard cards from one consistent snapshot. */
export function calculatePortfolioDashboardMetrics(
  input: PortfolioMetricInput,
): PortfolioDashboardMetrics {
  const invested = calculateInvestedValue(input.positions);
  const totalValue = finiteOrZero(input.cash) + invested;
  const unrealized = calculateUnrealizedPnl(input.positions);
  const realizedPnl = finiteOrZero(input.realizedPnl ?? 0);
  const combinedPnl = unrealized.amount == null && input.realizedPnl == null ? null : realizedPnl + (unrealized.amount ?? 0);
  const pnlBasis = unrealized.costBasis;
  const combinedPnlPct = combinedPnl == null ? null : (pnlBasis !== 0 ? combinedPnl / pnlBasis : null);
  const positionDay = calculatePositionDailyPnl(input.positions);
  const portfolioDay = calculatePortfolioDailyVariation(
    totalValue,
    input.previousTotalValue,
    input.dailyNetCashFlow ?? 0,
  );
  const performance = calculatePerformance(totalValue, input.netContributions);

  // Prefer full-portfolio daily variation when yesterday's portfolio NAV is known.
  // Otherwise fall back to position-level P&L from previous closes.
  const dailyAmount = portfolioDay.amount ?? positionDay.amount;
  const dailyPct = portfolioDay.pct ?? positionDay.pct;

  return {
    totalValue,
    cash: finiteOrZero(input.cash),
    invested,
    investedPct: totalValue !== 0 ? invested / totalValue : 0,
    cashPct: totalValue !== 0 ? finiteOrZero(input.cash) / totalValue : 0,
    realizedPnl,
    unrealizedPnl: unrealized.amount,
    unrealizedPnlPct: unrealized.pct,
    totalPnl: combinedPnl,
    totalPnlPct: combinedPnlPct,
    totalReturn: performance.amount,
    totalReturnPct: performance.pct,
    dailyPnl: dailyAmount,
    dailyPnlPct: dailyPct,
    dailyVariation: dailyAmount,
    dailyVariationPct: dailyPct,
    dailyReturn: dailyPct,
    feesPaid: finiteOrZero(input.feesPaid ?? 0),
    deposits: finiteOrZero(input.deposits ?? 0),
    withdrawals: finiteOrZero(input.withdrawals ?? 0),
    netContributions: input.netContributions == null ? null : finiteOrZero(input.netContributions),
    performance: performance.amount,
    performancePct: performance.pct,
  };
}
