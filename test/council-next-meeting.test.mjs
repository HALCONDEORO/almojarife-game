import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame, advanceDay } from '../src/game/game.mjs';
import { meetingDay, nextMeetingDay, MEETING_EVERY } from '../src/game/council.mjs';
import { hallView } from '../src/view/townhallview.mjs';
import { serialize, deserialize } from '../src/game/gamesave.mjs';
const world = loadWorld();

test('next meeting is the first strictly future scheduled day for every port across three periods', () => {
 for (const city of world.cities) for (let day = 0; day < MEETING_EVERY * 3; day++) {
  let expected = day + 1;
  while (!meetingDay(world, city.id, expected)) expected++;
  assert.equal(nextMeetingDay(world, city.id, day), expected, `${city.id} day ${day}`);
  assert.ok(expected <= day + MEETING_EVERY);
 }
});

test('Alicante zero-offset meetings advance a full period, including day zero', () => {
 assert.ok(meetingDay(world, 'alicante', 0));
 assert.equal(nextMeetingDay(world, 'alicante', 0), 30);
 assert.equal(nextMeetingDay(world, 'alicante', 30), 60);
 assert.equal(nextMeetingDay(world, 'alicante', 60), 90);
});

test('actual council work is identical with or without opening the future-date view, also after reload', () => {
 const direct = newGame(world, 'cadiz', { seed: 94, noGoal: true });
 direct.cash = 100000;
 direct.hallCaja = { cadiz: 0, alicante: 0 };
 let viewed = deserialize(serialize(direct, 'Council control', 0), world).g;
 for (let day = 0; day < MEETING_EVERY + 1; day++) {
  advanceDay(direct); advanceDay(viewed);
  const before = JSON.stringify({ cash: viewed.cash, hallCaja: viewed.hallCaja, hallTax: viewed.hallTax, inbox: viewed.inbox, day: viewed.day });
  for (const city of ['cadiz', 'alicante']) {
   const card = hallView(viewed, city);
   assert.ok(card.nextMeeting > viewed.day);
   assert.ok(meetingDay(world, city, card.nextMeeting));
  }
  assert.equal(JSON.stringify({ cash: viewed.cash, hallCaja: viewed.hallCaja, hallTax: viewed.hallTax, inbox: viewed.inbox, day: viewed.day }), before, 'reading the next date does not vote, debit or credit');
  assert.deepEqual(viewed.hallCaja, direct.hallCaja);
  assert.deepEqual(viewed.hallTax, direct.hallTax);
  assert.equal(viewed.cash, direct.cash);
  assert.deepEqual(viewed.inbox, direct.inbox);
  viewed = deserialize(serialize(viewed, 'Read and reload', 0), world).g;
 }
 assert.ok(direct.hallTax?.alicante, 'actual meeting voted during the real daily loop');
});
