/**
 * Transaction-level portfolio accounting for live/simulated portfolios.
 *
 * Conventions:
 * - BUY/SELL fees reduce P&L and cash.
 * - DEPOSIT/WITHDRAWAL are external cash flows and never investment P&L.
 * - DIVIDEND/INTEREST are investment income.
 * - Realized P&L uses weighted-average cost by default.
 * - All amounts are assumed to already be translated into the portfolio base currency.
 */

export type TransactionType =
  | 'BUY'
  | 'SELL'
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'DIVIDEND'
  | 'INTEREST'
  | 'FEE';

export type PortfolioTransaction = {
  id?: string;
  date: string;
  type: TransactionType;
  symbol?: string;
  quantity?: number;
  price?: number;
  amount?: number;
  fees?: number;
};

export type PositionLot = {
  symbol: string;
  quantity: number;
  averageCost: number;
  costBasis: number;
  realizedPnl: number;
  feesPaid: number;
};

export type AccountingState = {
  cash: number;
  positions: Record<string, PositionLot>;
  realizedPnl: number;
  investmentIncome: number;
  tradingFees: number;
  otherFees: number;
  deposits: number;
  withdrawals: number;
  netContributions: number;
};

const n = (x: number | undefined): number => (Number.isFinite(x) ? (x as number) : 0);

export function emptyAccountingState(initialCash = 0): AccountingState {
  return {
    cash: initialCash,
    positions: {},
    realizedPnl: 0,
    investmentIncome: 0,
    tradingFees: 0,
    otherFees: 0,
    deposits: initialCash,
    withdrawals: 0,
    netContributions: initialCash,
  };
}

export function processTransactions(
  transactions: PortfolioTransaction[],
  initialCash = 0,
): AccountingState {
  const state = emptyAccountingState(initialCash);
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  for (const tx of sorted) {
    const fees = Math.max(0, n(tx.fees));
    const qty = n(tx.quantity);
    const price = n(tx.price);
    const amount = n(tx.amount);

    if (tx.type === 'DEPOSIT') {
      state.cash += amount;
      state.deposits += amount;
      state.netContributions += amount;
      continue;
    }
    if (tx.type === 'WITHDRAWAL') {
      state.cash -= amount;
      state.withdrawals += amount;
      state.netContributions -= amount;
      continue;
    }
    if (tx.type === 'DIVIDEND' || tx.type === 'INTEREST') {
      state.cash += amount;
      state.investmentIncome += amount;
      state.realizedPnl += amount;
      continue;
    }
    if (tx.type === 'FEE') {
      state.cash -= amount;
      state.otherFees += amount;
      state.realizedPnl -= amount;
      continue;
    }

    if (!tx.symbol) throw new Error(`${tx.type} requires symbol`);
    if (!(qty > 0) || !(price >= 0)) throw new Error(`${tx.type} requires positive quantity and valid price`);

    const current = state.positions[tx.symbol] ?? {
      symbol: tx.symbol,
      quantity: 0,
      averageCost: 0,
      costBasis: 0,
      realizedPnl: 0,
      feesPaid: 0,
    };

    if (tx.type === 'BUY') {
      const gross = qty * price;
      const newCostBasis = current.costBasis + gross + fees;
      const newQty = current.quantity + qty;
      current.quantity = newQty;
      current.costBasis = newCostBasis;
      current.averageCost = newQty > 0 ? newCostBasis / newQty : 0;
      current.feesPaid += fees;
      state.cash -= gross + fees;
      state.tradingFees += fees;
    } else if (tx.type === 'SELL') {
      if (qty > current.quantity + 1e-12) {
        throw new Error(`Cannot sell ${qty} ${tx.symbol}; only ${current.quantity} available`);
      }
      const removedCost = current.averageCost * qty;
      const proceeds = qty * price;
      const realized = proceeds - removedCost - fees;
      current.quantity -= qty;
      current.costBasis = Math.max(0, current.costBasis - removedCost);
      current.realizedPnl += realized;
      current.feesPaid += fees;
      current.averageCost = current.quantity > 1e-12 ? current.costBasis / current.quantity : 0;
      if (current.quantity <= 1e-12) {
        current.quantity = 0;
        current.costBasis = 0;
        current.averageCost = 0;
      }
      state.cash += proceeds - fees;
      state.realizedPnl += realized;
      state.tradingFees += fees;
    }

    state.positions[tx.symbol] = current;
  }

  return state;
}

export function marketValueBySymbol(
  state: AccountingState,
  prices: Record<string, number>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [symbol, p] of Object.entries(state.positions)) {
    out[symbol] = p.quantity * n(prices[symbol]);
  }
  return out;
}

export function unrealizedPnlBySymbol(
  state: AccountingState,
  prices: Record<string, number>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [symbol, p] of Object.entries(state.positions)) {
    out[symbol] = p.quantity * n(prices[symbol]) - p.costBasis;
  }
  return out;
}

export function accountingSummary(state: AccountingState, prices: Record<string, number>) {
  const values = marketValueBySymbol(state, prices);
  const unrealizedBySymbol = unrealizedPnlBySymbol(state, prices);
  const investedValue = Object.values(values).reduce((a, b) => a + b, 0);
  const unrealizedPnl = Object.values(unrealizedBySymbol).reduce((a, b) => a + b, 0);
  const totalValue = state.cash + investedValue;
  const totalPnl = totalValue - state.netContributions;
  const totalReturn = state.netContributions !== 0 ? totalPnl / state.netContributions : null;
  return {
    cash: state.cash,
    investedValue,
    totalValue,
    realizedPnl: state.realizedPnl,
    unrealizedPnl,
    totalPnl,
    totalReturn,
    investmentIncome: state.investmentIncome,
    tradingFees: state.tradingFees,
    otherFees: state.otherFees,
    totalFees: state.tradingFees + state.otherFees,
    deposits: state.deposits,
    withdrawals: state.withdrawals,
    netContributions: state.netContributions,
    marketValueBySymbol: values,
    unrealizedPnlBySymbol,
  };
}
