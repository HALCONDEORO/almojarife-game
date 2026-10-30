import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initTutorial, restartTutorial, tutorialStep, tutorialActive } from "../src/game/tutorial.mjs";
import { settingsHtml } from "../src/view/settingsview.mjs";

const finished = () => { const g = {}; initTutorial(g); Object.assign(g.tut, { bought: true, sold: true, sailed: true, routed: true, hall: true, contract: true }); return g; };

test("a finished tutorial restarts from step one and runs again", () => {
  const g = finished();
  assert.equal(tutorialStep(g), "done");
  assert.equal(restartTutorial(g), true);
  assert.equal(tutorialStep(g), "buy");
  assert.equal(tutorialActive(g), true); // the mission arc hides and freezes again
  assert.equal(g.tut.skipped, false);
});

test("a skipped tutorial restarts too", () => {
  const g = finished();
  g.tut.skipped = true;
  assert.equal(tutorialStep(g), "done");
  assert.equal(restartTutorial(g), true);
  assert.equal(tutorialStep(g), "buy");
});

test("there is nothing to restart while the tutorial runs, was never on, or its data is damaged", () => {
  const running = {}; initTutorial(running);
  assert.equal(restartTutorial(running), false);
  assert.equal(restartTutorial({}), false);
  assert.equal(restartTutorial({ tut: true }), false);
  assert.equal(restartTutorial(null), false);
});

test("the replay button only appears in Settings when there is a tutorial to replay", () => {
  const tt = new Proxy({}, { get: (_, k) => `<${String(k)}>` });
  const base = { lang: "es", speed: 1, automaticTime: true, sound: true, large: false, reduceMotion: false, inGame: true };
  assert.match(settingsHtml(tt, { ...base, tutReplay: true }), /id="st-tut"/);
  assert.doesNotMatch(settingsHtml(tt, { ...base, tutReplay: false }), /id="st-tut"/);
  assert.match(settingsHtml(tt, { ...base, tutReplay: true }), /<tutReplay>/);
});

test("main wires the replay button and carries both locales", () => {
  const main = readFileSync("web/main.mjs", "utf8");
  assert.match(main, /restartTutorial/);
  assert.match(main, /\$\("st-tut"\)/);
  assert.match(main, /tutReplay: !inTitle && !g\.over && tutorialStep\(g\) === "done"/);
  assert.ok(main.includes('tutReplay: "Repetir tutorial"'));
  assert.ok(main.includes('tutReplay: "Replay tutorial"'));
});
