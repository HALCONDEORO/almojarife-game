// Achievements in the House panel: earned milestones and the ones still ahead. View only: no game rules.
import { ACHIEVEMENTS } from "../game/achievements.mjs";
const TEXT = {
  es: { title: "Logros", count: "{n} de {m}", day: "día {d}", locked: "Por conseguir" },
  en: { title: "Achievements", count: "{n} of {m}", day: "day {d}", locked: "Not yet earned" },
};
const esc = (raw) => String(raw ?? "").replace(/[&<>"]/g, (chr) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[chr]));
export function achievementsHtml(game, lang) {
  const ui = TEXT[lang] ?? TEXT.es, got = game.achievements?.unlocked ?? {};
  const done = ACHIEVEMENTS.filter((ach) => got[ach.id] != null).length;
  const count = ui.count.replace("{n}", done).replace("{m}", ACHIEVEMENTS.length);
  // Reuses the perk-card styling: earned milestones at full ink, the ones ahead faded.
  const cards = ACHIEVEMENTS.map((ach) => {
    const day = got[ach.id], label = ach[lang] ?? ach.es;
    const status = day != null ? ui.day.replace("{d}", day) : ui.locked;
    return `<div class="of-card"${day != null ? "" : ' style="opacity:.55"'}><small>${status}</small><b>${esc(label.name)}.</b> ${esc(label.desc)}</div>`;
  }).join("");
  return `<h4>${ui.title} <small>${count}</small></h4><div class="of-perks of-achv">${cards}</div>`;
}
