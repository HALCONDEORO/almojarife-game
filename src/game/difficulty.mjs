// Difficulty presets for a new game: starting cash and upkeep. Our own numbers; data only, no DOM.
export const DIFFICULTIES = {
  easy: { id: "easy", cash: 1000, upkeepMul: 0.8 },
  normal: { id: "normal", cash: 0, upkeepMul: 1 },
  hard: { id: "hard", cash: -500, upkeepMul: 1.25 },
};
export const DIFFICULTY_IDS = Object.keys(DIFFICULTIES);
/** Options to pass to newGame for a preset; an unknown id falls back to normal. */
export function difficultyOpts(id) {
  const d = Object.hasOwn(DIFFICULTIES, id) ? DIFFICULTIES[id] : DIFFICULTIES.normal;
  return { cash: d.cash, upkeepMul: d.upkeepMul, difficulty: d.id };
}
