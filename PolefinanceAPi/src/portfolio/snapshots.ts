import { buildLedger, CostBasisMethod } from '../accounting/ledger';
import { Transaction } from '../accounting/transactions';
import { portfolioValue } from './portfolioValue';
export type PortfolioSnapshot={date:string;cash:number;positions:Record<string,{quantity:number;costBasis:number;averageCost:number;marketValue:number}>;totalValue:number;externalCashFlow:number;dailyReturn:number|null;cumulativeReturn:number|null};
export function buildDailySnapshots(transactions:Transaction[],pricesByDate:Record<string,Record<string,number>>,method:CostBasisMethod='WEIGHTED_AVERAGE',initialCash=0):PortfolioSnapshot[]{
  const dates=Object.keys(pricesByDate).sort();const out:PortfolioSnapshot[]=[];let previous:number|null=null,cumulative=1;
  for(const date of dates){const txs=transactions.filter(t=>t.date<=date);const ledger=buildLedger(txs,initialCash,method);const positions=Object.values(ledger.positions);const prices=pricesByDate[date]??{};const total=portfolioValue(ledger.cash,positions,prices);const flow=transactions.filter(t=>t.date===date).reduce((s,t)=>s+(t.type==='DEPOSIT'?(t.amount??0):t.type==='WITHDRAWAL'?-(t.amount??0):0),0);const r=previous && previous!==0?(total-flow)/previous-1:null;if(r!=null)cumulative*=1+r;const map:PortfolioSnapshot['positions']={};for(const p of positions)map[p.symbol]={quantity:p.quantity,costBasis:p.costBasis,averageCost:p.averageCost,marketValue:p.quantity*(prices[p.symbol]??0)};out.push({date,cash:ledger.cash,positions:map,totalValue:total,externalCashFlow:flow,dailyReturn:r,cumulativeReturn:r==null?null:cumulative-1});previous=total;}
  return out;
}
