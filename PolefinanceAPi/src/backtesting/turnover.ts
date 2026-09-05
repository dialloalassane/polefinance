export function oneWayTurnover(previous:number[],next:number[]){const n=Math.max(previous.length,next.length);let s=0;for(let i=0;i<n;i++)s+=Math.abs((next[i]??0)-(previous[i]??0));return 0.5*s;}
