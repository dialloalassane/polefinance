# Backtesting

The legacy backtest engine supports buy-and-hold, equal weight, momentum, inverse drift, SMA crossover, minimum variance, maximum Sharpe, risk parity and volatility targeting. It supports transaction cost/slippage bps, lookback windows, covariance shrinkage, benchmark metrics, trade attribution, rolling volatility/Sharpe, monthly returns, and no-look-ahead estimation.

`src/backtesting/rebalance.ts` adds daily, weekly, monthly, quarterly, annual and none rebalance scheduling helpers. `src/backtesting/costs.ts` provides explicit commission, spread, slippage, percentage and fixed cost models.
