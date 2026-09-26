// The scan's sound, made in the browser (no sound files to download).
//
//   searching  a soft, airy shimmer while the phone is looking for the right
//              position. It gets a little brighter as the client gets closer,
//              and goes silent the moment everything is right.
//   chime      our own "done" sound: two bright, warm bell notes rising,
//              in the spirit of a payment confirmation. (Apple's actual
//              Apple Pay sound belongs to Apple and is not used.)
//   shutter    a very quiet click when a photo is taken.
//
// Phones only allow sound after the person has tapped something, so the
// scan's Start button calls sound.unlock(). All volumes are deliberately low:
// it should feel like a detail, not a noise.

let ctx: AudioContext | null = null;
let search: { gain: GainNode; filter: BiquadFilterNode; stop: () => void } | null = null;

function audio(): AudioContext | null {
  try { ctx ??= new AudioContext(); return ctx; } catch { return null; }
}

// A bell-like note: a pure tone plus a quieter overtone, struck and fading.
function bell(freq: number, at: number, length: number, volume: number) {
  const c = audio(); if (!c) return;
  for (const [mult, share] of [[1, 1], [2.76, 0.25], [5.4, 0.08]] as const) {
    const o = c.createOscillator(), g = c.createGain();
    o.type = "sine"; o.frequency.value = freq * mult;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(volume * share, at + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, at + length);
    o.connect(g).connect(c.destination);
    o.start(at); o.stop(at + length + 0.05);
  }
}

export const sound = {
  unlock() {
    const c = audio(); if (!c) return;
    void c.resume();
    const o = c.createOscillator(), g = c.createGain(); // a silent blip wakes iOS audio
    g.gain.value = 0; o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.01);
  },

  // closeness: 0 (far off) … 1 (almost there). Call it every check.
  searching(closeness: number) {
    const c = audio(); if (!c) return;
    if (!search) {
      // Filtered noise: sounds like air or a soft brush, not a beep.
      const noise = c.createBufferSource();
      const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      noise.buffer = buf; noise.loop = true;
      const filter = c.createBiquadFilter();
      filter.type = "bandpass"; filter.Q.value = 6; filter.frequency.value = 1800;
      // A slow wobble in volume makes it feel alive rather than static.
      const gain = c.createGain(); gain.gain.value = 0;
      const lfo = c.createOscillator(), lfoGain = c.createGain();
      lfo.frequency.value = 0.9; lfoGain.gain.value = 0.004;
      lfo.connect(lfoGain).connect(gain.gain);
      noise.connect(filter).connect(gain).connect(c.destination);
      noise.start(); lfo.start();
      search = { gain, filter, stop: () => { try { noise.stop(); lfo.stop(); } catch { /* already stopped */ } } };
    }
    const t = c.currentTime;
    search.gain.gain.setTargetAtTime(0.012 + 0.012 * closeness, t, 0.25);
    search.filter.frequency.setTargetAtTime(1500 + 2500 * closeness, t, 0.25);
  },

  quiet() {
    const c = audio(); if (!c || !search) return;
    search.gain.gain.setTargetAtTime(0, c.currentTime, 0.08);
  },

  stop() {
    if (search) { search.stop(); search = null; }
  },

  shutter() {
    const c = audio(); if (!c) return;
    const t = c.currentTime;
    const n = c.createBufferSource(), buf = c.createBuffer(1, c.sampleRate * 0.05, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3;
    n.buffer = buf;
    const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 2500;
    const g = c.createGain(); g.gain.value = 0.06;
    n.connect(f).connect(g).connect(c.destination); n.start(t);
  },

  chime() {
    const c = audio(); if (!c) return;
    this.quiet();
    const t = c.currentTime + 0.02;
    bell(1318.5, t, 0.9, 0.09);        // E6
    bell(1975.5, t + 0.11, 1.3, 0.08); // B6, a fifth above: bright and resolved
  },
};
