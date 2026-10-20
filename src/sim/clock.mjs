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
