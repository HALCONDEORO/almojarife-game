// Ship window (design: docs/design/ship-window.md): one floating window per ship with
// Cargo / Crew / Data tabs, using the shared .pwin component. Pure HTML strings: main.mjs
// mounts them and wires every button through act(). No game rules here.
import { goodIcon } from "../../web/icons.mjs";
import { shipIconSvg } from "./yardscene.mjs";
import { assignedCaptainHtml, CT } from "./captainview.mjs";
import { captainOf as captainOfShip } from "../game/captains.mjs";
import { CANNON_PRICE, cannonsOf, maxCannons, gunCond, gunRepairCost, crewLimits, crewOf, speedFactor, HIRE_FEE, WEAPON_TYPES, weaponWeight, gearOf, gearWeight, GEAR, GEAR_MAX, armoryPrice } from "../game/crew.mjs";
import { shipCapacity } from "../sim/trade.mjs";
import { hullSpeedFactor } from "../game/seawear.mjs";
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
    hull: "Casco {h}%", repair: "Reparar casco ({p})", hullSlow: "Lento por casco dañado: −{p}% de velocidad",
    upkeep: "Mantenimiento: {u}/día", value: "Valor: {v}",
    atPort: "En {city}", atSea: "En el mar: {from} → {to} ({eta})",
    route: "Ruta activa: {a} ⇄ {b}, lleva {out}{back}. Viajes completados: {n}.", noRoute: "Sin ruta.",
    backGoods: " y trae {g}",
    routeAdv: "Ruta activa (circuito): {stops}. Parada actual: {cur}. Vueltas completadas: {n}.",
    advBuy: "compra {g}", advSell: "vende {g}", advMinCash: "freno de caja {p}",
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
    hull: "Hull {h}%", repair: "Repair hull ({p})", hullSlow: "Slowed by hull damage: −{p}% speed",
    upkeep: "Upkeep: {u}/day", value: "Value: {v}",
    atPort: "At {city}", atSea: "At sea: {from} → {to} ({eta})",
    route: "Active route: {a} ⇄ {b}, carries {out}{back}. Trips completed: {n}.", noRoute: "No route.",
    backGoods: " and brings back {g}",
    routeAdv: "Active route (circuit): {stops}. Current stop: {cur}. Runs completed: {n}.",
    advBuy: "buys {g}", advSell: "sells {g}", advMinCash: "cash brake {p}",
    prize: "Captured prize: the shipyard pays less for it.",
    sellShip: "Sell ship ({p})",
  },
};

/** Small flat icons for the summary card (own work, same style as web/icons.mjs). */
const SWI = {
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21C6 16 3 12.5 3 8.8 3 6 5.2 4 7.8 4c1.7 0 3.2.9 4.2 2.4C13 4.9 14.5 4 16.2 4 18.8 4 21 6 21 8.8c0 3.7-3 7.2-9 12.2z" fill="#c4322f" stroke="#7d1a14" stroke-width="1.2"/></svg>',
  sailor: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="3.4" fill="#e8c9a0" stroke="#7a5a33" stroke-width="1.2"/><path d="M5 21c0-4.2 3-6.5 7-6.5s7 2.3 7 6.5z" fill="#3b6fb0" stroke="#264a7a" stroke-width="1.2"/></svg>',
  cannon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10h13l5 3-5 3H3z" fill="#4a4f55" stroke="#22262b" stroke-width="1.2"/><circle cx="8" cy="18" r="2.4" fill="#8a6a3f" stroke="#4d3a1a" stroke-width="1.2"/><circle cx="15" cy="18" r="2.4" fill="#8a6a3f" stroke="#4d3a1a" stroke-width="1.2"/></svg>',
  barrel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12c1.5 2.5 1.5 15.5 0 18H6c-1.5-2.5-1.5-15.5 0-18z" fill="#a8733a" stroke="#6e4a22" stroke-width="1.2"/><path d="M4.8 8h14.4M4.8 16h14.4" stroke="#6e4a22" stroke-width="1.4"/></svg>',
};
const escA = (v) => String(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** P3-style summary card: state, hull, crew, armament and hold of the ship at a glance,
 *  pinned above the tabs so it stays visible on every tab. Real data only, no rules here. */
function swCard(g, s, lang, t, hp) {
  const cn = hp.cityName, L = crewLimits(s), c = crewOf(s), guns = cannonsOf(s), mc = maxCannons(s);
  const hull = Math.round(s.hull ?? 100), used = cargoUsed(s), cap = shipCapacity(s);
  const state = s.voyage
    ? t.atSea.replace("{from}", cn(s.voyage.from)).replace("{to}", cn(s.voyage.to)).replace("{eta}", hp.eta(s))
    : t.atPort.replace("{city}", cn(s.at));
  const cell = (icon, label, val, bad = false) =>
    `<span class="swc-stat${bad ? " swc-bad" : ""}" role="img" aria-label="${escA(label)}">${icon}<b>${val}</b></span>`;
  const cells = [
    cell(SWI.heart, t.hull.replace("{h}", hull), hull + "%", hull < 50),
    cell(SWI.sailor, `${t.crew} ${c} (${t.min} ${L.min} · ${t.opt} ${L.opt} · ${t.max} ${L.max})`, c, c < L.min),
    cell(SWI.cannon, `${t.guns} ${guns}/${mc}`, `${guns}/${mc}`),
    cell(SWI.barrel, `${t.hold} ${used}/${cap}`, `${used}/${cap}`),
  ].join("");
  return `<div class="swcard">${shipIconSvg(s.type, 72, 40)}<div class="swc-main"><div class="swc-name"><b>${escA(hp.types[s.type] ?? s.type)} ${s.id}</b></div><div class="swc-state">${state}</div><div class="swc-stats">${cells}</div></div></div>`;
}

/** helpers: { fmt, fmtM, cityName, types, goods, eta } — eta(ship) renders the arrival estimate; fmtM is the money format (cents), fmt the count format. */
export function shipWindowHtml(g, s, lang, tab, hp) {
  const t = SW[lang] ?? SW.es, fmt = hp.fmt, fmtM = hp.fmtM, cn = hp.cityName, gn = (k) => hp.goods[k] ?? k;
  const tabs = [["cargo", t.tabCargo], ["crew", t.tabCrew], ["data", t.tabData]]
    .map(([k, l]) => `<button data-swtab="${k}" ${tab === k ? "disabled" : ""}>${l}</button>`).join("");
  return swCard(g, s, lang, t, hp) + `<div class="tabs">${tabs}</div>` + (tab === "crew" ? crewTab(g, s, lang, t, fmt, fmtM) : tab === "data" ? dataTab(g, s, t, hp) : cargoTab(g, s, t, hp, gn, cn));
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

function crewTab(g, s, lang, t, fmt, fmtM = fmt) {
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
  h += `<button data-gunrepair="1" ${gr <= 0 || s.voyage || g.over || g.cash < gr ? "disabled" : ""}>${t.gunRepair.replace("{p}", fmtM(gr))}</button> `;
  h += `<button data-cannon="1" ${s.voyage || g.over || cn >= mc || g.cash < CANNON_PRICE ? "disabled" : ""}>${t.cannonBuy.replace("{p}", fmt(CANNON_PRICE))}</button></div>`;
  const gl = gearOf(s), gp = gl < GEAR_MAX ? armoryPrice(g, s.at, GEAR[gl + 1] - GEAR[gl]) : 0, lw = weaponWeight(s) + gearWeight(s);
  h += `<div class="armory"><b>${t.armory}</b>: ` + Object.entries(WEAPON_TYPES).map(([k, W]) => { const p = armoryPrice(g, s.at, W.price); return `<button data-weapon="${k}" ${s.voyage || g.over || cn >= mc || g.cash < p ? "disabled" : ""}>${t.weaponBuy.replace("{w}", WEAPON_NAME[lang]?.[k] ?? k).replace("{p}", fmt(p)).replace("{pw}", W.power).replace("{wt}", W.weight)}</button>`; }).join(" ");
  h += `<br>${t.gearLine.replace("{l}", gl).replace("{m}", GEAR_MAX)} <button data-gear="1" ${s.voyage || g.over || gl >= GEAR_MAX || g.cash < gp ? "disabled" : ""}>${t.gearBuy.replace("{p}", fmt(gp))}</button>`;
  h += `<br><small>${t.weightLine.replace("{w}", lw)}</small></div>`;
  return h;
}

function dataTab(g, s, t, hp) {
  const fmt = hp.fmt, cn = hp.cityName, rp = repairPrice(g, s), sv = shipValue(s);
  let h = "";
  h += `<p>${t.hull.replace("{h}", Math.round(s.hull ?? 100))} <button data-repair="1" ${s.voyage || g.over || rp <= 0 || g.cash < rp ? "disabled" : ""}>${t.repair.replace("{p}", fmt(rp))}</button><br>`;
  { const hs = Math.round((1 - hullSpeedFactor(s.hull)) * 100); if (s.voyage && hs > 0) h += `<small class="warn">${t.hullSlow.replace("{p}", hs)}</small><br>`; }
  h += `${t.upkeep.replace("{u}", SHIP_TYPES[s.type].upkeepPerDay)} · ${t.value.replace("{v}", fmt(sv))}</p>`;
  h += s.voyage
    ? `<p>${t.atSea.replace("{from}", cn(s.voyage.from)).replace("{to}", cn(s.voyage.to)).replace("{eta}", hp.eta(s))}</p>`
    : `<p>${t.atPort.replace("{city}", cn(s.at))}</p>`;
  if (s.route) {
    const r = s.route, goodsName = (k) => goodIcon(k, 16) + (hp.goods[k] ?? k);
    if (r.v === 2) { // advanced circuit: show the stop chain, the current stop and each stop's orders
      const n = r.stops.length, cur = r.stops[(r.idx ?? 0) % n];
      h += `<p>${t.routeAdv.replace("{stops}", r.stops.map((st) => cn(st.city)).join(" → ")).replace("{cur}", cn(cur.city)).replace("{n}", r.legs ?? 0)}</p>`;
      const rule = (x, key, lim, sign) => t[key].replace("{g}", goodsName(x.good)) + (x[lim] != null ? ` ${sign}${fmt(x[lim])}` : "");
      h += `<p><small>` + r.stops.map((st) => {
        const parts = [...st.buy.map((x) => rule(x, "advBuy", "maxPrice", "≤")), ...st.sell.map((x) => rule(x, "advSell", "minPrice", "≥"))];
        return `<b>${cn(st.city)}</b>: ${parts.join(", ") || "—"}`;
      }).join(" · ") + (r.minCash > 0 ? ` · ${t.advMinCash.replace("{p}", fmt(r.minCash))}` : "") + `</small></p>`;
    } else h += `<p>${t.route.replace("{a}", cn(r.a)).replace("{b}", cn(r.b)).replace("{out}", goodsName(r.out)).replace("{back}", r.back ? t.backGoods.replace("{g}", goodsName(r.back)) : "").replace("{n}", r.legs ?? 0)}</p>`;
  } else h += `<p>${t.noRoute}</p>`;
  if (s.prize) h += `<p><i>${t.prize}</i></p>`;
  return h;
}
