import {
  CATCH_ANGLE,
  CATCH_STICK,
  FIXED_DT,
  MANUAL_CENTER,
  MANUAL_CORRECT,
  MANUAL_DRIFT,
  MANUAL_ENTER,
  MANUAL_HOLD,
  MANUAL_SPEED,
  SLIDE_SPLIT,
  FLICK_SPEED,
  FLICK_UP,
  FLICK_WINDOW,
  FLIP_DAMP,
  FLIP_SPIN,
  OLLIE_FLICK_GAIN,
  OLLIE_IMPULSE,
  SCOOP_SPEED,
  SCOOP_WINDOW,
  SCOOP_X,
  SHUV_SPIN,
  TAIL_HOLD,
} from "../constants.js";

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

/**
 * Ollie: hold back stick down, flick front stick up.
 * Nollie: hold front stick down, flick back stick up.
 * Flick can land a fraction of a second before the stick finishes up.
 */
export function detectPop(input, board, dt = FIXED_DT) {
  rememberFlick(board, input, dt);
  if (!board.grounded && !board.grinding) return 0;

  const ollie =
    input.back.y > TAIL_HOLD &&
    input.front.y < FLICK_UP &&
    board.flickFront > 0;
  const nollie =
    input.front.y > TAIL_HOLD &&
    input.back.y < FLICK_UP &&
    board.flickBack > 0;

  if ((ollie || nollie) && !board.popLatch) {
    board.popLatch = true;
    board.trick = ollie ? "ollie" : "nollie";
    const flick = ollie
      ? Math.max(-input.frontYVel, -FLICK_SPEED)
      : Math.max(-input.backYVel, -FLICK_SPEED);
    return OLLIE_IMPULSE + flick * OLLIE_FLICK_GAIN;
  }

  if (!ollie && !nollie && input.front.y > FLICK_UP && input.back.y > FLICK_UP) {
    board.popLatch = false;
  }
  return 0;
}

export function selfCheckPop() {
  const board = {
    grounded: true,
    popLatch: false,
    flickFront: 0,
    flickBack: 0,
  };
  const miss = detectPop(
    { back: { y: 0 }, front: { y: 0 }, frontYVel: 0, backYVel: 0 },
    board,
  );
  if (miss !== 0) throw new Error("pop self-check: idle must not pop");

  const ollie = detectPop(
    {
      back: { y: 0.8 },
      front: { y: -0.6 },
      frontYVel: -12,
      backYVel: 0,
    },
    board,
  );
  if (!(ollie > OLLIE_IMPULSE)) throw new Error("pop self-check: ollie flick missed");

  board.popLatch = false;
  board.flickFront = 0;
  board.flickBack = 0;
  const nollie = detectPop(
    {
      back: { y: -0.6 },
      front: { y: 0.8 },
      frontYVel: 0,
      backYVel: -12,
    },
    board,
  );
  if (!(nollie > OLLIE_IMPULSE)) throw new Error("pop self-check: nollie flick missed");
}

/**
 * Front stick X scoop → kickflip (+) / heelflip (−).
 * Back stick X scoop → shuv. Catch = both sticks in the dead zone near a full turn.
 */
export function stepFlip(input, board, dt, airborne) {
  const front = input.front || { x: 0, y: 0 };
  const back = input.back || { x: 0, y: 0 };

  if (!airborne) {
    board.airTime = 0;
    if (board.caught || (Math.abs(board.flip) < 0.05 && Math.abs(board.shuv) < 0.05)) {
      board.flip = 0;
      board.flipRate = 0;
      board.shuv = 0;
      board.shuvRate = 0;
      board.caught = true;
      board.trick = "";
    }
    return;
  }

  board.airTime += dt;

  if (board.airTime < SCOOP_WINDOW) {
    if (board.flipRate === 0 && board.flickFrontX > 0 && Math.abs(front.x) > SCOOP_X) {
      board.flipRate = Math.sign(front.x) * FLIP_SPIN;
      board.caught = false;
      board.trick = front.x > 0 ? "kickflip" : "heelflip";
    }
    if (board.shuvRate === 0 && board.flickBackX > 0 && Math.abs(back.x) > SCOOP_X) {
      // +X scoop swings the tail toward +X, which is negative yaw in YXZ.
      board.shuvRate = -Math.sign(back.x) * SHUV_SPIN;
      board.caught = false;
      if (!board.trick) board.trick = "shuvit";
      else if (board.trick === "kickflip") board.trick = "varial kickflip";
      else if (board.trick === "heelflip") board.trick = "varial heelflip";
    }
  }

  board.flip += board.flipRate * dt;
  board.shuv += board.shuvRate * dt;
  board.flipRate *= Math.exp(-FLIP_DAMP * dt);
  board.shuvRate *= Math.exp(-FLIP_DAMP * dt);

  const centered =
    Math.hypot(front.x, front.y) < CATCH_STICK &&
    Math.hypot(back.x, back.y) < CATCH_STICK;
  if (centered && !board.caught) {
    const flipErr = wrapPi(board.flip);
    const shuvErr = wrapPi(board.shuv);
    if (Math.abs(flipErr) < CATCH_ANGLE && Math.abs(shuvErr) < CATCH_ANGLE) {
      board.flip -= flipErr;
      board.shuv -= shuvErr;
      board.flipRate = 0;
      board.shuvRate = 0;
      board.caught = true;
    }
  }
}

/**
 * Tail manual: back foot down, front foot centered.
 * Nose manual: the other way. Balance wanders; the heavy foot corrects it.
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

  const tail = back.y > MANUAL_HOLD && Math.abs(front.y) < MANUAL_CENTER;
  const nose = front.y > MANUAL_HOLD && Math.abs(back.y) < MANUAL_CENTER;
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
  const stick = want === "tail" ? back.y : front.y;
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
}

export function selfCheckFlip() {
  if (Math.abs(wrapPi(Math.PI * 2) ) > 1e-6) throw new Error("wrapPi full turn");
  const board = {
    airTime: 0,
    flip: 0,
    flipRate: 0,
    shuv: 0,
    shuvRate: 0,
    caught: true,
    trick: "",
    flickFrontX: FLICK_WINDOW,
    flickBackX: 0,
  };
  stepFlip(
    { front: { x: 0.8, y: 0 }, back: { x: 0, y: 0 }, frontXVel: 8, backXVel: 0 },
    board,
    FIXED_DT,
    true,
  );
  if (!(board.flipRate > 0) || board.trick !== "kickflip") {
    throw new Error("flip self-check: kickflip scoop missed");
  }

  const shuv = {
    airTime: 0,
    flip: 0,
    flipRate: 0,
    shuv: 0,
    shuvRate: 0,
    caught: true,
    trick: "",
    flickFrontX: 0,
    flickBackX: FLICK_WINDOW,
  };
  stepFlip(
    { front: { x: 0, y: 0 }, back: { x: 0.8, y: 0 }, frontXVel: 0, backXVel: 8 },
    shuv,
    FIXED_DT,
    true,
  );
  if (!(shuv.shuvRate < 0) || shuv.trick !== "shuvit") {
    throw new Error("flip self-check: shuv spun away from the back foot");
  }
}
