// One public wholesale purse per port. No trader identity or special NPC credit.
// Account metadata lives inside the grain cell so city iteration remains goods-only.
import { price } from './market.mjs';
export function procurementOf(city) { return city?.grain?.commerce ?? null; }
/** Opening cash and inventory are two explicit capital contributions, not daily income. */
export function openProcurement(world, city) {
  if (procurementOf(city)) return procurementOf(city);
  const inventoryBasis={};let openingCapital=0;
  for(const [g,e]of Object.entries(city)){const basis=e.stock*world.goods[g].base;inventoryBasis[g]=basis;openingCapital+=basis;}
  return city.grain.commerce={cash:openingCapital,openingCapital,openingInventory:openingCapital,inventoryBasis,households:{},retail:0,paid:0,received:0,localSupplyValue:0,consumedBasis:0,releasedBasis:0,householdIncome:0};
}
/** Quote a receipt into public stock at marginal post-delivery prices. Pure. */
export function quoteProcurement(world, city, good, qty, fee=.02) {
 const e=city?.[good],account=procurementOf(city);
 if(!e||!Number.isSafeInteger(qty)||qty<=0)return {qty:0,revenue:0,next:null};
 const sim={...e};let revenue=0,n=0;
 while(n<qty){sim.stock++;const unit=Math.floor(price(world,sim,good)*(1-fee));
  if(account && revenue+unit>account.cash){sim.stock--;break;}revenue+=unit;n++;
 }
 return {qty:n,revenue,next:price(world,sim,good)};
}
export function receiveProcurement(world, city, good, qty, fee=.02) {
 const q=quoteProcurement(world,city,good,qty,fee),account=procurementOf(city);
 city[good].stock+=q.qty;
 if(account){account.cash-=q.revenue;account.paid+=q.revenue;account.inventoryBasis[good]=(account.inventoryBasis[good]??0)+q.revenue;}
 return q;
}
/** A market sale to a trader/producer replenishes the SAME wholesale purse. */
export function recordMarketPurchase(city,good,qty,cost,stockBefore) {
 const account=procurementOf(city);if(!account)return;
 const basis=account.inventoryBasis[good]??0;
 const released=Math.round(basis*qty/Math.max(1,stockBefore));
 account.inventoryBasis[good]=basis-released;account.releasedBasis=(account.releasedBasis??0)+released;
 account.cash+=cost;account.received+=cost;
}

/** Stock supplied outside the merchant market is paid-in local inventory, not cash. */
export function recordLocalSupply(city,good,qty,base) {
 const account=procurementOf(city);if(!account)return;
 const value=qty*base;account.inventoryBasis[good]=(account.inventoryBasis[good]??0)+value;account.localSupplyValue+=value;
}
