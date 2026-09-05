export type PriceBar = { date: string; close: number };
export type PriceSeries = { symbol: string; bars: PriceBar[] };
export type RebalanceFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
export type StrategyName =
  | 'buy-hold'
  | 'equal-weight'
  | 'momentum'
  | 'inverse-drift'
  | 'sma-crossover'
  | 'min-variance'
  | 'max-sharpe'
  | 'risk-parity'
  | 'vol-target';

export type BacktestConfig = {
  initialCapital: number;
  feesBps: number;
  slippageBps: number;
  riskFreeRate: number;
  rebalance: RebalanceFrequency;
  strategy: StrategyName;
  userWeights?: number[];
  volTarget?: number;
  maxLeverage?: number;
};

export type RebalanceEvent = {
  index: number;
  date: string;
  weights: number[];
  cash: number;
  costFraction: number;
  equityAfterCost: number;
};

export type TradeLeg = {
  entry: string;
  exit: string;
  asset: string;
  side: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPct: number;
  durationDays: number;
  fees: number;
  status: 'win' | 'loss' | 'flat';
};
