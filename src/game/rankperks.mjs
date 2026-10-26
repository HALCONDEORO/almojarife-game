// Rank privileges. Pure readers over heldRank(g): no stored fields, so old saves get them on load. Rank 0 keeps today's values.
import { heldRank, RANKS } from "./rank.mjs";
const at = (g, id) => heldRank(g) >= RANKS.findIndex((r) => r.id === id);
export const CONTRACT_MAX_BASE = 3;
/** Council orders a house can keep at once: Trader and above keep one more. */
export const contractMaxFor = (g) => CONTRACT_MAX_BASE + (at(g, "trader") ? 1 : 0);
