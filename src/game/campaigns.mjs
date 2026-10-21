// Original campaign arc "El Almojarife": a merchant house rises until the council names
// its head almojarife mayor. A mission is pure DATA: id, story, ordered steps, an optional
// deadline, rewards and what it unlocks - adding a mission means adding an entry, not code.
// Step kinds: events (buy/sell/sail/arrive/readReport, fired by the game) and conditions
// (respect/worth/fleet/build/warehouse, checked every day). Historical context is separate
// from fictional gameplay goals.
export const MISSIONS = Object.freeze([
  Object.freeze({ id: 'm1-oficio', chain: 'main', requires: [], optional: false, deadline: 60,
    title: { es: 'La prueba del oficio', en: 'The test of the trade' },
    intro: { es: 'El viejo almojarife ha muerto sin heredero y el concejo busca sucesor. Tu tío, marino retirado, te deja su coca y una condición: demuestra oficio antes de hablar de nombramientos. Compra 40 de sal, llévala a Sevilla y véndela allí antes del día 60; luego mira tu informe semanal y entenderás el oficio.', en: 'The old almojarife has died without an heir and the council is looking for a successor. Your uncle, a retired sailor, leaves you his cog and one condition: prove your trade before any talk of appointments. Buy 40 salt, take it to Seville and sell it there before day 60; then read your weekly report and you will understand the trade.' },
    done: { es: 'El concejo ha visto tu nombre en el libro de Sevilla: compra, viaje, venta y cuentas claras. El oficio está probado; ahora viene lo difícil: que el nombre pese.', en: 'The council has seen your name in Seville\'s book: purchase, voyage, sale and clear accounts. The trade is proven; now the hard part: making that name carry weight.' },
    failed: { es: 'El día 60 llegó sin venta en Sevilla. El concejo pierde interés en tu nombre; la casa sigue, pero el nombramiento se aleja.', en: 'Day 60 arrived with no sale in Seville. The council loses interest in your name; the house goes on, but the appointment drifts away.' },
    steps: Object.freeze([
      Object.freeze({ kind: 'buy', good: 'salt', qty: 40, label: { es: 'Compra {qty} de sal', en: 'Buy {qty} salt' } }),
      Object.freeze({ kind: 'sail', label: { es: 'Zarpa con la carga', en: 'Set sail with the cargo' } }),
      Object.freeze({ kind: 'arrive', city: 'sevilla', label: { es: 'Llega a Sevilla', en: 'Reach Seville' } }),
      Object.freeze({ kind: 'sell', good: 'salt', qty: 40, city: 'sevilla', label: { es: 'Vende {qty} de sal en Sevilla', en: 'Sell {qty} salt in Seville' } }),
      Object.freeze({ kind: 'readReport', label: { es: 'Lee tu informe semanal', en: 'Read your weekly report' } }),
    ]),
    reward: Object.freeze({ coins: 300, respect: { sevilla: 5 } }) }),
  Object.freeze({ id: 's1-gremio', chain: 'side', requires: ['m1-oficio'], optional: true, deadline: null,
    title: { es: 'Nombre y palabra', en: 'Name and word' },
    intro: { es: 'El escribano del concejo te lo dice claro: sin nombre no hay crédito, ni encargos, ni licencias. Haz que tu palabra pese en tu propia casa (respeto 20 en tu puerto de origen).', en: 'The council clerk spells it out: without a name there is no credit, no contracts, no licences. Make your word count at home (respect 20 in your home port).' },
    done: { es: 'En tu puerto ya no preguntan quién eres: preguntan qué traes. El gremio te saluda por tu nombre.', en: 'In your port they no longer ask who you are: they ask what you carry. The guild greets you by name.' },
    failed: { es: '', en: '' },
    steps: Object.freeze([
      Object.freeze({ kind: 'respect', city: 'home', atLeast: 20, label: { es: 'Respeto {n} en tu puerto de origen', en: 'Respect {n} in your home port' } }),
    ]),
    reward: Object.freeze({ coins: 200 }) }),
  Object.freeze({ id: 's2-caja', chain: 'side', requires: ['m1-oficio'], optional: true, deadline: null,
    title: { es: 'Caja para el invierno', en: 'A chest for the winter' },
    intro: { es: 'Una casa sin caja muere en el primer invierno. Junta un patrimonio de 10.000 y enséñaselo a tu gente: la prudencia también se negocia.', en: 'A house without a chest dies in the first winter. Gather a net worth of 10,000 and show it to your people: prudence is also traded.' },
    done: { es: 'Diez mil en valor: la casa aguanta una mala temporada, y eso lo sabe todo el muelle.', en: 'Ten thousand in worth: the house can weather a bad season, and the whole wharf knows it.' },
    failed: { es: '', en: '' },
    steps: Object.freeze([
      Object.freeze({ kind: 'worth', atLeast: 10000, label: { es: 'Patrimonio de {n}', en: 'Net worth of {n}' } }),
    ]),
    reward: Object.freeze({ respect: { home: 5 } }) }),
]);
export const CAMPAIGNS = MISSIONS; // backwards-compatible name for older imports
export function campaignById(id) { return MISSIONS.find((m) => m.id === id) ?? null; }

const EVENT_KINDS = new Set(['buy', 'sell', 'sail', 'arrive', 'readReport']);
const NO_HELPERS = Object.freeze({ post: () => {}, addRespect: () => {}, repOf: () => 0, netWorth: () => 0 });

export function newCampaign(id = 'm1-oficio') {
  if (!campaignById(id)) throw Error('unknown campaign');
  return { active: [id], missions: { [id]: { step: 0, count: 0, done: false, failed: false } } };
}

/** Activate missions whose requirements are met and that were never offered. Branches are
 *  just several missions requiring the same parent. */
function activate(g, post) {
  const c = g.campaign; if (!c) return;
  for (const m of MISSIONS) {
    if (c.missions[m.id]) continue;
    if (m.requires.every((r) => c.missions[r]?.done)) {
      c.missions[m.id] = { step: 0, count: 0, done: false, failed: false };
      c.active.push(m.id);
      post(g, 'mission', { txt: m.intro });
    }
  }
}
function complete(g, m, h) {
  const st = g.campaign.missions[m.id]; st.done = true;
  if (m.reward?.coins) g.cash += m.reward.coins;
  if (m.reward?.respect) for (const [city, amt] of Object.entries(m.reward.respect)) h.addRespect(g, city === 'home' ? g.profile?.home : city, amt);
  h.post(g, 'mission', { txt: m.done });
  activate(g, h.post);
}

/** Explicit successful player-action events only; no parsing translated logs. No general game side effects. */
export function campaignEvent(g, event, h = NO_HELPERS) {
  const c = g.campaign; if (!c || !event || typeof event.kind !== 'string') return false;
  let changed = false;
  for (const id of [...c.active]) {
    const m = campaignById(id), st = c.missions[id];
    if (!m || !st || st.done || st.failed) continue;
    const step = m.steps[st.step];
    if (!step || !EVENT_KINDS.has(step.kind) || step.kind !== event.kind) continue;
    if (step.good && step.good !== event.good) continue;
    if (step.city && step.city !== event.city) continue;
    st.count += Number.isSafeInteger(event.qty) ? event.qty : 0;
    if (step.qty && st.count < step.qty) { changed = true; continue; }
    st.count = 0; st.step++;
    changed = true;
    if (st.step >= m.steps.length) complete(g, m, h);
  }
  return changed;
}
function conditionMet(g, step, h) {
  if (step.kind === 'respect') return h.repOf(g, step.city === 'home' ? g.profile?.home : step.city) >= step.atLeast;
  if (step.kind === 'worth') return h.netWorth(g) >= step.atLeast;
  if (step.kind === 'fleet') return (g.ships ?? []).length >= step.ships;
  if (step.kind === 'build') return Object.values(g.buildings ?? {}).some((plots) => Object.values(plots).some((b) => b.type === step.type && b.state === 'active'));
  if (step.kind === 'warehouse') return Object.keys(g.warehouses ?? {}).length > 0;
  return false;
}
/** Daily: deadlines fail missions, condition steps complete themselves, new missions activate. */
export function campaignTick(g, h = NO_HELPERS) {
  const c = g.campaign; if (!c) return;
  activate(g, h.post);
  for (const id of [...c.active]) {
    const m = campaignById(id), st = c.missions[id];
    if (!m || !st || st.done || st.failed) continue;
    if (m.deadline && g.day > m.deadline) { st.failed = true; h.post(g, 'mission', { txt: m.failed }); continue; }
    const step = m.steps[st.step];
    if (step && !EVENT_KINDS.has(step.kind) && conditionMet(g, step, h)) { st.step++; if (st.step >= m.steps.length) complete(g, m, h); }
  }
}
/** Ordered step states of one mission for the UI/tests: [done booleans]. */
export function campaignSteps(g, id = g.campaign?.active?.[0]) {
  const m = campaignById(id), st = g.campaign?.missions?.[id];
  if (!m || !st) return [];
  return m.steps.map((_, i) => st.done || i < st.step);
}
/** What the UI shows: active missions with their current step and deadline countdown. */
export function missionView(g, lang) {
  const c = g.campaign; if (!c) return [];
  return c.active.map((id) => {
    const m = campaignById(id), st = c.missions[id];
    const step = m.steps[Math.min(st.step, m.steps.length - 1)];
    return { id, optional: m.optional, title: m.title[lang] ?? m.title.es,
      stepLabel: st.done ? '' : (step.label[lang] ?? step.label.es).replace('{qty}', step.qty ?? '').replace('{n}', step.atLeast ?? ''),
      progress: step.qty && !st.done ? Math.min(st.count ?? 0, step.qty) + '/' + step.qty : '',
      daysLeft: m.deadline && !st.done && !st.failed ? m.deadline - g.day : null,
      done: st.done, failed: st.failed };
  });
}
