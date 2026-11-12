import test from "node:test";
import assert from "node:assert/strict";
import { escapeHtml } from "../src/view/escapehtml.mjs";

// Player-controlled text (ship and convoy names) reaches innerHTML through this helper.

test("escapes the five HTML-sensitive characters, every occurrence", () => {
  assert.equal(escapeHtml(`a&b<c>d"e'f`), "a&amp;b&lt;c&gt;d&quot;e&#39;f");
  assert.equal(escapeHtml("&&&&"), "&amp;&amp;&amp;&amp;");
});

test("nullish values become empty text", () => {
  assert.equal(escapeHtml(null), "");
  assert.equal(escapeHtml(undefined), "");
});

test("non-strings are coerced first", () => {
  assert.equal(escapeHtml(42), "42");
  assert.equal(escapeHtml(0), "0");
  assert.equal(escapeHtml(false), "false");
});

test("safe text passes through unchanged", () => {
  assert.equal(escapeHtml("Santa María de la Rabida"), "Santa María de la Rabida");
  assert.equal(escapeHtml(""), "");
});

test("a crafted name cannot break out of an attribute or inject markup", () => {
  const name = `"><script>alert(1)</script><x y="`;
  const out = escapeHtml(name);
  assert.ok(!out.includes("<"), "no raw angle bracket survives");
  assert.ok(!out.includes('"'), "no raw double quote survives");
  assert.equal(out, "&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;&lt;x y=&quot;");
});

test("escaping is single-pass: the helper's own output re-escapes", () => {
  // Documents current behaviour so callers know not to escape twice.
  assert.equal(escapeHtml(escapeHtml("&")), "&amp;amp;");
});
