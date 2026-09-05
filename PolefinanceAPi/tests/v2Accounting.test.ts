import { describe,it,expect } from 'vitest';
import { buildLedger } from '../src/accounting/ledger';
import { Transaction } from '../src/accounting/transactions';

describe('V2 accounting engine',()=>{
  const txs:Transaction[]=[
    {id:'1',date:'2026-01-01',type:'DEPOSIT',amount:1000,currency:'EUR'},
    {id:'2',date:'2026-01-02',type:'BUY',symbol:'AAA',quantity:10,price:20,fees:2,currency:'EUR'},
    {id:'3',date:'2026-01-03',type:'SELL',symbol:'AAA',quantity:4,price:30,fees:1,currency:'EUR'},
  ];
  it('reconstructs cash and realized pnl',()=>{const s=buildLedger(txs);expect(s.cash).toBeCloseTo(917);expect(s.positions.AAA.quantity).toBeCloseTo(6);expect(s.realizedPnl).toBeCloseTo(38.2);});
  it('supports stock splits',()=>{const s=buildLedger([...txs,{id:'4',date:'2026-01-04',type:'SPLIT',symbol:'AAA',splitRatio:2,currency:'EUR'}]);expect(s.positions.AAA.quantity).toBeCloseTo(12);expect(s.positions.AAA.averageCost).toBeCloseTo(10.1);});
});
