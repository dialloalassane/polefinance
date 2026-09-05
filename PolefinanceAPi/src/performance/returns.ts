import { mean } from '../calculations/shared';
export function simpleReturn(begin:number,end:number){return begin!==0?end/begin-1:null;}
export function dailyCashFlowAdjustedReturn(previous:number,current:number,externalFlow=0){return previous!==0?(current-externalFlow)/previous-1:null;}
export function chainReturns(returns:number[]){return returns.reduce((a,r)=>a*(1+r),1)-1;}
export function cagr(begin:number,end:number,years:number){return begin>0&&end>=0&&years>0?(end/begin)**(1/years)-1:null;}
export function annualizedArithmeticReturn(returns:number[],ppy=252){return mean(returns)*ppy;}
export { cashFlowAdjustedReturns, timeWeightedReturn, modifiedDietzReturn, xirr } from '../calculations/performance';
