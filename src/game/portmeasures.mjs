// Port measures (own design, pure, no DOM): a council or league sanctions a port with one of two DISTINCT
// measures, never a single hostility flag. A BOYCOTT closes the harbour to new arrivals: outside ships may not
// set course for it, but ships already inside may still leave and trade. A full BLOCKADE seals the harbour both
// ways: no ship may sail for it and every ship present is held until the measure lifts. Neither measure touches
// the market: the grain embargo (embargo.mjs) is a trade refusal and stays independent - a port can refuse grain
// sales, refuse docking, both, or neither. A port has no measure until one is recorded in g.measures[port];
// nothing declares measures yet, so the default game is unchanged. Ships already en route when a measure is
// declared still arrive: turning them back at sea is a decision for whichever system will declare measures.
// Basis (public sources, own words): the Hansa expelled disobedient towns (Verhansung), stripping their
// merchants of trading privileges - Bremen 1285, Cologne 1471 (The Epoch Institute encyclopedia,
// https://the-epoch-institute.org/encyclopedia/verhansung); a blockade is the isolation of a harbour that
// prevents the passage of people or supplies, seizing ships that try to pass (National Museum of American
// Diplomacy, https://diplomacy.state.gov/encyclopedia/blockade/). Mapping the boycott to a docking refusal and
// the blockade to holding docked ships is our design inference; the sources do not pin game rules.
export const BOYCOTT = "boycott", BLOCKADE = "blockade";
/** The measure on a port ("boycott" | "blockade"), or null. Unknown values count as no measure. */
export const measureOf = (g, port) => { const measure = g?.measures?.[port]; return measure === BOYCOTT || measure === BLOCKADE ? measure : null; };
export const boycottOn = (g, port) => measureOf(g, port) === BOYCOTT;
export const blockadeOn = (g, port) => measureOf(g, port) === BLOCKADE;
/** Why no outside ship may set course for this port right now ("boycott" | "blockade"), or null. */
export const entryBan = (g, port) => measureOf(g, port);

/** Closed-port guard for a planned destination; free sea points have no port measure. */
export const plannedEntryBan = (game, plan) => plan.toPort ? entryBan(game, plan.to) : null;
