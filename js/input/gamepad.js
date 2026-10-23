// Poll every play frame. A valid pad has two analog sticks (four axes).
// Face buttons use the standard mapping, labeled PlayStation: × ○ □ △

import { STICK_DEADZONE } from "../constants.js";

/** Standard mapping: × Cross, ○ Circle, □ Square, △ Triangle. */
export const BTN = { CROSS: 0, CIRCLE: 1, SQUARE: 2, TRIANGLE: 3 };

/**
 * @param {Gamepad | null | undefined} pad
 */
export function hasTwoSticks(pad) {
  return Boolean(pad && pad.connected && pad.axes && pad.axes.length >= 4);
}

/** First connected pad that qualifies, else null. */
export function pollValidGamepad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const pad of pads) {
    if (hasTwoSticks(pad)) return pad;
  }
  return null;
}

function held(pad, i) {
  const b = pad.buttons[i];
  return Boolean(b && (b.pressed || b.value > 0.5));
}

/** True if any digital button is down this poll. */
export function anyButtonPressed(pad) {
  if (!pad) return false;
  for (let i = 0; i < pad.buttons.length; i++) {
    if (held(pad, i)) return true;
  }
  return false;
}

function axis(pad, i) {
  const v = pad.axes[i] || 0;
  return Math.abs(v) < STICK_DEADZONE ? 0 : v;
}

/**
 * Play input. Steer is both sticks' X (feet shifting sideways).
 * Push is × Cross. □ Square is reserved (not a push).
 */
export function readPlayInput(pad) {
  if (!pad) return { steer: 0, push: false };
  return {
    steer: (axis(pad, 0) + axis(pad, 2)) * 0.5,
    push: held(pad, BTN.CROSS),
  };
}
