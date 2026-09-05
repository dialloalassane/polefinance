import { MetricResult, metric } from '../types/result';
export function safeDivide(n:number,d:number):MetricResult{return d===0?metric(null,'ZERO_DENOMINATOR'):metric(n/d);}
export function sanitizeSeries(xs:Array<number|null|undefined>):number[]{return xs.filter((x):x is number=>x!=null&&Number.isFinite(x));}
export function validatePrices(prices:Array<{date:string;price:number}>){const seen=new Set<string>();const issues:string[]=[];for(const p of prices){if(seen.has(p.date))issues.push(`DUPLICATE:${p.date}`);seen.add(p.date);if(!Number.isFinite(p.price)||p.price<=0)issues.push(`INVALID_PRICE:${p.date}`);}return issues;}
export function stalePrice(lastDate:string,asOf:string,maxDays=5){const d=(new Date(asOf).getTime()-new Date(lastDate).getTime())/86400000;return d>maxDays;}
