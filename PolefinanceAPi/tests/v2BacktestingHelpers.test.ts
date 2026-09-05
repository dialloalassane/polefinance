import { describe,it,expect } from 'vitest';
import { transactionCost } from '../src/backtesting/costs';
import { rebalanceFlags } from '../src/backtesting/rebalance';
import { estimationWindow, assertNoLookAhead } from '../src/backtesting/lookAhead';
import { oneWayTurnover } from '../src/backtesting/turnover';

describe('V2 backtesting helpers',()=>{
 it('models distinct cost components',()=>expect(transactionCost(10000,{commissionBps:5,spreadBps:2,slippageBps:3,fixedFee:1})).toBeCloseTo(11));
 it('supports annual/none rebalance',()=>{expect(rebalanceFlags(['2025-01-01','2025-06-01','2026-01-01'],'annual')).toEqual([true,false,true]);expect(rebalanceFlags(['2025-01-01','2026-01-01'],'none')).toEqual([true,false]);});
 it('uses only observations before decision index',()=>{expect(estimationWindow([1,2,3,4,5],4,2)).toEqual([3,4]);expect(()=>assertNoLookAhead(4,[1,2,4])).toThrow('LOOK_AHEAD_BIAS');});
 it('calculates one-way turnover',()=>expect(oneWayTurnover([.5,.5],[.8,.2])).toBeCloseTo(.3));
});
