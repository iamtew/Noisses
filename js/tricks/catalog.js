/**
 * Stick charts in nose/tail space after Regular/Switch remap.
 * Regular + nollie: left on nose. Switch + fakie: right on nose.
 * Regular + switch: back pops. Nollie + fakie: front pops.
 * Invented thresholds. Generic skate names. No commercial branding.
 */
import {
  DIR_DEAD,
  FAKIE_ALONG,
  FAKIE_SPEED,
  GRIND_FRIC_SCALE,
  GRIND_PARALLEL_BLUNT,
  GRIND_PARALLEL_SLIDE,
  MATCH_MAX,
} from "../constants.js";

const VEC = {
  idle: [0, 0],
  N: [0, -1],
  NE: [0.7071, -0.7071],
  E: [1, 0],
  SE: [0.7071, 0.7071],
  S: [0, 1],
  SW: [-0.7071, 0.7071],
  W: [-1, 0],
  NW: [-0.7071, -0.7071],
};

const ARROW = {
  idle: "·",
  N: "↑",
  NE: "↗",
  E: "→",
  SE: "↘",
  S: "↓",
  SW: "↙",
  W: "←",
  NW: "↖",
};

const Y_FLIP = {
  idle: "idle",
  N: "S",
  S: "N",
  E: "E",
  W: "W",
  NE: "SE",
  SE: "NE",
  NW: "SW",
  SW: "NW",
};

const XY_FLIP = {
  idle: "idle",
  N: "S",
  S: "N",
  E: "W",
  W: "E",
  NE: "SW",
  SW: "NE",
  NW: "SE",
  SE: "NW",
};

function flipRow(name, ride, pop, a, b, extra = {}) {
  const hasFlip = extra.flip || 0;
  const hasShuv = extra.shuv || 0;
  return {
    name,
    ride,
    pop,
    a,
    b,
    aFlick: Boolean(extra.aFlick),
    bFlick: extra.bFlick !== false && !extra.aFlick,
    flip: hasFlip,
    shuv: hasShuv,
    flipTurns: extra.flipTurns ?? (hasFlip ? 1 : 0),
    shuvTurns: extra.shuvTurns ?? (hasShuv ? 1 : 0),
  };
}

function remapRow(row, ride, aMap, bMap) {
  return {
    ...row,
    ride,
    a: aMap[row.a] || row.a,
    b: bMap[row.b] || row.b,
  };
}

const NORMAL_FLIPS = [
  flipRow("ollie", "normal", "high", "S", "N"),
  flipRow("kickflip", "normal", "high", "S", "W", { flip: -1 }),
  flipRow("heelflip", "normal", "high", "S", "E", { flip: 1 }),
  flipRow("BS pop shove-it", "normal", "high", "S", "S", { shuv: 1 }),
  flipRow("FS pop shove-it", "normal", "high", "S", "N", { aFlick: true, bFlick: false, shuv: -1 }),
  // ponytail: mid/low ① diagonals guessed from a mushy screenshot. Correct a cell, not the matcher.
  flipRow("varial flip", "normal", "mid", "SW", "W", { flip: -1, shuv: 1 }),
  flipRow("varial heel", "normal", "mid", "SE", "E", { flip: 1, shuv: 1 }),
  flipRow("hardflip", "normal", "mid", "NE", "E", { flip: -1, shuv: -1 }),
  flipRow("inward heel", "normal", "mid", "NW", "W", { flip: 1, shuv: 1 }),
  flipRow("hardflip 360", "normal", "mid", "E", "NE", { flip: -1, shuv: -1, shuvTurns: 2 }),
  flipRow("FS pop shuvit 360", "normal", "mid", "N", "N", {
    aFlick: true,
    bFlick: false,
    shuv: -1,
    shuvTurns: 2,
  }),
  flipRow("BS pop shove-it 360", "normal", "low", "SW", "S", { aFlick: true, bFlick: false, shuv: 1, shuvTurns: 2 }),
  flipRow("360 flip", "normal", "low", "W", "W", { flip: -1, shuv: 1, shuvTurns: 2 }),
  flipRow("laserflip", "normal", "low", "E", "SE", { flip: 1, shuv: -1, shuvTurns: 2 }),
  flipRow("inward 360", "normal", "low", "NW", "NW", { flip: 1, shuv: 1, shuvTurns: 2 }),
  flipRow("low pop ollie", "normal", "low", "S", "S", { bFlick: false }),
];

const FAKIE_FLIPS = NORMAL_FLIPS.map((r) => remapRow(r, "fakie", Y_FLIP, Y_FLIP));

const SWITCH_FLIPS = [
  flipRow("ollie", "switch", "high", "S", "S"),
  flipRow("kickflip", "switch", "high", "S", "E", { flip: 1 }),
  flipRow("heelflip", "switch", "high", "S", "W", { flip: -1 }),
  flipRow("BS pop shove-it", "switch", "high", "S", "S", { shuv: 1 }),
  flipRow("FS pop shove-it", "switch", "high", "S", "N", { aFlick: true, bFlick: false, shuv: -1 }),
  ...NORMAL_FLIPS.filter((r) => r.pop !== "high").map((r) => remapRow(r, "switch", {}, XY_FLIP)),
];

const NOLLIE_FLIPS = NORMAL_FLIPS.map((r) => remapRow(r, "nollie", Y_FLIP, Y_FLIP));

export const FLIPS = [...NORMAL_FLIPS, ...FAKIE_FLIPS, ...SWITCH_FLIPS, ...NOLLIE_FLIPS];

function grind(name, front, back, side, friction, parallel = "grind") {
  return { name, front, back, side, friction, parallel };
}

export const GRINDS = [
  grind("50-50", "N", "S", "fs", "low"),
  grind("50-50", "S", "N", "bs", "low"),
  grind("boardslide", "E", "E", "fs", "low", "slide"),
  grind("boardslide", "W", "W", "bs", "low", "slide"),
  grind("lipslide", "W", "W", "fs", "low", "slide"),
  grind("lipslide", "E", "E", "bs", "low", "slide"),
  grind("willy", "NE", "NW", "fs", "low"),
  grind("willy", "NW", "NE", "bs", "low"),
  grind("over willy", "N", "NW", "fs", "low"),
  grind("over willy", "N", "NE", "bs", "low"),
  grind("5-0", "idle", "S", "any", "low"),
  grind("noseslide", "E", "idle", "fs", "low", "slide"),
  grind("noseslide", "W", "idle", "bs", "low", "slide"),
  grind("tailslide", "idle", "E", "fs", "low", "slide"),
  grind("tailslide", "idle", "W", "bs", "low", "slide"),
  // ponytail: Smith/Feeble/Salad/Suski diagonals guessed. Same matcher, swap the dirs.
  grind("smith", "NE", "S", "fs", "mid"),
  grind("smith", "NW", "S", "bs", "mid"),
  grind("feeble", "SE", "S", "fs", "mid"),
  grind("feeble", "SW", "S", "bs", "mid"),
  grind("nosegrind", "N", "idle", "any", "mid"),
  grind("crooked", "NE", "idle", "fs", "mid"),
  grind("crooked", "NW", "idle", "bs", "mid"),
  grind("overcrook", "SE", "idle", "fs", "mid"),
  grind("overcrook", "SW", "idle", "bs", "mid"),
  grind("salad", "idle", "NW", "fs", "mid"),
  grind("salad", "idle", "NE", "bs", "mid"),
  grind("suski", "idle", "SW", "fs", "mid"),
  grind("suski", "idle", "SE", "bs", "mid"),
  grind("noseblunt", "E", "idle", "fs", "hi", "blunt"),
  grind("noseblunt", "W", "idle", "bs", "hi", "blunt"),
  grind("blunt", "idle", "E", "fs", "hi", "blunt"),
  grind("blunt", "idle", "W", "bs", "hi", "blunt"),
];

export function stickDir(x = 0, y = 0, dead = DIR_DEAD) {
  const m = Math.hypot(x, y);
  if (m < dead) return "idle";
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  // Fat cardinals: a slightly dirty left flick is still W, not NW.
  if (ax >= ay * 1.2) return x > 0 ? "E" : "W";
  if (ay >= ax * 1.2) return y > 0 ? "S" : "N";
  if (x > 0) return y > 0 ? "SE" : "NE";
  return y > 0 ? "SW" : "NW";
}

export function dirStick(dir, mag = 0.82) {
  const v = VEC[dir] || VEC.idle;
  return { x: v[0] * mag, y: v[1] * mag };
}

export function dirArrow(dir) {
  return ARROW[dir] || "·";
}

function dirDist(a, b) {
  const va = VEC[a] || VEC.idle;
  const vb = VEC[b] || VEC.idle;
  return Math.hypot(va[0] - vb[0], va[1] - vb[1]);
}

export function trickLabel(row) {
  if (!row) return "";
  return row.ride === "normal" ? row.name : `${row.ride} ${row.name}`;
}

export function ridingOf(switched, fakie) {
  if (switched) return fakie ? "nollie" : "switch";
  return fakie ? "fakie" : "normal";
}

/** Nollie and fakie pop with the nose foot. Regular and switch pop with the tail. */
export function nosePop(ride) {
  return ride === "nollie" || ride === "fakie";
}

/** Left stick is the nose foot when switched === fakie. Writes board.regular and board.ride. */
export function syncFeet(board) {
  board.regular = Boolean(board.switched) === Boolean(board.fakie);
  board.ride = ridingOf(board.switched, board.fakie);
}

export function updateRide(board, forward) {
  const along = board.vel.x * forward.x + board.vel.z * forward.z;
  const speed = Math.hypot(board.vel.x, board.vel.z);
  if (speed >= FAKIE_SPEED) board.fakie = along < -FAKIE_ALONG;
  syncFeet(board);
}

export function matchFlip(ride, backDir, frontDir, backFlick, frontFlick) {
  let best = null;
  let bestScore = MATCH_MAX;
  for (const row of FLIPS) {
    if (row.ride !== ride) continue;
    let score = dirDist(row.a, backDir) + dirDist(row.b, frontDir);
    if (row.aFlick) score += backFlick ? 0 : 9;
    else score += backFlick ? 0.25 : 0;
    if (row.bFlick) score += frontFlick ? 0 : 9;
    else score += frontFlick ? 0.25 : 0;
    if (score < bestScore) {
      bestScore = score;
      best = row;
    }
  }
  return best;
}

function parallelBand(parallel) {
  if (parallel < GRIND_PARALLEL_BLUNT) return "blunt";
  if (parallel < GRIND_PARALLEL_SLIDE) return "slide";
  return "grind";
}

export function matchGrind(frontDir, backDir, side, parallel) {
  const band = parallelBand(parallel);
  let best = null;
  let bestScore = MATCH_MAX;
  for (const row of GRINDS) {
    if (row.side !== "any" && row.side !== side) continue;
    if (row.parallel !== band) continue;
    const score = dirDist(row.front, frontDir) + dirDist(row.back, backDir);
    if (score < bestScore) {
      bestScore = score;
      best = row;
    }
  }
  return best;
}

export function grindLabel(row, side) {
  if (!row) return "50-50";
  const tag = side === "bs" ? "BS" : "FS";
  return `${tag} ${row.name}`;
}

export function grindFric(row) {
  return GRIND_FRIC_SCALE[row?.friction] || 1;
}

export function flipsFor(ride) {
  return FLIPS.filter((r) => r.ride === ride);
}

/** Unique grind names in chart order, with the FS pose for the demo. */
export function grindDemos() {
  const seen = new Set();
  const out = [];
  for (const row of GRINDS) {
    if (seen.has(row.name)) continue;
    seen.add(row.name);
    out.push(row);
  }
  return out;
}

export function selfCheckCatalog() {
  if (stickDir(0, 0) !== "idle") throw new Error("catalog idle");
  if (stickDir(0, 0.9) !== "S") throw new Error("catalog S");
  if (stickDir(0, -0.9) !== "N") throw new Error("catalog N");
  if (stickDir(-0.9, 0) !== "W") throw new Error("catalog W");
  if (stickDir(0.9, 0) !== "E") throw new Error("catalog E");

  const ollie = matchFlip("normal", "S", "N", false, true);
  if (!ollie || ollie.name !== "ollie") throw new Error("catalog normal ollie");
  const kick = matchFlip("normal", "S", "W", false, true);
  if (!kick || kick.name !== "kickflip") throw new Error("catalog kickflip");
  const shove = matchFlip("normal", "S", "S", false, true);
  if (!shove || shove.name !== "BS pop shove-it") throw new Error("catalog BS pop shove-it");
  const heel = matchFlip("normal", "S", "E", false, true);
  if (!heel || heel.name !== "heelflip") throw new Error("catalog heelflip");
  const fakie = matchFlip("fakie", "N", "S", false, true);
  if (!fakie || fakie.name !== "ollie" || trickLabel(fakie) !== "fakie ollie") {
    throw new Error("catalog fakie ollie");
  }
  const nollie = matchFlip("nollie", "N", "W", false, true);
  if (!nollie || nollie.name !== "kickflip" || trickLabel(nollie) !== "nollie kickflip") {
    throw new Error("catalog nollie kickflip");
  }
  const feet = { switched: false, fakie: false };
  syncFeet(feet);
  if (!feet.regular || feet.ride !== "normal") throw new Error("catalog regular feet");
  feet.fakie = true;
  syncFeet(feet);
  if (feet.regular || feet.ride !== "fakie") throw new Error("catalog fakie feet");
  feet.switched = true;
  feet.fakie = false;
  syncFeet(feet);
  if (feet.regular || feet.ride !== "switch") throw new Error("catalog switch feet");
  feet.fakie = true;
  syncFeet(feet);
  if (!feet.regular || feet.ride !== "nollie") throw new Error("catalog nollie feet");
  const swKick = matchFlip("switch", "S", "E", false, true);
  if (!swKick || swKick.name !== "kickflip") throw new Error("catalog switch kickflip");

  const fifty = matchGrind("N", "S", "fs", 0.9);
  if (!fifty || fifty.name !== "50-50") throw new Error("catalog 50-50");
  const five = matchGrind("idle", "S", "fs", 0.9);
  if (!five || five.name !== "5-0") throw new Error("catalog 5-0");
  const nose = matchGrind("N", "idle", "fs", 0.9);
  if (!nose || nose.name !== "nosegrind") throw new Error("catalog nosegrind");
}
