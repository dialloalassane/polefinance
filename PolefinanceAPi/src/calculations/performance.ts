import { mean, sampleStd } from './shared';

export type NavPoint = { date: string; value: number; externalCashFlow?: number };

/** Cash-flow neutral daily return: (V_t - flow_t) / V_{t-1} - 1. */
export function cashFlowAdjustedReturns(points: NavPoint[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1].value;
    const current = points[i].value;
    const flow = points[i].externalCashFlow ?? 0;
    out.push(prev !== 0 ? (current - flow) / prev - 1 : 0);
  }
  return out;
}

/** Time-weighted return: chain cash-flow-neutral subperiod returns. */
export function timeWeightedReturn(points: NavPoint[]): number {
  return cashFlowAdjustedReturns(points).reduce((acc, r) => acc * (1 + r), 1) - 1;
}

/** Dietz return, useful when only period-level cash-flow timing is available. */
export function modifiedDietzReturn(
  beginningValue: number,
  endingValue: number,
  flows: Array<{ amount: number; weight: number }>,
): number | null {
  const netFlow = flows.reduce((s, f) => s + f.amount, 0);
  const denominator = beginningValue + flows.reduce((s, f) => s + f.amount * f.weight, 0);
  return denominator !== 0 ? (endingValue - beginningValue - netFlow) / denominator : null;
}

/** XIRR-style money-weighted return using Newton + bisection fallback. */
export function xirr(cashFlows: Array<{ date: string; amount: number }>, guess = 0.1): number | null {
  if (cashFlows.length < 2) return null;
  const flows = [...cashFlows].sort((a, b) => a.date.localeCompare(b.date));
  if (!flows.some(f => f.amount < 0) || !flows.some(f => f.amount > 0)) return null;
  const t0 = new Date(flows[0].date + 'T00:00:00Z').getTime();
  const years = flows.map(f => (new Date(f.date + 'T00:00:00Z').getTime() - t0) / 86_400_000 / 365.25);
  const f = (rate: number) => flows.reduce((s, cf, i) => s + cf.amount / Math.pow(1 + rate, years[i]), 0);
  const df = (rate: number) => flows.reduce((s, cf, i) => s - years[i] * cf.amount / Math.pow(1 + rate, years[i] + 1), 0);

  let r = guess;
  for (let i = 0; i < 50; i++) {
    if (r <= -0.999999) break;
    const y = f(r), d = df(r);
    if (Math.abs(y) < 1e-10) return r;
    if (!Number.isFinite(d) || Math.abs(d) < 1e-14) break;
    const next = r - y / d;
    if (!Number.isFinite(next) || next <= -0.999999 || next > 1e6) break;
    if (Math.abs(next - r) < 1e-12) return next;
    r = next;
  }

  let lo = -0.9999, hi = 10;
  let flo = f(lo), fhi = f(hi);
  for (let k = 0; k < 20 && flo * fhi > 0; k++) { hi *= 2; fhi = f(hi); }
  if (flo * fhi > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2, fm = f(mid);
    if (Math.abs(fm) < 1e-10) return mid;
    if (flo * fm <= 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
  }
  return (lo + hi) / 2;
}

export function annualizedArithmeticReturn(returns: number[], periodsPerYear: number): number {
  return mean(returns) * periodsPerYear;
}

export function annualizedVolatility(returns: number[], periodsPerYear: number): number {
  return sampleStd(returns) * Math.sqrt(periodsPerYear);
}

export function downsideDeviation(returns: number[], periodsPerYear: number, target = 0): number {
  if (!returns.length) return 0;
  const variance = returns.reduce((s, r) => s + Math.min(r - target, 0) ** 2, 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(periodsPerYear);
}

export function omegaRatio(returns: number[], threshold = 0): number | null {
  let gains = 0, losses = 0;
  for (const r of returns) {
    if (r > threshold) gains += r - threshold;
    else losses += threshold - r;
  }
  return losses > 0 ? gains / losses : gains > 0 ? Infinity : null;
}

export function ulcerIndex(equity: number[]): number {
  if (!equity.length) return 0;
  let peak = -Infinity;
  const sq = equity.map(v => {
    peak = Math.max(peak, v);
    const dd = peak > 0 ? (v / peak - 1) * 100 : 0;
    return dd * dd;
  });
  return Math.sqrt(mean(sq));
}
