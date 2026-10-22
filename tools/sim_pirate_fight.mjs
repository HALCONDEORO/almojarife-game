// Calibration sweep for the player's pirate fight (phase 1 of docs/design/piracy-study.md). Own design.
// Win rate and hull loss of a player ship against seeded pirates, for several fits, over many seeds, next to the old curve
// chance = min(0.9, 0.2 + defence / 150). Run: node tools/sim_pirate_fight.mjs [seeds=16] [fights=500]
import { fightPirates } from "../src/game/piratefight.mjs";
import { defenceOf } from "../src/game/crew.mjs";
import { encounterOutcome } from "../src/game/encounters.mjs";
import { prizeFor } from "../src/game/encounterdaily.mjs";
import { SHIP_TYPES } from "../src/sim/trade.mjs";
import { REPAIR_PER_POINT, PRIZE_SELL_RATE } from "../src/game/game.mjs";
import { seeded } from "../src/view/cityscene.mjs";
// Net value of one pirate encounter in coins: repairs, cargo lost (CARGO coins in the hold), a delayed day of upkeep, plus the resale value of a prize.
const CARGO = 2000;
const prizeValue = (pz) => pz ? Math.round(SHIP_TYPES[pz.type].price * PRIZE_SELL_RATE * (0.5 + 0.5 * pz.hull / 100)) : 0;
const netValue = (o, pz, upkeep) => -o.hullLoss * REPAIR_PER_POINT - (o.cargoLossPct / 100) * CARGO - o.delay * upkeep + (o.result === "repelled" ? prizeValue(pz) : 0);
const seeds = Number(process.argv[2] ?? 16), N = Number(process.argv[3] ?? 500);
const fits = [["cog", 12, 0, 0], ["cog", 12, 1, 0], ["cog", 12, 2, 0], ["cog", 12, 3, 0], ["cog", 12, 3, 3], ["cog", 18, 3, 3], ["barca", 5, 0, 0], ["barca", 5, 1, 0], ["caravel", 14, 4, 0], ["nao", 28, 8, 2]];
for (const [type, crew, guns, cap] of fits) {
  let won = 0, prize = 0, hw = 0, hl = 0, n = 0, evNew = 0, evOld = 0; const perSeed = [];
  for (let s = 1; s <= seeds; s++) {
    let w = 0;
    for (let i = 0; i < N; i++) {
      const ship = { id: 1, type, hull: 100, crew, cannons: guns, gunCond: 100, captain: { defence: cap }, cargo: { salt: 50 } };
      const f = fightPirates(ship, s, `e${i}`); n++;
      const up = SHIP_TYPES[type]?.upkeepPerDay ?? 2;
      evNew += netValue(f.outcome, f.prize, up);
      const oo = encounterOutcome(ship, "pirates", seeded(`ev-old:${s}:${i}`)()); evOld += netValue(oo, prizeFor({ seed: s }, `e${i}`), up);
      if (f.outcome.result === "repelled") { w++; hw += f.outcome.hullLoss; if (f.prize) prize++; } else hl += f.outcome.hullLoss;
    }
    won += w; perSeed.push(w / N);
  }
  const d = defenceOf({ type, crew, cannons: guns, gunCond: 100 }) + cap * 6;
  console.log(`${type} crew ${crew} guns ${guns} cap ${cap}: win ${(won / n).toFixed(2)} (seed range ${Math.min(...perSeed).toFixed(2)}-${Math.max(...perSeed).toFixed(2)}), old ${Math.min(0.9, 0.2 + d / 150).toFixed(2)}; hull loss when won ${(hw / Math.max(1, won)).toFixed(1)} (old 2), when raided ${(hl / Math.max(1, n - won)).toFixed(1)} (old 10); prize offered ${(prize / Math.max(1, won)).toFixed(2)} of wins; net EV per encounter new ${Math.round(evNew / n)} vs old ${Math.round(evOld / n)} coins`);
}
