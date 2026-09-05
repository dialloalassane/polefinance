export type ExposurePosition={value:number;side?:'LONG'|'SHORT';assetClass?:string;market?:string;currency?:string};
export function exposureReport(positions:ExposurePosition[],cash=0){
  let long=0,short=0; const assetClass:Record<string,number>={},market:Record<string,number>={},currency:Record<string,number>={};
  for(const p of positions){const signed=(p.side==='SHORT'?-1:1)*Math.abs(p.value); if(signed>=0)long+=signed;else short+=Math.abs(signed); if(p.assetClass)assetClass[p.assetClass]=(assetClass[p.assetClass]??0)+signed;if(p.market)market[p.market]=(market[p.market]??0)+signed;if(p.currency)currency[p.currency]=(currency[p.currency]??0)+signed;}
  const gross=long+short,net=long-short,total=Math.max(1e-18,net+cash);return{grossExposure:gross,netExposure:net,longExposure:long,shortExposure:short,cashWeight:cash/total,assetClass,market,currency};
}
export function concentration(weights:number[],topN=3){const abs=weights.map(Math.abs).sort((a,b)=>b-a);const hhi=abs.reduce((s,w)=>s+w*w,0);return{hhi,effectivePositions:hhi?1/hhi:0,largest:abs[0]??0,topN:abs.slice(0,topN).reduce((a,b)=>a+b,0)};}
export function diversificationRatio(weights:number[],assetVols:number[],portfolioVol:number){const num=weights.reduce((s,w,i)=>s+Math.abs(w)*(assetVols[i]??0),0);return portfolioVol>0?num/portfolioVol:null;}
