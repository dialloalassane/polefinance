import { describe,it,expect } from 'vitest';
import { calculateMetrics, calculateMonthlyReturns } from '../src/utils/backtesting';

const equity=[10000,10200,10098,10502,10187,10391,9975,10175,9971,10370,10162];
const r=equity.slice(1).map((v,i)=>v/equity[i]-1);
const bm=[10000,10300,10094,10598,10174,10479,9955,10254,9946,10444,10131];
const br=bm.slice(1).map((v,i)=>v/bm[i]-1);

describe('backtesting metrics - Dataset E/B',()=>{
 it('reproduces key formula-reference values',()=>{const m=calculateMetrics(equity,r,br,252,0,[],0,0);expect(m.totalReturn).toBeCloseTo(.0162,10);expect(m.cagr).toBeCloseTo(.499255,5);expect(m.annualVol).toBeCloseTo(.466488,5);expect(m.sharpe).toBeCloseTo(1.078453,5);expect(m.maxDrawdown).toBeCloseTo(-.050562,5);expect(m.beta).toBeCloseTo(.742645,5);expect(m.alpha).toBeCloseTo(.128872,5);});
 it('monthly heatmap preserves cross-month link returns',()=>{const dates=['2026-06-30','2026-07-01','2026-07-31','2026-08-03'];const eq=[100,102,110,111];const m=calculateMonthlyReturns(dates,eq);expect(m['2026']['06']).toBeCloseTo(0);expect(m['2026']['07']).toBeCloseTo(.10);expect(m['2026']['08']).toBeCloseTo(111/110-1);});
});
