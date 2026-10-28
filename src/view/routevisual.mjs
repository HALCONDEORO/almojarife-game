// Presentation only: callers retain ownership of route validity and geometry.
const styles = Object.freeze({
  network: Object.freeze({ stroke: "#514b3f", width: 1.5, opacity: 0.22, dash: "4 3" }),
  active: Object.freeze({ stroke: "#205c53", width: 3, opacity: 1, dash: "none" }),
  automatic: Object.freeze({ stroke: "#205c53", width: 2, opacity: 0.85, dash: "none" }),
  preview: Object.freeze({ stroke: "#205c53", width: 2.5, opacity: 0.9, dash: "7 5" }),
  invalid: Object.freeze({ stroke: "#b3261e", width: 2.5, opacity: 1, dash: "3 3" }),
});
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[c]);

export function routeStyle(kind) {
  if (!Object.hasOwn(styles, kind)) throw new RangeError("Unknown route style");
  return styles[kind];
}

export function routeStrokeAttrs(kind) {
  const s = routeStyle(kind);
  return `stroke="${s.stroke}" stroke-width="${s.width}" stroke-opacity="${s.opacity}" stroke-dasharray="${s.dash}"`;
}

export function routeLineSvg(points, kind) {
  return `<polyline points="${escapeHtml(points)}" fill="none" ${routeStrokeAttrs(kind)} vector-effect="non-scaling-stroke" pointer-events="none"/>`;
}

const text = {
  es: ["Rutas del mapa", "Red tenue", "Viaje activo: verde continuo", "Automática: verde fino", "Plan: verde discontinuo", "No válida: rojo"],
  en: ["Map routes", "Faint network", "Active voyage: solid green", "Automatic: thin green", "Plan: dashed green", "Invalid: red"],
};

export function routeLegendHtml(lang = "es") {
  const [title, ...labels] = text[lang === "en" ? "en" : "es"];
  return `<section aria-label="${escapeHtml(title)}" style="min-width:0;max-width:100%;box-sizing:border-box;font-size:12px;line-height:1.4;overflow-wrap:anywhere"><strong>${escapeHtml(title)}</strong><ul style="list-style:none;margin:2px 0;padding:0">` +
    Object.keys(styles).map((kind, i) => `<li><svg width="28" height="10" viewBox="0 0 28 10" aria-hidden="true" focusable="false" style="width:28px;height:10px;background:none;vertical-align:middle;max-width:100%"><path d="M1 5H27" ${routeStrokeAttrs(kind)}/></svg> ${escapeHtml(labels[i])}</li>`).join("") +
    `</ul></section>`;
}
