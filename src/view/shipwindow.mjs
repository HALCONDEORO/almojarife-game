// Ship window (design: docs/design/ship-window.md): one floating window per ship with
// Cargo / Crew / Data tabs, using the shared .pwin component. Pure HTML strings: main.mjs
// mounts them and wires every button through act(). No game rules here.
import { goodIcon } from "../../web/icons.mjs";
import { shipIconSvg } from "./yardscene.mjs";
import { assignedCaptainHtml, CT } from "./captainview.mjs";
import { captainOf as captainOfShip } from "../game/captains.mjs";
import { CANNON_PRICE, cannonsOf, maxCannons, gunCond, gunRepairCost, crewLimits, crewOf, speedFactor, HIRE_FEE, WEAPON_TYPES, weaponWeight, gearOf, gearWeight, GEAR, GEAR_MAX, armoryPrice } from "../game/crew.mjs";
import { shipCapacity } from "../sim/trade.mjs";
import { cargoUsed, SHIP_TYPES, shipValue, repairPrice, warehouseOf, quote } from "../game/game.mjs";

const WEAPON_NAME = { es: { ballista: "Ballesta", catapult: "Catapulta", cannon: "Cañón", bombard: "Bombarda" }, en: { ballista: "Ballista", catapult: "Catapult", cannon: "Cannon", bombard: "Bombard" } };
export const SW = {
  es: {
    tabCargo: "Mercancía", tabCrew: "Tripulación", tabData: "Datos",
    good: "Bien", units: "Uds", avgCost: "Coste medio", localPrice: "Precio aquí", hold: "Bodega",
    emptyHold: "Bodega vacía.", store: "Guardar", take: "Sacar", seaReadOnly: "En el mar no puedes mover mercancía.",
    crew: "Tripulación", min: "mínima", opt: "óptima", max: "máxima",
    crewShort: "Faltan marineros: con menos del mínimo el barco no zarpa.",
    crewSpeed: "Velocidad: {s} %",
    hire: "Contratar {n} ({p})", dismiss: "Despedir {n}",
    captainTavern: "Contrata capitanes en la taberna.",
    guns: "Armamento", gunCond: "Estado {c}%", gunNone: "Sin cañones",
    gunRepair: "Reparar armamento ({p})", cannonBuy: "Comprar cañón ({p})",
    armory: "Armería", weaponBuy: "{w} ({p}, poder {pw}, peso {wt})", gearLine: "Equipo de marineros: nivel {l}/{m}", gearBuy: "Mejorar equipo ({p})", weightLine: "Armas y equipo restan {w} de bodega",
    hull: "Casco {h}%", repair: "Reparar casco ({p})",
    upkeep: "Mantenimiento: {u}/día", value: "Valor: {v}",
    atPort: "En {city}", atSea: "En el mar: {from} → {to} ({eta})",
    route: "Ruta activa: {a} ⇄ {b}, lleva {out}{back}. Viajes completados: {n}.", noRoute: "Sin ruta.",
    backGoods: " y trae {g}",
    prize: "Presa capturada: el astillero paga menos por ella.",
    sellShip: "Vender barco ({p})",
  },
  en: {
    tabCargo: "Cargo", tabCrew: "Crew", tabData: "Data",
    good: "Good", units: "Units", avgCost: "Avg cost", localPrice: "Price here", hold: "Hold",
    emptyHold: "Hold empty.", store: "Store", take: "Take", seaReadOnly: "You cannot move goods at sea.",
    crew: "Crew", min: "minimum", opt: "optimal", max: "maximum",
    crewShort: "Short of sailors: below the minimum the ship will not sail.",
    crewSpeed: "Speed: {s}%",
    hire: "Hire {n} ({p})", dismiss: "Dismiss {n}",
    captainTavern: "Hire captains at the tavern.",
    guns: "Armament", gunCond: "Condition {c}%", gunNone: "No cannons",
    gunRepair: "Repair armament ({p})", cannonBuy: "Buy a cannon ({p})",
    armory: "Armory", weaponBuy: "{w} ({p}, power {pw}, weight {wt})", gearLine: "Sailors' gear: level {l}/{m}", gearBuy: "Upgrade gear ({p})", weightLine: "Weapons and gear take {w} from the hold",
    hull: "Hull {h}%", repair: "Repair hull ({p})",
    upkeep: "Upkeep: {u}/day", value: "Value: {v}",
    atPort: "At {city}", atSea: "At sea: {from} → {to} ({eta})",
    route: "Active route: {a} ⇄ {b}, carries {out}{back}. Trips completed: {n}.", noRoute: "No route.",
    backGoods: " and brings back {g}",
    prize: "Captured prize: the shipyard pays less for it.",
    sellShip: "Sell ship ({p})",
  },
};

/** helpers: { fmt, cityName, types, goods, eta } — eta(ship) renders the arrival estimate. */
export function shipWindowHtml(g, s, lang, tab, hp) {
  const t = SW[lang] ?? SW.es, fmt = hp.fmt, cn = hp.cityName, gn = (k) => hp.goods[k] ?? k;
  const tabs = [["cargo", t.tabCargo], ["crew", t.tabCrew], ["data", t.tabData]]
    .map(([k, l]) => `<button data-swtab="${k}" ${tab === k ? "disabled" : ""}>${l}</button>`).join("");
  return `<div class="tabs">${tabs}</div>` + (tab === "crew" ? crewTab(g, s, lang, t, fmt) : tab === "data" ? dataTab(g, s, t, hp) : cargoTab(g, s, t, hp, gn, cn));
}

function cargoTab(g, s, t, hp, gn, cn) {
  const fmt = hp.fmt, rows = Object.entries(s.cargo);
  const wh = !s.voyage ? warehouseOf(g, s.at) : null;
  let h = "";
  if (s.voyage) h += `<p><small>${t.seaReadOnly}</small></p>`;
  if (!rows.length) h += `<p><i>${t.emptyHold}</i></p>`;
  else {
    h += `<table><tr><th>${t.good}</th><th>${t.units}</th><th>${t.avgCost}</th><th>${t.localPrice}</th>${wh ? "<th></th>" : ""}</tr>`;
    for (const [gd, qty] of rows) {
      const avg = s.basis?.[gd] && qty ? Math.round(s.basis[gd] / qty) : null;
      const local = s.voyage ? null : quote(g, s.at, gd);
      h += `<tr><td>${goodIcon(gd)}${gn(gd)}</td><td>${qty}</td><td>${avg ?? "-"}</td><td>${local ?? "-"}</td>`;
      if (wh) {
        const inWh = wh.goods[gd] ?? 0;
        h += `<td><button data-st="${gd}">${t.store}</button><button data-tk="${gd}" ${inWh ? "" : "disabled"}>${t.take}</button></td>`;
      }
      h += `</tr>`;
    }
    h += `</table>`;
  }
  h += `<p><b>${t.hold}</b>: ${cargoUsed(s)}/${shipCapacity(s)}</p>`;
  return h;
}

function crewTab(g, s, lang, t, fmt) {
  const L = crewLimits(s), c = crewOf(s), sp = speedFactor(s);
  let h = `<div><b>${t.crew}</b>: ${c} (${t.min} ${L.min} · ${t.opt} ${L.opt} · ${t.max} ${L.max})<br>`;
  h += c < L.min ? `<b>${t.crewShort}</b>` : t.crewSpeed.replace("{s}", Math.round(sp * 100));
  h += `<br>` + [1, 5].map((n) => `<button data-hire="${n}" ${s.voyage || g.over || c >= L.max || g.cash < n * HIRE_FEE ? "disabled" : ""}>${t.hire.replace("{n}", n).replace("{p}", fmt(n * HIRE_FEE))}</button>`).join(" ");
  h += " " + [1, 5].map((n) => `<button data-dismiss="${n}" ${s.voyage || g.over || c <= 0 ? "disabled" : ""}>${t.dismiss.replace("{n}", n)}</button>`).join(" ") + `</div>`;
  h += `<div class="captain">${assignedCaptainHtml(s, lang)}`;
  h += captainOfShip(s) ? `<button data-captain-dismiss>${CT[lang].dismiss}</button>` : `<p><small>${t.captainTavern}</small></p>`;
  h += `</div>`;
  const cn = cannonsOf(s), mc = maxCannons(s), gr = gunRepairCost(s);
  h += `<div><b>${t.guns}</b>: ${cn ? `${cn}/${mc} · ${t.gunCond.replace("{c}", Math.round(gunCond(s)))}` : t.gunNone}<br>`;
  h += `<button data-gunrepair="1" ${gr <= 0 || s.voyage || g.over || g.cash < gr ? "disabled" : ""}>${t.gunRepair.replace("{p}", fmt(gr))}</button> `;
  h += `<button data-cannon="1" ${s.voyage || g.over || cn >= mc || g.cash < CANNON_PRICE ? "disabled" : ""}>${t.cannonBuy.replace("{p}", fmt(CANNON_PRICE))}</button></div>`;
  const gl = gearOf(s), gp = gl < GEAR_MAX ? armoryPrice(g, s.at, GEAR[gl + 1] - GEAR[gl]) : 0, lw = weaponWeight(s) + gearWeight(s);
  h += `<div class="armory"><b>${t.armory}</b>: ` + Object.entries(WEAPON_TYPES).map(([k, W]) => { const p = armoryPrice(g, s.at, W.price); return `<button data-weapon="${k}" ${s.voyage || g.over || cn >= mc || g.cash < p ? "disabled" : ""}>${t.weaponBuy.replace("{w}", WEAPON_NAME[lang]?.[k] ?? k).replace("{p}", fmt(p)).replace("{pw}", W.power).replace("{wt}", W.weight)}</button>`; }).join(" ");
  h += `<br>${t.gearLine.replace("{l}", gl).replace("{m}", GEAR_MAX)} <button data-gear="1" ${s.voyage || g.over || gl >= GEAR_MAX || g.cash < gp ? "disabled" : ""}>${t.gearBuy.replace("{p}", fmt(gp))}</button>`;
  h += `<br><small>${t.weightLine.replace("{w}", lw)}</small></div>`;
  return h;
}

function dataTab(g, s, t, hp) {
  const fmt = hp.fmt, cn = hp.cityName, rp = repairPrice(g, s), sv = shipValue(s);
  let h = `<div class="card yc">${shipIconSvg(s.type)}<b>${hp.types[s.type] ?? s.type} ${s.id}</b></div>`;
  h += `<p>${t.hull.replace("{h}", Math.round(s.hull ?? 100))} <button data-repair="1" ${s.voyage || g.over || rp <= 0 || g.cash < rp ? "disabled" : ""}>${t.repair.replace("{p}", fmt(rp))}</button><br>`;
  h += `${t.upkeep.replace("{u}", SHIP_TYPES[s.type].upkeepPerDay)} · ${t.value.replace("{v}", fmt(sv))}</p>`;
  h += s.voyage
    ? `<p>${t.atSea.replace("{from}", cn(s.voyage.from)).replace("{to}", cn(s.voyage.to)).replace("{eta}", hp.eta(s))}</p>`
    : `<p>${t.atPort.replace("{city}", cn(s.at))}</p>`;
  if (s.route) {
    const r = s.route, goodsName = (k) => hp.goods[k] ?? k;
    h += `<p>${t.route.replace("{a}", cn(r.a)).replace("{b}", cn(r.b)).replace("{out}", goodsName(r.out)).replace("{back}", r.back ? t.backGoods.replace("{g}", goodsName(r.back)) : "").replace("{n}", r.legs ?? 0)}</p>`;
  } else h += `<p>${t.noRoute}</p>`;
  if (s.prize) h += `<p><i>${t.prize}</i></p>`;
  h += `<p><button data-sellship="1" ${g.over || s.voyage || g.ships.length <= 1 || cargoUsed(s) > 0 ? "disabled" : ""}>${t.sellShip.replace("{p}", fmt(sv))}</button></p>`;
  return h;
}
