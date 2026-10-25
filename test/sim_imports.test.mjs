// Gate: the balance sim's import graph must stay inside the paths the Balance
// workflow treats as sim-relevant (src/game, src/sim, tools, data + the
// src/view/cityscene.mjs exception, whose seeded() hash the engine imports).
// If a future change makes the sim reach excluded UI/web/docs paths, the
// balance.yml path filter would silently skip the 100y gate for an
// economy-relevant change; this test fails first, on every push and PR.
//
// The scanner is fail-closed by construction: it follows only literal static
// forms it fully recognizes and flags the other module/subprocess forms JS
// code normally uses (dynamic import(), require(), non-whitelisted
// child_process use, subprocess calls whose target is not a literal repo
// script, unparsable import shapes). It is a gate, not a parser: an
// unusual-but-safe construct fails here and gets an explicit review instead
// of escaping silently. Known limit, accepted: adversarial evaluation
// channels outside the module system (Worker threads, vm, eval, new
// Function) are not scanned; none exist in the sim graph today and adding
// one would be its own review. The regex-based comment/string stripping can
// false-fail on pathological formatting - noisy is safe, silent is not.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

const ALLOWED = [/^src\/game\//, /^src\/sim\//, /^tools\//, /^data\//];
const EXCEPTIONS = new Set(["src/view/cityscene.mjs"]);

// The only approved child_process import: aliasing or other members are flagged.
const CHILD_IMPORT_OK = /^\s*import\s*\{\s*execFileSync\s*\}\s*from\s*["']node:child_process["']\s*;?\s*$/;
// The only approved subprocess call: execFileSync(process.execPath, ["<literal>.mjs", ...]).
const SPAWN_OK = /execFileSync\s*\(\s*process\.execPath\s*,\s*\[\s*["']([\w./-]+\.mjs)["']/g;
const ANY_SUBPROCESS_CALL = /\b(?:execFileSync|execFile|execSync|exec|spawnSync|spawn|fork)\s*\(/g;

const STATIC_FROM = /(?:import|export)\s+[^;'"]*?\s*from\s*["']([^"']+)["']/g;
const SIDE_EFFECT = /import\s*["']([^"']+)["']/g;
const DYNAMIC_LIT = /import\s*\(\s*["']([^"']+)["']\s*\)/g;

function stripCommentsAndStrings(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[\s(;])\/\/[^\n]*/g, "$1")
    .replace(/`(?:[^`\\]|\\[\s\S])*`/g, '""')
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, '""');
}

function isAllowed(path) {
  return ALLOWED.some((re) => re.test(path)) || EXCEPTIONS.has(path);
}

// Entry set from the real contract: every `run: node <file>.mjs` line in
// balance.yml. Fail-closed: a node run line this parser cannot read exactly
// (args, multi-line blocks, wrappers) is a problem, never a silent skip.
function entriesFromWorkflow(yml, problems) {
  const entries = [];
  for (const line of yml.split("\n")) {
    if (!/^\s*-?\s*run:/.test(line)) continue;
    const exact = line.match(/^\s*run:\s*node\s+([\w./-]+\.mjs)\s*$/);
    if (exact) { entries.push(exact[1]); continue; }
    if (/\bnode\b/.test(line) || /run:\s*[|>]/.test(line)) {
      problems.push(`unparsed run line in balance.yml: "${line.trim()}" (entry set may be incomplete)`);
    }
  }
  if (!entries.length) problems.push("no node entries found in balance.yml - the workflow contract changed");
  return entries;
}

function scanGraph(entries, readFile) {
  const seen = new Set();
  const parent = new Map();
  const problems = [];
  const queue = [...entries];
  for (const e of entries) parent.set(e, null);
  const follow = (spec, from, kind) => {
    if (!spec.startsWith(".")) {
      if (!spec.startsWith("node:")) problems.push(`${kind} non-builtin specifier "${spec}" in ${from}`);
      return;
    }
    const target = relative(".", resolve(dirname(from), spec)).replaceAll("\\", "/");
    if (!parent.has(target)) { parent.set(target, from); queue.push(target); }
  };
  while (queue.length) {
    const rel = queue.shift();
    if (seen.has(rel)) continue;
    seen.add(rel);
    let src;
    try {
      src = readFile(rel);
    } catch {
      problems.push(`unreadable: ${rel}`);
      continue;
    }
    for (const m of src.matchAll(STATIC_FROM)) follow(m[1], rel, "static");
    for (const m of src.matchAll(SIDE_EFFECT)) follow(m[1], rel, "side-effect");
    for (const m of src.matchAll(DYNAMIC_LIT)) {
      if (!m[1].startsWith("node:")) problems.push(`dynamic import("${m[1]}") in ${rel} (only node: builtins are proven safe)`);
    }
    // Subprocess edges: every subprocess-looking call must be the approved
    // literal form; anything else (variable target, execSync, spawn("node"),
    // another member) is flagged by count parity.
    const approved = [...src.matchAll(SPAWN_OK)];
    const total = [...src.matchAll(ANY_SUBPROCESS_CALL)].length;
    if (total !== approved.length) problems.push(`${rel}: ${total} subprocess call(s), only ${approved.length} in the approved literal form`);
    for (const m of approved) {
      const target = m[1];
      if (!parent.has(target)) { parent.set(target, rel); queue.push(target); }
    }
    // child_process imports: only the exact approved named import.
    for (const line of src.split("\n")) {
      if (/from\s*["']node:child_process["']/.test(line) && !CHILD_IMPORT_OK.test(line)) {
        problems.push(`${rel}: non-approved child_process import: "${line.trim()}"`);
      }
    }
    // Residue check on comment/string-stripped source: every remaining
    // `import` token must belong to a recognized static or literal-dynamic
    // form; `require(` is never expected in this ESM graph.
    let stripped = stripCommentsAndStrings(src)
      .replace(/\bimport\.meta\b/g, " ")
      .replace(/import\s+[^;'"()]*?\s*from\s*""/g, " ")
      .replace(/import\s*""/g, " ")
      .replace(/import\s*\(\s*""\s*\)/g, " ")
      .replace(/export\s+[^;'"]*?\s*from\s*""/g, " ");
    const badImport = stripped.match(/\bimport\b/);
    if (badImport) problems.push(`${rel}: import form not recognized by the gate (variable specifier, template, or unusual shape)`);
    if (/\brequire\s*\(/.test(stripped)) problems.push(`${rel}: require() call (CommonJS edge outside the static graph)`);
  }
  const chain = (file) => {
    const parts = [];
    for (let cur = file; cur; cur = parent.get(cur)) parts.unshift(cur);
    return parts.join(" -> ");
  };
  const violations = [...seen].filter((f) => !isAllowed(f)).map((f) => `${f} (via ${chain(f)})`);
  return { seen, violations, problems };
}

test("sim import graph stays inside the Balance-relevant surface", () => {
  const problems = [];
  const entries = entriesFromWorkflow(readFileSync(resolve(ROOT, ".github/workflows/balance.yml"), "utf8"), problems);
  assert.ok(entries.includes("tools/sim_balance_check.mjs"), "balance.yml must run tools/sim_balance_check.mjs");
  const { seen, violations, problems: scanProblems } = scanGraph(entries, (rel) => readFileSync(resolve(ROOT, rel), "utf8"));
  problems.push(...scanProblems);
  // Sanity: a scanner regression must not silently shrink the graph to nothing.
  assert.ok(seen.size >= 60, `sim graph suspiciously small (${seen.size} files) - check the scanner, not the allowlist`);
  assert.deepEqual(problems, [], "non-literal or non-builtin edges in the sim graph");
  assert.deepEqual(violations, [], "sim graph reaches paths the Balance filter excludes");
});

test("scanner fails closed on poisoned graphs", () => {
  const files = {
    "tools/entry.mjs": [
      'import "../src/game/ok.mjs";',            // static, followed
      'import "../src/view/evil.mjs";',          // static side-effect to excluded path
      'const a = 1; import "../web/same-line.mjs";', // same-line import after ';'
      'import { spawn as sp } from "node:child_process";', // aliased child_process
      'execSync("node tools/sneaky.mjs");',      // unapproved subprocess call
      'execFileSync(process.execPath, ["tools/child.mjs", "arg"]);', // approved: followed
      'const mod = "./dyn.mjs"; await import(mod);', // non-literal dynamic
    ].join("\n"),
    "src/game/ok.mjs": 'import "../view/cityscene.mjs";\nimport x from "express";\nconst y = require("../src/sim/y.mjs");\n',
    "tools/child.mjs": "export {};\n",
    "src/view/cityscene.mjs": "export const seeded = 1;\n",
    "src/view/evil.mjs": "export {};\n",
    "web/same-line.mjs": "export {};\n",
  };
  const { seen, violations, problems } = scanGraph(["tools/entry.mjs"], (rel) => {
    if (!(rel in files)) throw new Error("missing " + rel);
    return files[rel];
  });
  assert.ok(seen.has("tools/child.mjs"), "approved literal spawn is followed");
  assert.ok(violations.some((v) => v.startsWith("src/view/evil.mjs")), `view import flagged: ${violations}`);
  assert.ok(violations.some((v) => v.startsWith("web/same-line.mjs")), `same-line import flagged: ${violations}`);
  assert.ok(!violations.some((v) => v.startsWith("src/view/cityscene.mjs")), "cityscene exception stays allowed");
  const text = problems.join("\n");
  assert.ok(text.includes("non-approved child_process import"), `alias flagged: ${text}`);
  assert.ok(text.includes("subprocess call(s)"), `execSync/variable spawn flagged by parity: ${text}`);
  assert.ok(text.includes("import form not recognized"), `non-literal dynamic import flagged: ${text}`);
  assert.ok(text.includes('non-builtin specifier "express"'), `bare specifier flagged: ${text}`);
  assert.ok(text.includes("require()"), `require flagged: ${text}`);
});

test("entry parser fails closed on unrecognizable run lines", () => {
  const problems = [];
  const entries = entriesFromWorkflow([
    "jobs:",
    "  balance:",
    "    steps:",
    "      - run: node tools/sim_balance_check.mjs --with-args",
    "      - run: |",
    "          node tools/other.mjs",
  ].join("\n"), problems);
  assert.deepEqual(entries, [], "no exact entries parsed");
  assert.equal(problems.length, 3, `args form, multi-line block and empty set all flagged: ${problems.join(" | ")}`);
});
