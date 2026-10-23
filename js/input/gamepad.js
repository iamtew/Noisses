// Poll every play frame. A valid pad has two analog sticks (four axes).

import { STICK_DEADZONE } from "../constants.js";

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

/** True if any digital button is down this poll. */
export function anyButtonPressed(pad) {
  if (!pad) return false;
  for (const b of pad.buttons) {
    if (b && b.pressed) return true;
  }
  return false;
}

function axis(pad, i) {
  const v = pad.axes[i] || 0;
  return Math.abs(v) < STICK_DEADZONE ? 0 : v;
}

/**
 * Play input. Steer is both sticks' X (feet shifting sideways).
 * Push is A / Cross (button 0).
 */
export function readPlayInput(pad) {
  if (!pad) return { steer: 0, push: false };
  return {
    steer: (axis(pad, 0) + axis(pad, 2)) * 0.5,
    push: Boolean(pad.buttons[0] && pad.buttons[0].pressed),
  };
}
