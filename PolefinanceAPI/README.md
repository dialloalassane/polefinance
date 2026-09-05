# PoleFinance Quant Core

GitHub-ready TypeScript implementation of the **Backtesting Lab** and **Quant Lab** logic described in the supplied PoleFinance formula/reference documents.

## Scope

Implemented here:
- shared return/statistical primitives
- price alignment and inferred annualization basis
- warm-up/lookback and strict backward-looking estimation windows
- transaction costs, equity recursion, rebalance calendar
- Backtesting metrics (return, CAGR, volatility, Sharpe, Sortino, Calmar, drawdown, historical VaR/CVaR, skew, kurtosis, beta, alpha, tracking error, information ratio, trade statistics)
- strategies: buy & hold, equal weight, momentum, inverse-drift, SMA crossover, minimum variance, maximum Sharpe, risk parity, volatility targeting
- covariance shrinkage
- rolling volatility/Sharpe
- corrected monthly-return heatmap logic
- trade-leg attribution
- Quant Lab Monte Carlo (seeded GBM), stress tests, Gaussian VaR/CVaR
- regression/unit tests

Not reconstructed because it is outside the supplied documents: authentication, database schema, portfolio/order execution, Markets, AI Analyzer, payments, and the existing PoleFinance UI.

## Important correction

The worked example identifies a monthly heatmap defect: later months were incorrectly measured from their own first bar, dropping the inter-month return. `calculateMonthlyReturns()` in this repository uses the previous month's closing equity as the base, so YTD reconciles to Total Return.

## Run locally

```bash
npm install
npm test
npm run typecheck
```

## Integrating into the existing PoleFinance app

Recommended target paths are intentionally compatible with the reference documents:

```text
src/calculations/shared.ts
src/calculations/covariance.ts
src/calculations/optimize.ts
src/utils/backtesting.ts
src/utils/quantLab.ts
```

Copy/merge these modules into the real Next.js repository, then connect that GitHub repository to Vercel. Do not put production secrets in Git; use Vercel Environment Variables.

## Portfolio dashboard metrics

`src/utils/portfolioMetrics.ts` contains the live/simulated portfolio card calculations used for a dashboard like the PoleFinance portfolio screen.

The reconciliation identities are explicit:

- **Valeur totale** = cash + invested market value.
- **Cash** = uninvested base-currency cash.
- **Investi** = sum(quantity × current price).
- **PnL total** = sum(quantity × (current price − average acquisition price)); percentage is divided by covered cost basis.
- **PnL journalier / Variation du jour** = current total NAV − previous close NAV − today's net cash flow. If previous NAV is unavailable, the engine falls back to sum(quantity × (current − previous close)).
- **Performance** = (current total NAV − net contributions) / net contributions. Missing contribution history returns `null` rather than a misleading 0%.

This separation matters: deposits/withdrawals must not appear as trading P&L, and daily percentage P&L must not use today's invested amount as an unrelated denominator.
