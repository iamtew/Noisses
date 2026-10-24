// Original synthesized skate bed. No samples, no extra libs.
// Source is pink, not white. Each voice is a resonant filter.
// A high shelf on the master catches leftover hiss.

import {
  AUDIO_MASTER,
  GRIND_HZ,
  GRIND_HZ_SPEED,
  GRIND_LP,
  GRIND_Q,
  NOISE_SHELF_DB,
  NOISE_SHELF_HZ,
  ROLL_HZ,
  ROLL_HZ_SPEED,
  ROLL_Q,
  WHOOSH_HZ,
  WHOOSH_Q,
} from "../constants.js";

function noiseBuffer(ctx, seconds, kind) {
  const n = Math.max(1, (ctx.sampleRate * seconds) | 0);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === "brown") {
      last += 0.02 * w;
      last *= 0.98;
      d[i] = last * 3.2;
    } else {
      // Paul Kellet pink. Rolls off the fizz white noise is made of.
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  }
  return buf;
}

function loopNoise(ctx, buf, dest) {
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  src.connect(dest);
  src.start();
  return src;
}

function biquad(ctx, type, freq, q) {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

export function createAudio() {
  let ctx = null;
  let master;
  let pink;
  let rollGain;
  let rollFilter;
  let grindGain;
  let grindFilter;
  let whooshGain;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = AUDIO_MASTER;
    const shelf = biquad(ctx, "highshelf", NOISE_SHELF_HZ, 0.7);
    shelf.gain.value = NOISE_SHELF_DB;
    master.connect(shelf);
    shelf.connect(ctx.destination);

    pink = noiseBuffer(ctx, 2, "pink");
    const brown = noiseBuffer(ctx, 1.6, "brown");

    const rollHp = biquad(ctx, "highpass", 70, 0.7);
    rollFilter = biquad(ctx, "lowpass", ROLL_HZ, ROLL_Q);
    rollGain = ctx.createGain();
    rollGain.gain.value = 0;
    loopNoise(ctx, pink, rollHp);
    rollHp.connect(rollFilter);
    rollFilter.connect(rollGain);
    rollGain.connect(master);

    grindFilter = biquad(ctx, "bandpass", GRIND_HZ, GRIND_Q);
    const grindLp = biquad(ctx, "lowpass", GRIND_LP, 0.7);
    grindGain = ctx.createGain();
    grindGain.gain.value = 0;
    loopNoise(ctx, pink, grindFilter);
    grindFilter.connect(grindLp);
    grindLp.connect(grindGain);
    grindGain.connect(master);

    const whooshBp = biquad(ctx, "bandpass", WHOOSH_HZ, WHOOSH_Q);
    const whooshLp = biquad(ctx, "lowpass", 1800, 0.7);
    whooshGain = ctx.createGain();
    whooshGain.gain.value = 0;
    loopNoise(ctx, pink, whooshBp);
    whooshBp.connect(whooshLp);
    whooshLp.connect(whooshGain);
    whooshGain.connect(master);

    const ambGain = ctx.createGain();
    ambGain.gain.value = 0.045;
    const ambLp = biquad(ctx, "lowpass", 160, 0.9);
    loopNoise(ctx, brown, ambLp);
    ambLp.connect(ambGain);
    ambGain.connect(master);

    return ctx;
  }

  function burst(dur, center, q, gain, sweepTo) {
    if (!ctx || ctx.state !== "running") return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = pink;
    const bp = biquad(ctx, "bandpass", Math.max(40, center), q);
    const lp = biquad(ctx, "lowpass", 2400, 0.7);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    if (sweepTo) {
      bp.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), t + dur);
    }
    src.connect(bp);
    bp.connect(lp);
    lp.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  function thump(freq, dur, gain) {
    if (!ctx || ctx.state !== "running") return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.45), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  return {
    resume() {
      const c = ensure();
      if (c && c.state === "suspended") c.resume();
    },
    setVolume(v) {
      if (!master || !ctx) return;
      master.gain.setTargetAtTime(Math.max(0, v), ctx.currentTime, 0.04);
    },
    tick(speed, grounded, grinding, flipRate) {
      if (!ctx || ctx.state !== "running") return;
      const t = ctx.currentTime;
      const roll = grounded && !grinding ? Math.min(1, speed / 6) : 0;
      rollGain.gain.setTargetAtTime(roll * 0.22, t, 0.06);
      rollFilter.frequency.setTargetAtTime(ROLL_HZ + speed * ROLL_HZ_SPEED, t, 0.1);
      const grind = grinding ? Math.min(0.12, 0.04 + speed * 0.02) : 0;
      grindGain.gain.setTargetAtTime(grind, t, 0.04);
      grindFilter.frequency.setTargetAtTime(GRIND_HZ + speed * GRIND_HZ_SPEED, t, 0.08);
      const spin = Math.min(1, Math.abs(flipRate) / 10);
      whooshGain.gain.setTargetAtTime(spin * 0.08, t, 0.05);
    },
    push() {
      burst(0.14, 480, 3.2, 0.2, 160);
    },
    pop() {
      thump(220, 0.09, 0.22);
      burst(0.07, 980, 4.2, 0.12, 360);
    },
    land(downSpeed) {
      const g = Math.min(0.32, 0.08 + Math.abs(downSpeed) * 0.04);
      thump(90, 0.14, g);
      burst(0.12, 280, 2.2, g * 0.45, 80);
    },
    bail() {
      thump(70, 0.22, 0.28);
      burst(0.2, 200, 1.6, 0.14, 60);
    },
    spawnSet() {
      thump(330, 0.12, 0.12);
    },
    spawnGo() {
      thump(220, 0.1, 0.1);
      thump(440, 0.16, 0.08);
    },
  };
}

/** Resonant lowpass must peak at the cutoff and be quiet in the hiss band. */
export function selfCheckAudio() {
  const AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!AC) return;
  const ctx = new AC(1, 128, 44100);
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = ROLL_HZ;
  f.Q.value = ROLL_Q;
  const hz = new Float32Array([80, ROLL_HZ, 6000]);
  const mag = new Float32Array(3);
  const phase = new Float32Array(3);
  f.getFrequencyResponse(hz, mag, phase);
  if (!(mag[1] > mag[0] && mag[1] > mag[2] * 4)) {
    throw new Error("audio self-check: roll filter is not resonant");
  }
}
