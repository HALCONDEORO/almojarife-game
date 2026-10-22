// Calibration sweep for the player's pirate fight (phase 1 of docs/design/piracy-study.md). Own design.
// Win rate and hull loss of a player ship against seeded pirates, for several fits, over many seeds, next to the old curve
// chance = min(0.9, 0.2 + defence / 150). Run: node tools/sim_pirate_fight.mjs [seeds=16] [fights=500]
import { fightPirates } from "../src/game/piratefight.mjs";
import { defenceOf } from "../src/game/crew.mjs";
const seeds = Number(process.argv[2] ?? 16), N = Number(process.argv[3] ?? 500);
const fits = [["cog", 12, 0, 0], ["cog", 12, 1, 0], ["cog", 12, 2, 0], ["cog", 12, 3, 0], ["cog", 12, 3, 3], ["cog", 18, 3, 3], ["barca", 5, 0, 0], ["barca", 5, 1, 0], ["caravel", 14, 4, 0], ["nao", 28, 8, 2]];
for (const [type, crew, guns, cap] of fits) {
  let won = 0, prize = 0, hw = 0, hl = 0, n = 0; const perSeed = [];
  for (let s = 1; s <= seeds; s++) {
    let w = 0;
    for (let i = 0; i < N; i++) {
      const ship = { id: 1, type, hull: 100, crew, cannons: guns, gunCond: 100, captain: { defence: cap }, cargo: { salt: 50 } };
      const f = fightPirates(ship, s, `e${i}`); n++;
      if (f.outcome.result === "repelled") { w++; hw += f.outcome.hullLoss; if (f.prize) prize++; } else hl += f.outcome.hullLoss;
    }
    won += w; perSeed.push(w / N);
  }
  const d = defenceOf({ type, crew, cannons: guns, gunCond: 100 }) + cap * 6;
  console.log(`${type} crew ${crew} guns ${guns} cap ${cap}: win ${(won / n).toFixed(2)} (seed range ${Math.min(...perSeed).toFixed(2)}-${Math.max(...perSeed).toFixed(2)}), old ${Math.min(0.9, 0.2 + d / 150).toFixed(2)}; hull loss when won ${(hw / Math.max(1, won)).toFixed(1)} (old 2), when raided ${(hl / Math.max(1, n - won)).toFixed(1)} (old 10); prize offered ${(prize / Math.max(1, won)).toFixed(2)} of wins`);
}
