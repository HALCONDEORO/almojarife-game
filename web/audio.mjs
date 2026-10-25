// Sound effects: Kenney "Casino Audio" and "Interface Sounds" packs, both CC0
// (https://kenney.nl) rubberduck's "100 CC0 SFX" (opengameart.org) and CC0 stingers by kindland ("Rain and Thunders"), William Hector ("Horde War Drums"), RandomMind ("Medieval Minstrel Dance"), eXpl0it3r ("Applause in a Large Hall") and StarNinjas ("Crowd"), all opengameart.org; every pack CC0, license copies in web/audio/LICENSE-*.txt.
// Ambience: "Sea and River Wave Sounds" by randommind (CC0) at sea, "Crowded Pub" by bobjt (CC0)
// in port. Music in rotation: "A Tale of Water" by InspectorJ (CC BY 3.0), "Peaceful Village"
// by elerya (CC BY 3.0), "Dragon Tail Tavern" by jan125 (CC BY 4.0), all opengameart.org.
// Provenance for every file: web/audio/LICENSE-p3-sources.txt.
const FILES = { buy: "audio/buy.ogg", sell: "audio/sell.ogg", click: "audio/click.ogg", confirm: "audio/confirm.ogg", error: "audio/error.ogg", sail: "audio/sail.ogg", arrive: "audio/arrive.ogg", open: "audio/open.ogg", close: "audio/close.ogg", storm: "audio/storm.ogg", pirates: "audio/pirates.ogg", mission: "audio/mission.ogg", council: "audio/council.ogg", festival: "audio/festival.ogg", build: "audio/build.ogg", alert: "audio/alert.ogg" };
const cache = {};
export const soundOn = () => localStorage.getItem("sound") !== "0"; // on by default; Ajustes can mute
export function sfx(name) {
  if (!soundOn() || !FILES[name]) return;
  duckLoops();
  try {
    const a = cache[name] ?? (cache[name] = new Audio(FILES[name]));
    a.currentTime = 0; a.volume = 0.45;
    a.play().catch(() => {}); // browsers block audio before the first user gesture: stay silent, never throw
  } catch { /* no Audio in this environment (tests) */ }
}

const AMBIENCE = { sea: "audio/amb-sea.ogg", port: "audio/amb-port.ogg" };
const MUSIC = ["audio/music-water.ogg", "audio/music-village.ogg", "audio/music-tavern.ogg"];
const MUSIC_VOL = 0.30, AMB_VOL = 0.06; // ambience sits ~14 dB under the music
let amb = { name: null, el: null }, music = null, track = Math.floor(Math.random() * MUSIC.length);
const duck = (el, vol) => { if (!el) return; el.volume = vol * 0.3; setTimeout(() => { try { el.volume = vol; } catch {} }, 1200); };

/** Keep the ambience loop matching the context ("sea" | "port" | null); stops when sound is off. */
export function syncAmbience(name) {
  if (!soundOn()) name = null;
  if (amb.name === name) return;
  try { amb.el?.pause(); } catch {}
  amb = { name, el: null };
  if (!name) return;
  try {
    const el = new Audio(AMBIENCE[name]); el.loop = true; el.volume = AMB_VOL;
    el.play().catch(() => {}); amb.el = el;
  } catch { /* no Audio here */ }
}

/** Keep the music rotation going while sound is on; each track hands over to the next. */
export function syncMusic() {
  if (!soundOn()) { try { music?.pause(); } catch {} music = null; return; }
  if (music) return;
  try {
    const el = new Audio(MUSIC[track % MUSIC.length]); track++;
    el.volume = MUSIC_VOL;
    el.onended = () => { music = null; syncMusic(); };
    el.play().catch(() => { music = null; }); music = el;
  } catch { music = null; }
}

/** Dip ambience and music for a moment so a stinger reads clearly. */
export function duckLoops() { duck(amb.el, AMB_VOL); duck(music, MUSIC_VOL); }
