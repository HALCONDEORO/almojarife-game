// Mood layers drawn over the map: a seasonal colour wash and slow cloud shadows. Own artwork, in code.
import { seasonOf } from "../sim/market.mjs";
const TINT = { winter: ["#8fb0d8", 0.14], spring: ["#9fd09a", 0.07], summer: ["#ffd98a", 0.10], autumn: ["#d98a3a", 0.12] };
/** Colour wash for a game day: {season, color, opacity}. */
export function seasonTint(day) { const s = seasonOf(day), [color, opacity] = TINT[s]; return { season: s, color, opacity }; }
/**
 * SVG layer for a W x H map. `motion` false (reduced motion) draws the clouds still.
 * Clouds are soft ellipses whose positions come from the day, so a saved game looks the same on reload.
 */
export function atmosphereSvg(W, H, day, motion = true) {
  const t = seasonTint(day);
  let s = `<g id="atmo" pointer-events="none"><rect width="${W}" height="${H}" fill="${t.color}" opacity="${t.opacity}"/>`;
  const n = t.season === "winter" || t.season === "autumn" ? 5 : 3; // more cloud in the cold months
  for (let i = 0; i < n; i++) {
    const cy = ((i * 0.37 + day * 0.013) % 1) * H * 0.9 + 20, cx = ((i * 0.61 + day * 0.007) % 1) * W, rx = 70 + (i * 23) % 50, ry = 18 + (i * 11) % 14;
    s += `<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${rx}" ry="${ry}" fill="#223" opacity=".07">` + (motion ? `<animate attributeName="cx" values="${(cx - 30).toFixed(0)};${(cx + 30).toFixed(0)};${(cx - 30).toFixed(0)}" dur="${90 + i * 17}s" repeatCount="indefinite"/>` : "") + `</ellipse>`;
  }
  return s + `</g>`;
}
