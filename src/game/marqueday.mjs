// Daily wiring of the piracy mechanics (peace news today; later ones join here). Own design.
// The host loads data/realms.json and data/peaces.json and registers the hook once; with no hook nothing runs.
import { peaceNews } from "./peace.mjs";
export function marqueDaily(g, realms, peaces) { if (g.over) return []; return peaceNews(g, realms, peaces); }
/** Register the daily hook on game.mjs's DAILY_HOOKS list. Returns a function that removes it. */
export function installMarqueDaily(hooks, realms, peaces) {
  const h = (g) => { marqueDaily(g, realms, peaces); };
  hooks.push(h);
  return () => { const i = hooks.indexOf(h); if (i >= 0) hooks.splice(i, 1); };
}
