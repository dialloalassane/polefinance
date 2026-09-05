export type WeightConstraint={min?:number;max?:number};
export function projectWeights(weights:number[],constraints:WeightConstraint[]=[]){const clipped=weights.map((w,i)=>Math.min(constraints[i]?.max??1,Math.max(constraints[i]?.min??0,w)));const s=clipped.reduce((a,b)=>a+b,0);return s?clipped.map(x=>x/s):clipped.map(()=>1/clipped.length);}
