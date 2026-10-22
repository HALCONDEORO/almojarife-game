// Game clock: the tick is the simulation unit, the day stays the accounting unit.
// 240 ticks per day = 10 ticks per hour, so the low part of the tick is the time of day.
export const TICKS_PER_DAY = 240, TICKS_PER_HOUR = 10, HOURS_PER_DAY = 24;
/** Whole days elapsed (the accounting day). */
export const dayOf = (tick) => Math.floor(tick / TICKS_PER_DAY);
/** Hour of the day, 0-23. */
export const hourOf = (tick) => Math.floor((tick % TICKS_PER_DAY) / TICKS_PER_HOUR);
/** Ticks for a distance at a speed in km/day, before crew/captain/wind factors. */
export const ticksForKm = (km, kmPerDay) => (km / kmPerDay) * TICKS_PER_DAY;
/** Split an absolute tick into {day, hour}; the view formats it with the active locale. */
export const tickParts = (tick) => ({ day: dayOf(tick), hour: hourOf(tick) });

// Game calendar: day 0 is 1 January 1480, deep winter to match seasonOf(day 0) = winter.
// Plain 365-day years with the usual month lengths; leap years are ignored on purpose,
// so the date of a game day is pure arithmetic and never drifts from the day count.
export const START_YEAR = 1480;
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
/** Calendar date of a game day: {year, month (0-11), day (1-31)}. */
export function calendarOf(day) {
  const year = START_YEAR + Math.floor(day / 365);
  let doy = day % 365, month = 0;
  while (doy >= MONTH_DAYS[month]) doy -= MONTH_DAYS[month++];
  return { year, month, day: doy + 1 };
}
