import { quadForm, spectralBound } from './covariance';

export function projectOntoSimplex(v: number[]): number[] {
  if (!v.length) return [];
  const u = [...v].sort((a,b)=>b-a);
  let cssv = 0, rho = 0, theta = 0;
  for (let j=0;j<u.length;j++) {
    cssv += u[j];
    const t = (cssv - 1)/(j+1);
    if (u[j] - t > 0) { rho = j+1; theta = t; }
  }
  if (!rho) return Array(v.length).fill(1/v.length);
  return v.map(x=>Math.max(0,x-theta));
}

function matVec(A:number[][], w:number[]):number[] { return A.map(r=>r.reduce((s,x,j)=>s+x*w[j],0)); }
function normalizeSimplex(w:number[]):number[] { const s=w.reduce((a,b)=>a+b,0); return s>0?w.map(x=>x/s):Array(w.length).fill(1/w.length); }

export function minVariance(cov:number[][], iterations=500):number[] {
  const n=cov.length; let w=Array(n).fill(1/n);
  const bound=Math.max(1e-12,spectralBound(cov)); const eta=1/(2*bound);
  for(let k=0;k<iterations;k++) { const g=matVec(cov,w).map(x=>2*x); w=projectOntoSimplex(w.map((x,i)=>x-eta*g[i])); }
  return w;
}

export function maxSharpe(mu:number[], cov:number[][], rf=0, iterations=500):number[] {
  if (mu.every(x=>x-rf<=0)) return minVariance(cov,iterations);
  const n=mu.length; let w=Array(n).fill(1/n), best=[...w], bestS=-Infinity;
  for(let k=0;k<iterations;k++) {
    const cw=matVec(cov,w); const variance=Math.max(1e-18,w.reduce((s,x,i)=>s+x*cw[i],0)); const sigma=Math.sqrt(variance);
    const excess=w.reduce((s,x,i)=>s+x*mu[i],0)-rf; const sharpe=excess/sigma;
    if(sharpe>bestS){bestS=sharpe;best=[...w];}
    const grad=mu.map((m,i)=>m/sigma - excess*cw[i]/(sigma**3));
    const norm=Math.sqrt(grad.reduce((s,x)=>s+x*x,0)); if(norm<1e-14) break;
    const eta=Math.sqrt(2)/Math.sqrt(k+1);
    w=projectOntoSimplex(w.map((x,i)=>x+eta*grad[i]/norm));
  }
  return best;
}

export function riskParity(cov:number[][], iterations=500):number[] {
  const n=cov.length;
  let w=normalizeSimplex(cov.map((_,i)=>1/Math.sqrt(Math.max(cov[i][i],1e-18))));
  for(let k=0;k<iterations;k++) {
    const cw=matVec(cov,w); const v=Math.max(1e-18,w.reduce((s,x,i)=>s+x*cw[i],0));
    const rc=w.map((x,i)=>x*cw[i]/v); const target=1/n;
    w=normalizeSimplex(w.map((x,i)=>x*Math.sqrt(target/Math.max(rc[i],1e-12))));
  }
  return w;
}

export function volatilityTarget(cov:number[][], targetVol:number, maxLeverage=1.5):{weights:number[];cash:number;leverage:number;volatility:number} {
  const base=riskParity(cov); const baseVol=Math.sqrt(Math.max(0,quadForm(base,cov)));
  const k=baseVol>0?Math.min(maxLeverage,targetVol/baseVol):0;
  const weights=base.map(x=>k*x); return {weights,cash:1-k,leverage:k,volatility:k*baseVol};
}
