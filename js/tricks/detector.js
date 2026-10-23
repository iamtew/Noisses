import {
  FIXED_DT,
  FLICK_SPEED,
  FLICK_UP,
  FLICK_WINDOW,
  OLLIE_FLICK_GAIN,
  OLLIE_IMPULSE,
  TAIL_HOLD,
} from "../constants.js";

function rememberFlick(board, input, dt) {
  if (input.frontYVel < FLICK_SPEED) board.flickFront = FLICK_WINDOW;
  else board.flickFront = Math.max(0, (board.flickFront || 0) - dt);
  if (input.backYVel < FLICK_SPEED) board.flickBack = FLICK_WINDOW;
  else board.flickBack = Math.max(0, (board.flickBack || 0) - dt);
}

/**
 * Ollie: hold back stick down, flick front stick up.
 * Nollie: hold front stick down, flick back stick up.
 * Flick can land a fraction of a second before the stick finishes up.
 */
export function detectPop(input, board, dt = FIXED_DT) {
  rememberFlick(board, input, dt);
  if (!board.grounded) return 0;

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
