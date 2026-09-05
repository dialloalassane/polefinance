# PoleFinance quantitative functionality catalog

This repository separates live portfolio accounting, portfolio analytics, backtesting and Quant Lab models. The purpose is to make every displayed financial number auditable and independently testable.

## Live portfolio / dashboard

Implemented in `src/calculations/portfolioAccounting.ts`, `src/utils/portfolioMetrics.ts` and `src/calculations/performance.ts`.

- total portfolio value
- cash
- invested market value
- invested % and cash %
- weighted-average acquisition cost
- cost basis
- realized P&L
- unrealized P&L
- total P&L
- P&L %
- daily P&L
- daily return / daily variation
- contribution-adjusted performance
- total return
- deposits
- withdrawals
- net contributions
- trading fees and other fees
- dividends / interest income
- position-level market value and P&L
- cash-flow-adjusted return series
- time-weighted return (TWR)
- Modified Dietz return
- money-weighted return / XIRR

## Portfolio risk and diagnostics

Implemented in `src/calculations/portfolioAnalytics.ts` and the backtesting module.

- annualized volatility
- downside deviation / semideviation
- Sharpe ratio
- Sortino ratio
- Calmar ratio
- max drawdown
- average drawdown
- drawdown episodes, depth and recovery duration
- ulcer index
- historical VaR
- historical CVaR / Expected Shortfall
- beta
- Jensen alpha
- tracking error
- information ratio
- Omega ratio
- hit rate
- gain/loss ratio
- best/worst period
- median return
- skewness
- excess kurtosis
- gross exposure
- net exposure
- invested exposure ratio
- concentration / Herfindahl index
- effective number of positions
- largest position weight
- covariance-to-correlation conversion
- marginal, component and percentage risk contributions
- rolling metrics and rolling beta

## Portfolio optimization

Implemented in `src/calculations/optimize.ts` and `src/calculations/portfolioModels.ts`.

- minimum variance
- maximum Sharpe / tangency portfolio
- risk parity / equal risk contribution
- volatility targeting with explicit cash/borrowing leg
- efficient frontier approximation
- portfolio expected return
- portfolio variance / volatility
- long-only simplex projection
- covariance shrinkage

## Backtesting Lab

Implemented in `src/utils/backtesting.ts`.

- price-series intersection and alignment
- inferred periods per year
- trailing period trim
- estimation warm-up/lookback
- strict look-ahead prevention
- calendar-based weekly/monthly/quarterly rebalance schedule
- transaction fees and slippage
- equity recursion with cash leg
- drifted weights between rebalances
- turnover
- fees paid
- trade-leg attribution
- buy & hold
- equal weight
- momentum
- inverse-drift weighting
- SMA crossover
- minimum variance
- maximum Sharpe
- risk parity
- volatility targeting
- total return
- CAGR
- volatility
- Sharpe
- Sortino
- Calmar
- max/average drawdown
- historical VaR/CVaR
- skewness/kurtosis
- beta/alpha
- tracking error/information ratio
- win rate
- profit factor
- average win/loss
- best/worst day
- rolling volatility
- rolling Sharpe
- corrected monthly-return heatmap

## Quant Lab

Implemented in `src/utils/quantLab.ts`.

### Monte Carlo
- per-portfolio drift and volatility
- constant-correlation PSD guard
- seeded Gaussian RNG
- GBM paths with Itô correction
- expected terminal value
- median
- P5/P95
- probability of loss
- probability of doubling
- simulated dollar VaR/CVaR
- best/worst case
- terminal standard deviation
- percentile cone
- terminal histogram

### Stress testing
- historical scenario table
- developed/emerging/frontier equity classes
- bonds
- crypto
- stablecoins
- explicit scenario exclusions
- excluded-dollar and excluded-share accounting
- scenario P&L
- recovery path
- custom stress scenario

### Parametric VaR / CVaR
- horizon volatility using square-root-of-time scaling
- inverse-normal based Gaussian VaR
- Gaussian CVaR / Expected Shortfall
- value-weighted portfolio volatility prefill including cash dilution
- VaR/CVaR term structure

## Important accounting distinction

External cash flows are not returns. Deposits and withdrawals change portfolio NAV but must be neutralized in daily and time-weighted performance calculations. Trading fees are costs and therefore reduce P&L. The transaction-level accounting module is the preferred source for realized P&L and contribution history.
