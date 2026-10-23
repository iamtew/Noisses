import {
  FLICK_SPEED,
  FLICK_UP,
  OLLIE_FLICK_GAIN,
  OLLIE_IMPULSE,
  TAIL_HOLD,
} from "../constants.js";

/**
 * Regular ollie: hold back stick down, flick front stick up.
 * Nollie: hold front down, flick back up.
 * Windows are in constants.js (invented, not copied).
 * @returns {number} pop impulse (N·s), 0 if none
 */
export function detectPop(input, board) {
  if (!board.grounded) return 0;

  const ollie =
    input.back.y > TAIL_HOLD &&
    input.front.y < FLICK_UP &&
    input.frontYVel < FLICK_SPEED;
  const nollie =
    input.front.y > TAIL_HOLD &&
    input.back.y < FLICK_UP &&
    input.backYVel < FLICK_SPEED;

  if ((ollie || nollie) && !board.popLatch) {
    board.popLatch = true;
    const flick = ollie ? -input.frontYVel : -input.backYVel;
    return OLLIE_IMPULSE + flick * OLLIE_FLICK_GAIN;
  }

  if (input.front.y > -0.15 && input.back.y > -0.15) board.popLatch = false;
  return 0;
}

export function selfCheckPop() {
  const board = { grounded: true, popLatch: false };
  const miss = detectPop(
    {
      back: { y: 0 },
      front: { y: 0 },
      frontYVel: 0,
      backYVel: 0,
    },
    board,
  );
  if (miss !== 0) throw new Error("pop self-check: idle must not pop");
  const hit = detectPop(
    {
      back: { y: 0.8 },
      front: { y: -0.6 },
      frontYVel: -12,
      backYVel: 0,
    },
    board,
  );
  if (!(hit > OLLIE_IMPULSE)) throw new Error("pop self-check: ollie flick missed");
}
