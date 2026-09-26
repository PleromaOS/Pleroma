// Tiny tones made in the browser, for guiding the side photos by ear.
// No sound files to download. Phones only allow sound after the person has
// tapped something, so a screen calls sound.unlock() from a tap first.

let ctx: AudioContext | null = null;

function beep(freq: number, ms: number, delay = 0) {
  try {
    ctx ??= new AudioContext();
    const o = ctx.createOscillator(), gain = ctx.createGain();
    o.frequency.value = freq; gain.gain.value = 0.08;
    o.connect(gain).connect(ctx.destination);
    const t = ctx.currentTime + delay / 1000;
    o.start(t); o.stop(t + ms / 1000);
  } catch { /* no sound available: the screen still guides */ }
}

export const sound = {
  unlock() { try { ctx ??= new AudioContext(); void ctx.resume(); beep(1, 1); } catch { /* ignore */ } },
  tick() { beep(880, 40); },
  done() { beep(660, 90); beep(990, 140, 110); },
};
