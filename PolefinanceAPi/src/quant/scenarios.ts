export type AssetShock={assetClass:string;shock:number};
export function applyAssetClassScenario(positions:Array<{assetClass:string;value:number}>,shocks:Record<string,number>){return positions.map(p=>({ ...p, shock:shocks[p.assetClass]??0, stressedValue:p.value*(1+(shocks[p.assetClass]??0)) }));}
