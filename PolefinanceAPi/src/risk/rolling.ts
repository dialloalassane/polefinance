import { mean, sampleStd } from '../calculations/shared';
import { calculateBeta } from '../utils/backtesting';
export function rollingVolatility(r:number[],ppy=252,window=20):(number|null)[]{return r.map((_,i)=>i+1<window?null:sampleStd(r.slice(i-window+1,i+1))*Math.sqrt(ppy));}
export function rollingSharpe(r:number[],ppy=252,rf=0,window=60):(number|null)[]{return r.map((_,i)=>{if(i+1<window)return null;const x=r.slice(i-window+1,i+1),v=sampleStd(x)*Math.sqrt(ppy);return v?(mean(x)*ppy-rf)/v:null;});}
export function rollingBeta(p:number[],b:number[],window=60):(number|null)[]{const n=Math.min(p.length,b.length);return Array.from({length:n},(_,i)=>i+1<window?null:calculateBeta(p.slice(i-window+1,i+1),b.slice(i-window+1,i+1)));}
export function rollingCorrelation(a:number[],b:number[],window=60):(number|null)[]{const n=Math.min(a.length,b.length);return Array.from({length:n},(_,i)=>{if(i+1<window)return null;const x=a.slice(i-window+1,i+1),y=b.slice(i-window+1,i+1),mx=mean(x),my=mean(y),sx=sampleStd(x),sy=sampleStd(y);if(!sx||!sy)return null;let c=0;for(let j=0;j<x.length;j++)c+=(x[j]-mx)*(y[j]-my);return c/((x.length-1)*sx*sy);});}
export function rollingDrawdown(equity:number[],window=60):(number|null)[]{return equity.map((_,i)=>{if(i+1<window)return null;const x=equity.slice(i-window+1,i+1),peak=Math.max(...x);return peak?x.at(-1)!/peak-1:null;});}
