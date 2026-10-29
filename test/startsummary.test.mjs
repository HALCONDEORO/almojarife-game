import test from 'node:test';import assert from 'node:assert/strict';
import {startSummary,startSummaryHtml} from '../src/view/startsummary.mjs';
import {startBonus,BACKGROUNDS} from '../src/game/profile.mjs';import {DIFFICULTY_IDS} from '../src/game/difficulty.mjs';
import {START_CASH} from '../src/game/game.mjs';
test('startup summary derives all nine origin/difficulty combinations from actual game rules',()=>{
 for(const background of Object.keys(BACKGROUNDS))for(const difficulty of DIFFICULTY_IDS){const p={background,difficulty};const b=startBonus(p),s=startSummary(p,START_CASH);assert.equal(s.cash,START_CASH+b.cash);assert.equal(s.baseUpkeepPercent,Math.round(b.upkeepMul*10000)/100);}
 assert.deepEqual(startSummary({background:'seafarer',difficulty:'hard'},START_CASH),{cash:1500,baseUpkeepPercent:106.25});
 assert.deepEqual(startSummary({background:'scholar',difficulty:'easy'},START_CASH),{cash:3150,baseUpkeepPercent:76});
});
test('summary says what the multiplier excludes in both languages',()=>{for(const lang of ['es','en']){const h=startSummaryHtml({background:'merchant',difficulty:'normal'},START_CASH,lang);assert.ok(h.includes('100%'));assert.ok(h.includes(lang==='es'?'incluye tripulación; no incluye capitanes ni armamento':'includes crew; excludes captains and weapons'));}});
