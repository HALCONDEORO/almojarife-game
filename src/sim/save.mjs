// Save format with a schema version. Plain JSON, no functions, so a save is portable.
export const SAVE_VERSION = 1;

/** Migrations run in order: MIGRATIONS[n] upgrades a version-n save to n+1. */
export const MIGRATIONS = {};

export function makeSave({ seed, rngState, day, market, player = {} }) {
  // Deep copy: later ticks must not change the saved object.
  return structuredClone({ version: SAVE_VERSION, seed, rngState, day, market, player });
}

export function serialize(save) {
  return JSON.stringify(save);
}

/** Parse, migrate to the current version, validate. Throws a clear Error on any problem. */
export function deserialize(text, { migrations = MIGRATIONS, version = SAVE_VERSION } = {}) {
  let s;
  try { s = JSON.parse(text); } catch { throw new Error("save: not valid JSON"); }
  if (!s || typeof s !== "object" || !Number.isInteger(s.version)) throw new Error("save: missing version");
  if (s.version > version) throw new Error(`save: version ${s.version} is newer than this game (${version})`);
  while (s.version < version) {
    const prev = s.version;
    const up = migrations[prev];
    if (!up) throw new Error(`save: no migration from version ${prev}`);
    s = up(s);
    if (!s || typeof s !== "object" || s.version !== prev + 1) throw new Error(`save: migration from ${prev} must return version ${prev + 1}`);
  }
  validate(s);
  return s;
}

const isU32 = (n) => Number.isInteger(n) && n >= 0 && n <= 0xffffffff;
const isObj = (o) => o !== null && typeof o === "object" && !Array.isArray(o);

/** Rebuild a running game from a save: the RNG state is restored. */
export function loadGame(text, makeRng, opts) {
  const save = deserialize(text, opts);
  const rng = makeRng(save.seed);
  rng.setState(save.rngState);
  return { ...save, rng };
}

function validate(s) {
  if (!isU32(s.seed)) throw new Error("save: bad seed");
  if (!isU32(s.rngState)) throw new Error("save: bad rngState");
  if (!isObj(s.player)) throw new Error("save: bad player");
  if (!Number.isInteger(s.day) || s.day < 0) throw new Error("save: bad day");
  if (!isObj(s.market)) throw new Error("save: bad market");
  for (const [city, goods] of Object.entries(s.market)) {
    if (!isObj(goods)) throw new Error(`save: bad market entry ${city}`);
    for (const [g, e] of Object.entries(goods))
      if (!isObj(e) || !Number.isFinite(e.stock) || e.stock < 0) throw new Error(`save: bad stock ${city}/${g}`);
  }
}
