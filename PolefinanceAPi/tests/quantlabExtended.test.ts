import { describe, expect, it } from 'vitest';
import { monteCarloPercentileCone, portfolioVolatilityPrefill, runCustomStress, terminalHistogram, varCvarTermStructure } from '../src/utils/quantLab';

describe('extended quant lab helpers',()=>{
  it('builds histogram and percentile cone',()=>{
    const paths=[[100,101,102],[100,99,103],[100,102,104]];
    expect(monteCarloPercentileCone(paths)).toHaveLength(3);
    expect(terminalHistogram([90,100,110],3).reduce((s,b)=>s+b.count,0)).toBe(3);
  });
  it('dilutes portfolio volatility with cash',()=>{
    const x=portfolioVolatilityPrefill([{value:5000,annualVol:.4}],5000);
    expect(x.annualVol).toBeCloseTo(.2);
  });
  it('runs custom stress and var/cvar term structure',()=>{
    const s=runCustomStress([{name:'BTC',value:1000,shockClass:'crypto'}],1000,-.2,-.5,0);
    expect(s.after).toBeCloseTo(1500);
    const term=varCvarTermStructure(10000,.4,5,.95);
    expect(term).toHaveLength(5);
    expect(term[4].var).toBeGreaterThan(term[0].var);
  });
});
