// View pacing only: no changes to the simulation's calendar or economy rules.
export const HUMAN_MS_PER_DAY = 20_000;
export const LEGACY_MS_PER_DAY = 1_500;
export const HUMAN_SPEEDS = Object.freeze([1, 2, 4, 8]);
export const LEGACY_SPEEDS = Object.freeze([1, 2, 4]);
export const dayDurationMs = automatic => automatic ? HUMAN_MS_PER_DAY : LEGACY_MS_PER_DAY;
export function nextTimeSpeed(speed, automatic) {
  const choices = automatic ? HUMAN_SPEEDS : LEGACY_SPEEDS;
  return choices[(choices.indexOf(speed) + 1) % choices.length];
}
export const arrivalNeedsDecision = (ship, automatic) => !automatic || !ship.route;
