export type DataIssueReason =
  | 'INSUFFICIENT_HISTORY'
  | 'ZERO_DENOMINATOR'
  | 'MISSING_PRICE'
  | 'STALE_PRICE'
  | 'INVALID_INPUT'
  | 'UNSUPPORTED';

export type MetricResult = {
  value: number | null;
  reason?: DataIssueReason;
};

export const metric = (value: number | null, reason?: DataIssueReason): MetricResult => {
  if (value == null || !Number.isFinite(value)) return { value: null, reason: reason ?? 'INVALID_INPUT' };
  return { value };
};
