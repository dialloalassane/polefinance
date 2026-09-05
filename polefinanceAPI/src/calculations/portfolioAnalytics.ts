import { calculateBeta, calculateAlpha, calculateInformationRatio, calculateTrackingError, calculateSharpe, calculateSortino, calculateVaR, calculateCVaR, calculateDrawdowns } from '../utils/backtesting';
import { mean, quantile, sampleStd } from './shared';
import { annualizedVolatility, omegaRatio, ulcerIndex } from './performance';
import { quadForm } from './covariance';

export function portfolioWeights(values: number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0);
  return total !== 0 ? values.map(v => v / total) : values.map(() => 0);
}

export function herfindahlIndex(weights: number[]): number { return weights.reduce((s, w) => s + w * w, 0); }
export function effectiveNumberOfPositions(weights: number[]): number { const h = herfindahlIndex(weights); return h > 0 ? 1 / h : 0; }
export function largestPositionWeight(weights: number[]): number { return weights.length ? Math.max(...weights) : 0; }

export function portfolioVariance(weights: number[], covariance: number[][]): number { return quadForm(weights, covariance); }
export function portfolioVolatility(weights: number[], covariance: number[][]): number { return Math.sqrt(Math.max(0, portfolioVariance(weights, covariance))); }
export function portfolioExpectedReturn(weights: number[], expectedReturns: number[]): number { return weights.reduce((s, w, i) => s + w * (expectedReturns[i] ?? 0), 0); }

export function marginalRiskContributions(weights: number[], covariance: number[][]): number[] {
  const vol = portfolioVolatility(weights, covariance);
  if (vol === 0) return weights.map(() => 0);
  return covariance.map(row => row.reduce((s, c, j) => s + c * weights[j], 0) / vol);
}
export function componentRiskContributions(weights: number[], covariance: number[][]): number[] {
  const m = marginalRiskContributions(weights, covariance);
  return weights.map((w, i) => w * m[i]);
}
export function percentRiskContributions(weights: number[], covariance: number[][]): number[] {
  const c = componentRiskContributions(weights, covariance);
  const total = c.reduce((a, b) => a + b, 0);
  return total !== 0 ? c.map(x => x / total) : c.map(() => 0);
}

export function covarianceToCorrelation(covariance: number[][]): number[][] {
  return covariance.map((row, i) => row.map((v, j) => {
    const d = Math.sqrt(Math.max(0, covariance[i][i] * covariance[j][j]));
    return d > 0 ? v / d : i === j ? 1 : 0;
  }));
}

export function historicalExpectedShortfall(returns: number[], confidence = 0.95): number { return calculateCVaR(returns, confidence); }
export function historicalVaR(returns: number[], confidence = 0.95): number { return calculateVaR(returns, confidence); }

export function semiDeviation(returns: number[], periodsPerYear: number): number {
  if (!returns.length) return 0;
  return Math.sqrt(returns.reduce((s, r) => s + Math.min(r, 0) ** 2, 0) / returns.length) * Math.sqrt(periodsPerYear);
}

export function gainLossRatio(returns: number[]): number | null {
  const gains = returns.filter(r => r > 0), losses = returns.filter(r => r < 0);
  if (!losses.length) return gains.length ? Infinity : null;
  return mean(gains) / Math.abs(mean(losses));
}

export function hitRate(returns: number[]): number { return returns.length ? returns.filter(r => r > 0).length / returns.length : 0; }

export function percentileReturn(returns: number[], percentile: number): number { return quantile(returns, percentile); }

export function buildRiskReport(input: {
  equity: number[];
  returns: number[];
  benchmarkReturns?: number[];
  periodsPerYear: number;
  riskFreeRate?: number;
}) {
  const rf = input.riskFreeRate ?? 0;
  const benchmark = input.benchmarkReturns ?? [];
  const dd = calculateDrawdowns(input.equity);
  const vol = annualizedVolatility(input.returns, input.periodsPerYear);
  const sharpe = calculateSharpe(input.returns, input.periodsPerYear, rf);
  const sortino = calculateSortino(input.returns, input.periodsPerYear, rf);
  const beta = benchmark.length ? calculateBeta(input.returns, benchmark) : null;
  const alpha = benchmark.length ? calculateAlpha(input.returns, benchmark, input.periodsPerYear, rf) : null;
  const trackingError = benchmark.length ? calculateTrackingError(input.returns, benchmark, input.periodsPerYear) : null;
  const informationRatio = benchmark.length ? calculateInformationRatio(input.returns, benchmark, input.periodsPerYear) : null;
  return {
    meanPeriodicReturn: mean(input.returns),
    annualizedVolatility: vol,
    sharpe,
    sortino,
    maxDrawdown: dd.max,
    averageDrawdown: dd.avg,
    ulcerIndex: ulcerIndex(input.equity),
    historicalVaR95: historicalVaR(input.returns, 0.95),
    historicalCVaR95: historicalExpectedShortfall(input.returns, 0.95),
    beta,
    alpha,
    trackingError,
    informationRatio,
    omega: omegaRatio(input.returns),
    hitRate: hitRate(input.returns),
    gainLossRatio: gainLossRatio(input.returns),
    bestPeriod: input.returns.length ? Math.max(...input.returns) : 0,
    worstPeriod: input.returns.length ? Math.min(...input.returns) : 0,
    medianReturn: quantile(input.returns, 0.5),
    stdPeriodic: sampleStd(input.returns),
  };
}

export function grossExposure(longValues:number[],shortValues:number[]=[]):number { return longValues.reduce((s,v)=>s+Math.abs(v),0)+shortValues.reduce((s,v)=>s+Math.abs(v),0); }
export function netExposure(longValues:number[],shortValues:number[]=[]):number { return longValues.reduce((s,v)=>s+v,0)+shortValues.reduce((s,v)=>s+v,0); }
export function exposureRatio(investedValue:number,totalValue:number):number { return totalValue!==0?investedValue/totalValue:0; }

export function drawdownEpisodes(equity:number[],dates?:string[]){
  const episodes:Array<{startIndex:number;troughIndex:number;endIndex:number|null;depth:number;duration:number;recoveryDuration:number|null;startDate?:string;troughDate?:string;endDate?:string}>=[];
  if(!equity.length)return episodes; let peak=equity[0],peakIdx=0,inDd=false,troughIdx=0,troughDepth=0;
  for(let i=1;i<equity.length;i++){
    if(equity[i]>=peak){
      if(inDd){episodes.push({startIndex:peakIdx,troughIndex:troughIdx,endIndex:i,depth:troughDepth,duration:i-peakIdx,recoveryDuration:i-troughIdx,startDate:dates?.[peakIdx],troughDate:dates?.[troughIdx],endDate:dates?.[i]});inDd=false;}
      peak=equity[i];peakIdx=i;troughIdx=i;troughDepth=0;
    } else {
      const d=equity[i]/peak-1;if(!inDd){inDd=true;troughIdx=i;troughDepth=d;}if(d<troughDepth){troughDepth=d;troughIdx=i;}
    }
  }
  if(inDd)episodes.push({startIndex:peakIdx,troughIndex:troughIdx,endIndex:null,depth:troughDepth,duration:equity.length-1-peakIdx,recoveryDuration:null,startDate:dates?.[peakIdx],troughDate:dates?.[troughIdx]});
  return episodes;
}

export function rollingMetric<T>(values:number[],window:number,fn:(slice:number[])=>T):Array<T|null>{return values.map((_,i)=>i+1<window?null:fn(values.slice(i-window+1,i+1)));}
export function rollingBeta(portfolio:number[],benchmark:number[],window=60):Array<number|null>{const n=Math.min(portfolio.length,benchmark.length);return Array.from({length:n},(_,i)=>i+1<window?null:calculateBeta(portfolio.slice(i-window+1,i+1),benchmark.slice(i-window+1,i+1)));}
