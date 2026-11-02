/** Escape a string for HTML text and double-quoted attribute contexts. Shared by web/main.mjs and the view modules. */
export const esc = (raw) => String(raw ?? "").replace(/[&<>"]/g, (chr) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[chr]));
