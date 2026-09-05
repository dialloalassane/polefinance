# PoleFinance Quant Engine Architecture

The engine is intentionally independent from React, Lovable, Vercel, authentication, news, AI, and UI concerns.

```text
RAW TRANSACTIONS / MARKET PRICES
              ↓
        ACCOUNTING LEDGER
              ↓
   POSITIONS + CASH + COST BASIS
              ↓
     DAILY PORTFOLIO SNAPSHOTS
              ↓
   CASH-FLOW-ADJUSTED RETURNS
              ↓
      RISK / PERFORMANCE ENGINE
              ↓
  Dashboard / Portfolio / Analysis /
        Quant Lab / Backtesting
```

One source of truth is the design goal: UI layers should import functions from `src/index.ts` instead of reimplementing formulas.
