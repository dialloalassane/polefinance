export type TransactionType =
  | 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAWAL' | 'DIVIDEND' | 'INTEREST'
  | 'FEE' | 'TAX' | 'SPLIT' | 'FX';

export type Transaction = {
  id: string;
  date: string;
  type: TransactionType;
  symbol?: string;
  quantity?: number;
  price?: number;
  amount?: number;
  fees?: number;
  tax?: number;
  currency: string;
  fxRate?: number;
  lotId?: string;
  splitRatio?: number;
  quoteCurrency?: string;
};

export function sortTransactions<T extends {date:string; id?:string}>(txs:T[]):T[] {
  return [...txs].sort((a,b)=>a.date.localeCompare(b.date)||(a.id??'').localeCompare(b.id??''));
}

export function externalCashFlow(tx: Transaction): number {
  if (tx.type === 'DEPOSIT') return tx.amount ?? 0;
  if (tx.type === 'WITHDRAWAL') return -(tx.amount ?? 0);
  return 0;
}
