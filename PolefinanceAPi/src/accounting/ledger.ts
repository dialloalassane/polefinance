import { Transaction, sortTransactions } from './transactions';
export type CostBasisMethod = 'WEIGHTED_AVERAGE'|'FIFO'|'LIFO'|'SPECIFIC_LOT';
export type Lot = { id:string; symbol:string; quantity:number; unitCost:number; acquired:string };
export type LedgerPosition = { symbol:string; quantity:number; averageCost:number; costBasis:number; realizedPnl:number; lots:Lot[] };
export type LedgerState = {
  cash:number; positions:Record<string,LedgerPosition>; realizedPnl:number; dividends:number; interest:number;
  fees:number; taxes:number; deposits:number; withdrawals:number; netContributions:number;
};

const finite=(x:number|undefined)=>Number.isFinite(x)?x as number:0;
const emptyPos=(symbol:string):LedgerPosition=>({symbol,quantity:0,averageCost:0,costBasis:0,realizedPnl:0,lots:[]});

function consumeLots(p:LedgerPosition, qty:number, price:number, method:CostBasisMethod, lotId?:string){
  let remaining=qty, basis=0;
  const order = method==='LIFO' ? [...p.lots].reverse() : [...p.lots];
  if(method==='SPECIFIC_LOT' && lotId){ order.sort((a,b)=>a.id===lotId?-1:b.id===lotId?1:0); }
  for(const lot of order){ if(remaining<=0)break; const take=Math.min(remaining,lot.quantity); basis += take*lot.unitCost; lot.quantity -= take; remaining -= take; }
  p.lots = p.lots.filter(l=>l.quantity>1e-12);
  return {basis,remaining};
}

export function buildLedger(transactions:Transaction[], initialCash=0, method:CostBasisMethod='WEIGHTED_AVERAGE'):LedgerState{
  const s:LedgerState={cash:initialCash,positions:{},realizedPnl:0,dividends:0,interest:0,fees:0,taxes:0,deposits:initialCash,withdrawals:0,netContributions:initialCash};
  for(const tx of sortTransactions(transactions)){
    const fx=tx.fxRate && tx.fxRate>0?tx.fxRate:1; const fees=finite(tx.fees)*fx, tax=finite(tx.tax)*fx;
    s.fees+=fees; s.taxes+=tax;
    if(tx.type==='DEPOSIT'){const a=finite(tx.amount)*fx;s.cash+=a;s.deposits+=a;s.netContributions+=a;continue;}
    if(tx.type==='WITHDRAWAL'){const a=finite(tx.amount)*fx;s.cash-=a;s.withdrawals+=a;s.netContributions-=a;continue;}
    if(tx.type==='DIVIDEND'){const a=finite(tx.amount)*fx;s.cash+=a-fees-tax;s.dividends+=a;continue;}
    if(tx.type==='INTEREST'){const a=finite(tx.amount)*fx;s.cash+=a-fees-tax;s.interest+=a;continue;}
    if(tx.type==='FEE'){const a=finite(tx.amount)*fx;s.cash-=a;s.fees+=a;continue;}
    if(tx.type==='TAX'){const a=finite(tx.amount)*fx;s.cash-=a;s.taxes+=a;continue;}
    if(tx.type==='FX'){const a=finite(tx.amount)*fx;s.cash+=a-fees-tax;continue;}
    if(!tx.symbol) continue;
    const p=s.positions[tx.symbol]??emptyPos(tx.symbol); s.positions[tx.symbol]=p;
    if(tx.type==='SPLIT'){
      const ratio=tx.splitRatio??1; if(ratio>0){p.quantity*=ratio;p.averageCost/=ratio;p.costBasis=p.quantity*p.averageCost;p.lots.forEach(l=>{l.quantity*=ratio;l.unitCost/=ratio;});} continue;
    }
    const q=finite(tx.quantity), px=finite(tx.price)*fx; if(q<=0||px<0)continue;
    if(tx.type==='BUY'){
      const gross=q*px; s.cash-=gross+fees+tax;
      if(method==='WEIGHTED_AVERAGE'){
        const newBasis=p.costBasis+gross+fees+tax; p.quantity+=q; p.costBasis=newBasis; p.averageCost=p.quantity?newBasis/p.quantity:0;
      }else{
        p.lots.push({id:tx.lotId??tx.id,symbol:tx.symbol,quantity:q,unitCost:(gross+fees+tax)/q,acquired:tx.date}); p.quantity+=q; p.costBasis=p.lots.reduce((a,l)=>a+l.quantity*l.unitCost,0); p.averageCost=p.quantity?p.costBasis/p.quantity:0;
      }
      continue;
    }
    if(tx.type==='SELL'){
      const sellQty=Math.min(q,p.quantity); const proceeds=sellQty*px; let basis=0;
      if(method==='WEIGHTED_AVERAGE'){basis=sellQty*p.averageCost;p.quantity-=sellQty;p.costBasis=Math.max(0,p.costBasis-basis);if(p.quantity<=1e-12){p.quantity=0;p.averageCost=0;p.costBasis=0;}}
      else {const c=consumeLots(p,sellQty,px,method,tx.lotId);basis=c.basis;p.quantity=p.lots.reduce((a,l)=>a+l.quantity,0);p.costBasis=p.lots.reduce((a,l)=>a+l.quantity*l.unitCost,0);p.averageCost=p.quantity?p.costBasis/p.quantity:0;}
      const pnl=proceeds-basis-fees-tax; p.realizedPnl+=pnl;s.realizedPnl+=pnl;s.cash+=proceeds-fees-tax;
    }
  }
  return s;
}
