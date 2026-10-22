import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';
test('clock action says Resume not Sail in both languages, destination sail unchanged',()=>{const s=readFileSync('web/main.mjs','utf8');assert.match(s,/play: "▶ Resume"/);assert.match(s,/play: "▶ Reanudar"/);assert.match(s,/sailGo: "Sail"/);assert.match(s,/sailGo: "Zarpar"/);});
