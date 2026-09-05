import { mean } from './shared';

export function sampleCovariance(returnSeries: number[][], periodsPerYear: number): number[][] {
  const n = returnSeries.length;
  if (!n) return [];
  const T = Math.min(...returnSeries.map(r => r.length));
  const mus = returnSeries.map(r => mean(r.slice(0, T)));
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => {
    if (T < 2) return 0;
    let s = 0;
    for (let t = 0; t < T; t++) s += (returnSeries[i][t] - mus[i]) * (returnSeries[j][t] - mus[j]);
    return s / (T - 1) * periodsPerYear;
  }));
}

export function suggestedShrinkage(nAssets: number, observations: number): number {
  if (observations <= 0) return 0.9;
  const raw = (nAssets * (nAssets + 1) / 2) / observations;
  return Math.min(0.9, Math.max(0.05, raw));
}

export function shrinkCovariance(cov: number[][], delta: number): number[][] {
  return cov.map((row, i) => row.map((v, j) => i === j ? v : (1 - delta) * v));
}

export function spectralBound(cov: number[][]): number {
  return Math.max(0, ...cov.map(row => row.reduce((s, x) => s + Math.abs(x), 0)));
}

export function quadForm(w: number[], cov: number[][]): number {
  let s = 0;
  for (let i = 0; i < w.length; i++) for (let j = 0; j < w.length; j++) s += w[i] * cov[i][j] * w[j];
  return s;
}

export function covToCorr(cov: number[][]): number[][] {
  return cov.map((row, i) => row.map((v, j) => {
    const den = Math.sqrt(Math.max(0, cov[i][i] * cov[j][j]));
    return den ? v / den : 0;
  }));
}
