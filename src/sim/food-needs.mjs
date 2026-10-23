export const PHYSICAL_NEEDS_ENABLED=true; // default ON (Marco 23/10); note: no consumer imports it today, zero behavioural effect
export const ADULT_EQUIVALENT_COEFFICIENT=1; // explicit scenario assumption, not calibrated demography
// Physical quantities separate from market scale, production and affordability.
// Evidence is heterogeneous: reconstructed worker basket, institutional allowance,
// and explicit design assumptions. These are not universal historical requirements.
const BASKET='https://e-archivo.uc3m.es/rest/api/core/bitstreams/900ef851-1967-4a5e-b5a4-8f1afdccda6a/content';
const COURT='https://ifc.dpz.es/recursos/publicaciones/33/14/_ebook.pdf';
const MEAT='https://revistascientificas.us.es/index.php/HID/article/download/22543/19779/95098';
export const FOOD_PHYSICAL=Object.freeze({
 grain:{physicalUnit:'kg-bread-equivalent',perPersonDay:{poor:.450,middle:.600,rich:.890},evidenceByClass:{poor:'reconstructed-adult-worker-basket-Sevilla1521-1540',middle:'design-assumption',rich:'court-servant-allowance-not-rich-population'},sources:{poor:BASKET,rich:COURT},mapping:'bread to grain 1:1 mass is a game assumption, no milling/baking conversion verified'},
 meat:{physicalUnit:'kg',perPersonDay:{poor:.132,middle:.220,rich:.800},evidenceByClass:{poor:'reconstructed-adult-worker-basket-Sevilla1521-1540',middle:'fiscal-reconstruction-population-average-Sevilla1481-not-middle-class',rich:'fiscal-reconstruction-Abencemerro-household-and-servants-Sevilla1481-not-all-rich'},sources:{poor:BASKET,middle:MEAT,rich:MEAT}},
 fish:{physicalUnit:'kg',perPersonDay:{poor:15/365,middle:.060,rich:.060},evidenceByClass:{poor:'reconstructed-adult-worker-basket-Sevilla1521-1540',middle:'design-assumption',rich:'design-assumption'},sources:{poor:BASKET}},
 wine:{physicalUnit:'litre',perPersonDay:{poor:146/365,middle:.600,rich:.800},evidenceByClass:{poor:'reconstructed-adult-worker-basket-Sevilla1521-1540',middle:'design-assumption',rich:'design-assumption'},sources:{poor:BASKET}},
 olive_oil:{physicalUnit:'litre',perPersonDay:{poor:7/365,middle:.030,rich:.040},evidenceByClass:{poor:'reconstructed-adult-worker-basket-food-only-Sevilla1521-1540',middle:'design-assumption',rich:'design-assumption'},sources:{poor:BASKET}},
});
/** No game production multiplier: physical need does not depend on origin/need tag.
 * The scale100 is a gameplay choice, not an observed historical trade unit.
 * Provisional rows must stay labelled when exposed or compared. */
export function foodNeedsPolicy(policy,scale=100){
 const out=structuredClone(policy);
 for(const[g,row]of Object.entries(FOOD_PHYSICAL))if(out[g])out[g]={...out[g],unit:'game-unit',physicalUnit:row.physicalUnit,physicalPerMarketUnit:scale,evidence:'mixed-explicit-see-evidenceByClass',evidenceByClass:row.evidenceByClass,source:row.sources,perPersonDay:Object.fromEntries(Object.entries(row.perPersonDay).map(([c,n])=>[c,n/scale]))};
 return out;
}
