export function convertToBase(amount:number,fxRate:number){if(!Number.isFinite(fxRate)||fxRate<=0)throw new Error('Invalid FX rate');return amount*fxRate;}
