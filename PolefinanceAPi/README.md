# PoleFinance Quant Engine

Standalone TypeScript financial/quantitative calculation engine extracted from PoleFinance concepts. It is designed to be versioned in GitHub and imported by the application so formulas can be changed and tested without editing React components or opening Lovable.

## Scope

This repository contains the financial brain only: transaction accounting, cost basis, cash, positions, P&L, portfolio valuation, daily snapshots, cash-flow-adjusted returns, TWR/XIRR/Modified Dietz, risk metrics, covariance/correlation, exposures/concentration, optimization, Monte Carlo, stress testing and backtesting.

It intentionally does **not** contain the PoleFinance UI, authentication, news, AI assistant, user settings, Supabase production data, or Vercel application configuration.

## Architecture

```text
Raw transactions + market prices
             ↓
       Accounting ledger
             ↓
 Positions + cash + cost basis
             ↓
    Daily portfolio snapshots
             ↓
  Cash-flow-adjusted performance
             ↓
 Risk / Performance / Optimization
             ↓
Dashboard | Portfolio | Analysis | Quant | Backtest
```

## Install and validate

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Public API

Import from `src/index.ts` (or from the built package after publishing):

```ts
import {
  buildLedger,
  portfolioValue,
  unrealizedPnl,
  totalPnl,
  dailyCashFlowAdjustedReturn,
  timeWeightedReturn,
  xirr,
  sharpeRatio,
  sortinoRatio,
  historicalVaR,
  historicalCVaR,
  beta,
  alpha,
  minimumVariance,
  maximumSharpe,
  riskParity,
  efficientFrontier,
  runMonteCarlo,
  runStressTest,
  runBacktest,
} from './src/index';
```

## Documentation

Start with:

- `docs/IMPLEMENTATION_CHECKLIST.md` — the 50 requested requirements, one by one.
- `docs/FORMULAS.md` — definitions and formulas.
- `docs/ARCHITECTURE.md` — data-flow architecture.
- `docs/DATA_MODEL.md` — transactions, lots and snapshots.
- `docs/RISK_MODELS.md` — risk model inventory.
- `docs/OPTIMIZATION.md` — portfolio optimizers.
- `docs/BACKTESTING.md` — backtesting conventions and bias controls.

## Important conventions

Deposits and withdrawals are external cash flows and are excluded from investment P&L. Purchases and sales are internal portfolio reallocations. The transaction ledger supports weighted-average, FIFO, LIFO and specific-lot cost basis methods. Historical multi-asset computations should align dates before calculating covariance, correlation or benchmark statistics.

Invalid numerical states should not be displayed as `NaN` or `Infinity`; use the data-quality helpers to return a null metric with a reason such as `INSUFFICIENT_HISTORY` or `ZERO_DENOMINATOR`.

## CI

`.github/workflows/ci.yml` runs type checking, tests and a TypeScript build on pushes and pull requests.

## Production integration

This library does not automatically know PoleFinance's production database. The application developer must map the real transaction, cash, position, price, benchmark, FX and fee records to these types and remove duplicate formulas from UI components. The engine should then become the single source of truth for Dashboard, Portfolio, Analysis, Quant Lab and Backtesting calculations.
