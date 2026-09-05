export function realizedPnlFromSale(proceeds:number,costBasis:number,fees=0,taxes=0){return proceeds-costBasis-fees-taxes;}
