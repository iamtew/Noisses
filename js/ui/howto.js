/** In-game how-to. Regular: left foot on the nose. Switch: right foot on the nose. */

import { dirArrow, dirStick, flipsFor, grindDemos, nosePop } from "../tricks/catalog.js";

export const HOWTO_BODY =
  "This is dual-stick foot control. Keyboard may watch. It may not skate.\n\n" +
  "Regular: left foot on the nose, right on the tail. Switch: the other way. Pause → Options Stance, or ○ on the ground, flips Regular ↔ Switch. It sticks.\n\n" +
  "Regular and switch pop with the back foot. Nollie and fakie pop with the front foot. Rolling tail-first is fakie (it notices itself). Switch plus fakie is nollie.\n\n" +
  "□ push left foot. × push right foot. Once per press, on the ground.\n" +
  "Stick Y is weight. Down on a stick is toward the tail. Up is toward the nose.\n" +
  "L2 / R2 turn. R1 low cam. ← backside · → frontside cam. Hold D-pad down to plant a spawn. Hold up to come back.\n\n" +
  "Ollie: hold the back stick down, flick the front stick up. Kickflip: hold back down, flick front right. Heelflip is front left. Nollie is that, front foot first. Catch is automatic near a full turn.\n" +
  "Grind the lip, not the magnet. Options pauses. Hold Options for the nerd sliders.\n" +
  "Pause → Options is hoodie, day/night, audio, Regular/Switch, and those sliders. Time scale lives in advanced.\n" +
  "△ steps off the board. It lives in the left hand, graphic out, truck in the fist. △ again gets back on.\n" +
  "Off the board the left stick walks, the right stick swings the camera, × jumps, and ×× runs.\n" +
  "L3+R3 together paints the sticks: left red, right purple.";

export const RIDES = ["normal", "fakie", "switch", "nollie"];
export const KINDS = ["flips", "grinds"];

function k(t, lx, ly, rx, ry) {
  return { t, l: [lx, ly], r: [rx, ry] };
}

const REST = [k(0, 0, 0, 0, 0), k(0.12, 0, 0, 0, 0)];

function pretty(name) {
  return name.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

function holdThenFlick(a, b, ride) {
  const charge = dirStick(a);
  const flick = dirStick(b);
  const chargeLeft = ride === "nollie" || ride === "switch";
  if (chargeLeft) {
    return [
      ...REST,
      k(0.22, charge.x, charge.y, 0, 0),
      k(0.5, charge.x, charge.y, 0, 0),
      k(0.62, charge.x, charge.y * 0.9, flick.x, flick.y),
      k(1.15, 0, 0, 0, 0),
    ];
  }
  return [
    ...REST,
    k(0.22, 0, 0, charge.x, charge.y),
    k(0.5, 0, 0, charge.x, charge.y),
    k(0.62, flick.x, flick.y, charge.x, charge.y * 0.9),
    k(1.15, 0, 0, 0, 0),
  ];
}

function bothHold(frontDir, backDir) {
  const f = dirStick(frontDir);
  const b = dirStick(backDir);
  return [...REST, k(0.35, f.x, f.y, b.x, b.y), k(1.1, f.x, f.y, b.x, b.y), k(1.3, 0, 0, 0, 0)];
}

const EXTRA_FLIP = [
  {
    name: "Catch",
    cat: "Air",
    arrows: "",
    blurb: "No stick dump. When the flip or shuv is close to a full turn, it snaps level by itself.",
    keys: [
      k(0, 0.7, -0.2, 0.65, 0.2),
      k(0.35, 0.7, -0.2, 0.65, 0.2),
      k(0.55, 0, 0, 0, 0),
      k(1.05, 0, 0, 0, 0),
    ],
  },
];

const EXTRA_GROUND = [
  {
    name: "Tail manual",
    cat: "Ground",
    arrows: "",
    blurb: "Rolling: back foot down, front foot near center. Wiggle the heavy foot or eat pavement.",
    keys: [
      ...REST,
      k(0.25, 0, 0, 0, 0.72),
      k(0.7, 0, 0.08, 0, 0.62),
      k(1.05, 0, -0.06, 0, 0.78),
      k(1.4, 0, 0, 0, 0.7),
    ],
  },
  {
    name: "Nose manual",
    cat: "Ground",
    arrows: "",
    blurb: "Front foot 12 o'clock, back foot near center. Same balance game, other end of the plank.",
    keys: [
      ...REST,
      k(0.25, 0, -0.72, 0, 0),
      k(0.7, 0, -0.62, 0, 0.08),
      k(1.05, 0, -0.78, 0, -0.06),
      k(1.4, 0, -0.7, 0, 0),
    ],
  },
  {
    name: "Powerslide",
    cat: "Ground",
    arrows: "",
    blurb: "One foot toward the nose, the other toward the tail. Speed leaves. The board pivots.",
    keys: [
      ...REST,
      k(0.3, 0, -0.7, 0, 0.7),
      k(1.1, 0, -0.7, 0, 0.7),
      k(1.35, 0, 0, 0, 0),
    ],
  },
];

const POP_CAT = { high: "High pop", mid: "Mid pop", low: "Low pop" };
const FRIC_CAT = { low: "Low friction", mid: "Mid friction", hi: "Hi friction" };

function flipBlurb(row) {
  const charge = nosePop(row.ride) ? "front" : "back";
  const flick = nosePop(row.ride) ? "back" : "front";
  return `Hold ${charge} ${dirArrow(row.a)}, add ${flick} ${dirArrow(row.b)}. ${row.pop} pop. Catch still snaps itself.`;
}

function grindBlurb(row) {
  return `${pretty(row.name)} on the lip. Front ${dirArrow(row.front)}, back ${dirArrow(row.back)}. No magnet.`;
}

export function listTricks(ride, kind) {
  if (kind === "grinds") {
    const rows = grindDemos().map((row) => ({
      name: pretty(row.name),
      cat: FRIC_CAT[row.friction],
      arrows: `${dirArrow(row.front)}  ${dirArrow(row.back)}`,
      blurb: grindBlurb(row),
      keys: bothHold(row.front, row.back),
    }));
    return [...rows, ...EXTRA_GROUND];
  }
  const rows = flipsFor(ride).map((row) => ({
    name: pretty(row.name),
    cat: POP_CAT[row.pop],
    arrows: `${dirArrow(row.a)}  ${dirArrow(row.b)}`,
    blurb: flipBlurb(row),
    keys: holdThenFlick(row.a, row.b, row.ride),
  }));
  return [...rows, ...EXTRA_FLIP];
}

function lerp(a, b, u) {
  return a + (b - a) * u;
}

/** Sample a looping keyframe path. Stick Y is down-positive, same as the pad. */
export function sampleTrick(keys, time) {
  const dur = keys[keys.length - 1].t;
  const t = dur > 0 ? time % dur : 0;
  let i = 0;
  while (i < keys.length - 1 && keys[i + 1].t < t) i += 1;
  const a = keys[i];
  const b = keys[Math.min(i + 1, keys.length - 1)];
  const span = b.t - a.t;
  const u = span > 0 ? (t - a.t) / span : 0;
  return {
    lx: lerp(a.l[0], b.l[0], u),
    ly: lerp(a.l[1], b.l[1], u),
    rx: lerp(a.r[0], b.r[0], u),
    ry: lerp(a.r[1], b.r[1], u),
  };
}

export function selfCheckHowto() {
  const list = listTricks("normal", "flips");
  if (list[0].name !== "Ollie") throw new Error("howto self-check: ollie first");
  const s = sampleTrick(list[0].keys, 0);
  if (s.lx !== 0 || s.ly !== 0) throw new Error("howto self-check: ollie start");
  const mid = sampleTrick(list[0].keys, 0.5);
  if (!(mid.ry > 0.4)) throw new Error("howto self-check: ollie tail");
  const kick = list.find((r) => r.name === "Kickflip");
  if (!kick || !kick.arrows.includes("→")) throw new Error("howto self-check: kickflip front right");
  const nollie = listTricks("nollie", "flips");
  const nollieOllie = sampleTrick(nollie[0].keys, 0.5);
  if (!(nollieOllie.ly < -0.4)) throw new Error("howto self-check: nollie charges left pad at 12 o'clock");
}
