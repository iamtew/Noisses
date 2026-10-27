import {
  CATCH_ANGLE,
  FIXED_DT,
  MANUAL_CENTER,
  MANUAL_CORRECT,
  MANUAL_DRIFT,
  MANUAL_ENTER,
  MANUAL_HOLD,
  MANUAL_SPEED,
  SLIDE_SPLIT,
  FLICK_SPEED,
  FLICK_WINDOW,
  FLIP_DAMP,
  FLIP_SPIN,
  OLLIE_FLICK_GAIN,
  OLLIE_IMPULSE,
  POP_SCALE,
  SCOOP_SPEED,
  SCOOP_WINDOW,
  SHUV_SPIN,
  DIR_DEAD,
} from "../constants.js";
import { matchFlip, nosePop, stickDir, trickLabel } from "./catalog.js";

function rememberFlick(board, input, dt) {
  if (input.frontYVel < FLICK_SPEED) board.flickFront = FLICK_WINDOW;
  else board.flickFront = Math.max(0, (board.flickFront || 0) - dt);
  if (input.backYVel < FLICK_SPEED) board.flickBack = FLICK_WINDOW;
  else board.flickBack = Math.max(0, (board.flickBack || 0) - dt);
  if (Math.abs(input.frontXVel || 0) > SCOOP_SPEED) board.flickFrontX = FLICK_WINDOW;
  else board.flickFrontX = Math.max(0, (board.flickFrontX || 0) - dt);
  if (Math.abs(input.backXVel || 0) > SCOOP_SPEED) board.flickBackX = FLICK_WINDOW;
  else board.flickBackX = Math.max(0, (board.flickBackX || 0) - dt);
}

/** Signed distance to the nearest full turn, in (−π, π]. */
export function wrapPi(a) {
  const t = Math.PI * 2;
  return ((((a + Math.PI) % t) + t) % t) - Math.PI;
}

function frontScoopDir(front) {
  if (Math.abs(front.x) >= DIR_DEAD) return front.x < 0 ? "W" : "E";
  return stickDir(front.x, front.y);
}

function applyPopRow(board, row, input) {
  board.popLatch = true;
  board.trickRow = row;
  board.trick = trickLabel(row);
  board.spinApplied = false;
  board.caught = !row.flip && !row.shuv;
  const flick = Math.max(
    -Math.min(input.frontYVel || 0, input.backYVel || 0),
    -FLICK_SPEED,
  );
  return OLLIE_IMPULSE * (POP_SCALE[row.pop] || 1) + flick * OLLIE_FLICK_GAIN;
}

/**
 * Regular/switch: hold back, add front. Nollie/fakie: hold front, add back.
 * Kickflip is charge down + flick left. Latch until the flick foot recenters.
 */
export function detectPop(input, board, dt = FIXED_DT) {
  rememberFlick(board, input, dt);
  const front = input.front || { x: 0, y: 0 };
  const back = input.back || { x: 0, y: 0 };
  const ride = board.ride || "normal";
  const popNose = nosePop(ride);
  const charge = popNose ? front : back;
  const flick = popNose ? back : front;
  const chargeDir = stickDir(charge.x, charge.y);
  const flickDir = frontScoopDir(flick);
  const chargeFlickVel = popNose
    ? board.flickFront > 0 || board.flickFrontX > 0
    : board.flickBack > 0 || board.flickBackX > 0;
  const flickVel = popNose
    ? board.flickBack > 0 || board.flickBackX > 0
    : board.flickFront > 0 || board.flickFrontX > 0;
  const added = flickDir !== "idle" && flickDir !== (board.prevFlickDir || "idle");

  if (!board.grounded && !board.grinding) {
    board.prevFlickDir = flickDir;
    return 0;
  }

  const charged = chargeDir !== "idle";
  if (charged && (added || flickVel) && !board.popLatch) {
    const row = matchFlip(ride, chargeDir, flickDir, chargeFlickVel, flickVel || added);
    if (row) return applyPopRow(board, row, input);
  }

  const latched = board.trickRow;
  if (board.popLatch && charged && latched && !latched.flip && !latched.shuv) {
    const next = matchFlip(ride, chargeDir, flickDir, chargeFlickVel, true);
    if (next && (next.flip || next.shuv)) {
      board.trickRow = next;
      board.trick = trickLabel(next);
      board.spinApplied = false;
      board.caught = false;
    }
  }

  if (flickDir === "idle") board.popLatch = false;
  board.prevFlickDir = flickDir;
  return 0;
}

export function selfCheckPop() {
  const board = {
    grounded: true,
    popLatch: false,
    flickFront: 0,
    flickBack: 0,
    flickFrontX: 0,
    flickBackX: 0,
    ride: "normal",
    prevFlickDir: "idle",
  };
  const miss = detectPop(
    { back: { x: 0, y: 0 }, front: { x: 0, y: 0 }, frontYVel: 0, backYVel: 0, frontXVel: 0, backXVel: 0 },
    board,
  );
  if (miss !== 0) throw new Error("pop self-check: idle must not pop");

  const ollie = detectPop(
    {
      back: { x: 0, y: 0.8 },
      front: { x: 0, y: -0.8 },
      frontYVel: -12,
      backYVel: 0,
      frontXVel: 0,
      backXVel: 0,
    },
    board,
  );
  if (!(ollie > OLLIE_IMPULSE * 0.8) || board.trick !== "ollie") {
    throw new Error("pop self-check: ollie flick missed");
  }

  board.popLatch = false;
  board.flickFront = 0;
  board.flickBack = 0;
  board.flickFrontX = 0;
  board.flickBackX = 0;
  board.prevFlickDir = "idle";
  board.ride = "normal";
  const kick = detectPop(
    {
      back: { x: 0, y: 0.8 },
      front: { x: -0.85, y: 0 },
      frontYVel: 0,
      backYVel: 0,
      frontXVel: -12,
      backXVel: 0,
    },
    board,
  );
  if (!(kick > 0) || board.trick !== "kickflip") {
    throw new Error("pop self-check: kickflip is back down + front left");
  }
  const kickHold = { front: { x: -0.85, y: 0 }, back: { x: 0, y: 0.8 } };
  stepFlip(kickHold, board, FIXED_DT, false);
  stepFlip(kickHold, board, FIXED_DT, false);
  if (board.trick !== "kickflip" || !board.trickRow) {
    throw new Error("pop self-check: grounded frames after pop must keep kickflip");
  }

  board.popLatch = false;
  board.prevFlickDir = "idle";
  board.flickFront = 0;
  board.flickFrontX = 0;
  const slow = detectPop(
    {
      back: { x: 0, y: 0.8 },
      front: { x: -0.85, y: 0 },
      frontYVel: 0,
      backYVel: 0,
      frontXVel: 0,
      backXVel: 0,
    },
    board,
  );
  if (!(slow > 0) || board.trick !== "kickflip") {
    throw new Error("pop self-check: slow analog left add must kickflip");
  }

  board.popLatch = false;
  board.prevFlickDir = "idle";
  board.flickFront = 0;
  board.flickFrontX = 0;
  const upLeft = detectPop(
    {
      back: { x: 0, y: 0.8 },
      front: { x: -0.55, y: -0.7 },
      frontYVel: -10,
      backYVel: 0,
      frontXVel: -8,
      backXVel: 0,
    },
    board,
  );
  if (!(upLeft > 0) || board.trick !== "kickflip") {
    throw new Error("pop self-check: up-left flick must kickflip, not ollie");
  }

  board.popLatch = false;
  board.prevFlickDir = "idle";
  board.flickFront = 0;
  board.flickFrontX = 0;
  const heel = detectPop(
    {
      back: { x: 0, y: 0.8 },
      front: { x: 0.85, y: 0 },
      frontYVel: 0,
      backYVel: 0,
      frontXVel: 12,
      backXVel: 0,
    },
    board,
  );
  if (!(heel > 0) || board.trick !== "heelflip") {
    throw new Error("pop self-check: heelflip is back down + front right");
  }

  board.popLatch = false;
  board.prevFlickDir = "idle";
  board.flickFront = 0;
  board.flickFrontX = 0;
  detectPop(
    {
      back: { x: 0, y: 0.8 },
      front: { x: 0, y: -0.8 },
      frontYVel: -12,
      backYVel: 0,
      frontXVel: 0,
      backXVel: 0,
    },
    board,
  );
  if (board.trick !== "ollie") throw new Error("pop self-check: upgrade needs an ollie first");
  detectPop(
    {
      back: { x: 0, y: 0.8 },
      front: { x: -0.7, y: -0.2 },
      frontYVel: 0,
      backYVel: 0,
      frontXVel: -6,
      backXVel: 0,
    },
    board,
  );
  if (board.trick !== "kickflip") {
    throw new Error("pop self-check: grounded scoop-left must upgrade ollie");
  }

  board.popLatch = false;
  board.prevFlickDir = "idle";
  board.flickFront = 0;
  board.flickFrontX = 0;
  board.flickBack = 0;
  board.flickBackX = 0;
  board.ride = "nollie";
  const nollieKick = detectPop(
    {
      back: { x: -0.85, y: 0 },
      front: { x: 0, y: -0.8 },
      frontYVel: 0,
      backYVel: 0,
      frontXVel: 0,
      backXVel: -12,
    },
    board,
  );
  if (!(nollieKick > 0) || board.trick !== "nollie kickflip") {
    throw new Error("pop self-check: nollie kickflip is front 12 o'clock + back left");
  }

  board.popLatch = false;
  board.prevFlickDir = "idle";
  board.flickFront = 0;
  board.flickFrontX = 0;
  board.flickBack = 0;
  board.flickBackX = 0;
  board.ride = "normal";
  const shove = detectPop(
    {
      back: { x: 0, y: 0.8 },
      front: { x: 0, y: 0.8 },
      frontYVel: 0,
      backYVel: 0,
      frontXVel: 0,
      backXVel: 0,
    },
    board,
  );
  if (!(shove > 0) || board.trick !== "BS pop shove-it") {
    throw new Error("pop self-check: BS pop shove-it is back down + front down");
  }
}

function nearTurns(angle, turns, step = Math.PI * 2) {
  if (!turns) return Math.abs(angle) < CATCH_ANGLE;
  const need = turns * step;
  const err = Math.abs(Math.abs(angle) - need);
  return Math.abs(angle) > need * 0.45 && err < CATCH_ANGLE;
}

function applySpin(board, row) {
  if (!row) return;
  if (row.flip) board.flipRate = row.flip * FLIP_SPIN;
  if (row.shuv) board.shuvRate = row.shuv * SHUV_SPIN;
  board.flipTurns = row.flipTurns || 0;
  board.shuvTurns = row.shuvTurns || 0;
  board.caught = !row.flip && !row.shuv;
}

/** Ollie already left the ground; a sideways add still counts as kick/heel. */
function scoopUpgrade(input, board) {
  const row = board.trickRow;
  if (!row || row.flip || board.airTime > SCOOP_WINDOW * 1.8) return;
  const flick = nosePop(row.ride) ? input.back || { x: 0, y: 0 } : input.front || { x: 0, y: 0 };
  const dir = frontScoopDir(flick);
  if (dir !== "W" && dir !== "E") return;
  const next = matchFlip(row.ride, row.a, dir, false, true);
  if (!next || !next.flip) return;
  board.trickRow = next;
  board.trick = trickLabel(next);
  board.spinApplied = false;
  board.caught = false;
}

/**
 * Spin comes from the catalog row at pop. Catch is automatic near the target turns.
 */
export function stepFlip(input, board, dt, airborne) {
  if (!airborne) {
    board.airTime = 0;
    // Wheels stay grounded a couple frames after pop. Do not wipe the pending flip.
    if (board.trickRow && !board.spinApplied) return;
    board.spinApplied = false;
    if (board.caught || (Math.abs(board.flip) < 0.05 && Math.abs(board.shuv) < 0.05)) {
      board.flip = 0;
      board.flipRate = 0;
      board.shuv = wrapPi(board.shuv);
      board.shuvRate = 0;
      board.caught = true;
      board.trick = "";
      board.trickRow = null;
    }
    return;
  }

  board.airTime += dt;
  scoopUpgrade(input, board);

  if (!board.spinApplied && board.trickRow) {
    applySpin(board, board.trickRow);
    board.spinApplied = true;
  }

  board.flip += board.flipRate * dt;
  board.shuv += board.shuvRate * dt;
  board.flipRate *= Math.exp(-FLIP_DAMP * dt);
  board.shuvRate *= Math.exp(-FLIP_DAMP * dt);

  if (!board.caught) {
    const ft = board.flipTurns || 0;
    const st = board.shuvTurns || 0;
    if (nearTurns(board.flip, ft) && nearTurns(board.shuv, st, Math.PI)) {
      if (ft) {
        const need = ft * Math.PI * 2 * Math.sign(board.flip || 1);
        board.flip = need;
      } else board.flip = 0;
      if (st) {
        const need = st * Math.PI * Math.sign(board.shuv || 1);
        board.shuv = need;
      } else board.shuv = 0;
      board.flipRate = 0;
      board.shuvRate = 0;
      board.caught = true;
    }
  }
}

/**
 * Tail manual: back foot 6 o'clock, front centered.
 * Nose manual: front foot 12 o'clock, back centered.
 * Returns true when the manual falls over.
 */
export function stepManual(board, input, dt, grounded, speed) {
  const front = input.front || { x: 0, y: 0 };
  const back = input.back || { x: 0, y: 0 };
  if (!grounded || board.grinding || board.bailed > 0 || speed < MANUAL_SPEED * 0.45) {
    board.manual = "";
    board.manualCharge = 0;
    board.balance = 0;
    return false;
  }

  const tail =
    back.y > MANUAL_HOLD && Math.abs(front.y) < MANUAL_CENTER && Math.abs(front.x) < MANUAL_CENTER;
  const nose =
    front.y < -MANUAL_HOLD && Math.abs(back.y) < MANUAL_CENTER && Math.abs(back.x) < MANUAL_CENTER;
  const want = tail && !nose ? "tail" : nose && !tail ? "nose" : "";

  if (!board.manual) {
    if (!want) {
      board.manualCharge = 0;
      return false;
    }
    board.manualCharge = (board.manualCharge || 0) + dt;
    if (board.manualCharge < MANUAL_ENTER || speed < MANUAL_SPEED) return false;
    board.manual = want;
    board.balance = 0;
    board.trick = `${want} manual`;
    return false;
  }

  if (!want) {
    board.manual = "";
    board.manualCharge = 0;
    board.balance = 0;
    if (board.trick.endsWith("manual")) board.trick = "";
    return false;
  }

  board.manual = want;
  board.trick = `${want} manual`;
  board.manualPhase = (board.manualPhase || 0) + dt;
  const stick = want === "tail" ? back.y : -front.y;
  const wander = Math.sin(board.manualPhase * 1.7) * MANUAL_DRIFT;
  board.balance += (wander - (stick - MANUAL_HOLD) * MANUAL_CORRECT) * dt;
  return Math.abs(board.balance) > 1;
}

/** One foot toward the nose and the other toward the tail. */
export function feetSplit(front, back) {
  const yf = front?.y || 0;
  const yb = back?.y || 0;
  return (yf > SLIDE_SPLIT && yb < -SLIDE_SPLIT) || (yb > SLIDE_SPLIT && yf < -SLIDE_SPLIT);
}

export function selfCheckSlide() {
  if (feetSplit({ y: 0 }, { y: 0 })) throw new Error("slide self-check: centered feet");
  if (!feetSplit({ y: 0.6 }, { y: -0.6 })) throw new Error("slide self-check: split feet");
}

export function selfCheckManual() {
  const board = {
    grinding: false,
    bailed: 0,
    manual: "",
    balance: 0,
    manualPhase: 0,
    manualCharge: 0,
    trick: "",
  };
  const idle = { front: { x: 0, y: 0 }, back: { x: 0, y: 0 } };
  if (stepManual(board, idle, 0.2, true, 3)) throw new Error("manual self-check: idle fell");
  if (board.manual) throw new Error("manual self-check: idle locked");

  const tail = { front: { x: 0, y: 0 }, back: { x: 0, y: 0.8 } };
  stepManual(board, tail, MANUAL_ENTER, true, 3);
  if (board.manual !== "tail") throw new Error("manual self-check: tail did not lock");

  board.manual = "";
  board.manualCharge = 0;
  board.balance = 0;
  const nose = { front: { x: 0, y: -0.8 }, back: { x: 0, y: 0 } };
  stepManual(board, nose, MANUAL_ENTER, true, 3);
  if (board.manual !== "nose") throw new Error("manual self-check: nose did not lock at 12 o'clock");
}

export function selfCheckFlip() {
  if (Math.abs(wrapPi(Math.PI * 2)) > 1e-6) throw new Error("wrapPi full turn");
  const board = {
    airTime: 0,
    flip: 0,
    flipRate: 0,
    shuv: 0,
    shuvRate: 0,
    caught: true,
    trick: "kickflip",
    trickRow: matchFlip("normal", "S", "W", false, true),
    spinApplied: false,
    flickFrontX: FLICK_WINDOW,
    flickBackX: 0,
  };
  stepFlip({ front: { x: 0.8, y: 0 }, back: { x: 0, y: 0 } }, board, FIXED_DT, true);
  if (!(board.flipRate < 0) || !board.spinApplied) {
    throw new Error("flip self-check: kickflip spin missed");
  }

  const late = {
    airTime: 1,
    flip: Math.PI * 2 - 0.1,
    flipRate: 4,
    shuv: 0,
    shuvRate: 0,
    caught: false,
    trick: "kickflip",
    trickRow: board.trickRow,
    spinApplied: true,
    flipTurns: 1,
    shuvTurns: 0,
    flickFrontX: 0,
    flickBackX: 0,
  };
  stepFlip({ front: { x: -0.9, y: 0 }, back: { x: 0, y: 0 } }, late, FIXED_DT, true);
  if (!late.caught) throw new Error("flip self-check: catch should be automatic");

  const shuvBoard = {
    airTime: 0,
    yaw: 0,
    flip: 0,
    flipRate: 0,
    shuv: 0,
    shuvRate: 0,
    caught: false,
    trick: "BS pop shove-it",
    trickRow: matchFlip("normal", "S", "S", false, true),
    spinApplied: false,
  };
  const idle = { front: { x: 0, y: 0.8 }, back: { x: 0, y: 0.8 } };
  for (let i = 0; i < 50 && !shuvBoard.caught; i++) stepFlip(idle, shuvBoard, FIXED_DT, true);
  if (!shuvBoard.caught) throw new Error("flip self-check: shove-it should catch at 180");
  if (Math.abs(shuvBoard.yaw) > 0.05) throw new Error("flip self-check: shove-it must not spin rider yaw");
  if (Math.abs(Math.abs(shuvBoard.shuv) - Math.PI) > 0.05) {
    throw new Error("flip self-check: shove-it should rest at 180 on the deck");
  }
}
