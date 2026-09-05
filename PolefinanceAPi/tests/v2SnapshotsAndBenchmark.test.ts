import { describe,it,expect } from 'vitest';
import { buildDailySnapshots } from '../src/portfolio/snapshots';
import { benchmarkComparison } from '../src/performance/benchmark';
import { Transaction } from '../src/accounting/transactions';

describe('V2 snapshots and benchmark',()=>{
 it('neutralizes deposits in daily return',()=>{const tx:Transaction[]=[{id:'d',date:'2026-01-01',type:'DEPOSIT',amount:100,currency:'EUR'},{id:'b',date:'2026-01-01',type:'BUY',symbol:'A',quantity:10,price:10,currency:'EUR'},{id:'d2',date:'2026-01-02',type:'DEPOSIT',amount:50,currency:'EUR'}];const s=buildDailySnapshots(tx,{'2026-01-01':{A:10},'2026-01-02':{A:11}});expect(s[1].dailyReturn).toBeCloseTo(.1);});
 it('returns synchronized benchmark analytics',()=>{const r=benchmarkComparison([.01,.02],[.005,.01],252,0);expect(r.portfolioCumulative.length).toBe(2);expect(Number.isFinite(r.beta)).toBe(true);});
});
