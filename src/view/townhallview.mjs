// Rows for the "Ayuntamiento" tab: the concejo's faces and the derechos it sets.
// Pure data, no DOM (same pattern as buildingsview.mjs / cityview.mjs). Phase A1: read-only.
import { townCouncil } from "../game/townhall.mjs";
import { FEE } from "../sim/trade.mjs";
import { feeMul } from "../game/reputation.mjs";
import { repOf, respectIndex, RESPECT } from "../game/rank.mjs";
import { TOLL_DIV, TOLL_DISCOUNT } from "../game/tolls.mjs";
import { cajaOf, taxSteps, nextMeetingDay } from "../game/council.mjs";
import { identityLine } from "../game/identity.mjs";

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
    caja: Math.round(cajaOf(g, cityId)), // the concejo's chest
    sisa: taxSteps(g, cityId).sisa, // signed tax steps, 0 = normal
    portazgo: taxSteps(g, cityId).portazgo,
    nextMeeting: nextMeetingDay(g.world, cityId, g.day),
    // City character, only with the identity flag on: the tab shows one sentence of who this city is. Off: no key at all.
    ...(g.cityIdentity === true ? { identity: identityLine(g.world, cityId) } : {}),
  };
}
