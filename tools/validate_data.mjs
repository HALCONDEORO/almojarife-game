// Usage: node tools/validate_data.mjs [path/to/world.json]
import fs from "node:fs";
import { validateWorld } from "../src/sim/validate.mjs";
const path = process.argv[2] ?? new URL("../data/world.json", import.meta.url);
const errs = validateWorld(JSON.parse(fs.readFileSync(path, "utf8")));
if (errs.length) { console.error(errs.map((e) => "- " + e).join("\n")); process.exit(1); }
console.log("world data OK");
