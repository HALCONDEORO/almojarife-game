// Original campaign arc "El Almojarife": a merchant house rises until the council names
// its head almojarife mayor. A mission is pure DATA: id, story, ordered steps, an optional
// deadline, rewards and what it unlocks - adding a mission means adding an entry, not code.
// Step kinds: events (buy/sell/sail/arrive/readReport, fired by the game) and conditions
// (respect/worth/fleet/build/warehouse, checked every day). Historical context is separate
// from fictional gameplay goals.
import { addRep } from "./reputation.mjs";
import { tutorialActive } from "./tutorial.mjs"; // the tutorial gates the mission arc (see below)

export const MISSIONS = Object.freeze([
  Object.freeze({ id: 'm1-oficio', chain: 'main', requires: [], optional: false, deadline: 60,
    title: { es: 'La prueba del oficio', en: 'The test of the trade' },
    intro: { es: 'El viejo almojarife ha muerto sin heredero y el concejo busca sucesor. Tu tío, marino retirado, te deja su coca y una condición: demuestra oficio antes de hablar de nombramientos. Compra 40 de sal, llévala a Sevilla y véndela allí a más tardar el día 60; luego mira tu informe semanal y entenderás el oficio.', en: 'The old almojarife has died without an heir and the council is looking for a successor. Your uncle, a retired sailor, leaves you his cog and one condition: prove your trade before any talk of appointments. Buy 40 salt, take it to Seville and sell it there by day 60 at the latest; then read your weekly report and you will understand the trade.' },
    done: { es: 'El concejo ha visto tu nombre en el libro de Sevilla: compra, viaje, venta y cuentas claras. El oficio está probado; ahora viene lo difícil: que el nombre pese.', en: 'The council has seen your name in Seville\'s book: purchase, voyage, sale and clear accounts. The trade is proven; now the hard part: making that name carry weight.' },
    failed: { es: 'El día 60 llegó sin venta en Sevilla. El concejo pierde interés en tu nombre; la casa sigue, pero el nombramiento se aleja.', en: 'Day 60 arrived with no sale in Seville. The council loses interest in your name; the house goes on, but the appointment drifts away.' },
    steps: Object.freeze([
      Object.freeze({ kind: 'buy', good: 'salt', qty: 40, label: { es: 'Compra {qty} de sal', en: 'Buy {qty} salt' } }),
      Object.freeze({ kind: 'sail', label: { es: 'Zarpa con la carga: elige destino en el mapa y clic derecho → «Zarpar»', en: 'Set sail with the cargo: pick a destination on the map, then right-click → "Sail"' } }),
      Object.freeze({ kind: 'arrive', city: 'sevilla', label: { es: 'Llega a Sevilla', en: 'Reach Seville' } }),
      Object.freeze({ kind: 'sell', good: 'salt', qty: 40, city: 'sevilla', label: { es: 'Vende {qty} de sal en Sevilla', en: 'Sell {qty} salt in Seville' } }),
      Object.freeze({ kind: 'readReport', label: { es: 'Lee tu informe semanal en Informes (el primero llega el día 7)', en: 'Read your weekly report under Reports (the first one arrives on day 7)' } }),
    ]),
    reward: Object.freeze({ coins: 300, respect: { sevilla: 5 } }) }),
  Object.freeze({ id: 'm2-nombre', chain: 'main', requires: ['m1-oficio'], optional: false, deadline: null,
    title: { es: 'Nombre y palabra', en: 'Name and word' },
    intro: { es: 'El escribano del concejo te lo dice claro: un nombre que solo pesa en casa no basta; sin nombre no hay crédito, ni encargos, ni licencias. Haz que en dos puertos distintos te conozcan y te respeten (respeto 20 en cada uno) y vuelve con esa palabra.', en: 'The council clerk spells it out: a name that only counts at home is not enough; without a name there is no credit, no contracts, no licences. Make yourself known and respected in two different ports (respect 20 in each) and come back with that word.' },
    done: { es: 'Dos puertos, dos libros con tu nombre. El escribano asiente: ya hay firma con peso para un crédito. El concejo empieza a contar contigo.', en: 'Two ports, two books with your name. The clerk nods: there is now a signature with weight behind a loan. The council is starting to count on you.' },
    failed: { es: '', en: '' },
    steps: Object.freeze([
      Object.freeze({ kind: 'respectPorts', atLeast: 20, ports: 2, label: { es: 'Respeto {n} en {ports} puertos distintos', en: 'Respect {n} in {ports} different ports' } }),
    ]),
    reward: Object.freeze({ coins: 400, respect: { home: 3 } }) }),
  Object.freeze({ id: 's1-gremio', chain: 'side', requires: ['m1-oficio'], optional: true, deadline: null,
    title: { es: 'Nombre en casa', en: 'A name at home' },
    intro: { es: 'El gremio de tu villa mira cómo trabajas en casa antes de hablar de ti fuera. Alcanza respeto 20 en tu puerto de origen y te saludarán por tu nombre.', en: 'Your town guild watches how you work at home before speaking of you abroad. Reach respect 20 in your home port and they will greet you by name.' },
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
  Object.freeze({ id: 's3-long-name', chain: 'side', requires: ['m1-oficio'], optional: true,
    feature: 'longMissions', duration: 730, failure: Object.freeze({ reputation: -2, cooldown: 14 }),
    title: { es: 'Una palabra duradera', en: 'A lasting word' },
    intro: { es: 'Gana respeto 30 en tu puerto de origen durante los próximos 730 días de campaña. Si vence el plazo, se revoca solo este encargo: reputación local −2 y 14 días sin nuevos encargos opcionales.', en: 'Reach respect 30 in your home port within the next 730 campaign days. Expiry revokes only this mission: local reputation −2 and 14 days without new optional offers.' },
    done: { es: 'Tu palabra perdura. La casa sigue su camino.', en: 'Your word endures. The house continues its journey.' },
    failedShort: { es: 'Revocado: reputación local −2', en: 'Revoked: local reputation −2' },
    failed: { es: 'Encargo revocado: reputación local −2, una sola vez. Los nuevos encargos opcionales vuelven tras 14 días de campaña; los ya aceptados y la cadena principal continúan.', en: 'Mission revoked: local reputation −2, once only. New optional offers return after 14 campaign days; accepted missions and the main chain continue.' },
    steps: Object.freeze([Object.freeze({ kind: 'respect', city: 'home', atLeast: 30,
      label: { es: 'Respeto {n} en tu puerto de origen', en: 'Respect {n} in your home port' } })]) }),
  Object.freeze({ id: 's4-next-word', chain: 'side', requires: [], resolved: 's3-long-name', optional: true, feature: 'longMissions',
    title: { es: 'Volver a las cuentas', en: 'Back to the books' },
    intro: { es: 'El gremio vuelve a ofrecer un encargo: lee tu informe semanal.', en: 'The guild offers another mission: read your weekly report.' },
    done: { es: 'Las cuentas están claras.', en: 'The accounts are clear.' },
    failed: { es: '', en: '' },
    steps: Object.freeze([Object.freeze({ kind: 'readReport', label: { es: 'Lee tu informe semanal', en: 'Read your weekly report' } })]) }),

]);
export const CAMPAIGNS = MISSIONS; // backwards-compatible name for older imports
export function campaignById(id) { return MISSIONS.find((m) => m.id === id) ?? null; }

// Multi-year content belongs only to open-ended campaigns: the standard game
// still ends after 365 days. Never extend that limit to make this opt-in work.
const longEnabled = (g) => g.longMissions === true && g.noGoal === true;
const enabled = (g, m) => !m.feature || (g[m.feature] === true && g.noGoal === true);
const clockDay = (g) => g.campaign.longClock?.day ?? 0;
// Optional clock is lazy: no new keys in games that never opt in. Daily tutorial ticks
// advance only the observation, so neither deadlines nor cooldowns consume tutorial time.
function observeClock(g) {
  if (!longEnabled(g)) return;
  const c = g.campaign;
  c.longClock ??= { day: 0, lastDay: g.day };
  if (!tutorialActive(g)) c.longClock.day += Math.max(0, g.day - c.longClock.lastDay);
  c.longClock.lastDay = g.day;
}
function expireOptional(g, h) {
  if (!longEnabled(g)) return;
  for (const id of g.campaign.active) {
    const m = campaignById(id), st = g.campaign.missions[id];
    if (!m?.duration || !enabled(g, m) || !st || st.done || st.failed) continue;
    // Missing timing in a partial old save gets a full relative window.
    if (!Number.isFinite(st.deadlineDay)) st.deadlineDay = clockDay(g) + m.duration;
    if (clockDay(g) <= st.deadlineDay) continue;
    st.failed = true; // persisted guard: repeat ticks/events/reloads cannot apply twice
    addRep(g, g.profile?.home, m.failure.reputation);
    g.campaign.optionalUntil = Math.max(g.campaign.optionalUntil ?? 0, clockDay(g) + m.failure.cooldown);
    h.post(g, 'mission', { txt: m.failed });
  }
}

const EVENT_KINDS = new Set(['buy', 'sell', 'sail', 'arrive', 'readReport']);
const NO_HELPERS = Object.freeze({ post: () => {}, addRespect: () => {}, repOf: () => 0, netWorth: () => 0 });
/** Current saved campaign shape; anything else is a pre-engine save and must be normalised or ignored, never crash. */
export function campaignShapeOk(c) { return !!c && Array.isArray(c.active) && !!c.missions && typeof c.missions === 'object'; }

export function newCampaign(id = 'm1-oficio') {
  if (!campaignById(id)) throw Error('unknown campaign');
  return { active: [id], missions: { [id]: { step: 0, count: 0, done: false, failed: false } } };
}

/** Activate missions whose requirements are met and that were never offered. Branches are
 *  just several missions requiring the same parent. */
function activate(g, post) {
  const c = g.campaign; if (!campaignShapeOk(c)) return;
  for (const m of MISSIONS) {
    if (c.missions[m.id] || !enabled(g, m)) continue;
    if (m.resolved && !c.missions[m.resolved]?.done && !c.missions[m.resolved]?.failed) continue;
    if (longEnabled(g) && m.optional && clockDay(g) < (c.optionalUntil ?? 0)) continue;
    if (m.requires.every((r) => c.missions[r]?.done)) {
      c.missions[m.id] = { step: 0, count: 0, done: false, failed: false };
      if (m.duration) c.missions[m.id].deadlineDay = clockDay(g) + m.duration;
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

/** Explicit successful player-action events only; optional expiry is checked before progress. */
export function campaignEvent(g, event, h = NO_HELPERS) {
  const c = g.campaign; if (!campaignShapeOk(c) || !event || typeof event.kind !== 'string') return false;
  observeClock(g);
  if (tutorialActive(g)) return false; // missions stay frozen until the tutorial is done or skipped (owner decision, 25 Oct 2026)
  expireOptional(g, h);
  let changed = false;
  for (const id of [...c.active]) {
    const m = campaignById(id), st = c.missions[id];
    if (!m || !enabled(g, m) || !st || st.done || st.failed) continue;
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
  if (step.kind === 'respectPorts') return portsWithRespect(g, step, h) >= step.ports;
  if (step.kind === 'worth') return h.netWorth(g) >= step.atLeast;
  if (step.kind === 'fleet') return (g.ships ?? []).length >= step.ships;
  if (step.kind === 'build') return Object.values(g.buildings ?? {}).some((plots) => Object.values(plots).some((b) => b.type === step.type && b.state === 'active'));
  if (step.kind === 'warehouse') return Object.keys(g.warehouses ?? {}).length > 0;
  return false;
}
/** Ports whose respect reaches the step's bar: the engine counts them for respectPorts steps. */
function portsWithRespect(g, step, h) {
  return Object.keys(g.market ?? {}).filter((city) => h.repOf(g, city) >= step.atLeast).length;
}
/** Daily: deadlines fail missions, condition steps complete themselves, new missions activate. */
export function campaignTick(g, h = NO_HELPERS) {
  const c = g.campaign; if (!campaignShapeOk(c)) return;
  observeClock(g);
  if (tutorialActive(g)) return; // no activation, progress or deadlines while the tutorial runs
  expireOptional(g, h);
  activate(g, h.post);
  for (const id of [...c.active]) {
    const m = campaignById(id), st = c.missions[id];
    if (!m || !enabled(g, m) || !st || st.done || st.failed) continue;
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
export function missionView(g, lang, h = NO_HELPERS) {
  const c = g.campaign; if (!c) return [];
  if (tutorialActive(g)) return []; // the arc appears once the tutorial is done or skipped
  return c.active.filter((id) => { const m = campaignById(id); return m && c.missions[id] && enabled(g, m); }).map((id) => {
    const m = campaignById(id), st = c.missions[id];
    const step = m.steps[Math.min(st.step, m.steps.length - 1)];
    return { id, optional: m.optional, title: m.title[lang] ?? m.title.es,
      stepLabel: st.failed && m.feature ? (m.failedShort?.[lang] ?? m.failedShort?.es ?? m.failed[lang] ?? m.failed.es) : st.done ? '' : (step.label[lang] ?? step.label.es).replace('{qty}', step.qty ?? '').replace('{n}', step.atLeast ?? '').replace('{ports}', step.ports ?? ''),
      progress: st.failed ? '' : step.qty && !st.done ? Math.min(st.count ?? 0, step.qty) + '/' + step.qty
        : step.kind === 'respectPorts' && !st.done ? portsWithRespect(g, step, h) + '/' + step.ports
        : step.kind === 'respect' && !st.done ? Math.min(Math.floor(h.repOf(g, step.city === 'home' ? g.profile?.home : step.city)), step.atLeast) + '/' + step.atLeast : '',
      daysLeft: m.duration && !st.done && !st.failed ? Math.max(0, st.deadlineDay - clockDay(g)) : m.deadline && !st.done && !st.failed ? m.deadline - g.day : null,
      done: st.done, failed: st.failed };
  });
}
