export function applySplit(quantity:number,unitCost:number,ratio:number){if(ratio<=0)throw new Error('Invalid split ratio');return{quantity:quantity*ratio,unitCost:unitCost/ratio};}
