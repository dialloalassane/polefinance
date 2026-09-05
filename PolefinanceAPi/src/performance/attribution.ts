export type AttributionRow={symbol:string;weight:number;return:number;contribution:number};
export function returnAttribution(weights:number[],returns:number[],symbols:string[]=[]):AttributionRow[]{return weights.map((w,i)=>({symbol:symbols[i]??String(i),weight:w,return:returns[i]??0,contribution:w*(returns[i]??0)}));}
