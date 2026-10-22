import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { render } from "../tools/gen_wiki.mjs";

// The wiki tables come from the code constants. If this fails, run `node tools/gen_wiki.mjs` and commit docs/wiki/generated/.
test("docs/wiki/generated matches the code constants", () => {
  for (const [name, text] of Object.entries(render())) {
    assert.equal(readFileSync(new URL("../docs/wiki/generated/" + name, import.meta.url), "utf8"), text, name);
  }
});
