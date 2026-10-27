/** In-game how-to. Regular: left stick is the front foot. */

export const HOWTO_BODY =
  "This is dual-stick foot control. Keyboard may watch. It may not skate.\n\n" +
  "Regular (default): left stick = front foot, right stick = back foot. ○ on the ground swaps to Goofy, which flips that.\n\n" +
  "□ push left foot. × push right foot. Once per press, on the ground.\n" +
  "Stick Y is weight. Back foot down lifts the nose. Front foot down is the nollie crouch.\n" +
  "L2 / R2 turn. R1 low cam. ← backside · → frontside cam. Hold D-pad down to plant a spawn. Hold up to come back.\n\n" +
  "Ollie: hold the back stick down, flick the front stick up. Catch is automatic near a full turn.\n" +
  "Grind the lip, not the magnet. Options pauses. Hold Options for the nerd sliders.\n" +
  "Pause → Options is hoodie, day/night, audio, and those sliders. Time scale lives in advanced.\n" +
  "△ steps off the board. It lives in the left hand, graphic out, truck in the fist. △ again gets back on.\n" +
  "Off the board the left stick walks, the right stick swings the camera, × jumps, and ×× runs.\n" +
  "L3+R3 together paints the sticks: left red, right purple.";

function k(t, lx, ly, rx, ry) {
  return { t, l: [lx, ly], r: [rx, ry] };
}

const REST = [k(0, 0, 0, 0, 0), k(0.12, 0, 0, 0, 0)];

function ollieThen(extra, end = 1.35) {
  return [
    ...REST,
    k(0.2, 0, 0, 0, 0.78),
    k(0.48, 0, 0, 0, 0.78),
    k(0.56, 0, -0.82, 0, 0.7),
    ...extra,
    k(end, 0, 0, 0, 0),
  ];
}

export const TRICKS = [
  {
    name: "Ollie",
    blurb: "Hold back foot down, flick front foot up. Regular: R down, L flick up.",
    keys: ollieThen([], 1.15),
  },
  {
    name: "Nollie",
    blurb: "The other way: hold front foot down, flick back foot up. Regular: L down, R flick up.",
    keys: [
      ...REST,
      k(0.2, 0, 0.78, 0, 0),
      k(0.48, 0, 0.78, 0, 0),
      k(0.56, 0, 0.7, 0, -0.82),
      k(1.15, 0, 0, 0, 0),
    ],
  },
  {
    name: "Kickflip",
    blurb: "Ollie, then scoop the front stick right. Catch snaps itself near a full flip.",
    keys: ollieThen([k(0.7, 0.82, -0.15, 0, 0.35), k(0.95, 0.15, 0, 0, 0.1)], 1.35),
  },
  {
    name: "Heelflip",
    blurb: "Ollie, scoop the front stick left. Catch is automatic near a full flip.",
    keys: ollieThen([k(0.7, -0.82, -0.15, 0, 0.35), k(0.95, -0.15, 0, 0, 0.1)], 1.35),
  },
  {
    name: "Shuvit",
    blurb: "Ollie, scoop the back stick left or right. The tail follows that scoop.",
    keys: ollieThen([k(0.7, 0, -0.1, 0.82, 0.2), k(0.95, 0, 0, 0.15, 0)], 1.35),
  },
  {
    name: "Varial kickflip",
    blurb: "Kickflip scoop plus a shuv on the back foot in the same window.",
    keys: ollieThen([k(0.68, 0.82, -0.12, 0.82, 0.22), k(0.95, 0.2, 0, 0.2, 0)], 1.4),
  },
  {
    name: "Varial heelflip",
    blurb: "Heelflip scoop plus a shuv. Same pop window. Catch is still automatic.",
    keys: ollieThen([k(0.68, -0.82, -0.12, -0.82, 0.22), k(0.95, -0.2, 0, -0.2, 0)], 1.4),
  },
  {
    name: "Catch",
    blurb: "No stick dump. When the flip or shuv is close to a full turn, it snaps level by itself.",
    keys: [
      k(0, 0.7, -0.2, 0.65, 0.2),
      k(0.35, 0.7, -0.2, 0.65, 0.2),
      k(0.55, 0, 0, 0, 0),
      k(1.05, 0, 0, 0, 0),
    ],
  },
  {
    name: "Tail manual",
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
    blurb: "Front foot down, back foot near center. Same balance game, other end of the plank.",
    keys: [
      ...REST,
      k(0.25, 0, 0.72, 0, 0),
      k(0.7, 0, 0.62, 0, 0.08),
      k(1.05, 0, 0.78, 0, -0.06),
      k(1.4, 0, 0.7, 0, 0),
    ],
  },
  {
    name: "Powerslide",
    blurb: "One foot toward the nose, the other toward the tail. Speed leaves. The board pivots.",
    keys: [
      ...REST,
      k(0.3, 0, 0.7, 0, -0.7),
      k(1.1, 0, 0.7, 0, -0.7),
      k(1.35, 0, 0, 0, 0),
    ],
  },
  {
    name: "50-50",
    blurb: "Lock a lip with both trucks. Feet level. No magnet: miss the edge and you miss the grind.",
    keys: [
      ...REST,
      k(0.35, 0, 0.08, 0, 0.08),
      k(1.1, 0, 0.08, 0, 0.08),
      k(1.3, 0, 0, 0, 0),
    ],
  },
  {
    name: "5-0",
    blurb: "On the lip, back foot down. Front stays calmer. Pop or ride off to leave.",
    keys: [
      ...REST,
      k(0.35, 0, 0.05, 0, 0.72),
      k(1.1, 0, 0.05, 0, 0.72),
      k(1.3, 0, 0, 0, 0),
    ],
  },
  {
    name: "Nosegrind",
    blurb: "On the lip, front foot down. Mirror of a 5-0.",
    keys: [
      ...REST,
      k(0.35, 0, 0.72, 0, 0.05),
      k(1.1, 0, 0.72, 0, 0.05),
      k(1.3, 0, 0, 0, 0),
    ],
  },
  {
    name: "Boardslide / lipslide",
    blurb: "On the lip, both feet sideways. Combined stick X picks boardslide vs lipslide.",
    keys: [
      ...REST,
      k(0.35, 0.7, 0.05, 0.7, 0.05),
      k(1.1, 0.7, 0.05, 0.7, 0.05),
      k(1.3, 0, 0, 0, 0),
    ],
  },
];

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
  const s = sampleTrick(TRICKS[0].keys, 0);
  if (s.lx !== 0 || s.ly !== 0) throw new Error("howto self-check: ollie start");
  const mid = sampleTrick(TRICKS[0].keys, 0.5);
  if (!(mid.ry > 0.4)) throw new Error("howto self-check: ollie tail");
}
