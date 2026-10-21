// Rows for the "Ayuntamiento" tab: the concejo's faces and the derechos it sets.
// Pure data, no DOM (same pattern as buildingsview.mjs / cityview.mjs). Phase A1: read-only.
import { townCouncil } from "../game/townhall.mjs";
import { FEE } from "../sim/trade.mjs";
import { feeMul } from "../game/reputation.mjs";
import { repOf, respectIndex, RESPECT } from "../game/rank.mjs";
import { TOLL_DIV, TOLL_DISCOUNT } from "../game/tolls.mjs";

/** Everything the tab shows for one city, numbers already rounded for display. */
export function hallView(g, cityId) {
  const c = townCouncil(g.world, cityId);
  const pts = repOf(g, cityId), ri = respectIndex(pts);
  return {
    mayor: c.mayor,
    councillors: c.councillors,
    respectId: RESPECT[ri].id,
    respectPts: Math.floor(pts),
    feePct: Math.round(FEE * feeMul(g, cityId) * 10000) / 100, // market fee as a % (reputation moves it)
    tollDiv: TOLL_DIV, // a ship pays capacity/TOLL_DIV when it docks
    tollDiscountPct: Math.round(TOLL_DISCOUNT[ri] * 100), // respect discount on the toll
  };
}
