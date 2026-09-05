# PoleFinance Quant & Portfolio Core

GitHub-ready TypeScript financial engine for PoleFinance. It contains auditable modules for **live portfolio accounting**, **portfolio performance**, **risk analytics**, **backtesting**, **portfolio optimization**, **Monte Carlo**, **stress testing** and **VaR/CVaR**.

The goal is that financial logic lives in normal source files that can be edited in GitHub/VS Code and tested independently of Lovable or any UI builder.

## Main capabilities

### Portfolio dashboard/accounting
- total portfolio value
- cash
- invested amount
- position market values
- average acquisition cost / cost basis
- realized P&L
- unrealized P&L
- total P&L
- total return / performance
- daily P&L
- daily return / variation du jour
- deposits and withdrawals adjustment
- net contributions
- fees
- dividends and interest income
- time-weighted return
- Modified Dietz return
- money-weighted return / XIRR

### Portfolio risk
- volatility
- downside deviation
- Sharpe
- Sortino
- Calmar
- max and average drawdown
- drawdown episodes/recovery
- ulcer index
- historical VaR / CVaR
- beta / alpha
- tracking error / information ratio
- Omega ratio
- hit rate / gain-loss ratio
- skewness / kurtosis
- exposures
- concentration metrics
- covariance/correlation
- marginal/component/% risk contribution
- rolling metrics

### Portfolio optimization
- minimum variance
- maximum Sharpe
- risk parity / ERC
- volatility targeting
- efficient frontier approximation
- long-only simplex constraints
- covariance shrinkage

### Backtesting Lab
- aligned historical data
- inferred annualization basis
- lookback/warm-up
- look-ahead protection
- calendar rebalancing
- fees and slippage
- turnover
- cash leg
- trade attribution
- Buy & Hold
- Equal Weight
- Momentum
- Inverse-Drift
- SMA Crossover
- Minimum Variance
- Maximum Sharpe
- Risk Parity
- Volatility Targeting
- all documented performance/risk metrics
- rolling volatility / rolling Sharpe
- monthly returns heatmap with inter-month-link bug fixed

### Quant Lab
- seeded GBM Monte Carlo
- constant-correlation PSD guard
- probability of loss / doubling
- terminal VaR/CVaR
- percentile cone
- histogram
- historical stress scenarios
- excluded asset accounting
- recovery paths
- custom stress scenario
- Gaussian parametric VaR/CVaR
- VaR/CVaR term structure
- portfolio-volatility prefill with cash dilution

See [`docs/FUNCTIONALITY_CATALOG.md`](docs/FUNCTIONALITY_CATALOG.md) for the full list.

## Source layout

```text
src/
├── calculations/
│   ├── shared.ts
│   ├── covariance.ts
│   ├── optimize.ts
│   ├── portfolioAccounting.ts
│   ├── performance.ts
│   ├── portfolioAnalytics.ts
│   └── portfolioModels.ts
├── types/
│   └── quant.ts
├── utils/
│   ├── portfolioMetrics.ts
│   ├── backtesting.ts
│   └── quantLab.ts
└── index.ts
```

## Accounting rules

A deposit or withdrawal is **not P&L**. Daily portfolio return uses:

```text
Daily P&L = Current NAV - Previous NAV - Net external cash flow today
Daily Return = Daily P&L / Previous NAV
```

For a position:

```text
Market Value = Quantity × Current Price
Unrealized P&L = Market Value - Remaining Cost Basis
```

Realized P&L is generated when a sale occurs. The transaction module currently uses **weighted-average cost** and subtracts trading fees from realized P&L.

Overall contribution-based P&L reconciles as:

```text
Total P&L = Current Portfolio Value - Net Contributions
Net Contributions = Deposits - Withdrawals
```

For performance across multiple cash-flow dates, prefer **TWR** or **XIRR/MWR** rather than a naive current-value/contribution ratio.

## Run locally

```bash
npm install
npm test
npm run typecheck
npm run build
```

## Safety / correctness approach

Financial formulas are separated from React/UI components. Unit tests cover accounting, cash-flow adjustments, portfolio analytics, optimization, backtesting and Quant Lab helpers. GitHub Actions runs type checking and tests on pushes and pull requests.

## What this ZIP is and is not

This ZIP is a financial-engine/code module, not a reconstruction of every page of the existing PoleFinance production website. Authentication, the actual production database, live market-data credentials, order execution, and current React pages must be connected from the developer's real app repository. The modules here are designed to be copied/merged into that repository.

## Environment variables

Never commit real secrets. Use `.env.example` for variable names and Vercel/Supabase environment settings for real values.
