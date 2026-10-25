// Sound effects: Kenney "Casino Audio" and "Interface Sounds" packs, both CC0
// (https://kenney.nl) and rubberduck's "100 CC0 SFX" (opengameart.org); both CC0, license copies in web/audio/LICENSE-*.txt.
const FILES = { buy: "audio/buy.ogg", sell: "audio/sell.ogg", click: "audio/click.ogg", confirm: "audio/confirm.ogg", error: "audio/error.ogg", sail: "audio/sail.ogg", arrive: "audio/arrive.ogg", open: "audio/open.ogg", close: "audio/close.ogg" };
const cache = {};
export const soundOn = () => localStorage.getItem("sound") !== "0"; // on by default; Ajustes can mute
export function sfx(name) {
  if (!soundOn() || !FILES[name]) return;
  try {
    const a = cache[name] ?? (cache[name] = new Audio(FILES[name]));
    a.currentTime = 0; a.volume = 0.45;
    a.play().catch(() => {}); // browsers block audio before the first user gesture: stay silent, never throw
  } catch { /* no Audio in this environment (tests) */ }
}
