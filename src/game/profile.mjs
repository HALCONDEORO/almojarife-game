// Player profile: character, house colours, coat of arms, home port and background.
// Pure data and SVG-string builders (no DOM), so they can be tested. All art here is original work.
import { cleanCompany } from "./gamesave.mjs";

export const PALETTE = ["#8a1c1c", "#1f4e8c", "#2f6b3a", "#c9962a", "#4b2a6b", "#222222", "#e8e0cc", "#b4571e"];
export const DIVISIONS = ["plain", "pale", "fess", "chevron", "cross"];
export const CHARGES = ["star", "tower", "ship", "anchor", "sun", "wheat"];
export const SHIELDS = ["heater", "round"];
export const PORTRAITS = 8;
// Backgrounds change the start a little. Kept small and simple.
export const BACKGROUNDS = {
  merchant: { cash: 300, upkeepMul: 1 },   // a merchant's child: a bit more starting money
  seafarer: { cash: 0, upkeepMul: 0.85 },  // knows ships: cheaper ship upkeep
  scholar: { cash: 150, upkeepMul: 0.95 }, // letters and numbers: a little of both
};
export const NAMES = { es: { merchant: "Hijo de mercader", seafarer: "Marino", scholar: "Letrado" }, en: { merchant: "Merchant's child", seafarer: "Seafarer", scholar: "Scholar" } };

export const defaultProfile = (company = "") => ({
  company: cleanCompany(company), character: "", portrait: 0,
  crest: { shield: "heater", division: "pale", charge: "star", c1: PALETTE[0], c2: PALETTE[3] },
  home: "cadiz", background: "merchant",
});
const pick = (v, list, d) => (list.includes(v) ? v : d);
const color = (v, d) => (PALETTE.includes(v) ? v : d);
export function cleanProfile(p, cityIds = ["cadiz"]) {
  const d = defaultProfile(), c = p?.crest ?? {};
  return {
    company: cleanCompany(p?.company), character: cleanCompany(p?.character), portrait: Number.isInteger(p?.portrait) && p.portrait >= 0 && p.portrait < PORTRAITS ? p.portrait : 0,
    crest: { shield: pick(c.shield, SHIELDS, d.crest.shield), division: pick(c.division, DIVISIONS, d.crest.division), charge: pick(c.charge, CHARGES, d.crest.charge), c1: color(c.c1, d.crest.c1), c2: color(c.c2, d.crest.c2) },
    home: pick(p?.home, cityIds, cityIds[0]), background: pick(p?.background, Object.keys(BACKGROUNDS), d.background),
  };
}
export const startBonus = (p) => BACKGROUNDS[p.background] ?? BACKGROUNDS.merchant;

const SHIELD_PATH = { heater: "M5 5h90v50c0 34-24 52-45 62C29 107 5 89 5 55z", round: "M50 6a44 44 0 1 0 .01 0z" };
const light = (hex) => hex === "#e8e0cc" || hex === "#c9962a";
const CHARGE_SVG = (kind, fill) => ({
  star: `<path d="M50 28l7 17 18 1-14 11 5 18-16-10-16 10 5-18-14-11 18-1z" fill="${fill}"/>`,
  tower: `<path d="M34 80V50h6v-6h6v6h8v-6h6v6h6v30z" fill="${fill}"/><rect x="45" y="62" width="10" height="18" fill="#0006"/>`,
  ship: `<path d="M30 66h40l-6 14H36z" fill="${fill}"/><path d="M50 36v30M50 38l16 22H50zM48 44l-14 16h14z" fill="${fill}" stroke="${fill}" stroke-width="1.5"/>`,
  anchor: `<circle cx="50" cy="38" r="5" fill="none" stroke="${fill}" stroke-width="4"/><path d="M50 43v38M38 52h24M30 68c4 12 16 14 20 14s16-2 20-14" fill="none" stroke="${fill}" stroke-width="4" stroke-linecap="round"/>`,
  sun: `<circle cx="50" cy="55" r="12" fill="${fill}"/><g stroke="${fill}" stroke-width="4" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path transform="rotate(${a} 50 55)" d="M50 36v-8"/>`).join("")}</g>`,
  wheat: `<path d="M50 84V40" stroke="${fill}" stroke-width="3"/><g fill="${fill}">${[[50, 36, 0], [40, 46, -35], [60, 46, 35], [40, 62, -35], [60, 62, 35]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="8" transform="rotate(${r} ${x} ${y})"/>`).join("")}</g>`,
}[kind] ?? "");
/** Coat of arms as an SVG string (viewBox 0 0 100 120). */
export function crestSvg(crest, size = 48, id = "c") {
  const { shield, division, charge, c1, c2 } = crest, path = SHIELD_PATH[shield] ?? SHIELD_PATH.heater, cid = `cl-${id}`;
  const div = { plain: "", pale: `<rect x="50" y="0" width="50" height="120" fill="${c2}"/>`, fess: `<rect x="0" y="60" width="100" height="60" fill="${c2}"/>`,
    chevron: `<path d="M0 120L50 50l50 70v-30L50 20 0 90z" fill="${c2}"/>`, cross: `<path d="M42 0h16v120H42zM0 46h100v16H0z" fill="${c2}"/>` }[division] ?? "";
  const chargeFill = division === "plain" || division === "cross" || division === "chevron" ? (light(c1) ? "#222" : "#f4ead0") : light(c1) && light(c2) ? "#222" : "#f4ead0";
  return `<svg class="crest" role="img" aria-label="crest" width="${size}" height="${Math.round(size * 1.2)}" viewBox="0 0 100 120"><defs><clipPath id="${cid}"><path d="${path}"/></clipPath></defs>` +
    `<g clip-path="url(#${cid})"><rect width="100" height="120" fill="${c1}"/>${div}${CHARGE_SVG(charge, chargeFill)}</g><path d="${path}" fill="none" stroke="#3a2a14" stroke-width="4"/></svg>`;
}
const SKIN = ["#e3b98f", "#c68d5f", "#8d5a3a"], HAT = ["cap", "hood", "feather", "bare"];
/** Portrait as an SVG string (viewBox 0 0 80 80). `cloth` is the house colour for the clothes. */
export function portraitSvg(i, cloth = "#1f4e8c", size = 64) {
  const skin = SKIN[i % 3], hat = HAT[Math.floor(i / 3) % 4] ?? "bare", hair = ["#3b2a1a", "#6b4a22", "#222", "#a9a9a9"][i % 4];
  const head = {
    cap: `<path d="M22 34c0-14 36-14 36 0z" fill="${cloth}"/><rect x="20" y="33" width="40" height="5" rx="2" fill="#0003"/>`,
    hood: `<path d="M18 46c0-24 12-30 22-30s22 6 22 30c-6-8-10-12-22-12s-16 4-22 12z" fill="${cloth}"/>`,
    feather: `<path d="M22 34c0-14 36-14 36 0z" fill="#222"/><path d="M52 24c8-10 14-8 16-6-6 2-8 8-12 14z" fill="#b4571e"/>`,
    bare: `<path d="M22 36c0-16 36-16 36 0c-4-6-10-8-18-8s-14 2-18 8z" fill="${hair}"/>`,
  }[hat];
  return `<svg class="portrait" role="img" aria-label="portrait ${i + 1}" width="${size}" height="${size}" viewBox="0 0 80 80"><rect width="80" height="80" rx="8" fill="#d9c79c"/>` +
    `<path d="M10 80c2-18 14-24 30-24s28 6 30 24z" fill="${cloth}"/><circle cx="40" cy="38" r="15" fill="${skin}"/>${head}` +
    `<circle cx="34.5" cy="40" r="1.6" fill="#222"/><circle cx="45.5" cy="40" r="1.6" fill="#222"/><path d="M35 46q5 3 10 0" stroke="#5a3a24" stroke-width="1.5" fill="none"/></svg>`;
}
/** Small flag (house colours) for ships on the map. */
export const flagSvg = (crest) => `<rect x="0" y="-14" width="10" height="7" fill="${crest.c1}"/><rect x="5" y="-14" width="5" height="7" fill="${crest.c2}"/><path d="M0 -15V0" stroke="#3a2a14" stroke-width="1.2"/>`;
