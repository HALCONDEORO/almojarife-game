// Settings window markup: sections for language, game, accessibility, data and help.
// Pure (strings in, string out) so the layout is testable without a DOM.
import { settingsIcon } from "./settingsicons.mjs";

/** Real, verified page for the in-repo wiki (the GitHub Wiki tab is not enabled and redirects to the repo home). */
export const HELP_URL = "https://github.com/HALCONDEORO/almojarife-game/tree/main/docs/wiki";
export const helpUrl = lang => lang === "es" ? `${HELP_URL}/es` : HELP_URL;

const section = (icon, title, body) =>
  `<section class="st-sec">${`<h3 class="st-h">${settingsIcon(icon)}<span>${title}</span></h3>`}${body}</section>`;

/**
 * @param t   language table (needs the st* keys)
 * @param s   { lang, speed, automaticTime, large, reduceMotion, inGame, tutReplay }
 */
export function settingsHtml(t, s) {
  const row = (label, control) => `<div class="st-row"><span class="st-lbl">${label}</span>${control}</div>`;
  const chk = (input, label) => `<label class="st-row st-chk">${input} <span class="st-lbl">${label}</span></label>`;
  const vol = (id, label, v = 100) => `<label class="st-row st-vol"><span class="st-lbl">${label}</span><input id="${id}" type="range" min="0" max="100" step="5" value="${v}" aria-label="${label}"></label>`;
  const ck = (on) => (on ? "checked" : "");
  const body =
    section("language", t.stSecLang, row(t.lang2, `<button id="st-lang">${s.lang === "es" ? "EN" : "ES"}</button>`) + `<p class="st-hint">${t.stLangHint}</p>`) +
    section("game", t.stSecGame, row(t.speedDef, `<button id="st-spd">${s.speed}x</button>`) + chk(`<input id="st-auto" type="checkbox" ${ck(s.automaticTime)}>`, t.stAuto) + chk(`<input id="st-sound" type="checkbox" ${ck(s.sound)}>`, t.stSound) + vol("st-vol-sfx", t.stVolSfx, s.vol?.sfx) + vol("st-vol-music", t.stVolMusic, s.vol?.music) + vol("st-vol-amb", t.stVolAmb, s.vol?.amb) + `<p class="st-hint">${t.stSoundKey}</p>` + `<p class="st-hint">${t.stAutoHint}</p>`) +
    section("access", t.stSecAccess, row(t.stText, `<button id="st-text" aria-pressed="${s.large}">${s.large ? t.stLarge : t.stNormal}</button>`) + chk(`<input id="st-motion" type="checkbox" ${ck(s.reduceMotion)}>`, t.stMotion)) +
    section("data", t.stSecData, `<p class="st-hint">${t.stNote}</p>` + (s.inGame ? `<div class="st-row"><button id="st-exp">${t.exportS}</button> <span id="st-msg" role="status"></span></div>` : "")) +
    section("help", t.stSecHelp, `<p class="st-hint">${t.keys}</p><div class="st-row"><a id="st-help" href="${helpUrl(s.lang)}" target="_blank" rel="noopener noreferrer">${t.stHelpLink}</a></div>` + (s.tutReplay ? `<div class="st-row"><button id="st-tut" title="${t.tutReplayTitle}" aria-label="${t.tutReplayTitle}">${t.tutReplay}</button></div>` : ""));
  return `<div class="box pausemenu st-win"><div class="pausemenu-handle"><h2>${t.stTitle}</h2></div><div class="pausemenu-body st-body">${body}<p><button id="st-back">${t.back}</button></p></div></div>`;
}
