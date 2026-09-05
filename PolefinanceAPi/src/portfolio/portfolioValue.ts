export type PriceMap=Record<string,number>;
export type PositionLike={symbol:string;quantity:number;averageCost?:number;costBasis?:number;realizedPnl?:number};
export function marketValue(p:PositionLike,prices:PriceMap){const px=prices[p.symbol];return Number.isFinite(px)?p.quantity*px:0;}
export function investedMarketValue(positions:PositionLike[],prices:PriceMap){return positions.reduce((s,p)=>s+marketValue(p,prices),0);}
export function portfolioValue(cash:number,positions:PositionLike[],prices:PriceMap){return cash+investedMarketValue(positions,prices);}
export function unrealizedPnl(positions:PositionLike[],prices:PriceMap){return positions.reduce((s,p)=>{const mv=marketValue(p,prices),basis=p.costBasis??p.quantity*(p.averageCost??0);return s+mv-basis;},0);}
export function realizedPnl(positions:PositionLike[]){return positions.reduce((s,p)=>s+(p.realizedPnl??0),0);}
export function totalPnl(input:{positions:PositionLike[];prices:PriceMap;dividends?:number;interest?:number;fees?:number;taxes?:number}){return realizedPnl(input.positions)+unrealizedPnl(input.positions,input.prices)+(input.dividends??0)+(input.interest??0)-(input.fees??0)-(input.taxes??0);}
