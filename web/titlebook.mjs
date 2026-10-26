// Title screen "merchant's ledger": open book on a walnut desk. Markup and CSS (web/index.html, #title .tbroot) come from the
// reviewed title exploration; artwork is the game's own map and sprites plus inline SVG. Real save data only, no sample content.
import { START_YEAR } from "../src/sim/clock.mjs";
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ROMAN = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
export const roman = (n) => ROMAN.reduce((o, [v, r]) => { while (n >= v) { o += r; n -= v; } return o; }, "");
export const TB = {
 "es": {
  "deskTitle": "El oficio de prosperar",
  "deskSubtitle": "Puertos, fortuna y buen nombre.",
  "deskPlatform": "Juego de escritorio · teclado y ratón",
  "bookLabel": "El libro del mercader",
  "leftRunning": "De los puertos y sus gentes",
  "subtitle": "Una vida entre el mar y el comercio",
  "harborAlt": "Lámina de un puerto mercantil: casas, muelle y velero sobre una carta de la península ibérica.",
  "plateLabel": "La bahía de Cádiz",
  "caption": "Carta de una ambición · Cádiz, {year}",
  "invitation": "Donde hay un puerto,\nhay un porvenir.",
  "motto": "Por mar, con buen viento.\nEn tierra, con buen nombre.",
  "rightRunning": "Registro de la casa mercantil",
  "folio": "Folio II",
  "chapter": "A la atención del mercader",
  "ledgerTitle": "Tu libro de cuentas",
  "ledgerSubtitle": "Toda fortuna empieza con una primera línea.",
  "lastSave": "Última partida",
  "emptyTitle": "La primera página está en blanco.",
  "emptyDescription": "Tu casa mercantil está por fundar.",
  "menuLabel": "Partidas",
  "start": "Empezar",
  "startHint": "Funda tu casa. Escribe tu historia.",
  "startSafe": "Un nuevo comienzo, con copia de la partida actual.",
  "continue": "Continuar",
  "continueHint": "Retoma el rumbo donde lo dejaste.",
  "continueEmpty": "Aún no hay una partida guardada.",
  "archive": "El archivo de la casa",
  "import": "Importar",
  "export": "Exportar",
  "slots": "Ranuras de guardado",
  "restore": "Restaurar copia previa",
  "restoreEmpty": "No hay copia previa disponible.",
  "restoreHint": "Copia del día {day} · {house}",
  "pageNote": "Un libro bien guardado es un viaje que continúa.",
  "credits": "Créditos",
  "language": "Idioma"
 },
 "en": {
  "deskTitle": "The art of prosperity",
  "deskSubtitle": "Harbours, fortune and a good name.",
  "deskPlatform": "A desktop game · keyboard and mouse",
  "bookLabel": "The merchant’s book",
  "leftRunning": "Of harbours and their people",
  "subtitle": "A life of seafaring and trade",
  "harborAlt": "An illustrated trading harbour: houses, a stone quay and a sailing boat over a chart of the Iberian peninsula.",
  "plateLabel": "The bay of Cádiz",
  "caption": "A chart of ambition · Cádiz, {year}",
  "invitation": "Where there is a harbour,\nthere is a future.",
  "motto": "At sea, a fair wind.\nOn land, a good name.",
  "rightRunning": "Register of the merchant house",
  "folio": "Folio II",
  "chapter": "To the attention of the merchant",
  "ledgerTitle": "Your merchant’s ledger",
  "ledgerSubtitle": "Every fortune begins with a first entry.",
  "lastSave": "Last saved game",
  "emptyTitle": "The first page is still unwritten.",
  "emptyDescription": "Your merchant house awaits its founding.",
  "menuLabel": "Saved games",
  "start": "Start",
  "startHint": "Found your house. Write your story.",
  "startSafe": "A fresh start, with a copy of your current game.",
  "continue": "Continue",
  "continueHint": "Pick up your voyage where you left off.",
  "continueEmpty": "There is no saved game yet.",
  "archive": "The house archives",
  "import": "Import",
  "export": "Export",
  "slots": "Save slots",
  "restore": "Restore previous copy",
  "restoreEmpty": "No previous copy is available.",
  "restoreHint": "Copy from day {day} · {house}",
  "pageNote": "A well-kept ledger is a voyage that continues.",
  "credits": "Credits",
  "language": "Language"
 }
};

const DEFS = `<svg class="definitions" aria-hidden="true">
    <defs>
      <filter id="paper-grain"><feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
      <filter id="wood-grain"><feTurbulence type="fractalNoise" baseFrequency=".014 .38" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
      <linearGradient id="brass" x2="1" y2="1"><stop stop-color="#e3bc68"/><stop offset=".3" stop-color="#83602e"/><stop offset=".6" stop-color="#be9b53"/><stop offset="1" stop-color="#574020"/></linearGradient>
      <symbol id="merchant-mark" viewBox="0 0 40 48">
        <path d="M5 4h30v24c0 8-8 13-15 17C13 41 5 36 5 28Z" fill="none" stroke="currentColor" stroke-width="1.2"/>
        <path d="M20 10v25m-9-18h18M13 17l-5 10h10Zm14 0-5 10h10ZM8 28q5 4 10 0m4 0q5 4 10 0m-18 8h12" fill="none" stroke="currentColor" stroke-width="1.1"/>
        <circle cx="20" cy="12" r="2" fill="currentColor"/>
      </symbol>
      <symbol id="flourish" viewBox="0 0 30 18"><path d="M1 9h24m-7-5 7 5-7 5M4 6l3 3-3 3" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="28" cy="9" r="1" fill="currentColor"/></symbol>
    </defs>
  </svg>
  `;
const OBJ1 = `<div class="desk-object candle" aria-hidden="true">
        <svg viewBox="0 0 84 164">
          <defs><linearGradient id="candle-wax"><stop stop-color="#96733f"/><stop offset=".35" stop-color="#ecdaa0"/><stop offset=".7" stop-color="#d3b67a"/><stop offset="1" stop-color="#a57b43"/></linearGradient><radialGradient id="candle-flame"><stop stop-color="#fff5c4"/><stop offset=".6" stop-color="#f4c05e"/><stop offset="1" stop-color="#d4843266"/></radialGradient></defs>
          <ellipse cx="42" cy="149" rx="38" ry="12" fill="#382a18" stroke="#947446"/>
          <ellipse cx="42" cy="145" rx="32" ry="9" fill="#8e6e3d"/><path d="M27 143V55h29v88q-14 9-29 0" fill="url(#candle-wax)"/>
          <ellipse cx="41.5" cy="55" rx="14.5" ry="5" fill="#ead49e"/><path d="M29 57v37q4 7 5 0V68q5-2 5 5v10q6 5 6-3V60" fill="#ddc38c"/>
          <path d="m42 56 1-11" stroke="#372315" stroke-width="2"/><path class="flame" d="M43 49C23 43 36 25 42 12c-2 18 18 23 1 37" fill="url(#candle-flame)"/>
          <ellipse cx="42" cy="146" rx="17" ry="3" fill="#b29156" opacity=".6"/>
        </svg>
      </div>

      `;
const OBJ2 = `<svg class="desk-object quill" viewBox="0 0 146 318" aria-hidden="true">
        <defs><linearGradient id="feather" x2="1" y2=".5"><stop stop-color="#a79266"/><stop offset=".5" stop-color="#e6d9b3"/><stop offset=".8" stop-color="#f4e7bf"/><stop offset="1" stop-color="#ad9567"/></linearGradient><linearGradient id="inkpot"><stop stop-color="#181d1a"/><stop offset=".4" stop-color="#454b3b"/><stop offset=".7" stop-color="#252c23"/><stop offset="1" stop-color="#141a16"/></linearGradient></defs>
        <path d="M52 281q-11 5-10 20l6 10q22 11 45-1l4-11q-1-15-12-18Z" fill="url(#inkpot)" stroke="#131712"/>
        <ellipse cx="69" cy="281" rx="18" ry="7" fill="#8f7c4e"/><ellipse cx="69" cy="280" rx="12" ry="4" fill="#101611"/>
        <path d="M66 264C68 215 50 161 60 103 67 63 105 13 130 3c-8 23 4 60-13 88l-13 8 9-1c-12 32-20 32-25 52l-10 7 6 1c-9 32-12 63-18 106Z" fill="url(#feather)"/>
        <path d="M66 279C69 202 73 129 126 14" fill="none" stroke="#826e46" stroke-width="1.3"/>
        <g fill="none" stroke="#8b785341" stroke-width=".8"><path d="m70 217-8-28m11 14 10-33m-9 10-14-36m18 17 15-39m-13 20-18-32m22 16 20-32m-17 18L74 78m20 22 24-32M97 89 88 54m16 22 19-29m-13 13-4-31"/></g>
        <path d="M46 296q8 8 12 5" fill="none" stroke="#d9d0a2" opacity=".2" stroke-width="2"/>
      </svg>
      <svg class="desk-object coins" viewBox="0 0 140 77" aria-hidden="true">
        <g fill="url(#brass)" stroke="#b49754"><ellipse cx="34" cy="52" rx="24" ry="12"/><ellipse cx="34" cy="49" rx="24" ry="12"/><ellipse cx="34" cy="46" rx="24" ry="12"/><ellipse cx="34" cy="43" rx="24" ry="12"/><ellipse cx="34" cy="40" rx="24" ry="12"/><ellipse cx="79" cy="57" rx="24" ry="12"/><ellipse cx="79" cy="54" rx="24" ry="12"/><ellipse cx="112" cy="28" rx="23" ry="12" transform="rotate(-20 112 28)"/></g>
        <g fill="none" stroke="#665029" stroke-width="1"><ellipse cx="34" cy="40" rx="19" ry="8"/><ellipse cx="79" cy="54" rx="19" ry="8"/><ellipse cx="112" cy="28" rx="18" ry="8" transform="rotate(-20 112 28)"/><path d="M27 40h14m-7-6v12m38 8h14m-7-6v12m26-30 13-4m-9-2 4 9"/></g>
      </svg>
    `;
const entry = (id, idx, label, hint, cls = "") => `<button type="button" class="menu-entry${cls}" id="${id}"${hint?.dis ? " disabled" : ""}><span class="entry-index" aria-hidden="true">${idx}</span><span class="menu-copy"><span class="menu-label">${esc(label)}</span>${hint?.text ? `<small>${esc(hint.text)}</small>` : ""}</span><svg class="entry-flourish" aria-hidden="true"><use href="#flourish"/></svg></button>`;
/** Builds the whole title overlay. saved: {house, day, coins} | null; backup: {house, day} | null (a previous copy exists). */
export function titleBookHtml({ lang, saved, backup, dayLabel, coinsLabel }) {
  const x = TB[lang], YR = roman(START_YEAR), n = { i: 0 }, idx = () => roman(++n.i);
  const langNav = `<nav class="languages" aria-label="${esc(x.language)}"><button type="button" ${lang === "es" ? "aria-pressed=\"true\"" : "id=\"t-lang\" aria-pressed=\"false\""} data-lang="es" lang="es" aria-label="Español">ES</button><span aria-hidden="true">/</span><button type="button" ${lang === "en" ? "aria-pressed=\"true\"" : "id=\"t-lang\" aria-pressed=\"false\""} data-lang="en" lang="en" aria-label="English">EN</button></nav>`;
  const start = entry("t-start", "@S", x.start, saved ? null : { text: x.startHint }, saved ? "" : " primary");
  const cont = entry("t-cont", "@C", x.continue, { text: saved ? x.continueHint : x.continueEmpty, dis: !saved }, saved ? " primary" : "");
  const first = saved ? [cont, start] : [start, cont];
  const menu = first.map((h) => h.replace(/@[SC]/, idx())).join("") + `<div class="menu-divider">${esc(x.archive)}</div>` +
    entry("t-imp", idx(), x.import, null, " utility") + entry("t-exp", idx(), x.export, { dis: !saved }, " utility") +
    entry("t-slots", idx(), x.slots, null, " utility") +
    entry("t-rest", idx(), x.restore, { text: backup ? x.restoreHint.replace("{day}", backup.day).replace("{house}", backup.house) : x.restoreEmpty, dis: !backup }, " utility") +
    entry("t-cred", idx(), x.credits, null, " utility");
  const card = saved
    ? `<div class="save-card" id="save-card"><div class="save-heading"><span class="small-caps">${esc(x.lastSave)}</span><svg aria-hidden="true"><use href="#merchant-mark"/></svg></div><h3 class="house-name">${esc(saved.house)}</h3><div class="save-stats"><span>${esc(dayLabel)}</span><span>${esc(coinsLabel)}</span></div></div>`
    : `<div class="empty-save" id="empty-save"><svg aria-hidden="true"><use href="#merchant-mark"/></svg><div><p>${esc(x.emptyTitle)}</p><small>${esc(x.emptyDescription)}</small></div></div>`;
  const LEFT = `<section class="page left-page" aria-labelledby="game-title">
          <div class="running-head"><span data-i18n="leftRunning">De los puertos y sus gentes</span><span class="anno">Anno ${YR}</span></div>
          <header class="title-block">
            <div class="title-pre" aria-hidden="true">EL</div>
            <h1 id="game-title" aria-label="El Almojarife">Almojarife</h1>
            <p data-i18n="subtitle">Una vida entre el mar y el comercio</p>
          </header>
          <figure class="harbor">
            <div class="plate" role="img" aria-label="Lámina de un puerto mercantil: casas, muelle y velero sobre una carta de la península ibérica." data-i18n-aria="harborAlt">
              <img class="atlas" src="../assets/map/background.webp" alt="">
              <svg class="harbor-lines" viewBox="0 0 440 258" preserveAspectRatio="none" aria-hidden="true">
                <defs><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#a8b6a0" stop-opacity=".1"/><stop offset=".4" stop-color="#83a49a" stop-opacity=".86"/><stop offset="1" stop-color="#5f8880" stop-opacity=".95"/></linearGradient><pattern id="ripples" width="61" height="17" patternUnits="userSpaceOnUse"><path d="M3 4h19m8 7h26M9 15h7" stroke="#e0dcb6" stroke-width=".6" opacity=".4"/></pattern></defs>
                <path d="M0 97q68-30 121 6t109 2 210-20v173H0Z" fill="#b3b696" opacity=".5"/>
                <path d="M0 119q65-17 127-4t138-1 175-15v159H0Z" fill="url(#sea)"/>
                <path d="M0 151q87-27 165-8t275-8v123H0Z" fill="url(#ripples)"/>
                <g fill="none" stroke="#e5dab1" stroke-width=".7" opacity=".55"><path d="M0 222 440 66M35 258 279 0M0 15l440 232M3 78l437 80"/><path d="M83 208q115-94 269-17" stroke="#4e6657" stroke-dasharray="4 4"/></g>
                <g fill="none" stroke="#53604a" stroke-width="1" opacity=".6"><path d="m295 51 5-3 4 3m16 8 5-3 5 2m-25 4 3-2 4 2M48 74l3-2 3 2"/></g>
              </svg>
              <div class="harbor-town" aria-hidden="true">
                <img class="chapel" src="city2d/assets/capilla-1.webp" alt="" width="512" height="512">
                <img class="warehouse" src="city2d/assets/warehouse-1.webp" alt="" width="512" height="512">
                <img class="merchant-house" src="city2d/assets/house_rich-1.webp" alt="" width="512" height="512">
                <img class="quay" src="city2d/assets/muelle.webp" alt="" width="512" height="512">
                <img class="ship" src="city2d/assets/barco.webp" alt="" width="512" height="512">
              </div>
              <span class="plate-label" aria-hidden="true" data-i18n="plateLabel">La bahía de Cádiz</span>
              <span class="plate-number" aria-hidden="true">I · ${YR}</span>
            </div>
            <figcaption data-i18n="caption">Carta de una ambición · Cádiz, 1475</figcaption>
          </figure>
          <p class="invitation" data-i18n="invitation">Donde hay un puerto,<br>hay un porvenir.</p>
          <div class="left-colophon">
            <p class="motto" data-i18n="motto">Por mar, con buen viento.<br>En tierra, con buen nombre.</p>
            <div class="wax-seal" aria-hidden="true"><svg><use href="#merchant-mark"/></svg></div>
          </div>
          <span class="page-number" aria-hidden="true">I</span>
        </section>`;
  const fill = (h) => h.replace(/ data-i18n="(\w+)"([^>]*)>([^<]*(?:<br>[^<]*)?)</g, (m, k, rest, txt) => ` ${rest}>${esc(x[k] ?? "").replace(/\n/g, "<br>").replace("{year}", START_YEAR)}<`)
    .replace(/aria-label="[^"]*" data-i18n-aria="(\w+)"/g, (m, k) => `aria-label="${esc(x[k] ?? "")}"`);
  return fill(`<div class="tbroot" lang="${lang}">${DEFS}<div class="desk"><header class="desk-header">
      <div class="desk-signature">
        <svg aria-hidden="true"><use href="#merchant-mark"/></svg>
        <div><span class="small-caps" data-i18n="deskTitle">El oficio de prosperar</span><small data-i18n="deskSubtitle">Puertos, fortuna y buen nombre.</small><small data-i18n="deskPlatform">Juego de escritorio · teclado y ratón</small></div>
      </div>
      ${langNav}
    </header>` +
    `<div class="stage">${OBJ1}<article class="book" aria-label="${esc(x.bookLabel)}"><div class="ribbon" aria-hidden="true"></div>${LEFT}` +
    `<section class="page right-page" aria-labelledby="ledger-title"><div class="running-head"><span>${esc(x.rightRunning)}</span><span>${esc(x.folio)}</span></div>` +
    `<header class="chapter"><span class="small-caps">${esc(x.chapter)}</span><h2 id="ledger-title">${esc(x.ledgerTitle)}</h2><p>${esc(x.ledgerSubtitle)}</p></header>` +
    `${card}<nav class="menu" id="menu" aria-label="${esc(x.menuLabel)}">${menu}</nav><input type="file" id="t-file" accept="application/json,.json" hidden>` +
    `<p class="status" id="t-msg" role="alert"></p><p class="page-footnote">${esc(x.pageNote)}</p><span class="page-number" aria-hidden="true">II</span></section></article>${OBJ2}</div></div></div>`);
}
