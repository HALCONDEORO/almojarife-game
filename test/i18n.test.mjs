import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/** Locale parity: every top-level key in one locale must exist in the other.
 *  Regression tripwire for the EN industry/auction gap that crashed the city
 *  tab on rep types (t.indTypes undefined). Text scan, no DOM needed. */
const src = readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");

function localeBody(locale) {
  const start = src.indexOf(`${locale}: { play:`); // locales are single-line; en starts mid-line after es closes
  assert.notEqual(start, -1, `locale ${locale} found`);
  let i = src.indexOf("{", start), depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === "{") depth++;
    else if (src[j] === "}") { depth--; if (!depth) return src.slice(i, j + 1); }
  }
  throw new Error(`locale ${locale} unbalanced`);
}

function topKeys(body) {
  const keys = new Set();
  let depth = 0, i = 0;
  while (i < body.length) {
    const c = body[i];
    if (c === '"' || c === "'" || c === "`") { // skip string/template literals
      const q = c; i++;
      while (i < body.length && body[i] !== q) { if (body[i] === "\\") i++; i++; }
    } else if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (depth === 1 && /[A-Za-z_$]/.test(c)) {
      const m = /^[A-Za-z_$][\w$]*/.exec(body.slice(i));
      if (m && body[i + m[0].length] === ":") keys.add(m[0]);
      i += m[0].length - 1;
    }
    i++;
  }
  return keys;
}

for (const locale of ["es", "en"]) {
  test(`locale ${locale}: no key missing vs the other locale`, () => {
    const mine = topKeys(localeBody(locale));
    const other = topKeys(localeBody(locale === "es" ? "en" : "es"));
    const missing = [...other].filter((k) => !mine.has(k));
    assert.deepEqual(missing, [], `${locale} misses: ${missing.join(", ")}`);
  });
}
