import { goodIcon } from "./icons.mjs";
import { newCamera, zoomAt, panBy, viewBox, markerScale } from "../src/view/camera.mjs";
import { buildWorld } from "../src/sim/world.mjs";
import { shipPosition } from "../src/sim/position.mjs";
import { serialize as packGame, deserialize as unpackGame, cleanCompany } from "../src/game/gamesave.mjs";
import { defaultProfile, cleanProfile, startBonus, crestSvg, portraitSvg, flagSvg, PALETTE, DIVISIONS, CHARGES, SHIELDS, PORTRAITS, BACKGROUNDS, NAMES } from "../src/game/profile.mjs";
import { newGame, advanceDay, doBuy, doSell, doSail, waitUntilArrival, buyCaravel, quote, netWorth, cargoUsed, SHIP_TYPES, GOAL_CASH, DEADLINE_DAYS, CARAVEL_PRICE } from "../src/game/game.mjs";

const T = {
  es: { play: "▶ Navegar", pause: "⏸ Pausa", speed: "Velocidad", day: "Día", cash: "Monedas", goal: "Meta", ships: "Barcos", new: "Nueva partida", cont: "Continuar", start: "Empezar", company: "Nombre de tu casa mercantil", defCo: "Mi Casa Mercantil", tagline: "Comercio marítimo en la costa ibérica, siglos XV-XVI", menu: "Menú", saved: "Partida guardada", noSave: "No hay partida guardada", exportS: "Exportar", importS: "Importar", badSave: "Ese archivo no es una partida válida", create: "Crea tu casa mercantil", character: "Tu nombre", portrait: "Retrato", crest: "Escudo", shield: "Forma", division: "División", charge: "Emblema", c1: "Color principal", c2: "Color secundario", home: "Puerto de origen", background: "Origen", back: "Atrás", sh: { heater: "Clásico", round: "Redondo" }, dv: { plain: "Liso", pale: "Partido", fess: "Cortado", chevron: "Cheurón", cross: "Cruz" }, ch: { star: "Estrella", tower: "Torre", ship: "Nave", anchor: "Ancla", sun: "Sol", wheat: "Trigo" }, bgInfo: { merchant: "+300 monedas", seafarer: "Barcos 15% más baratos de mantener", scholar: "+150 monedas y 5% menos de mantenimiento" },
    hint0: "Misión 1: gana {goal} monedas en {days} días. Compra barato donde un bien abunda, vende caro donde falta. Pulsa un puerto del mapa para zarpar.",
    hintSea: "Tu barco está en el mar. Espera para llegar.", good: "Bien", price: "Precio", stock: "Stock", hold: "Bodega", holdValue: "Valor de la bodega aquí (aprox.)", cheap: "Barato: buen momento para comprar", dear: "Caro: buen momento para vender",
    buy: "Comprar", sell: "Vender", sailTo: "Zarpar a", days: "días", wait: "Esperar 1 día", arrive: "Esperar llegada",
    caravel: "Comprar carabela ({p})", at: "En", sea: "En el mar hacia", win: "¡Victoria! Alcanzaste la meta.", lose: "Se acabó el tiempo. Patrimonio final:",
    cap: "Carga", log: { arrive: "Día {day}: el barco {ship} llega a {city}", buy: "Día {day}: compras {qty} {good} por {sum}", sell: "Día {day}: vendes {qty} {good} por {sum}", sail: "Día {day}: el barco {ship} zarpa a {city} ({days} días)", caravel: "Día {day}: compras una carabela en {city}" }, goods: { grain: "Trigo", dried_fish: "Pescado seco", salt: "Sal", wool: "Lana", iron: "Hierro", timber: "Madera", cloth: "Paño", olive_oil: "Aceite", wine: "Vino", silk: "Seda", sugar: "Azúcar", pepper: "Pimienta" },
    types: { cog: "Coca", caravel: "Carabela" } },
  en: { play: "▶ Sail", pause: "⏸ Pause", speed: "Speed", day: "Day", cash: "Coins", goal: "Goal", ships: "Ships", new: "New game", cont: "Continue", start: "Start", company: "Name of your trading house", defCo: "My Trading House", tagline: "Sea trading on the Iberian coast, 15th-16th century", menu: "Menu", saved: "Game saved", noSave: "No saved game", exportS: "Export", importS: "Import", badSave: "That file is not a valid save", create: "Create your trading house", character: "Your name", portrait: "Portrait", crest: "Coat of arms", shield: "Shape", division: "Division", charge: "Emblem", c1: "Main colour", c2: "Second colour", home: "Home port", background: "Background", back: "Back", sh: { heater: "Classic", round: "Round" }, dv: { plain: "Plain", pale: "Split", fess: "Cut", chevron: "Chevron", cross: "Cross" }, ch: { star: "Star", tower: "Tower", ship: "Ship", anchor: "Anchor", sun: "Sun", wheat: "Wheat" }, bgInfo: { merchant: "+300 coins", seafarer: "Ships cost 15% less to keep", scholar: "+150 coins and 5% lower upkeep" },
    hint0: "Mission 1: earn {goal} coins in {days} days. Buy cheap where a good is plentiful, sell dear where it is scarce. Click a port on the map to sail.",
    hintSea: "Your ship is at sea. Wait to arrive.", good: "Good", price: "Price", stock: "Stock", hold: "Hold", holdValue: "Hold value here (approx.)", cheap: "Cheap: good time to buy", dear: "Dear: good time to sell",
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
// Pan and zoom: the wheel zooms at the cursor, dragging pans, two fingers pinch, double click resets.
const cam = newCamera(800, VH), mapEl = $("map");
const applyCam = () => { mapEl.setAttribute("viewBox", viewBox(cam).join(" ")); scaleMarkers(); };
function scaleMarkers() {
  const k = markerScale(cam.zoom);
  mapEl.querySelectorAll("[data-mx]").forEach((el) => el.setAttribute("transform", `translate(${el.dataset.mx} ${el.dataset.my}) scale(${k})`));
  mapEl.querySelectorAll("#static line").forEach((el) => el.setAttribute("stroke-width", 1.5 * k));
}
const frac = (e) => { const r = mapEl.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
mapEl.style.touchAction = "none";
mapEl.addEventListener("wheel", (e) => { e.preventDefault(); zoomAt(cam, e.deltaY < 0 ? 1.25 : 0.8, ...frac(e)); applyCam(); }, { passive: false });
mapEl.addEventListener("dblclick", () => { cam.zoom = 1; cam.x = cam.y = 0; applyCam(); });
const ptrs = new Map(); let moved = 0, pinch = 0;
mapEl.addEventListener("pointerdown", (e) => { ptrs.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; pinch = 0; });
mapEl.addEventListener("pointermove", (e) => {
  const prev = ptrs.get(e.pointerId); if (!prev) return;
  const r = mapEl.getBoundingClientRect();
  if (ptrs.size === 2) {
    ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
    if (pinch) { zoomAt(cam, d / pinch, ((a[0] + b[0]) / 2 - r.left) / r.width, ((a[1] + b[1]) / 2 - r.top) / r.height); applyCam(); }
    pinch = d; moved = 99; return;
  }
  const dx = e.clientX - prev[0], dy = e.clientY - prev[1]; moved += Math.abs(dx) + Math.abs(dy);
  if (moved > 6) { panBy(cam, dx / r.width, dy / r.height); applyCam(); ptrs.set(e.pointerId, [e.clientX, e.clientY]); }
});
const endPtr = (e) => { ptrs.delete(e.pointerId); pinch = 0; };
mapEl.addEventListener("pointerup", endPtr); mapEl.addEventListener("pointercancel", endPtr);
// a drag must not count as a click on a port
mapEl.addEventListener("click", (e) => { if (moved > 6) { e.stopPropagation(); e.preventDefault(); moved = 0; } }, true);
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
  for (const a of g.ai) { const p = shipPosition(world, a.ship, progress); h += `<g data-mx="${X(p.lon)}" data-my="${Y(p.lat)}"><text x="-6" y="5" font-size="13" fill="#555" opacity="0.8">⛵</text></g>`; }
  g.ships.forEach((sh, i) => { const p = shipPosition(world, sh, shipFrac(sh.id)); h += `<g data-mx="${X(p.lon)}" data-my="${Y(p.lat)}"><text x="-8" y="6" font-size="18" fill="${i === sel ? "#a00" : "#036"}">⛵</text><text x="8" y="-6" font-size="11" fill="#300">${sh.id}</text></g>`; });
  layer.innerHTML = h; scaleMarkers();
}
function tickDay() {
  const before = g.ships.map((x) => !!x.voyage);
  advanceDay(g); progress = 0; departed.clear(); autosave();
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
const SAVE_KEY = "almojarife.save.v1";
let company = "";
function autosave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(packGame(g, company))); } catch {} }
function loadSaved() { try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return null; return unpackGame(JSON.parse(raw), world); } catch { return null; } }
const cityIds = world.cities.map((c) => c.id);
function start(prof, save = true) {
  const p = cleanProfile({ ...prof, company: prof?.company || T[lang].defCo }, cityIds);
  g = newGame(world, p.home, { ...startBonus(p), profile: p }); sel = 0; company = p.company; if (save) autosave(); render();
}
function ship() { return g.ships[sel] ?? g.ships[0]; }
function act(fn) {
  const was = new Set(g.ships.filter((x) => x.voyage).map((x) => x.id));
  const day = g.day; fn();
  if (g.day !== day) { progress = 0; departed.clear(); } // wait buttons advance whole days
  else for (const x of g.ships) if (x.voyage && !was.has(x.id)) departed.set(x.id, progress); // left port mid-day
  autosave(); render();
}

function render() {
  t = T[lang]; const s = ship();
  const pr = g.profile, co = $("co"); co.textContent = "";
  if (pr) { const box = document.createElement("span"); box.innerHTML = crestSvg(pr.crest, 22, "top"); co.append(box, ` ${pr.company}`); if (pr.character) { const sm = document.createElement("small"); sm.textContent = ` (${pr.character})`; co.append(sm); } }
  else if (company) co.textContent = `· ${company}`;
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
    m += `<g class="city" data-c="${canSail ? c.id : ""}" data-mx="${X(c.lon)}" data-my="${Y(c.lat)}"><circle cx="0" cy="0" r="7" fill="${c.id === s.at ? "#2a7" : "#7a3b1c"}"/><text x="10" y="4" font-size="14">${c.name}</text></g>`;
  }
  $("map").innerHTML = `<image href="../assets/map/background.webp" x="0" y="0" width="800" height="${VH}" preserveAspectRatio="none" pointer-events="none"/><g id="static">${m}</g><g id="shipsLayer" pointer-events="none"></g>`;
  drawShips(); scaleMarkers();
  $("map").querySelectorAll("g.city").forEach((el) => el.onclick = () => { const c = el.dataset.c; if (c) act(() => doSail(g, ship(), c)); });
  const logLine = (l) => t.log[l.key].replace(/\{(\w+)\}/g, (_, k) => k === "city" ? cityName(l.city) : k === "good" ? t.goods[l.good] : l[k]);
  $("log").innerHTML = g.log.map((l) => `<div>${logLine(l)}</div>`).join("");
  // panel
  let h = g.ships.map((sh, i) => `<button data-sel="${i}" ${i === sel ? "disabled" : ""}>${t.types[sh.type]} ${sh.id}</button>`).join("");
  h += ` <b>${t.types[s.type]} ${s.id}</b>: ${s.voyage ? `${t.sea} ${cityName(s.voyage.to)} (${s.voyage.daysLeft} ${t.days})` : `${t.at} ${cityName(s.at)}`} - ${t.cap} ${cargoUsed(s)}/${SHIP_TYPES[s.type].capacity}<br>`;
  if (!s.voyage && !g.over) {
    const hv = Object.keys(s.cargo).reduce((a, gd) => a + (s.cargo[gd] ?? 0) * quote(g, s.at, gd), 0);
    h += `<div title="${t.holdValue}">${t.holdValue}: ≈ ${fmt(Math.round(hv))}</div>`;
    h += `<table><tr><th>${t.good}</th><th>${t.price}</th><th>${t.stock}</th><th>${t.hold}</th><th></th></tr>`;
    for (const gd of Object.keys(world.goods)) {
      const p = quote(g, s.at, gd), base = world.goods[gd].base, col = p < base * 0.9 ? "#161" : p > base * 1.2 ? "#a11" : "inherit", tag = p < base * 0.9 ? "▼" : p > base * 1.2 ? "▲" : "";
      h += `<tr><td>${goodIcon(gd)}${t.goods[gd]}</td><td style="color:${col}" title="${tag === "" ? "" : tag === "▼" ? t.cheap : t.dear}">${tag} ${p}</td><td>${g.market[s.at][gd].stock}</td><td>${s.cargo[gd] ?? 0}</td>` +
        `<td><button data-b="${gd}:10">${t.buy} 10</button><button data-b="${gd}:60">${t.buy} max</button><button data-s="${gd}" ${(s.cargo[gd] ?? 0) > 0 ? "" : "disabled"}>${t.sell}</button></td></tr>`;
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
$("new").onclick = () => { playing = false; showTitle(); };
$("lang").onclick = () => { lang = lang === "es" ? "en" : "es"; localStorage.setItem("lang", lang); render(); };
function showCreate(name) {
  t = T[lang]; const el = $("title"), pf = defaultProfile(name || t.defCo), swatch = (key) => PALETTE.map((c) => `<button class="sw ${pf.crest[key] === c ? "on" : ""}" data-k="${key}" data-v="${c}" style="background:${c}" aria-label="${c}"></button>`).join("");
  const opt = (list, cur, label, key) => list.map((v) => `<option value="${v}" ${v === cur ? "selected" : ""}>${label(v)}</option>`).join("");
  const draw = () => {
    el.innerHTML = `<div class="box wide"><h2>${t.create}</h2><div class="cols"><div>` +
      `<label>${t.company}<br><input id="p-co" maxlength="30"></label><label>${t.character}<br><input id="p-ch" maxlength="30"></label>` +
      `<div>${t.portrait}</div><div class="ports">${Array.from({ length: PORTRAITS }, (_, i) => `<button class="pt ${pf.portrait === i ? "on" : ""}" data-p="${i}">${portraitSvg(i, pf.crest.c1, 48)}</button>`).join("")}</div>` +
      `<label>${t.home}<br><select id="p-home">${opt(cityIds, pf.home, (id) => cityName(id))}</select></label>` +
      `<label>${t.background}<br><select id="p-bg">${opt(Object.keys(BACKGROUNDS), pf.background, (b) => NAMES[lang][b])}</select></label><small>${t.bgInfo[pf.background]}</small></div>` +
      `<div><div>${t.crest}</div><div class="prev">${crestSvg(pf.crest, 96, "prev")}${portraitSvg(pf.portrait, pf.crest.c1, 96)}</div>` +
      `<label>${t.shield} <select id="p-sh">${opt(SHIELDS, pf.crest.shield, (v) => t.sh[v])}</select></label> <label>${t.division} <select id="p-dv">${opt(DIVISIONS, pf.crest.division, (v) => t.dv[v])}</select></label> <label>${t.charge} <select id="p-cg">${opt(CHARGES, pf.crest.charge, (v) => t.ch[v])}</select></label>` +
      `<div>${t.c1}</div><div>${swatch("c1")}</div><div>${t.c2}</div><div>${swatch("c2")}</div></div></div>` +
      `<p><button id="p-back">${t.back}</button> <button id="p-go">${t.start}</button></p></div>`;
    $("p-co").value = pf.company; $("p-ch").value = pf.character; // set as values, never parsed as HTML
    const read = () => { pf.company = $("p-co").value; pf.character = $("p-ch").value; };
    el.querySelectorAll(".pt").forEach((b) => b.onclick = () => { read(); pf.portrait = +b.dataset.p; draw(); });
    el.querySelectorAll(".sw").forEach((b) => b.onclick = () => { read(); pf.crest[b.dataset.k] = b.dataset.v; draw(); });
    for (const [id, set] of [["p-home", (v) => pf.home = v], ["p-bg", (v) => pf.background = v], ["p-sh", (v) => pf.crest.shield = v], ["p-dv", (v) => pf.crest.division = v], ["p-cg", (v) => pf.crest.charge = v]]) $(id).onchange = (e) => { read(); set(e.target.value); draw(); };
    $("p-back").onclick = () => showTitle();
    $("p-go").onclick = () => { read(); playing = false; progress = 0; departed.clear(); start(pf); el.hidden = true; };
  };
  draw();
}
function showTitle() {
  t = T[lang]; const saved = loadSaved(), el = $("title");
  el.innerHTML = `<div class="box"><h1>El Almojarife</h1><p>${t.tagline}</p>` +
    `<label>${t.company}<br><input id="co-in" maxlength="30" value="${t.defCo}"></label><br>` +
    `<button id="t-start">${t.start}</button> <button id="t-cont" ${saved ? "" : "disabled"} title="${saved ? "" : t.noSave}">${t.cont}</button> ` +
    `<button id="t-exp" ${saved ? "" : "disabled"}>${t.exportS}</button> <button id="t-imp">${t.importS}</button> <button id="t-lang">${lang === "es" ? "EN" : "ES"}</button>` +
    `<input type="file" id="t-file" accept="application/json,.json" hidden><div id="t-msg"></div></div>`;
  el.hidden = false;
  $("t-start").onclick = () => showCreate($("co-in").value);
  $("t-cont").onclick = () => { if (!saved) return; g = saved.g; company = saved.company; sel = 0; playing = false; progress = 0; departed.clear(); render(); el.hidden = true; };
  $("t-lang").onclick = () => { lang = lang === "es" ? "en" : "es"; localStorage.setItem("lang", lang); document.documentElement.lang = lang; showTitle(); };
  $("t-exp").onclick = () => { const blob = new Blob([localStorage.getItem(SAVE_KEY)], { type: "application/json" }), a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "almojarife-save.json"; a.click(); URL.revokeObjectURL(a.href); };
  $("t-imp").onclick = () => $("t-file").click();
  $("t-file").onchange = async (e) => { try { const f = e.target.files[0]; const r = unpackGame(JSON.parse(await f.text()), world); g = r.g; company = r.company; autosave(); sel = 0; render(); el.hidden = true; } catch { $("t-msg").textContent = t.badSave; } };
}
start(null, false); // background game behind the title screen; it never overwrites a save
showTitle();
requestAnimationFrame(frame);
