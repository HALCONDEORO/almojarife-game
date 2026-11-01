import test from 'node:test';
import assert from 'node:assert/strict';
import { tutorialNote, tutorialStep, restartTutorial, skipTutorial } from '../src/game/tutorial.mjs';
import { tutorialStoryNotice, acknowledgeTutorialStory, TUTORIAL_AWARD, FATHER_STORY } from '../src/game/tutorialstory.mjs';
import { newGame } from '../src/game/game.mjs';
import { loadWorld } from '../src/sim/world.mjs';
import { serialize, deserialize } from '../src/game/gamesave.mjs';
const world = loadWorld();
const makeGame = () => newGame(world, 'cadiz', { tutorial: true });
test('new guide starts with an original father story, each step has both languages', () => {
 const game = makeGame(); assert.match(tutorialStoryNotice(game, tutorialStep(game), 'es').title, /padre/);
 for (const language of ['es','en']) for (const step of ['buy','sell','sail','yard','hall','contract','done']) assert.equal(FATHER_STORY[language][step].length,2);
 acknowledgeTutorialStory(game,'buy'); assert.equal(tutorialStoryNotice(game,'buy','es'),null);
 tutorialNote(game,'buy'); assert.equal(tutorialStoryNotice(game,'sell','es').reward,TUTORIAL_AWARD);
});
test('awards are once per completed lesson, reload and replay cannot mint them again', () => {
 const game = makeGame(), cash = game.cash;
 const complete = () => { for (const kind of ['buy','sell','sail','yard','hall','contract']) tutorialNote(game,kind,{profit:1,spent:10}); };
 complete(); assert.equal(game.cash,cash+6*TUTORIAL_AWARD);
 complete(); assert.equal(game.cash,cash+6*TUTORIAL_AWARD);
 const loaded = deserialize(JSON.parse(JSON.stringify(serialize(game,'Casa'))),world).g;
 restartTutorial(loaded); for (const kind of ['buy','sell','sail','yard','hall','contract']) tutorialNote(loaded,kind,{profit:1,spent:10});
 assert.equal(loaded.cash,cash+6*TUTORIAL_AWARD); assert.equal(Object.keys(loaded.tutorialAwards).length,6);
});
test('failed, skipped and legacy lessons award nothing', () => {
 const game = makeGame(), cash = game.cash;
 tutorialNote(game,'sell',{profit:1,spent:10}); assert.equal(game.cash,cash);
 skipTutorial(game); tutorialNote(game,'buy'); assert.equal(game.cash,cash); assert.equal(tutorialStoryNotice(game,'done','es'),null);
 const legacy = {cash:100,tut:{v:3}}; tutorialNote(legacy,'buy'); assert.equal(legacy.cash,100); assert.equal(legacy.tutorialAwards,undefined);
});
test('story acknowledgement persists but rewards cannot be claimed by reading a popup', () => {
 const game = makeGame(), cash = game.cash; acknowledgeTutorialStory(game,'buy');
 const loaded = deserialize(JSON.parse(JSON.stringify(serialize(game,'Casa'))),world).g;
 assert.equal(tutorialStoryNotice(loaded,'buy','es'),null); assert.equal(loaded.cash,cash); assert.equal(loaded.tutorialAwards,undefined);
});

test('trade feedback uses transaction amounts, not the balance delta containing an award', async () => {
 const { readFileSync } = await import('node:fs');
 const source = readFileSync('web/main.mjs','utf8');
 assert.match(source, /dc = res.ok \? res.cost : 0/);
 assert.match(source, /dc = res.ok \? res.revenue : 0/);
});

test('actual buy handler reports full price even when the first purchase pays a tutorial award', async () => {
 const { readFileSync } = await import('node:fs'); const vm = await import('node:vm');
 const source = readFileSync('web/main.mjs','utf8');
 const binding = source.split('\n').find(line => line.startsWith('  P.querySelectorAll("[data-b]")'));
 const button = { dataset: { b: 'salt:1' } }, game = {cash:1000}, ship = {cargo:{}}, messages=[];
 vm.runInNewContext(binding,{P:{querySelectorAll:()=>[button]},g:game,s:ship,sfx:()=>{},act:()=>{},fmtM:String,
  t:{toastBought:'Paid {c} for {q} {g}',goods:{salt:'Sal'}},toast:(message)=>messages.push(message),
  doBuy:()=>{game.cash-=75; ship.cargo.salt=1; return {ok:true,cost:100};}});
 button.onclick(); assert.deepEqual(messages,['Paid 100 for 1 Sal']); assert.equal(game.cash,925);
});
