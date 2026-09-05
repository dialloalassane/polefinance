import { describe, expect, it } from 'vitest';
import {
  calculateInvestedValue,
  calculatePerformance,
  calculatePortfolioDashboardMetrics,
  calculatePortfolioDailyVariation,
  calculatePositionDailyPnl,
  calculateTotalValue,
  calculateUnrealizedPnl,
} from '../src/utils/portfolioMetrics';

describe('portfolio dashboard metrics', () => {
  const positions = [
    { symbol: 'AAPL', quantity: 2, currentPrice: 110, previousClose: 108, averageCost: 100 },
    { symbol: 'BTC', quantity: 0.01, currentPrice: 50_000, previousClose: 49_000, averageCost: 45_000 },
  ];

  it('reconciles total value = cash + invested', () => {
    expect(calculateInvestedValue(positions)).toBeCloseTo(720, 12);
    expect(calculateTotalValue(1_000, positions)).toBeCloseTo(1_720, 12);
  });

  it('calculates unrealized P&L against average cost', () => {
    const out = calculateUnrealizedPnl(positions);
    // AAPL: 2*(110-100)=20; BTC: .01*(50000-45000)=50
    expect(out.amount).toBeCloseTo(70, 12);
    // Cost basis: 200 + 450 = 650
    expect(out.pct).toBeCloseTo(70 / 650, 12);
  });

  it('calculates daily P&L from previous closes', () => {
    const out = calculatePositionDailyPnl(positions);
    // AAPL 4 + BTC 10 = 14
    expect(out.amount).toBeCloseTo(14, 12);
    expect(out.previousInvested).toBeCloseTo(706, 12);
    expect(out.pct).toBeCloseTo(14 / 706, 12);
  });

  it('neutralizes deposits/withdrawals in daily portfolio variation', () => {
    // Previous NAV 1600, deposit 100, current 1720 => true P&L is +20.
    const out = calculatePortfolioDailyVariation(1_720, 1_600, 100);
    expect(out.amount).toBeCloseTo(20, 12);
    expect(out.pct).toBeCloseTo(0.0125, 12);
  });

  it('calculates contribution-based performance', () => {
    const out = calculatePerformance(1_720, 1_500);
    expect(out.amount).toBeCloseTo(220, 12);
    expect(out.pct).toBeCloseTo(220 / 1_500, 12);
  });

  it('builds all dashboard cards from one snapshot', () => {
    const out = calculatePortfolioDashboardMetrics({
      cash: 1_000,
      positions,
      previousTotalValue: 1_600,
      dailyNetCashFlow: 100,
      netContributions: 1_500,
    });
    expect(out.totalValue).toBeCloseTo(1_720, 12);
    expect(out.cash).toBeCloseTo(1_000, 12);
    expect(out.invested).toBeCloseTo(720, 12);
    expect(out.dailyPnl).toBeCloseTo(20, 12);
    expect(out.dailyVariation).toBeCloseTo(20, 12);
    expect(out.performance).toBeCloseTo(220, 12);
    expect(out.totalPnl).toBeCloseTo(70, 12);
  });

  it('does not fabricate unavailable P&L inputs', () => {
    const out = calculatePortfolioDashboardMetrics({
      cash: 100,
      positions: [{ symbol: 'X', quantity: 1, currentPrice: 10 }],
    });
    expect(out.totalPnl).toBeNull();
    expect(out.dailyPnl).toBeNull();
    expect(out.performance).toBeNull();
  });
});
