/**
 * Human-readable formula/model registry for PoleFinance UI "Models" / help panels.
 * Computations live in the calculation modules; this registry documents what is displayed.
 */
export type FunctionModel = {
  id: string;
  label: string;
  category: 'portfolio'|'performance'|'risk'|'benchmark'|'optimization'|'backtest'|'monte-carlo'|'stress'|'accounting';
  formula: string;
  description: string;
  implementation: string;
};

export const FUNCTION_MODELS: FunctionModel[] = [
  {id:'total-value',label:'Total Portfolio Value',category:'portfolio',formula:'V = Cash + Σ(qᵢ × Pᵢ)',description:'Marked-to-market portfolio NAV.',implementation:'src/utils/portfolioMetrics.ts'},
  {id:'invested',label:'Invested Amount',category:'portfolio',formula:'Invested = Σ(qᵢ × Pᵢ)',description:'Current market value of open positions.',implementation:'src/utils/portfolioMetrics.ts'},
  {id:'cash',label:'Cash',category:'portfolio',formula:'Cash = deposits - withdrawals - buys - fees + sells + income',description:'Uninvested base-currency cash.',implementation:'src/calculations/portfolioAccounting.ts'},
  {id:'realized-pnl',label:'Realized P&L',category:'accounting',formula:'Σ[(SellPrice - AvgCost) × Qty - sell fees] + income - other fees',description:'P&L crystallized by sales and investment income.',implementation:'src/calculations/portfolioAccounting.ts'},
  {id:'unrealized-pnl',label:'Unrealized P&L',category:'accounting',formula:'Σ[MarketValueᵢ - RemainingCostBasisᵢ]',description:'Open-position mark-to-market profit/loss.',implementation:'src/calculations/portfolioAccounting.ts'},
  {id:'total-pnl',label:'Total P&L',category:'performance',formula:'Current NAV - Net Contributions',description:'Overall monetary gain/loss after neutralizing external flows.',implementation:'src/calculations/portfolioAccounting.ts'},
  {id:'total-return',label:'Total Return',category:'performance',formula:'TotalP&L / NetContributions',description:'Simple contribution-based return; use TWR/MWR for multi-date flows.',implementation:'src/utils/portfolioMetrics.ts'},
  {id:'daily-pnl',label:'Daily P&L',category:'performance',formula:'NAVₜ - NAVₜ₋₁ - externalFlowₜ',description:'One-day P&L with deposits/withdrawals neutralized.',implementation:'src/utils/portfolioMetrics.ts'},
  {id:'daily-return',label:'Daily Return',category:'performance',formula:'DailyP&L / NAVₜ₋₁',description:'Daily portfolio percentage change net of external flows.',implementation:'src/utils/portfolioMetrics.ts'},
  {id:'twr',label:'Time-Weighted Return',category:'performance',formula:'Πₜ(1+rₜ) - 1',description:'Chains cash-flow-neutral subperiod returns.',implementation:'src/calculations/performance.ts'},
  {id:'xirr',label:'Money-Weighted Return / XIRR',category:'performance',formula:'Σ CFᵢ/(1+r)^yearsᵢ = 0',description:'Investor experience accounting for timing of cash flows.',implementation:'src/calculations/performance.ts'},
  {id:'volatility',label:'Annualized Volatility',category:'risk',formula:'s(r) × √P',description:'Sample standard deviation annualized.',implementation:'src/utils/backtesting.ts'},
  {id:'sharpe',label:'Sharpe Ratio',category:'risk',formula:'(mean(r)×P - Rf)/(s(r)×√P)',description:'Excess arithmetic return per unit of total volatility.',implementation:'src/utils/backtesting.ts'},
  {id:'sortino',label:'Sortino Ratio',category:'risk',formula:'(mean(r)×P - Rf)/DownsideDeviation',description:'Excess return per unit of downside risk.',implementation:'src/utils/backtesting.ts'},
  {id:'drawdown',label:'Max Drawdown',category:'risk',formula:'minₜ(Vₜ/Peakₜ - 1)',description:'Worst peak-to-trough decline.',implementation:'src/utils/backtesting.ts'},
  {id:'calmar',label:'Calmar Ratio',category:'risk',formula:'CAGR / |MaxDrawdown|',description:'Annualized geometric return per unit of maximum drawdown.',implementation:'src/utils/backtesting.ts'},
  {id:'var',label:'Historical VaR',category:'risk',formula:'Q₁₋confidence(returns)',description:'Empirical lower-tail return quantile.',implementation:'src/utils/backtesting.ts'},
  {id:'cvar',label:'Historical CVaR',category:'risk',formula:'E[r | r ≤ VaR]',description:'Average return in the VaR tail.',implementation:'src/utils/backtesting.ts'},
  {id:'beta',label:'Beta',category:'benchmark',formula:'Cov(Rp,Rm)/Var(Rm)',description:'Sensitivity to benchmark returns.',implementation:'src/utils/backtesting.ts'},
  {id:'alpha',label:'Jensen Alpha',category:'benchmark',formula:'Rp - [Rf + β(Rm-Rf)]',description:'Annualized benchmark-risk-adjusted excess return.',implementation:'src/utils/backtesting.ts'},
  {id:'tracking-error',label:'Tracking Error',category:'benchmark',formula:'stdev(Rp-Rm)×√P',description:'Annualized volatility of active return.',implementation:'src/utils/backtesting.ts'},
  {id:'information-ratio',label:'Information Ratio',category:'benchmark',formula:'mean(Rp-Rm)×P / TrackingError',description:'Active return per unit of active risk.',implementation:'src/utils/backtesting.ts'},
  {id:'turnover',label:'Turnover (one-way)',category:'backtest',formula:'Σrebalances 0.5×Σᵢ|wnewᵢ-woldᵢ|',description:'Cumulative fraction of the book replaced.',implementation:'src/utils/backtesting.ts'},
  {id:'transaction-cost',label:'Transaction Cost',category:'backtest',formula:'Σᵢ|wnewᵢ-woldᵢ| × (fee+slippage)',description:'Two-way traded notional charged at each rebalance.',implementation:'src/utils/backtesting.ts'},
  {id:'min-var',label:'Minimum Variance',category:'optimization',formula:'min wᵀΣw, Σw=1, w≥0',description:'Long-only global minimum variance portfolio.',implementation:'src/calculations/optimize.ts'},
  {id:'max-sharpe',label:'Maximum Sharpe',category:'optimization',formula:'max (wᵀμ-Rf)/√(wᵀΣw)',description:'Long-only tangency portfolio.',implementation:'src/calculations/optimize.ts'},
  {id:'risk-parity',label:'Risk Parity / ERC',category:'optimization',formula:'wᵢ(Σw)ᵢ/(wᵀΣw)=1/n',description:'Equal percentage contribution to portfolio variance.',implementation:'src/calculations/optimize.ts'},
  {id:'vol-target',label:'Volatility Targeting',category:'optimization',formula:'k=min(Lmax, σtarget/σERC); riskyWeights=k×wERC; cash=1-k',description:'Scales risk-parity exposure with explicit cash/borrow leg.',implementation:'src/calculations/optimize.ts'},
  {id:'cov-shrink',label:'Covariance Shrinkage',category:'optimization',formula:'Σ*=(1-δ)Σ+δdiag(Σ)',description:'Pulls unstable correlations toward zero while preserving variances.',implementation:'src/calculations/covariance.ts'},
  {id:'gbm',label:'Monte Carlo GBM',category:'monte-carlo',formula:'Vₜ₊₁=Vₜ exp[(μ-½σ²)Δt+σ√Δt z]',description:'Seeded geometric Brownian motion paths.',implementation:'src/utils/quantLab.ts'},
  {id:'mc-var',label:'Monte Carlo VaR',category:'monte-carlo',formula:'max(0, V₀-Q₀.05(VT))',description:'Positive dollar loss from simulated terminal values.',implementation:'src/utils/quantLab.ts'},
  {id:'param-var',label:'Parametric VaR',category:'risk',formula:'V × zα × σannual/√P × √h',description:'Gaussian horizon VaR in currency units.',implementation:'src/utils/quantLab.ts'},
  {id:'param-cvar',label:'Parametric CVaR',category:'risk',formula:'V × σh × φ(zα)/(1-α)',description:'Gaussian expected shortfall in currency units.',implementation:'src/utils/quantLab.ts'},
  {id:'stress',label:'Stress Test',category:'stress',formula:'Vafter = Cash + Σ Vᵢ(1+shockClassᵢ)',description:'Class-based historical/custom shock application with explicit exclusions.',implementation:'src/utils/quantLab.ts'},
];

export function modelsByCategory(category:FunctionModel['category']){
  return FUNCTION_MODELS.filter(m=>m.category===category);
}
