import { calculateReturns, inferPeriodsPerYear, mean, quantile, sampleStd } from '../calculations/shared';
import { sampleCovariance, shrinkCovariance, suggestedShrinkage } from '../calculations/covariance';
import { maxSharpe, minVariance, riskParity, volatilityTarget } from '../calculations/optimize';
import type { BacktestConfig, PriceSeries, RebalanceEvent, TradeLeg } from '../types/quant';

export const ROLLING_VOL_WINDOW=30;
export const ROLLING_SHARPE_WINDOW=60;

export function resolveLookback(n:number):number { return Math.min(252,Math.max(20,Math.floor(n/3))); }

export function alignPriceSeries(series:PriceSeries[], trailingDays?:number):{dates:string[];prices:number[][]} {
  if(!series.length) return {dates:[],prices:[]};
  const maps=series.map(s=>new Map(s.bars.map(b=>[b.date,b.close])));
  let dates=series[0].bars.map(b=>b.date).filter(d=>maps.every(m=>m.has(d))).sort();
  if(trailingDays && dates.length){ const end=new Date(dates[dates.length-1]+'T00:00:00Z').getTime(); const floor=end-trailingDays*86400000; dates=dates.filter(d=>new Date(d+'T00:00:00Z').getTime()>=floor); }
  return {dates,prices:maps.map(m=>dates.map(d=>m.get(d)!))};
}

export function periodKey(date:string, frequency:BacktestConfig['rebalance']):string {
  const d=new Date(date+'T00:00:00Z');
  if(frequency==='none') return 'all';
  if(frequency==='daily') return date;
  if(frequency==='annual') return String(d.getUTCFullYear());
  if(frequency==='monthly') return `${d.getUTCFullYear()}-${d.getUTCMonth()+1}`;
  if(frequency==='quarterly') return `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth()/3)+1}`;
  const th=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())); th.setUTCDate(th.getUTCDate()+4-(th.getUTCDay()||7));
  const y0=new Date(Date.UTC(th.getUTCFullYear(),0,1)); const week=Math.ceil((((th.getTime()-y0.getTime())/86400000)+1)/7); return `${th.getUTCFullYear()}-W${week}`;
}

export function tradeCost(target:number[],current:number[],feesBps:number,slippageBps:number):number {
  const rate=(feesBps+slippageBps)/10000; return target.reduce((s,w,i)=>s+Math.abs(w-(current[i]??0)),0)*rate;
}

function annualMeans(priceMatrix:number[][], start:number,end:number,ppy:number):number[] {
  return priceMatrix.map(p=>mean(calculateReturns(p.slice(start,end+1)))*ppy);
}

export function strategyWeights(strategy:BacktestConfig['strategy'], mu:number[], cov:number[][], userWeights:number[]|undefined, rf:number, pricesWindow:number[][], volTarget=0.12,maxLeverage=1.5):{weights:number[];cash:number} {
  const n=mu.length; const eq=()=>Array(n).fill(1/n);
  if(strategy==='buy-hold') { let w=userWeights?.slice(0,n)??eq(); let s=w.reduce((a,b)=>a+b,0); if(s>1) w=w.map(x=>x/s); return {weights:w,cash:1-w.reduce((a,b)=>a+b,0)}; }
  if(strategy==='equal-weight') return {weights:eq(),cash:0};
  if(strategy==='momentum') { const pos=mu.map(x=>Math.max(0,x)),s=pos.reduce((a,b)=>a+b,0); return {weights:s?pos.map(x=>x/s):eq(),cash:0}; }
  if(strategy==='inverse-drift') { const raw=mu.map(x=>1/(Math.abs(x)+0.05)),s=raw.reduce((a,b)=>a+b,0); return {weights:raw.map(x=>x/s),cash:0}; }
  if(strategy==='sma-crossover') { const bull=pricesWindow.map(p=>p.length<50?true:mean(p.slice(-20))>mean(p.slice(-50))); const c=bull.filter(Boolean).length; return c?{weights:bull.map(b=>b?1/c:0),cash:0}:{weights:Array(n).fill(0),cash:1}; }
  if(strategy==='min-variance') return {weights:minVariance(cov),cash:0};
  if(strategy==='max-sharpe') return {weights:maxSharpe(mu,cov,rf),cash:0};
  if(strategy==='risk-parity') return {weights:riskParity(cov),cash:0};
  const vt=volatilityTarget(cov,volTarget,maxLeverage); return {weights:vt.weights,cash:vt.cash};
}

export type BacktestResult={dates:string[];equity:number[];returns:number[];benchmarkReturns?:number[];periodsPerYear:number;events:RebalanceEvent[];turnover:number;feesPaid:number;lookback:number;shrinkage:number;metrics:ReturnType<typeof calculateMetrics>;monthlyReturns:Record<string,Record<string,number>>;trades:TradeLeg[]};

export function runBacktest(assetSeries:PriceSeries[],benchmark:PriceSeries|undefined,config:BacktestConfig,trailingDays?:number):BacktestResult {
  const all=benchmark?[...assetSeries,benchmark]:assetSeries; const aligned=alignPriceSeries(all,trailingDays);
  const nAssets=assetSeries.length; if(aligned.dates.length<3) throw new Error('Not enough aligned data');
  const dates=aligned.dates; const assetPrices=aligned.prices.slice(0,nAssets); const benchmarkPrices=benchmark?aligned.prices[nAssets]:undefined;
  const ppy=inferPeriodsPerYear(dates); const L=resolveLookback(dates.length); const start=Math.min(L,Math.max(1,dates.length-2));
  const btDates=dates.slice(start); const equity:number[]=[]; const events:RebalanceEvent[]=[]; let turnover=0,feesPaid=0;
  let currentW=Array(nAssets).fill(0),cash=1,V=config.initialCapital,prevKey='';
  const retByAsset=assetPrices.map(calculateReturns);
  let shrink=0;
  for(let abs=start;abs<dates.length;abs++) {
    const local=abs-start; const key=periodKey(dates[abs],config.rebalance); const rebalance=local===0 || (config.rebalance!=='none' && key!==prevKey);
    if(rebalance){
      const retStart=Math.max(0,abs-L); const windowReturns=retByAsset.map(r=>r.slice(retStart,abs));
      const T=Math.min(...windowReturns.map(r=>r.length)); shrink=suggestedShrinkage(nAssets,T);
      const cov=shrinkCovariance(sampleCovariance(windowReturns,ppy),shrink);
      const mu=windowReturns.map(r=>mean(r)*ppy);
      const pwin=assetPrices.map(p=>p.slice(retStart,abs+1));
      const target=strategyWeights(config.strategy,mu,cov,config.userWeights,config.riskFreeRate,pwin,config.volTarget,config.maxLeverage);
      const cost=tradeCost(target.weights,currentW,config.feesBps,config.slippageBps);
      turnover += 0.5*target.weights.reduce((s,w,i)=>s+Math.abs(w-currentW[i]),0);
      const dollar=V*cost; V*=1-cost; feesPaid+=dollar; currentW=[...target.weights]; cash=target.cash;
      events.push({index:local,date:dates[abs],weights:[...currentW],cash,costFraction:cost,equityAfterCost:V}); prevKey=key;
    }
    if(local===0){ equity.push(V); continue; }
    let risky=0; for(let i=0;i<nAssets;i++) risky+=currentW[i]*(assetPrices[i][abs]/assetPrices[i][abs-1]-1);
    V*=1+risky+cash*(config.riskFreeRate/ppy); equity.push(V);
    // drift weights with prices + cash, then renormalize on total portfolio wealth
    const gross=currentW.map((w,i)=>w*(1+(assetPrices[i][abs]/assetPrices[i][abs-1]-1))); const cg=cash*(1+config.riskFreeRate/ppy); const total=gross.reduce((a,b)=>a+b,0)+cg; currentW=gross.map(x=>x/total); cash=cg/total;
  }
  const returns=calculateReturns(equity); const bmReturns=benchmarkPrices?calculateReturns(benchmarkPrices.slice(start)):undefined;
  const trades=deriveTrades(assetSeries.map(s=>s.symbol),assetPrices.map(p=>p.slice(start)),btDates,equity,events,(config.feesBps+config.slippageBps)/10000);
  const metrics=calculateMetrics(equity,returns,bmReturns,ppy,config.riskFreeRate,trades,turnover,feesPaid);
  return {dates:btDates,equity,returns,benchmarkReturns:bmReturns,periodsPerYear:ppy,events,turnover,feesPaid,lookback:L,shrinkage:shrink,metrics,monthlyReturns:calculateMonthlyReturns(btDates,equity),trades};
}

export function calculateCAGR(equity:number[],ppy:number):number { if(equity.length<2||equity[0]<=0)return 0; const y=Math.max((equity.length-1)/ppy,1e-9); return (equity.at(-1)!/equity[0])**(1/y)-1; }
export function calculateBeta(p:number[],m:number[]):number { const n=Math.min(p.length,m.length); if(n<2)return 0; const a=p.slice(0,n),b=m.slice(0,n),ma=mean(a),mb=mean(b); let num=0,den=0; for(let i=0;i<n;i++){num+=(a[i]-ma)*(b[i]-mb);den+=(b[i]-mb)**2;} return den?num/den:0; }
export function calculateAlpha(p:number[],m:number[],ppy:number,rf:number):number { const b=calculateBeta(p,m); return mean(p)*ppy-(rf+b*(mean(m)*ppy-rf)); }
export function calculateSharpe(r:number[],ppy:number,rf:number):number { const vol=sampleStd(r)*Math.sqrt(ppy); return vol?(mean(r)*ppy-rf)/vol:0; }
export function calculateSortino(r:number[],ppy:number,rf:number):number { if(!r.length)return 0; const dd=Math.sqrt(r.reduce((s,x)=>s+Math.min(x,0)**2,0)/r.length)*Math.sqrt(ppy); const n=mean(r)*ppy-rf; return dd?n/dd:(n>0?Infinity:0); }
export function calculateDrawdowns(equity:number[]):{series:number[];max:number;avg:number}{ let peak=-Infinity; const d=equity.map(v=>{peak=Math.max(peak,v);return peak? v/peak-1:0}); return {series:d,max:Math.min(0,...d),avg:mean(d)}; }
export function calculateVaR(r:number[],confidence=0.95):number { return quantile(r,1-confidence); }
export function calculateCVaR(r:number[],confidence=0.95):number { const v=calculateVaR(r,confidence),tail=r.filter(x=>x<=v); return tail.length?mean(tail):v; }
export function calculateSkewness(r:number[]):number { if(r.length<3)return 0; const m=mean(r),s=sampleStd(r); return s?mean(r.map(x=>((x-m)/s)**3)):0; }
export function calculateKurtosis(r:number[]):number { if(r.length<4)return 0; const m=mean(r),s=sampleStd(r); return s?mean(r.map(x=>((x-m)/s)**4))-3:0; }
export function calculateTrackingError(p:number[],m:number[],ppy:number):number { const n=Math.min(p.length,m.length); return sampleStd(Array.from({length:n},(_,i)=>p[i]-m[i]))*Math.sqrt(ppy); }
export function calculateInformationRatio(p:number[],m:number[],ppy:number):number { const n=Math.min(p.length,m.length),diff=Array.from({length:n},(_,i)=>p[i]-m[i]); const te=sampleStd(diff)*Math.sqrt(ppy); return te?mean(diff)*ppy/te:0; }

export function calculateMetrics(equity:number[],r:number[],bm:number[]|undefined,ppy:number,rf:number,trades:TradeLeg[],turnover:number,feesPaid:number){
  const dd=calculateDrawdowns(equity), wins=trades.filter(t=>t.pnl>0),losses=trades.filter(t=>t.pnl<0),grossWins=wins.reduce((s,t)=>s+t.pnl,0),grossLoss=Math.abs(losses.reduce((s,t)=>s+t.pnl,0));
  const cagr=calculateCAGR(equity,ppy), m=bm??[];
  return {totalReturn:equity.length?equity.at(-1)!/equity[0]-1:0,cagr,annualVol:sampleStd(r)*Math.sqrt(ppy),sharpe:calculateSharpe(r,ppy,rf),sortino:calculateSortino(r,ppy,rf),maxDrawdown:dd.max,avgDrawdown:dd.avg,calmar:dd.max?cagr/Math.abs(dd.max):0,var95:calculateVaR(r),cvar95:calculateCVaR(r),skew:calculateSkewness(r),kurt:calculateKurtosis(r),beta:m.length?calculateBeta(r,m):0,alpha:m.length?calculateAlpha(r,m,ppy,rf):0,trackingError:m.length?calculateTrackingError(r,m,ppy):0,informationRatio:m.length?calculateInformationRatio(r,m,ppy):0,winRate:trades.length?wins.length/trades.length:0,profitFactor:losses.length?grossWins/grossLoss:null,avgWin:wins.length?grossWins/wins.length:0,avgLoss:losses.length?-grossLoss/losses.length:0,bestDay:r.length?Math.max(...r):0,worstDay:r.length?Math.min(...r):0,turnover,feesPaid};
}

// Corrected definition: each month is measured from the previous month's last close;
// the first month uses the opening equity as its base.
export function calculateMonthlyReturns(dates:string[],equity:number[]):Record<string,Record<string,number>>{
  const out:Record<string,Record<string,number>>={}; if(!dates.length)return out;
  let base=equity[0]; let i=0;
  while(i<dates.length){ const d=new Date(dates[i]+'T00:00:00Z'); const y=String(d.getUTCFullYear()),m=String(d.getUTCMonth()+1).padStart(2,'0'); let j=i; while(j+1<dates.length){const nd=new Date(dates[j+1]+'T00:00:00Z'); if(nd.getUTCFullYear()!==d.getUTCFullYear()||nd.getUTCMonth()!==d.getUTCMonth())break;j++;}
    out[y]??={}; out[y][m]=equity[j]/base-1; base=equity[j]; i=j+1;
  }
  return out;
}

export function rollingVolatility(r:number[],ppy:number,window=ROLLING_VOL_WINDOW):(number|null)[]{ return r.map((_,i)=>i+1<window?null:sampleStd(r.slice(i-window+1,i+1))*Math.sqrt(ppy)); }
export function rollingSharpe(r:number[],ppy:number,rf:number,window=ROLLING_SHARPE_WINDOW):(number|null)[]{ return r.map((_,i)=>i+1<window?null:calculateSharpe(r.slice(i-window+1,i+1),ppy,rf)); }

export function deriveTrades(symbols:string[],prices:number[][],dates:string[],equity:number[],events:RebalanceEvent[],rate:number):TradeLeg[]{
  const legs:TradeLeg[]=[]; const boundaries=[...events.map(e=>e.index)]; if(boundaries.at(-1)!==dates.length-1)boundaries.push(dates.length-1);
  for(let e=0;e<boundaries.length-1;e++){ const a=boundaries[e],b=boundaries[e+1],event=events[e]; if(!event)continue; for(let i=0;i<symbols.length;i++){const w=event.weights[i]??0;if(w<0.005)continue; const ep=prices[i][a],xp=prices[i][b],q=event.equityAfterCost*w/ep,fees=(ep+xp)*q*rate,pnl=(xp-ep)*q-fees,pct=pnl/(ep*q),days=Math.round((new Date(dates[b]+'T00:00:00Z').getTime()-new Date(dates[a]+'T00:00:00Z').getTime())/86400000); legs.push({entry:dates[a],exit:dates[b],asset:symbols[i],side:'buy',quantity:q,entryPrice:ep,exitPrice:xp,pnl,pnlPct:pct,durationDays:days,fees,status:pnl>0?'win':pnl<0?'loss':'flat'}); }} return legs;
}
