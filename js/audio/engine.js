// Original synthesized skate bed. No samples, no extra libs.

import { AUDIO_MASTER } from "../constants.js";

function noiseBuffer(ctx, seconds, brown) {
  const n = Math.max(1, (ctx.sampleRate * seconds) | 0);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) {
      last += 0.02 * w;
      last *= 0.98;
      d[i] = last * 3.2;
    } else {
      d[i] = w;
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

export function createAudio() {
  let ctx = null;
  let master;
  let white;
  let rollGain;
  let rollFilter;
  let grindGain;
  let grindFilter;
  let whooshGain;
  let ambGain;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = AUDIO_MASTER;
    master.connect(ctx.destination);

    white = noiseBuffer(ctx, 1.2, false);
    const brown = noiseBuffer(ctx, 1.6, true);

    rollFilter = ctx.createBiquadFilter();
    rollFilter.type = "bandpass";
    rollFilter.frequency.value = 520;
    rollFilter.Q.value = 0.7;
    rollGain = ctx.createGain();
    rollGain.gain.value = 0;
    loopNoise(ctx, white, rollFilter);
    rollFilter.connect(rollGain);
    rollGain.connect(master);

    grindFilter = ctx.createBiquadFilter();
    grindFilter.type = "bandpass";
    grindFilter.frequency.value = 1400;
    grindFilter.Q.value = 2.4;
    grindGain = ctx.createGain();
    grindGain.gain.value = 0;
    loopNoise(ctx, white, grindFilter);
    grindFilter.connect(grindGain);
    grindGain.connect(master);

    whooshGain = ctx.createGain();
    whooshGain.gain.value = 0;
    const whooshHp = ctx.createBiquadFilter();
    whooshHp.type = "highpass";
    whooshHp.frequency.value = 900;
    loopNoise(ctx, white, whooshHp);
    whooshHp.connect(whooshGain);
    whooshGain.connect(master);

    ambGain = ctx.createGain();
    ambGain.gain.value = 0.04;
    const ambLp = ctx.createBiquadFilter();
    ambLp.type = "lowpass";
    ambLp.frequency.value = 180;
    loopNoise(ctx, brown, ambLp);
    ambLp.connect(ambGain);
    ambGain.connect(master);

    return ctx;
  }

  function burst(dur, hpHz, gain, freqSweep) {
    if (!ctx || ctx.state !== "running") return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = white;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = hpHz;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    if (freqSweep) hp.frequency.exponentialRampToValueAtTime(freqSweep, t + dur);
    src.connect(hp);
    hp.connect(g);
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
    tick(speed, grounded, grinding, flipRate) {
      if (!ctx || ctx.state !== "running") return;
      const t = ctx.currentTime;
      const roll = grounded && !grinding ? Math.min(1, speed / 6) : 0;
      rollGain.gain.setTargetAtTime(roll * 0.16, t, 0.06);
      rollFilter.frequency.setTargetAtTime(380 + speed * 160, t, 0.1);
      const grind = grinding ? Math.min(0.2, 0.07 + speed * 0.035) : 0;
      grindGain.gain.setTargetAtTime(grind, t, 0.04);
      grindFilter.frequency.setTargetAtTime(1100 + speed * 90, t, 0.08);
      const spin = Math.min(1, Math.abs(flipRate) / 10);
      whooshGain.gain.setTargetAtTime(spin * 0.12, t, 0.05);
    },
    push() {
      burst(0.12, 200, 0.18, 900);
    },
    pop() {
      thump(220, 0.09, 0.22);
      burst(0.08, 400, 0.14, 1800);
    },
    land(downSpeed) {
      const g = Math.min(0.32, 0.08 + Math.abs(downSpeed) * 0.04);
      thump(90, 0.14, g);
      burst(0.1, 120, g * 0.6, 400);
    },
    bail() {
      thump(70, 0.22, 0.28);
      burst(0.2, 80, 0.2, 300);
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

export function selfCheckAudio() {
  const n = 64;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += Math.random() * 2 - 1;
  if (!Number.isFinite(sum / n)) throw new Error("audio self-check: noise");
}
