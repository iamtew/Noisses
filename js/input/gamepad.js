// Poll every play frame. A valid pad has two analog sticks (four axes).

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
