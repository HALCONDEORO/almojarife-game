import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";

// The wiki is bilingual: English at docs/wiki/, a Spanish mirror at docs/wiki/es/.
// Both sides link to each other so a reader can switch language from any page.
const ROOT = "docs/wiki";
const ES = "docs/wiki/es";

test("every English wiki page has a Spanish mirror and both link to each other", () => {
  const pages = readdirSync(ROOT).filter((f) => f.endsWith(".md"));
  assert.ok(pages.length >= 8, "expected the eight wiki pages");
  for (const p of pages) {
    const esPath = `${ES}/${p}`;
    assert.ok(existsSync(esPath), `missing ${esPath}`);
    const es = readFileSync(esPath, "utf8");
    assert.ok(es.includes(`](../${p})`), `${esPath} must link back to the English ../${p}`);
    const en = readFileSync(`${ROOT}/${p}`, "utf8");
    assert.ok(en.includes(`](es/${p})`), `${ROOT}/${p} must link to its mirror es/${p}`);
  }
});

test("the Spanish mirror points at the Spanish generated tables", () => {
  for (const t of ["classes.md", "ships-and-weapons.md"]) {
    assert.ok(existsSync(`docs/wiki/generated/es/${t}`), `missing generated/es/${t}`);
  }
  const readme = readFileSync(`${ES}/README.md`, "utf8");
  assert.ok(readme.includes("generated/es/classes.md") && readme.includes("generated/es/ships-and-weapons.md"));
});

test("the settings help link no longer presents the wiki as English-only", () => {
  const main = readFileSync("web/main.mjs", "utf8");
  assert.ok(main.includes('stHelpLink: "Abrir la wiki"'), "es stHelpLink");
  assert.ok(main.includes('stHelpLink: "Open the wiki"'), "en stHelpLink");
});
