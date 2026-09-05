import { gaussian, mean, mulberry32, normInv, normPdf, quantile } from '../calculations/shared';

export class QuantConfigError extends Error {}
export function minAttainableCorrelation(n:number):number { return n<=1?0:-1/(n-1); }

export function portfolioDriftVol(weights:number[],mu:number[],sigma:number[],rho:number):{mu:number;sigma:number}{
  const n=weights.length;if(!n)return{mu:0,sigma:0}; const min=minAttainableCorrelation(n); if(rho<min-1e-12||rho>1)throw new QuantConfigError(`Correlation must be in [${min}, 1]`);
  const sw=weights.reduce((a,b)=>a+b,0); const W=sw?weights.map(x=>x/sw):Array(n).fill(1/n); const drift=W.reduce((s,w,i)=>s+w*mu[i],0); let v=0; for(let i=0;i<n;i++)for(let j=0;j<n;j++)v+=W[i]*W[j]*sigma[i]*sigma[j]*(i===j?1:rho); if(v< -1e-12)throw new QuantConfigError('Covariance is not PSD'); return{mu:drift,sigma:Math.sqrt(Math.max(0,v))};
}

export type MonteCarloResult={terminal:number[];expectedValue:number;median:number;p5:number;p95:number;pLoss:number;pDouble:number;var95:number;cvar95:number;best:number;worst:number;std:number;paths:number[][]};
export function runMonteCarlo(initial:number,weights:number[],mu:number[],sigma:number[],rho:number,horizonDays:number,nPaths=1000,seed=42):MonteCarloResult{
  const pv=portfolioDriftVol(weights,mu,sigma,rho),rng=mulberry32(seed),dt=1/252; const keep=Math.min(50,nPaths),paths:Array<number[]> = Array.from({length:keep},()=>[initial]),terminal:number[]=[];
  for(let s=0;s<nPaths;s++){let v=initial; for(let t=0;t<horizonDays;t++){v*=Math.exp((pv.mu-0.5*pv.sigma**2)*dt+pv.sigma*Math.sqrt(dt)*gaussian(rng)); if(s<keep)paths[s].push(v);}terminal.push(v)}
  const pnl=terminal.map(v=>v-initial),v5=quantile(terminal,0.05),var95=Math.max(0,initial-v5),tail=pnl.filter(x=>x<=-var95); return{terminal,expectedValue:mean(terminal),median:quantile(terminal,0.5),p5:v5,p95:quantile(terminal,0.95),pLoss:terminal.filter(v=>v<initial).length/nPaths,pDouble:terminal.filter(v=>v>=2*initial).length/nPaths,var95,cvar95:tail.length?-mean(tail):var95,best:Math.max(...terminal),worst:Math.min(...terminal),std:sampleStdLocal(terminal),paths};
}
function sampleStdLocal(xs:number[]){if(xs.length<2)return 0;const m=mean(xs);return Math.sqrt(xs.reduce((s,x)=>s+(x-m)**2,0)/(xs.length-1));}

export type ShockClass='equityDM'|'equityEM'|'equityFrontier'|'bond'|'crypto'|'stable';
export type StressScenario={id:string;name:string;recoveryDays:number;shocks:Partial<Record<ShockClass,number|null>>};
export const HISTORICAL_SCENARIOS:StressScenario[]=[
 {id:'covid',name:'COVID-19 Crash',recoveryDays:150,shocks:{equityDM:-.34,equityEM:-.35,equityFrontier:-.12,bond:-.05,crypto:-.50,stable:0}},
 {id:'gfc',name:'Financial Crisis',recoveryDays:517,shocks:{equityDM:-.57,equityEM:-.45,equityFrontier:null,bond:-.12,crypto:null,stable:0}},
 {id:'dotcom',name:'Dot-Com Burst',recoveryDays:929,shocks:{equityDM:-.49,equityEM:-.25,equityFrontier:null,bond:.20,crypto:null,stable:0}},
 {id:'luna-ftx',name:'Luna / FTX',recoveryDays:190,shocks:{equityDM:-.18,equityEM:-.10,equityFrontier:0,bond:-.10,crypto:-.65,stable:-.02}},
 {id:'rates-2022',name:'Rate Shock 2022',recoveryDays:282,shocks:{equityDM:-.25,equityEM:-.15,equityFrontier:-.03,bond:-.17,crypto:-.65,stable:0}},
 {id:'flash',name:'Flash Crash',recoveryDays:1,shocks:{equityDM:-.09,equityEM:-.07,equityFrontier:0,bond:-.01,crypto:-.12,stable:0}},
 {id:'geopolitical',name:'Geopolitical',recoveryDays:60,shocks:{equityDM:-.15,equityEM:-.20,equityFrontier:-.08,bond:-.05,crypto:-.25,stable:0}}
];

export type StressHolding={name:string;value:number;shockClass:ShockClass};
export function runStressTest(holdings:StressHolding[],cash:number,scenario:StressScenario){let before=cash,after=cash,excludedUSD=0;const rows=holdings.map(h=>{before+=h.value;const s=scenario.shocks[h.shockClass];if(s===null||s===undefined){after+=h.value;excludedUSD+=h.value;return{...h,shock:null,after:h.value,pnl:null};}const av=h.value*(1+s);after+=av;return{...h,shock:s,after:av,pnl:av-h.value};});return{before,after,pnl:after-before,pnlPct:before?after/before-1:0,excludedUSD,excludedShare:before?excludedUSD/before:0,rows};}

export function recoveryPath(trough:number,pre:number,recoveryDays:number){const intervals=Math.min(30,Math.max(2,Math.ceil(recoveryDays/7)));return Array.from({length:intervals+1},(_,i)=>{const day=Math.round(recoveryDays*i/intervals);return{day,value:trough+(pre-trough)*(day/recoveryDays)}});}
export function horizonVolatility(annualVol:number,horizonDays:number,ppy=252){return annualVol/Math.sqrt(ppy)*Math.sqrt(Math.max(1,horizonDays));}
export function parametricVaR(value:number,annualVol:number,horizonDays:number,confidence=.95){return value*normInv(confidence)*horizonVolatility(annualVol,horizonDays);}
export function parametricCVaR(value:number,annualVol:number,horizonDays:number,confidence=.95){const z=normInv(confidence);return value*horizonVolatility(annualVol,horizonDays)*normPdf(z)/(1-confidence);}

/** Percentile cone from retained Monte Carlo paths. */
export function monteCarloPercentileCone(paths:number[][],quantiles=[0.05,0.25,0.5,0.75,0.95]){
  const steps=paths.reduce((m,p)=>Math.max(m,p.length),0); const out:Array<{step:number;values:Record<string,number>}>=[];
  for(let t=0;t<steps;t++){
    const xs=paths.map(p=>p[t]).filter((x):x is number=>Number.isFinite(x)); if(!xs.length)continue;
    const values:Record<string,number>={}; for(const q of quantiles)values[String(q)]=quantile(xs,q); out.push({step:t,values});
  }
  return out;
}

/** Equal-width histogram for terminal values. */
export function terminalHistogram(values:number[],buckets=24){
  if(!values.length)return [];
  const lo=Math.min(...values),hi=Math.max(...values); if(hi===lo)return[{min:lo,max:hi,center:lo,count:values.length}];
  const width=(hi-lo)/buckets,counts=Array(buckets).fill(0);
  for(const v of values){const idx=Math.min(buckets-1,Math.max(0,Math.floor((v-lo)/width)));counts[idx]++;}
  return counts.map((count,i)=>({min:lo+i*width,max:lo+(i+1)*width,center:lo+(i+.5)*width,count}));
}

/** Custom three-slider stress scenario; equities share one shock. */
export function runCustomStress(holdings:StressHolding[],cash:number,equityPct:number,cryptoPct:number,stablePct:number,bondPct=0,recoveryDays=30){
  const scenario:StressScenario={id:'custom',name:'Custom scenario',recoveryDays,shocks:{equityDM:equityPct,equityEM:equityPct,equityFrontier:equityPct,bond:bondPct,crypto:cryptoPct,stable:stablePct}};
  return runStressTest(holdings,cash,scenario);
}

/** Value-weighted portfolio volatility prefill, with cash at zero volatility. */
export function portfolioVolatilityPrefill(positions:Array<{value:number;annualVol:number|null|undefined}>,cash=0){
  let coveredValue=0,weighted=0,excludedValue=0;
  for(const p of positions){if(p.annualVol==null||!Number.isFinite(p.annualVol)){excludedValue+=p.value;continue;}coveredValue+=p.value;weighted+=p.value*p.annualVol;}
  const total=coveredValue+cash; return{value:total,annualVol:total>0?weighted/total:0,coveredValue,excludedValue,cash};
}

/** VaR/CVaR term structure for charting. */
export function varCvarTermStructure(value:number,annualVol:number,maxHorizon=30,confidence=.95){
  return Array.from({length:Math.max(0,maxHorizon)},(_,i)=>{const h=i+1;return{horizonDays:h,var:parametricVaR(value,annualVol,h,confidence),cvar:parametricCVaR(value,annualVol,h,confidence)}});
}
