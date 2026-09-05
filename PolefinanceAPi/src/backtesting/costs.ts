export type CostModel={commissionBps?:number;spreadBps?:number;slippageBps?:number;percentageFeeBps?:number;fixedFee?:number};
export function transactionCost(notional:number,model:CostModel){const bps=(model.commissionBps??0)+(model.spreadBps??0)+(model.slippageBps??0)+(model.percentageFeeBps??0);return Math.abs(notional)*bps/10000+(model.fixedFee??0);}
