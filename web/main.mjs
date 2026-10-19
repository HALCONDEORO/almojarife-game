import { goodIcon } from "./icons.mjs";
import { buildWorld } from "../src/sim/world.mjs";
import { shipPosition } from "../src/sim/position.mjs";
import { newGame, advanceDay, doBuy, doSell, doSail, waitUntilArrival, buyCaravel, quote, netWorth, cargoUsed, SHIP_TYPES, GOAL_CASH, DEADLINE_DAYS, CARAVEL_PRICE } from "../src/game/game.mjs";

const T = {
  es: { play: "▶ Navegar", pause: "⏸ Pausa", speed: "Velocidad", day: "Día", cash: "Monedas", goal: "Meta", ships: "Barcos", new: "Nueva partida",
    hint0: "Misión 1: gana {goal} monedas en {days} días. Compra barato donde un bien abunda, vende caro donde falta. Pulsa un puerto del mapa para zarpar.",
    hintSea: "Tu barco está en el mar. Espera para llegar.", good: "Bien", price: "Precio", stock: "Stock", hold: "Bodega", cheap: "Barato: buen momento para comprar", dear: "Caro: buen momento para vender",
    buy: "Comprar", sell: "Vender", sailTo: "Zarpar a", days: "días", wait: "Esperar 1 día", arrive: "Esperar llegada",
    caravel: "Comprar carabela ({p})", at: "En", sea: "En el mar hacia", win: "¡Victoria! Alcanzaste la meta.", lose: "Se acabó el tiempo. Patrimonio final:",
    cap: "Carga", log: { arrive: "Día {day}: el barco {ship} llega a {city}", buy: "Día {day}: compras {qty} {good} por {sum}", sell: "Día {day}: vendes {qty} {good} por {sum}", sail: "Día {day}: el barco {ship} zarpa a {city} ({days} días)", caravel: "Día {day}: compras una carabela en {city}" }, goods: { grain: "Trigo", dried_fish: "Pescado seco", salt: "Sal", wool: "Lana", iron: "Hierro", timber: "Madera", cloth: "Paño", olive_oil: "Aceite", wine: "Vino", silk: "Seda", sugar: "Azúcar", pepper: "Pimienta" },
    types: { cog: "Coca", caravel: "Carabela" } },
  en: { play: "▶ Sail", pause: "⏸ Pause", speed: "Speed", day: "Day", cash: "Coins", goal: "Goal", ships: "Ships", new: "New game",
    hint0: "Mission 1: earn {goal} coins in {days} days. Buy cheap where a good is plentiful, sell dear where it is scarce. Click a port on the map to sail.",
    hintSea: "Your ship is at sea. Wait to arrive.", good: "Good", price: "Price", stock: "Stock", hold: "Hold", cheap: "Cheap: good time to buy", dear: "Dear: good time to sell",
    buy: "Buy", sell: "Sell", sailTo: "Sail to", days: "days", wait: "Wait 1 day", arrive: "Wait for arrival",
    caravel: "Buy a caravel ({p})", at: "At", sea: "At sea to", win: "Victory! You reached the goal.", lose: "Time is up. Final net worth:",
    cap: "Cargo", log: { arrive: "Day {day}: ship {ship} arrives at {city}", buy: "Day {day}: you buy {qty} {good} for {sum}", sell: "Day {day}: you sell {qty} {good} for {sum}", sail: "Day {day}: ship {ship} sails to {city} ({days} days)", caravel: "Day {day}: you buy a caravel at {city}" }, goods: { grain: "Grain", dried_fish: "Dried fish", salt: "Salt", wool: "Wool", iron: "Iron", timber: "Timber", cloth: "Cloth", olive_oil: "Olive oil", wine: "Wine", silk: "Silk", sugar: "Sugar", pepper: "Pepper" },
    types: { cog: "Cog", caravel: "Caravel" } },
};
let lang = localStorage.getItem("lang") || (navigator.language?.toLowerCase().startsWith("es") ? "es" : "en"), t = T[lang], g, sel = 0;
const $ = (id) => document.getElementById(id), fmt = (n) => Math.round(n).toLocaleString(lang);
const world = buildWorld(await (await fetch("../data/world.json")).json());
const nodes = Object.values(world.nodes);
const lons = nodes.map((n) => n.lon), lats = nodes.map((n) => n.lat);
const [x0, x1, y0, y1] = [Math.min(...lons) - 1, Math.max(...lons) + 1, Math.min(...lats) - 1, Math.max(...lats) + 1];
const sc = 800 / (x1 - x0), VH = Math.round((y1 - y0) * sc * 1.25);
$("map").setAttribute("viewBox", `0 0 800 ${VH}`);
const X = (lon) => (lon - x0) * sc, Y = (lat) => (y1 - lat) * sc * 1.25;
const cityName = (id) => world.nodes[id].name ?? id;

document.documentElement.lang = lang;
// Moving ships. The view only reads sim state; the sim advances on the daily tick below.
// `progress` is how much of the current day has elapsed (0 to 1). It is kept across pause,
// resume and speed changes, so ships never move backwards or jump.
let playing = false, speed = 1, progress = 0, lastFrame = 0;
const MS_PER_DAY = 1500, departed = new Map(); // ship id -> progress when it left port (view only)
const shipFrac = (id) => { const d = departed.get(id); return d === undefined ? progress : Math.max(0, (progress - d) / (1 - d || 1)); };
function drawShips() {
  const layer = $("shipsLayer"); if (!layer) return;
  let h = "";
  for (const a of g.ai) { const p = shipPosition(world, a.ship, progress); h += `<text x="${X(p.lon) - 6}" y="${Y(p.lat) + 5}" font-size="13" fill="#555" opacity="0.8">⛵</text>`; }
  g.ships.forEach((sh, i) => { const p = shipPosition(world, sh, shipFrac(sh.id)); h += `<text x="${X(p.lon) - 8}" y="${Y(p.lat) + 6}" font-size="18" fill="${i === sel ? "#a00" : "#036"}">⛵</text><text x="${X(p.lon) + 8}" y="${Y(p.lat) - 6}" font-size="11" fill="#300">${sh.id}</text>`; });
  layer.innerHTML = h;
}
function tickDay() {
  const before = g.ships.map((x) => !!x.voyage);
  advanceDay(g); progress = 0; departed.clear();
  if (g.ships.some((x, i) => before[i] && !x.voyage)) playing = false; // pause when your ship arrives
  render();
}
function frame(now) {
  const dt = lastFrame ? Math.min(250, now - lastFrame) : 0; lastFrame = now;
  if (playing && !g.over) {
    progress += (dt * speed) / MS_PER_DAY;
    if (progress >= 1) tickDay();
  }
  drawShips();
  requestAnimationFrame(frame);
}
function start() { g = newGame(world); sel = 0; render(); }
function ship() { return g.ships[sel] ?? g.ships[0]; }
function act(fn) {
  const was = new Set(g.ships.filter((x) => x.voyage).map((x) => x.id));
  const day = g.day; fn();
  if (g.day !== day) { progress = 0; departed.clear(); } // wait buttons advance whole days
  else for (const x of g.ships) if (x.voyage && !was.has(x.id)) departed.set(x.id, progress); // left port mid-day
  render();
}

function render() {
  t = T[lang]; const s = ship();
  $("day").textContent = `${t.day} ${g.day}/${DEADLINE_DAYS}`;
  $("cash").textContent = `${t.cash}: ${fmt(g.cash)}`;
  $("goal").textContent = `${t.goal}: ${fmt(GOAL_CASH)}`;
  $("ships").textContent = `${t.ships}: ${g.ships.length}`;
  $("play").textContent = playing ? t.pause : t.play; $("spd").textContent = `${t.speed} ${speed}x`;
  $("new").textContent = t.new; $("lang").textContent = lang === "es" ? "EN" : "ES";
  $("hint").textContent = g.over === "win" ? t.win : g.over === "lose" ? `${t.lose} ${fmt(netWorth(g))}` :
    s.voyage ? t.hintSea : t.hint0.replace("{goal}", fmt(GOAL_CASH)).replace("{days}", DEADLINE_DAYS);
  // map
  let m = "";
  for (const [a, b] of world.lanes) m += `<line x1="${X(world.nodes[a].lon)}" y1="${Y(world.nodes[a].lat)}" x2="${X(world.nodes[b].lon)}" y2="${Y(world.nodes[b].lat)}" stroke="#7a9bb0" stroke-width="1.5" stroke-dasharray="4 3"/>`;
  for (const c of world.cities) {
    const canSail = !s.voyage && c.id !== s.at && !g.over;
    m += `<g class="city" data-c="${canSail ? c.id : ""}"><circle cx="${X(c.lon)}" cy="${Y(c.lat)}" r="7" fill="${c.id === s.at ? "#2a7" : "#7a3b1c"}"/><text x="${X(c.lon) + 10}" y="${Y(c.lat) + 4}" font-size="14">${c.name}</text></g>`;
  }
  $("map").innerHTML = `<g id="static">${m}</g><g id="shipsLayer" pointer-events="none"></g>`;
  drawShips();
  $("map").querySelectorAll("g.city").forEach((el) => el.onclick = () => { const c = el.dataset.c; if (c) act(() => doSail(g, ship(), c)); });
  const logLine = (l) => t.log[l.key].replace(/\{(\w+)\}/g, (_, k) => k === "city" ? cityName(l.city) : k === "good" ? t.goods[l.good] : l[k]);
  $("log").innerHTML = g.log.map((l) => `<div>${logLine(l)}</div>`).join("");
  // panel
  let h = g.ships.map((sh, i) => `<button data-sel="${i}" ${i === sel ? "disabled" : ""}>${t.types[sh.type]} ${sh.id}</button>`).join("");
  h += ` <b>${t.types[s.type]} ${s.id}</b>: ${s.voyage ? `${t.sea} ${cityName(s.voyage.to)} (${s.voyage.daysLeft} ${t.days})` : `${t.at} ${cityName(s.at)}`} - ${t.cap} ${cargoUsed(s)}/${SHIP_TYPES[s.type].capacity}<br>`;
  if (!s.voyage && !g.over) {
    h += `<table><tr><th>${t.good}</th><th>${t.price}</th><th>${t.stock}</th><th>${t.hold}</th><th></th></tr>`;
    for (const gd of Object.keys(world.goods)) {
      const p = quote(g, s.at, gd), base = world.goods[gd].base, col = p < base * 0.9 ? "#161" : p > base * 1.2 ? "#a11" : "inherit", tag = p < base * 0.9 ? "▼" : p > base * 1.2 ? "▲" : "";
      h += `<tr><td>${goodIcon(gd)}${t.goods[gd]}</td><td style="color:${col}" title="${tag === "" ? "" : tag === "▼" ? t.cheap : t.dear}">${tag} ${p}</td><td>${g.market[s.at][gd].stock}</td><td>${s.cargo[gd] ?? 0}</td>` +
        `<td><button data-b="${gd}:10">${t.buy} 10</button><button data-b="${gd}:60">${t.buy} max</button><button data-s="${gd}">${t.sell}</button></td></tr>`;
    }
    h += `</table><div>${t.sailTo}: ` + world.cities.filter((c) => c.id !== s.at).map((c) => `<button data-sail="${c.id}">${c.name}</button>`).join("") + `</div>`;
    h += `<button data-caravel="1" ${g.cash < CARAVEL_PRICE || g.ships.length >= 3 ? "disabled" : ""}>${t.caravel.replace("{p}", fmt(CARAVEL_PRICE))}</button>`;
  }
  if (!g.over) h += `<div><button data-wait="1">${t.wait}</button>${s.voyage ? `<button data-arrive="1">${t.arrive}</button>` : ""}</div>`;
  $("panel").innerHTML = h;
  const P = $("panel");
  P.querySelectorAll("[data-sel]").forEach((e) => e.onclick = () => { sel = +e.dataset.sel; render(); });
  P.querySelectorAll("[data-b]").forEach((e) => e.onclick = () => { const [gd, q] = e.dataset.b.split(":"); act(() => doBuy(g, s, gd, +q)); });
  P.querySelectorAll("[data-s]").forEach((e) => e.onclick = () => act(() => doSell(g, s, e.dataset.s, s.cargo[e.dataset.s] ?? 0)));
  P.querySelectorAll("[data-sail]").forEach((e) => e.onclick = () => act(() => doSail(g, s, e.dataset.sail)));
  P.querySelectorAll("[data-caravel]").forEach((e) => e.onclick = () => act(() => { const r = buyCaravel(g, s.at); if (r.ok) sel = g.ships.length - 1; }));
  P.querySelectorAll("[data-wait]").forEach((e) => e.onclick = () => act(() => advanceDay(g)));
  P.querySelectorAll("[data-arrive]").forEach((e) => e.onclick = () => act(() => waitUntilArrival(g, s)));
}
$("play").onclick = () => { playing = !playing; render(); };
$("spd").onclick = () => { speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; render(); };
$("new").onclick = () => { playing = false; progress = 0; departed.clear(); start(); };
$("lang").onclick = () => { lang = lang === "es" ? "en" : "es"; localStorage.setItem("lang", lang); render(); };
start();
requestAnimationFrame(frame);
