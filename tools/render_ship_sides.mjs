// Writes the four intact side-view ship SVGs used by the port scene (web/city2d/assets/ships/*.svg).
// Usage: node tools/render_ship_sides.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { shipSideSvg } from "../src/view/shipside.mjs";

const out = fileURLToPath(new URL("../web/city2d/assets/ships/", import.meta.url));
mkdirSync(out, { recursive: true });
for (const t of ["barca", "cog", "caravel", "nao"]) writeFileSync(out + t + ".svg", shipSideSvg(t) + "\n");
console.log("wrote 4 ship SVGs to", out);
