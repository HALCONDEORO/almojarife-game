import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Sea events stop the clock. The card must say so, deciding must resume the
// clock by itself, and a manual pause/play toggle cancels that auto-resume.
const main = readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");

test("both locales carry the event pause notice", () => {
  assert.match(main, /evPaused: "El tiempo está parado hasta que decidas\."/);
  assert.match(main, /evPaused: "Time is stopped until you decide\."/);
});

test("the pending-event card tells the player the clock is stopped", () => {
  assert.match(main, /<p class="ev-paused"><i>\$\{t\.evPaused\}<\/i><\/p>/);
});

test("an event-caused pause is recorded and deciding the event resumes the clock", () => {
  assert.match(main, /\{ playing = false; autoPause = "event"; \}/);
  assert.match(main, /autoPause === "event" && !g\.pending && !g\.encounterReport && !g\.over\) \{ playing = true; autoPause = null; \}/);
});

test("manual clock control retires the auto-resume", () => {
  assert.match(main, /toggleClock = \(\) => \{ playing = !playing; manualPause = !playing; planningResume = false; autoPause = null;/);
});

import vm from "node:vm";
// Regression: a game LOADED with an event already pending must resume by itself once the
// event is decided - even if the player toggled Resume first (render forces the pause back).
// Before the fix, autoPause was only assigned inside stepTicks, so on this path deciding the
// event left the clock frozen on "Reanudar" for good.
test("loaded-with-pending + resume + decide: the clock resumes by itself", () => {
  const src = readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
  const pauseStmt = src.match(/if \(pe\) \{ playing = false; if \(!autoPause\) autoPause = "event";/);
  const toggle = src.match(/const toggleClock = \(\) => \{ playing = !playing; manualPause = !playing; planningResume = false; autoPause = null;[^}]*\};/);
  const resume = src.match(/if \(autoPause === "event" && !g\.pending && !g\.encounterReport && !g\.over\) \{ playing = true; autoPause = null; \}/);
  assert.ok(pauseStmt, "the event card records the event-caused pause");
  assert.ok(toggle, "manual clock control still retires the auto-resume");
  assert.ok(resume, "deciding resumes when the pause came from the event");
  const ctx = {
    g: { pending: { id: "storm" }, encounterReport: null, over: false },
    playing: false, autoPause: null, manualPause: false, planningResume: false, pauseNote: { x: 1 },
    pe: { id: "storm" }, render() {}, // stubs: the statements under test drive the flags directly
  };
  vm.createContext(ctx);
  const showEvent = `${pauseStmt[0]} }`;
  vm.runInContext(showEvent, ctx); // first render after load: paused by the event
  assert.equal(ctx.playing, false);
  assert.equal(ctx.autoPause, "event", "loading with a pending event records the cause");
  vm.runInContext(toggle[0], ctx); // bind the real toggle, then press Resume
  vm.runInContext("toggleClock()", ctx);
  assert.equal(ctx.playing, true);
  assert.equal(ctx.autoPause, null, "Resume retires the auto-resume as designed");
  vm.runInContext(showEvent, ctx); // render forces the pause back while the event is open
  assert.equal(ctx.playing, false);
  assert.equal(ctx.autoPause, "event", "the card re-marks the event pause after Resume");
  vm.runInContext(`g.pending = null; ${resume[0]}`, ctx); // the player decides ("Buscar abrigo")
  assert.equal(ctx.playing, true, "deciding resumes the clock on the loaded-with-pending path");
  assert.equal(ctx.autoPause, null);
});
