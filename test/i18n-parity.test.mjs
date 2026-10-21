// Generic i18n parity check for web/main.mjs: the ES and EN string tables must
// carry the same key set (nested too) and no empty strings anywhere.
// Inspired by CashPilot's locale-parity guard; reimplemented from scratch here.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const SRC = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");

// Extract the `const T = { ... };` literal, skipping over string contents so
// braces inside placeholders like "{d}" or "{city}" do not unbalance the scan.
function extractLocaleTable(src) {
  const start = src.indexOf("const T = {");
  assert.ok(start >= 0, "web/main.mjs must declare const T = { ... }");
  const open = src.indexOf("{", start);
  let depth = 0, quote = null;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === "\\") { i++; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return src.slice(open, i + 1); }
  }
  assert.fail("unbalanced braces while scanning the locale table");
}

const T = new Function("return (" + extractLocaleTable(SRC) + ");")();
assert.ok(T.es && T.en, "locale table must have es and en");

// Flatten nested objects into "path.to.key" entries; arrays (e.g. months) are leaves.
function flatten(obj, prefix = "", out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? prefix + "." + k : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, path, out);
    else out.set(path, v);
  }
  return out;
}

const es = flatten(T.es), en = flatten(T.en);

test("ES and EN define exactly the same keys", () => {
  const onlyEs = [...es.keys()].filter((k) => !en.has(k));
  const onlyEn = [...en.keys()].filter((k) => !es.has(k));
  assert.deepEqual(onlyEs, [], `keys only in ES: ${onlyEs.slice(0, 10).join(", ")}`);
  assert.deepEqual(onlyEn, [], `keys only in EN: ${onlyEn.slice(0, 10).join(", ")}`);
});

test("no empty strings in either language", () => {
  for (const [lang, table] of [["es", es], ["en", en]]) {
    const empty = [...table.entries()].filter(([, v]) => typeof v === "string" && v.trim() === "").map(([k]) => k);
    assert.deepEqual(empty, [], `${lang} empty strings: ${empty.slice(0, 10).join(", ")}`);
  }
});

test("every leaf is a string or an array of strings, and arrays match in length", () => {
  for (const [k, v] of es) {
    const w = en.get(k);
    if (Array.isArray(v)) {
      assert.ok(Array.isArray(w), `${k}: es is an array but en is not`);
      assert.equal(w.length, v.length, `${k}: array length differs between es and en`);
      for (let i = 0; i < v.length; i++) {
        assert.ok(typeof v[i] === "string" && v[i].trim() !== "", `${k}[${i}]: empty or non-string in es`);
        assert.ok(typeof w[i] === "string" && w[i].trim() !== "", `${k}[${i}]: empty or non-string in en`);
      }
    } else {
      assert.equal(typeof v, "string", `${k}: es leaf must be a string, got ${typeof v}`);
      assert.equal(typeof w, "string", `${k}: en leaf must be a string, got ${typeof w}`);
    }
  }
});
