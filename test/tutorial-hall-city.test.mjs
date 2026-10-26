import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Regression: with the city view (city2d/3D) active, opening the Town hall goes through
// openCityPanel, not through the legacy map-panel tab buttons (#panel-home is display:none
// in normal play). The tutorial's last step ("hall") only counts when openCityPanel also
// notes the visit - otherwise the guide sticks at 5/5 and the council missions never start.
const src = readFileSync(new URL('../web/main.mjs', import.meta.url), 'utf8');

test('city-view town-hall panel closes the tutorial', () => {
  const m = src.match(/function openCityPanel\(tb\) \{[\s\S]*?\n\}/);
  assert.ok(m, 'openCityPanel exists');
  assert.ok(
    m[0].includes('tutorialNote(g, "hall")'),
    'openCityPanel must call tutorialNote(g, "hall") so the council visit counts in the city view',
  );
});

test('both town-hall paths feed the same tutorial step', () => {
  // Legacy map-panel tab handler (kept for the event overlay) still notes the visit too.
  assert.ok(src.includes('if (tab === "hall") tutorialNote(g, "hall")'), 'map-panel tab path intact');
  // The civic-building click from the city iframe routes to openCityPanel("hall").
  assert.ok(src.includes('e.data.id==="hall"||e.data.id==="lonja")'), 'civic click opens the hall panel');
});
