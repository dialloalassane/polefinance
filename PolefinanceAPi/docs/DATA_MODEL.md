# Data model

## Transaction
`src/accounting/transactions.ts`

Supported transaction types: BUY, SELL, DEPOSIT, WITHDRAWAL, DIVIDEND, INTEREST, FEE, TAX, SPLIT, FX.

Core fields: id, date, type, symbol, quantity, price, amount, fees, tax, currency, fxRate, lotId, splitRatio.

## Cost basis
`src/accounting/ledger.ts`

Supported methods: WEIGHTED_AVERAGE, FIFO, LIFO, SPECIFIC_LOT.

## Daily snapshot
`src/portfolio/snapshots.ts`

Stores date, cash, position quantity/cost basis/market value, total value, external cash flow, daily return and cumulative return.
