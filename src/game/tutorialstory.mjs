// Original father-to-child story and small one-time learning awards, in game coins only.
export const TUTORIAL_AWARD = 25;
const AWARD_FIELDS = new Set(['bought', 'sold', 'sailed', 'reviewed', 'hall', 'contract']);
export function awardTutorialStep(game, field, wasComplete) {
  if (game.tut?.story !== true || !Number.isFinite(game.cash) || wasComplete || !AWARD_FIELDS.has(field)) return 0;
  const awards = game.tutorialAwards ??= {};
  if (Object.hasOwn(awards, field)) return 0;
  awards[field] = TUTORIAL_AWARD;
  game.cash += TUTORIAL_AWARD;
  return TUTORIAL_AWARD;
}
export const FATHER_STORY = {
 es: {
  buy: ['La primera lección de tu padre', 'Hijo, esta casa mercantil empieza contigo. Entra en el Mercado y compra una mercancía barata. No llenes la bodega sin mirar el precio.'],
  sell: ['El valor de una buena venta', 'Ya llevas tu primera carga. Busca un puerto donde falte esa mercancía, zarpa y véndela con beneficio. Lo que pagaste por ella también cuenta.'],
  sail: ['Aprende a leer la costa', 'Elige un puerto en el mapa y ordena zarpar con clic derecho. El tiempo debe estar en marcha para que el barco llegue.'],
  yard: ['Cuida de tu barco', 'Entra en el Astillero con tu barco atracado aquí. Si el casco está sano, la revisión no cuesta nada. Si está dañado, encarga la reparación al precio indicado. Nunca dañaremos el barco para darte una lección.'],
  hall: ['Conoce a quienes gobiernan', 'Visita el Ayuntamiento. El concejo fija tasas y ofrece encargos: una casa mercantil también necesita conocer su puerto.'],
  contract: ['Tu primer compromiso', 'Acepta un encargo del concejo. Mira qué mercancía pide y cuándo vence antes de comprometerte. Después seguirás por tu cuenta.'],
  done: ['Ahora llevas el timón', 'Has terminado mis lecciones. Tu casa mercantil está en tus manos. Las misiones del concejo ya pueden empezar.'],
 },
 en: {
  buy: ["Your father's first lesson", 'My child, this trading house begins with you. Enter the Market and buy a cheap good. Check the price before filling the hold.'],
  sell: ['The value of a good sale', 'You have your first cargo. Find a port where it is scarce, sail there and sell at a profit. What you paid for it matters too.'],
  sail: ['Learn to read the coast', 'Pick a port on the map and right-click to order departure. Time must be running for your ship to arrive.'],
  yard: ['Care for your ship', 'Visit the Shipyard with your ship docked here. A sound hull is inspected for free. If damaged, order repairs at the quoted price. We never damage the ship to teach a lesson.'],
  hall: ['Meet the council', 'Visit the Town hall. The council sets fees and offers contracts. A trading house needs to know its port.'],
  contract: ['Your first commitment', 'Accept a council contract. Check the requested goods and the deadline before committing. Then you will carry on by yourself.'],
  done: ['The helm is yours', 'You have finished my lessons. The trading house is in your hands. The council missions can now begin.'],
 },
};
export function tutorialStoryNotice(game, step, language) {
  if (game.over || game.tut?.story !== true || game.tut.skipped || !step) return null;
  if (game.tut.storySeen === step) return null;
  const text = (FATHER_STORY[language] ?? FATHER_STORY.es)[step];
  if (!text) return null;
  const total = Object.values(game.tutorialAwards ?? {}).reduce((sum, amount) => sum + amount, 0);
  return { step, title: text[0], body: text[1], total, reward: TUTORIAL_AWARD };
}
export function acknowledgeTutorialStory(game, step) {
  if (game.tut?.story !== true) return false;
  game.tut.storySeen = step;
  return true;
}
