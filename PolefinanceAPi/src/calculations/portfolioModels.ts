import { minVariance, maxSharpe, riskParity, volatilityTarget } from './optimize';
import { portfolioExpectedReturn, portfolioVolatility } from './portfolioAnalytics';

export type FrontierPoint = { targetReturn: number; volatility: number; weights: number[] };

/**
 * Approximate efficient frontier using projected gradient with a quadratic penalty on target-return error.
 * Deterministic and dependency-free; intended for UI exploration, not regulatory optimization.
 */
export function efficientFrontier(
  mu: number[],
  cov: number[][],
  points = 25,
  iterations = 1500,
): FrontierPoint[] {
  if (!mu.length) return [];
  const lo = Math.min(...mu), hi = Math.max(...mu);
  const n = mu.length;
  const simplex = (v: number[]) => {
    const u = [...v].sort((a,b)=>b-a); let cssv=0,theta=0,rho=0;
    for(let j=0;j<u.length;j++){cssv+=u[j];const t=(cssv-1)/(j+1);if(u[j]-t>0){rho=j+1;theta=t;}}
    return rho?v.map(x=>Math.max(0,x-theta)):Array(n).fill(1/n);
  };
  const matVec=(A:number[][],w:number[])=>A.map(r=>r.reduce((s,x,j)=>s+x*w[j],0));
  const out: FrontierPoint[]=[];
  for(let p=0;p<points;p++){
    const target=points===1?(lo+hi)/2:lo+(hi-lo)*p/(points-1);
    let w=Array(n).fill(1/n); const penalty=100;
    for(let k=0;k<iterations;k++){
      const cw=matVec(cov,w); const er=portfolioExpectedReturn(w,mu); const grad=w.map((_,i)=>2*cw[i]+2*penalty*(er-target)*mu[i]);
      const eta=0.05/Math.sqrt(k+1); w=simplex(w.map((x,i)=>x-eta*grad[i]));
    }
    out.push({targetReturn:portfolioExpectedReturn(w,mu),volatility:portfolioVolatility(w,cov),weights:w});
  }
  return out;
}

export function optimizationSuite(mu:number[],cov:number[][],rf=0,targetVol=0.12,maxLeverage=1.5){
  const mv=minVariance(cov), ms=maxSharpe(mu,cov,rf), rp=riskParity(cov), vt=volatilityTarget(cov,targetVol,maxLeverage);
  const describe=(weights:number[])=>({weights,expectedReturn:portfolioExpectedReturn(weights,mu),volatility:portfolioVolatility(weights,cov)});
  return {minimumVariance:describe(mv),maximumSharpe:{...describe(ms),sharpe:(portfolioExpectedReturn(ms,mu)-rf)/(portfolioVolatility(ms,cov)||Infinity)},riskParity:describe(rp),volatilityTarget:{...vt,expectedReturn:portfolioExpectedReturn(vt.weights,mu)}};
}
