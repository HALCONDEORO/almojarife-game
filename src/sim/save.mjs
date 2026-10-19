// Save format with a schema version. Plain JSON, no functions, so a save is portable.
export const SAVE_VERSION = 1;

/** Migrations run in order: MIGRATIONS[n] upgrades a version-n save to n+1. */
export const MIGRATIONS = {};

export function makeSave({ seed, rngState, day, market, player = {} }) {
  return { version: SAVE_VERSION, seed, rngState, day, market, player };
}

export function serialize(save) {
  return JSON.stringify(save);
}

/** Parse, migrate to the current version, validate. Throws a clear Error on any problem. */
export function deserialize(text) {
  let s;
  try { s = JSON.parse(text); } catch { throw new Error("save: not valid JSON"); }
  if (!s || typeof s !== "object" || !Number.isInteger(s.version)) throw new Error("save: missing version");
  if (s.version > SAVE_VERSION) throw new Error(`save: version ${s.version} is newer than this game (${SAVE_VERSION})`);
  while (s.version < SAVE_VERSION) {
    const up = MIGRATIONS[s.version];
    if (!up) throw new Error(`save: no migration from version ${s.version}`);
    s = up(s);
  }
  validate(s);
  return s;
}

function validate(s) {
  if (!Number.isInteger(s.seed)) throw new Error("save: bad seed");
  if (!Number.isInteger(s.rngState)) throw new Error("save: bad rngState");
  if (!Number.isInteger(s.day) || s.day < 0) throw new Error("save: bad day");
  if (!s.market || typeof s.market !== "object") throw new Error("save: bad market");
  for (const [city, goods] of Object.entries(s.market))
    for (const [g, e] of Object.entries(goods))
      if (!Number.isFinite(e.stock) || e.stock < 0) throw new Error(`save: bad stock ${city}/${g}`);
}
