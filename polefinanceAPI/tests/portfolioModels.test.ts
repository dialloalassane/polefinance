import { describe, expect, it } from 'vitest';
import { effectiveNumberOfPositions, herfindahlIndex, percentRiskContributions, portfolioVolatility } from '../src/calculations/portfolioAnalytics';
import { optimizationSuite } from '../src/calculations/portfolioModels';

describe('portfolio analytics and optimization',()=>{
  const cov=[[.04,.01],[.01,.09]];
  it('computes concentration and risk contributions',()=>{
    const w=[.5,.5];
    expect(herfindahlIndex(w)).toBeCloseTo(.5);
    expect(effectiveNumberOfPositions(w)).toBeCloseTo(2);
    expect(portfolioVolatility(w,cov)).toBeGreaterThan(0);
    expect(percentRiskContributions(w,cov).reduce((a,b)=>a+b,0)).toBeCloseTo(1);
  });
  it('returns core optimization models',()=>{
    const out=optimizationSuite([.08,.12],cov,.02,.1,1.5);
    expect(out.minimumVariance.weights.reduce((a,b)=>a+b,0)).toBeCloseTo(1);
    expect(out.maximumSharpe.weights.reduce((a,b)=>a+b,0)).toBeCloseTo(1);
    expect(out.riskParity.weights.reduce((a,b)=>a+b,0)).toBeCloseTo(1);
    expect(out.volatilityTarget.leverage).toBeLessThanOrEqual(1.5);
  });
});
