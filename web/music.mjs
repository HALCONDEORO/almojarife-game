// Menu music: "If My Complaints Could Passions Move" (John Dowland, 1597; recording by
// Of Far Different Nature, CC0 - see web/audio/MUSIC-dowland.md). Loops softly on the
// title screen, respects the Ajustes sound switch (soundOn) and never throws: browsers
// that block audio before the first gesture simply stay silent until one.
import { soundOn, setMenuMode } from "./audio.mjs";

const SRC = "audio/menu-dowland.ogg", VOLUME = 0.22;

export function menuMusic(env = {}) {
  const doc = env.document ?? (typeof document !== "undefined" ? document : null);
  let el = null, wanted = false;
  const ensure = () => { if (!el && typeof Audio !== "undefined") { el = new Audio(SRC); el.loop = true; el.volume = VOLUME; } return el; };
  const sync = () => {
    const on = wanted && soundOn();
    const a = on ? ensure() : el;
    if (!a) return;
    if (on && a.paused) a.play().catch(() => {}); // blocked before the first gesture: stays silent, retries on the next sync
    else if (!on && !a.paused) a.pause();
  };
  if (env.auto !== false && typeof setInterval !== "undefined") {
    setInterval(sync, 1500); // picks up mute/unmute from Ajustes and late autoplay unlocks
    doc?.addEventListener?.("pointerdown", sync, { passive: true }); // a gesture unlocks autoplay: start at once
    doc?.addEventListener?.("keydown", sync);
  }
  return {
    showTitle() { setMenuMode(true); wanted = true; sync(); }, // the title screen wants music; the game rotation stops
    leaveTitle() { setMenuMode(false); wanted = false; sync(); },
    sync,
    get playing() { return !!el && !el.paused; },
  };
}
