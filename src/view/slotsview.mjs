// Save-slots window markup (pure strings) and its texts.
export const SLOT_TEXT = {
  es: { title: "Ranuras de guardado", slot: "Ranura", empty: "Vacía", corrupt: "Dañada: no se puede cargar", day: "Día", coins: "monedas", save: "Guardar aquí", load: "Cargar", del: "Borrar", back: "Atrás",
    hint: "Tres ranuras propias, aparte del guardado automático. Cargar parte tu partida actual como copia de seguridad.",
    confirmOver: "¿Sobrescribir la ranura {n}?", confirmLoad: "¿Cargar la ranura {n}? La partida actual pasará a ser la copia de seguridad.", confirmDel: "¿Borrar la ranura {n}? No se puede deshacer.",
    saved: "Guardada en la ranura {n}.", loaded: "Ranura {n} cargada.", deleted: "Ranura {n} borrada.", err: "No se pudo completar: no se ha cambiado nada.", noGame: "Empieza o continúa una partida para guardar en una ranura." },
  en: { title: "Save slots", slot: "Slot", empty: "Empty", corrupt: "Damaged: cannot be loaded", day: "Day", coins: "coins", save: "Save here", load: "Load", del: "Delete", back: "Back",
    hint: "Three slots of your own, apart from the autosave. Loading keeps your current game as the safety copy.",
    confirmOver: "Overwrite slot {n}?", confirmLoad: "Load slot {n}? The current game becomes the safety copy.", confirmDel: "Delete slot {n}? This cannot be undone.",
    saved: "Saved to slot {n}.", loaded: "Slot {n} loaded.", deleted: "Slot {n} deleted.", err: "Could not finish: nothing was changed.", noGame: "Start or continue a game to save into a slot." },
};
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** slots: output of listSlots; opts: { lang, inGame, fmt, defCo } */
export function slotsHtml(slots, { lang, inGame, fmt = String, defCo = "" }) {
  const x = SLOT_TEXT[lang] ?? SLOT_TEXT.es;
  const rows = slots.map((s) => {
    const info = s.state === "empty" ? x.empty : s.state === "corrupt" ? x.corrupt : `${esc(s.house || defCo)} · ${x.day} ${esc(s.day)} · ${esc(fmt(s.cash))} ${x.coins}`;
    return `<div class="sl-row" data-slot="${s.n}"><div class="sl-info"><b>${x.slot} ${s.n}</b><span class="sl-meta">${info}</span></div><div class="sl-btns">` +
      `<button data-sl-save="${s.n}" ${inGame ? "" : "disabled"}>${x.save}</button>` +
      `<button data-sl-load="${s.n}" ${s.state === "ok" ? "" : "disabled"}>${x.load}</button>` +
      `<button data-sl-del="${s.n}" ${s.state === "empty" ? "disabled" : ""}>${x.del}</button></div></div>`;
  }).join("");
  return `<div class="box pausemenu sl-win"><div class="pausemenu-handle"><h2>${x.title}</h2></div><div class="pausemenu-body sl-body">${rows}<p class="sl-hint">${x.hint}${inGame ? "" : " " + x.noGame}</p><p><span id="sl-msg" role="status"></span></p><p><button id="sl-back">${x.back}</button></p></div></div>`;
}
