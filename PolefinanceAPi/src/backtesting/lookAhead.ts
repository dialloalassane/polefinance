export function estimationWindow<T>(series:T[],decisionIndex:number,lookback:number):T[]{if(decisionIndex<0)throw new Error('decisionIndex must be >= 0');return series.slice(Math.max(0,decisionIndex-lookback),decisionIndex);}
export function assertNoLookAhead(decisionIndex:number,usedIndices:number[]){if(usedIndices.some(i=>i>=decisionIndex))throw new Error('LOOK_AHEAD_BIAS');return true;}
