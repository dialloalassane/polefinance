import { describe, expect, it } from 'vitest';
import { accountingSummary, processTransactions } from '../src/calculations/portfolioAccounting';

describe('transaction-level portfolio accounting', () => {
  it('separates deposits, realized pnl, unrealized pnl and fees', () => {
    const state = processTransactions([
      { date:'2026-01-01', type:'DEPOSIT', amount:10_000 },
      { date:'2026-01-02', type:'BUY', symbol:'AAA', quantity:10, price:100, fees:5 },
      { date:'2026-02-01', type:'SELL', symbol:'AAA', quantity:4, price:120, fees:2 },
      { date:'2026-02-10', type:'DIVIDEND', amount:10 },
      { date:'2026-02-11', type:'WITHDRAWAL', amount:500 },
    ]);
    const out = accountingSummary(state,{AAA:110});
    expect(state.positions.AAA.quantity).toBeCloseTo(6);
    expect(state.positions.AAA.averageCost).toBeCloseTo(100.5);
    expect(out.investedValue).toBeCloseTo(660);
    expect(out.realizedPnl).toBeCloseTo((120-100.5)*4-2+10);
    expect(out.unrealizedPnl).toBeCloseTo(6*(110-100.5));
    expect(out.totalFees).toBeCloseTo(7);
    expect(out.netContributions).toBeCloseTo(9500);
    expect(out.totalPnl).toBeCloseTo(out.totalValue - 9500);
  });

  it('rejects overselling', () => {
    expect(() => processTransactions([
      {date:'2026-01-01',type:'DEPOSIT',amount:1000},
      {date:'2026-01-02',type:'BUY',symbol:'X',quantity:1,price:100},
      {date:'2026-01-03',type:'SELL',symbol:'X',quantity:2,price:110},
    ])).toThrow();
  });
});
