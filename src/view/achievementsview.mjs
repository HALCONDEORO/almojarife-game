// Achievements in the House panel: earned milestones and the ones still ahead. View only: no game rules.
import { ACHIEVEMENTS } from "../game/achievements.mjs";
const T = {
  es: { title: "Logros", count: "{n} de {m}", day: "día {d}", locked: "Por conseguir" },
  en: { title: "Achievements", count: "{n} of {m}", day: "day {d}", locked: "Not yet earned" },
};
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export function achievementsHtml(g, lang) {
  const t = T[lang] ?? T.es, got = g.achievements?.unlocked ?? {}, n = ACHIEVEMENTS.filter((a) => got[a.id] != null).length;
  // Reuses the perk-card styling: earned milestones at full ink, the ones ahead faded.
  return `<h4>${t.title} <small>${t.count.replace("{n}", n).replace("{m}", ACHIEVEMENTS.length)}</small></h4>`
    + `<div class="of-perks of-achv">` + ACHIEVEMENTS.map((a) => { const d = got[a.id], L = a[lang] ?? a.es;
      return `<div class="of-card"${d != null ? "" : ' style="opacity:.55"'}><small>${d != null ? t.day.replace("{d}", d) : t.locked}</small><b>${esc(L.name)}.</b> ${esc(L.desc)}</div>`; }).join("") + `</div>`;
}
