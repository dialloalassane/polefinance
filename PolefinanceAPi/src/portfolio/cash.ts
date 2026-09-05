import { buildLedger, CostBasisMethod } from '../accounting/ledger';
import { Transaction } from '../accounting/transactions';
export function reconstructCash(transactions:Transaction[],initialCash=0,method:CostBasisMethod='WEIGHTED_AVERAGE'){return buildLedger(transactions,initialCash,method).cash;}
