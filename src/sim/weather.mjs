// Regional weather field: prevailing winds by season, storm cells that drift with them, and a per-leg
// wind factor for sailing. Everything is a pure function of (lat, lon, day, seed): no state, no I/O,
// so saves, replays and tests always see the same weather. Distances in km, bearings in degrees
// (0 = north, 90 = east), wind direction is where the wind blows FROM (sailor's convention).
import { seasonOf } from "./market.mjs";

/** Deterministic hash → 0..1, stable across runs for the same string. */
function h1(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** Sea regions of the chart, checked in order; the first match wins. */
export const WEATHER_REGIONS = ["cantabrico", "mediterraneo", "estrecho", "berberia", "atlantico"];
const REGION_BOX = {
  cantabrico: { lat0: 42.0, lat1: 44.0, lon0: -10.0, lon1: -2.0 },
  mediterraneo: { lat0: 35.6, lat1: 42.0, lon0: -5.4, lon1: 4.0 },
  estrecho: { lat0: 35.0, lat1: 36.6, lon0: -6.0, lon1: -4.8 },
  berberia: { lat0: 33.0, lat1: 35.6, lon0: -8.0, lon1: -0.5 },
  atlantico: { lat0: 33.0, lat1: 42.0, lon0: -10.5, lon1: -6.0 },
};
/** Which region a point at sea belongs to. */
export function regionAt(lat, lon) {
  if (lat >= 42) return "cantabrico";
  if (lon > -5.4 && lat > 35.6) return "mediterraneo";
  if (lon > -6.0 && lon < -4.8 && lat <= 36.6) return "estrecho";
  if (lat <= 35.6 && lon > -8.0) return "berberia";
  return "atlantico";
}

/** Prevailing wind per region and season: [direction FROM, ±jitter, force 0..1, force jitter]. */
const WIND = {
  atlantico:    { winter: [250, 40, 0.85, 0.15], spring: [300, 30, 0.55, 0.15], summer: [340, 25, 0.55, 0.15], autumn: [270, 45, 0.65, 0.15] },
  cantabrico:   { winter: [260, 35, 0.90, 0.10], spring: [290, 30, 0.55, 0.15], summer: [280, 30, 0.45, 0.15], autumn: [250, 40, 0.75, 0.15] },
  estrecho:     { winter: [90, 0, 0.80, 0.20],   spring: [90, 0, 0.70, 0.20],  summer: [90, 0, 0.75, 0.20],  autumn: [90, 0, 0.70, 0.20] }, // levante/poniente chosen per day below
  mediterraneo: { winter: [300, 30, 0.70, 0.20], spring: [90, 40, 0.45, 0.15],  summer: [80, 30, 0.35, 0.15],  autumn: [290, 40, 0.55, 0.15] },
  berberia:     { winter: [240, 35, 0.65, 0.15], spring: [40, 30, 0.50, 0.15],  summer: [30, 30, 0.55, 0.15],  autumn: [250, 35, 0.55, 0.15] },
};

/** Wind at a point on a day: {region, dir (FROM, deg), force 0..1}. */
export function windAt(lat, lon, day, seed = 0) {
  const region = regionAt(lat, lon), season = seasonOf(day), w = WIND[region][season];
  const j = h1(`wind-dir:${seed}:${region}:${day}`);
  let dir = w[0] + (j - 0.5) * 2 * w[1];
  if (region === "estrecho") dir = j < (season === "summer" ? 0.65 : 0.5) ? 90 : 270; // levante or poniente through the funnel
  const force = Math.min(1, Math.max(0, w[2] + (h1(`wind-f:${seed}:${region}:${day}`) - 0.5) * 2 * w[3]));
  return { region, dir: (dir + 360) % 360, force };
}

const KM_PER_DEG_LAT = 111;
const kmLon = (lat) => 111 * Math.cos((lat * Math.PI) / 180);
const bearing = (a, b) => (Math.atan2((b.lon - a.lon) * kmLon((a.lat + b.lat) / 2), (b.lat - a.lat) * KM_PER_DEG_LAT) * 180) / Math.PI;

/**
 * Wind factor for sailing from `from` to `to` ({lat, lon}) on `day`: 0.8 (dead upwind in a blow)
 * to 1.2 (running before it), same range the flat leg roll always had, now tied to the chart.
 */
export function legWindFactor(from, to, day, seed = 0) {
  const mid = { lat: (from.lat + to.lat) / 2, lon: (from.lon + to.lon) / 2 };
  const w = windAt(mid.lat, mid.lon, day, seed);
  const toward = (w.dir + 180) % 360, course = (bearing(from, to) + 360) % 360;
  const align = Math.cos(((course - toward) * Math.PI) / 180);
  return Math.min(1.2, Math.max(0.8, Math.round((1 + 0.2 * align * w.force) * 1000) / 1000));
}

/** Storm cells per region and season (mean count; fractional parts roll daily). */
const STORM_COUNT = {
  cantabrico:   { winter: 2,   spring: 1,   summer: 0,   autumn: 1 },
  atlantico:    { winter: 2,   spring: 0.5, summer: 0,   autumn: 1 },
  mediterraneo: { winter: 1,   spring: 0,   summer: 0,   autumn: 1 },
  estrecho:     { winter: 0.5, spring: 0,   summer: 0,   autumn: 0.5 },
  berberia:     { winter: 0,   spring: 0,   summer: 0,   autumn: 0 },
};
const CELL_DAYS = 3; // a cell lives about three days and drifts with its region's wind
const CELL_DRIFT_KM_PER_DAY = 55;

/**
 * Storm cells over the chart on `day`: [{id, region, lat, lon, rKm, dir (drift, deg), force}].
 * Cells persist for CELL_DAYS epochs and move with the prevailing wind, so the chart and the
 * encounters below agree from save to save.
 */
export function stormsAt(day, seed = 0) {
  const season = seasonOf(day), epoch = Math.floor(day / CELL_DAYS), out = [];
  for (const region of WEATHER_REGIONS) {
    const mean = STORM_COUNT[region][season];
    const n = Math.floor(mean) + (h1(`storm-n:${seed}:${region}:${epoch}`) < mean % 1 ? 1 : 0);
    const box = REGION_BOX[region];
    for (let i = 0; i < n; i++) {
      const baseLat = box.lat0 + h1(`storm-la:${seed}:${region}:${epoch}:${i}`) * (box.lat1 - box.lat0);
      const baseLon = box.lon0 + h1(`storm-lo:${seed}:${region}:${epoch}:${i}`) * (box.lon1 - box.lon0);
      const age = day - epoch * CELL_DAYS, w = windAt(baseLat, baseLon, day, seed), toward = ((w.dir + 180) % 360) * (Math.PI / 180);
      const dKm = CELL_DRIFT_KM_PER_DAY * age;
      out.push({
        id: `${region}:${epoch}:${i}`, region,
        lat: baseLat + (Math.cos(toward) * dKm) / KM_PER_DEG_LAT,
        lon: baseLon + (Math.sin(toward) * dKm) / kmLon(baseLat),
        rKm: 60 + Math.round(h1(`storm-r:${seed}:${region}:${epoch}:${i}`) * 60),
        dir: w.dir, force: Math.min(1, w.force + 0.2),
      });
    }
  }
  return out;
}

/** Is a point inside a storm cell on `day`? */
export function inStorm(lat, lon, day, seed = 0) {
  return stormsAt(day, seed).some((c) => Math.hypot((lat - c.lat) * KM_PER_DEG_LAT, (lon - c.lon) * kmLon((lat + c.lat) / 2)) <= c.rKm);
}

/** Day-by-day outlook for a point: [{day, region, dir, force, storm}] for `days` days from `day`. */
export function forecast(lat, lon, day, seed = 0, days = 7) {
  const out = [];
  for (let d = 0; d < days; d++) {
    const w = windAt(lat, lon, day + d, seed);
    out.push({ day: day + d, region: w.region, dir: w.dir, force: w.force, storm: inStorm(lat, lon, day + d, seed) });
  }
  return out;
}
