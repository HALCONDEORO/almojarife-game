// Chances and expected effects for the choices of a sea event, read from the real data and rules (never invented).
import { encounterOutcome } from "../game/encounters.mjs";
import { fightPirates } from "../game/piratefight.mjs";
import { escortOf } from "../game/convoys.mjs";
const pct = (p) => `${Math.round(p * 100)} %`;
const num = (n) => String(Math.round(n));
/** One effects object as words: [{cash:-150}] -> "pagas 150 monedas". */
export function effectText(fx = {}, lang = "es") {
  const en = lang === "en", out = [];
  if (fx.cash) out.push(fx.cash > 0 ? (en ? `you gain ${num(fx.cash)} coins` : `ganas ${num(fx.cash)} monedas`) : (en ? `you lose ${num(-fx.cash)} coins` : `pierdes ${num(-fx.cash)} monedas`));
  if (fx.salvage) { // pays by hold size with a luck band: per hold slot, never a fixed amount
    const j = fx.salvage.jitter ?? 0, per = fx.salvage.perCap ?? 2, lo = per * (1 - j), hi = per * (1 + j), d = (n) => String(Math.round(n * 10) / 10).replace(".", en ? "." : ",");
    out.push(en ? `you recover coins by hold size (${d(lo)} to ${d(hi)} per hold slot)` : `recuperas monedas según la bodega (de ${d(lo)} a ${d(hi)} por plaza de carga)`);
  }
  if (fx.cargoLossPct) out.push(en ? `you lose ${num(fx.cargoLossPct)} % of the cargo` : `pierdes el ${num(fx.cargoLossPct)} % de la carga`);
  if (fx.days) out.push(fx.days > 0 ? (en ? `${fx.days} day${fx.days > 1 ? "s" : ""} later` : `${fx.days} día${fx.days > 1 ? "s" : ""} más`) : (en ? `${-fx.days} day${fx.days < -1 ? "s" : ""} sooner` : `${-fx.days} día${fx.days < -1 ? "s" : ""} menos`));
  return out.length ? out.join(en ? " and " : " y ") : (en ? "no consequences" : "sin consecuencias");
}
/** Outcomes of a world.json choice: "65 % no consequences · 35 % you lose 15 % of the cargo". */
export function choiceOdds(choice, lang = "es") {
  const os = choice?.outcomes ?? [];
  if (os.length === 1) return (lang === "en" ? "Certain: " : "Seguro: ") + effectText(os[0].effects, lang);
  return os.map((o) => `${pct(o.p)} ${effectText(o.effects, lang)}`).join(" · ");
}
/** Pirate dialog: flee chance is the one stored on the encounter; fight chance comes from the same resolver the game uses. */
export function pirateOdds(g, lang = "es") {
  const en = lang === "en", p = g.pending, ship = g.ships.find((s) => s.id === p?.ship);
  if (!ship) return null;
  const escort = escortOf(g, ship), flee = p.escapeChance / 100;
  let win, exact = true;
  if (g.pirateFight === true) { // real seeded battles: sample the same resolver over other encounters of the same kind
    let w = 0; const N = 60;
    for (let i = 0; i < N; i++) if (fightPirates(ship, g.seed, `odds:${i}`, escort).outcome.result === "repelled") w++;
    win = w / N; exact = false;
  } else win = encounterOutcome(ship, "pirates", 0, escort).chance;
  const lose = encounterOutcome(ship, "pirates", 0.999, escort), won = encounterOutcome(ship, "pirates", 0, escort);
  const loseTxt = effectText({ cargoLossPct: lose.cargoLossPct, days: lose.delay }, lang) + (en ? `, hull -${lose.hullLoss}` : `, casco -${lose.hullLoss}`);
  const fightTxt = `${exact ? "" : "≈ "}${pct(win)} ${en ? `you repel them (hull -${won.hullLoss})` : `los rechazas (casco -${won.hullLoss})`} · ${exact ? "" : "≈ "}${pct(1 - win)} ${loseTxt}`;
  const fleeTxt = `${pct(flee)} ${en ? "you escape, 1 day later, no losses" : "escapas, 1 día más, sin pérdidas"} · ${pct(1 - flee)} ${en ? "your crew fights (see Fight)" : "tu tripulación lucha (mira Luchar)"}`;
  return { flee: fleeTxt, fight: fightTxt };
}
