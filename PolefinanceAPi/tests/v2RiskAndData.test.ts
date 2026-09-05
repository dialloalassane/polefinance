import { describe,it,expect } from 'vitest';
import { rollingCorrelation, rollingBeta, rollingDrawdown } from '../src/risk/rolling';
import { concentration, diversificationRatio, exposureReport } from '../src/portfolio/exposures';
import { alignSeries } from '../src/market/alignment';
import { safeDivide, validatePrices } from '../src/risk/dataQuality';

describe('V2 risk/data helpers',()=>{
 it('aligns dates before cross-asset calculations',()=>{const x=alignSeries([[{date:'1',value:1},{date:'2',value:2}],[{date:'2',value:4},{date:'3',value:5}]]);expect(x.dates).toEqual(['2']);});
 it('handles zero denominators explicitly',()=>expect(safeDivide(1,0).reason).toBe('ZERO_DENOMINATOR'));
 it('detects duplicate and invalid prices',()=>expect(validatePrices([{date:'1',price:1},{date:'1',price:0}]).length).toBe(2));
 it('computes concentration/exposure',()=>{expect(concentration([.5,.3,.2],2).topN).toBeCloseTo(.8);expect(diversificationRatio([.5,.5],[.2,.2],.15)).toBeCloseTo(1.333333);expect(exposureReport([{value:100},{value:20,side:'SHORT'}],30).grossExposure).toBe(120);});
 it('produces rolling metrics',()=>{const a=[.01,.02,-.01,.03,.01],b=[.005,.01,-.005,.02,.01];expect(rollingCorrelation(a,b,3).at(-1)).not.toBeNull();expect(rollingBeta(a,b,3).at(-1)).not.toBeNull();expect(rollingDrawdown([100,110,105,120,115],3).at(-1)).toBeCloseTo(-5/120);});
});
