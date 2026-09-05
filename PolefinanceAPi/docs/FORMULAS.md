# Financial formulas

## Portfolio value
`Portfolio Value = Cash + Σ(quantity × current price)`
Source: `src/portfolio/portfolioValue.ts`.

## Unrealized P&L
`Σ(market value - open cost basis)`.

## Realized P&L
For a sale: `sale proceeds - released cost basis - fees - taxes`.
Cost basis methodology is configurable: weighted average, FIFO, LIFO, or specific lot.

## Total P&L
`Realized P&L + Unrealized P&L + Dividends + Interest - Fees - Taxes`.
External deposits/withdrawals are not P&L.

## Daily P&L
`Current NAV - Previous NAV - Net External Cash Flow`.

## Daily return
`(Current NAV - Net External Cash Flow) / Previous NAV - 1`.

## TWR
Chain cash-flow-neutral subperiod returns: `Π(1+r_t)-1`.

## Modified Dietz
`(EV - BV - ΣCF_i) / (BV + Σ w_i CF_i)`.

## XIRR
Money-weighted annual return solving discounted cash-flow NPV = 0.

## Volatility
`sampleStd(periodic returns) × sqrt(periodsPerYear)`.

## Sharpe
`(annualized return - annual risk-free rate) / annualized volatility`.

## Sortino
`annualized excess return / annualized downside deviation`.

## Drawdown
`NAV_t / runningPeak_t - 1`.

## Calmar
`CAGR / abs(MaxDrawdown)`.

## Historical VaR / CVaR
Historical VaR uses the empirical lower-tail quantile. CVaR is the average return in the tail at or below VaR.

## Parametric VaR
`Value × z_confidence × sigma_horizon`, with `sigma_horizon = sigma_annual/sqrt(PPY) × sqrt(days)`.

## Beta
`Cov(Rp,Rb) / Var(Rb)`.

## Jensen alpha
`Rp - [Rf + beta(Rb-Rf)]`, annualized by the engine convention.

## Tracking error
`StdDev(Rp-Rb) × sqrt(PPY)`.

## Information ratio
`annualized active return / tracking error`.

## Portfolio variance
`w' Σ w`.

## Marginal risk contribution
`(Σw)_i / σp`.

## Component risk contribution
`w_i × MRC_i`.

## HHI
`Σ w_i²`. Effective number of positions = `1/HHI`.

## Diversification ratio
`Σ |w_i|σ_i / σp`.

## Turnover
One-way turnover = `0.5 × Σ|w_new - w_old|`.

## Minimum variance
Minimize `w'Σw` under portfolio constraints.

## Maximum Sharpe
Maximize `(w'μ-rf)/sqrt(w'Σw)`.

## Risk parity
Iterative equalization of percentage risk contributions.

## Volatility targeting
`leverage = target volatility / estimated volatility`, capped by max leverage.

## Monte Carlo
Seeded GBM: `V(t+dt)=V(t)exp((mu-0.5σ²)dt + σsqrt(dt)Z)`.

## Backtesting
Weights are estimated only from historical windows. Rebalance costs reduce equity. Inter-month returns are retained in monthly heatmap calculations.
