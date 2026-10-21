// Usage: node tools/validate_data.mjs [path/to/world.json]
import fs from "node:fs";
import { validateWorld } from "../src/sim/validate.mjs";
import { PRODUCERS } from "../src/game/buildings.mjs";
import { validateEvents } from "../src/game/events.mjs";
const path = process.argv[2] ?? new URL("../data/world.json", import.meta.url);
const w = JSON.parse(fs.readFileSync(path, "utf8")), errs = [...validateWorld(w, Object.values(PRODUCERS).map((p) => p.output)), ...(w.events ? validateEvents(w.events) : [])];
if (errs.length) { console.error(errs.map((e) => "- " + e).join("\n")); process.exit(1); }
console.log("world data OK");
