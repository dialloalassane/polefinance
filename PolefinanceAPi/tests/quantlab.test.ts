import { describe,it,expect } from 'vitest';
import { minAttainableCorrelation, parametricCVaR, parametricVaR, portfolioDriftVol, runStressTest, HISTORICAL_SCENARIOS } from '../src/utils/quantLab';

describe('Quant Lab',()=>{
 it('PSD correlation floor',()=>{expect(minAttainableCorrelation(3)).toBe(-.5)});
 it('portfolio drift and constant-correlation vol',()=>{const x=portfolioDriftVol([.4,.3,.3],[.35,.30,.12],[.60,.75,.28],.30);expect(x.mu).toBeCloseTo(.266,12);expect(x.sigma).toBeCloseTo(.413663,5)});
 it('parametric VaR/CVaR example',()=>{expect(parametricVaR(10000,.4,10,.95)).toBeCloseTo(1310.65,1);expect(parametricCVaR(10000,.4,10,.95)).toBeCloseTo(1643.61,1)});
 it('COVID stress on documented demo portfolio',()=>{const s=HISTORICAL_SCENARIOS[0];const r=runStressTest([{name:'BTC',value:4000,shockClass:'crypto'},{name:'ETH',value:2000,shockClass:'crypto'},{name:'AAPL',value:1500,shockClass:'equityDM'},{name:'NVDA',value:500,shockClass:'equityDM'}],2000,s);expect(r.after).toBeCloseTo(6320,8);expect(r.pnlPct).toBeCloseTo(-.368,8)});
});
