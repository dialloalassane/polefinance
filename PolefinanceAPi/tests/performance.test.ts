import { describe, expect, it } from 'vitest';
import { cashFlowAdjustedReturns, modifiedDietzReturn, timeWeightedReturn, xirr } from '../src/calculations/performance';

describe('cash-flow adjusted performance', () => {
  it('does not count deposits as performance', () => {
    const points=[
      {date:'2026-01-01',value:1000},
      {date:'2026-01-02',value:1110,externalCashFlow:100},
      {date:'2026-01-03',value:1132.2},
    ];
    const r=cashFlowAdjustedReturns(points);
    expect(r[0]).toBeCloseTo(.01);
    expect(r[1]).toBeCloseTo(.02);
    expect(timeWeightedReturn(points)).toBeCloseTo(1.01*1.02-1);
  });

  it('computes modified Dietz',()=>{
    expect(modifiedDietzReturn(1000,1150,[{amount:100,weight:.5}])).toBeCloseTo(50/1050);
  });

  it('computes an annual money weighted return',()=>{
    const r=xirr([{date:'2025-01-01',amount:-1000},{date:'2026-01-01',amount:1100}]);
    expect(r).not.toBeNull();
    expect(r!).toBeCloseTo(.1,2);
  });
});
