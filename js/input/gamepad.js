// Poll every play frame. A valid pad has two analog sticks (four axes).
// Face buttons use the standard mapping, labeled PlayStation: × ○ □ △
// L2/R2 are buttons 6/7 (analog triggers).

import { STICK_DEADZONE } from "../constants.js";

/** Standard mapping: × Cross, ○ Circle, □ Square, △ Triangle. */
export const BTN = {
  CROSS: 0,
  CIRCLE: 1,
  SQUARE: 2,
  TRIANGLE: 3,
  R1: 5,
  L2: 6,
  R2: 7,
  DUP: 12,
  DDOWN: 13,
};

const ZERO_FOOT = { x: 0, y: 0 };

export const IDLE_INPUT = {
  steer: 0,
  pushLeft: false,
  pushRight: false,
  triangle: false,
  circle: false,
  dpadUp: false,
  dpadDown: false,
  r1: false,
  front: ZERO_FOOT,
  back: ZERO_FOOT,
  frontYVel: 0,
  backYVel: 0,
  frontXVel: 0,
  backXVel: 0,
  l2: 0,
  r2: 0,
};

let prevFrontY = 0;
let prevBackY = 0;
let prevFrontX = 0;
let prevBackX = 0;
let prevTime = 0;

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

function trigger(pad, i) {
  const b = pad.buttons[i];
  return b ? b.value : 0;
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
 * @param {Gamepad} pad
 * @param {boolean} regular Regular: left = front foot, right = back foot.
 * @param {number} now performance.now()
 */
export function readPlayInput(pad, regular, now) {
  if (!pad) {
    prevFrontY = 0;
    prevBackY = 0;
    prevFrontX = 0;
    prevBackX = 0;
    return IDLE_INPUT;
  }
  const lx = axis(pad, 0);
  const ly = axis(pad, 1);
  const rx = axis(pad, 2);
  const ry = axis(pad, 3);
  const front = regular ? { x: lx, y: ly } : { x: rx, y: ry };
  const back = regular ? { x: rx, y: ry } : { x: lx, y: ly };
  const dt = prevTime ? Math.max(0.001, (now - prevTime) / 1000) : FIXED_FALLBACK;
  const frontYVel = (front.y - prevFrontY) / dt;
  const backYVel = (back.y - prevBackY) / dt;
  const frontXVel = (front.x - prevFrontX) / dt;
  const backXVel = (back.x - prevBackX) / dt;
  prevFrontY = front.y;
  prevBackY = back.y;
  prevFrontX = front.x;
  prevBackX = back.x;
  prevTime = now;
  return {
    steer: (front.x + back.x) * 0.5,
    // □ left face = left foot, × bottom/right of that pair = right foot.
    pushLeft: held(pad, BTN.SQUARE),
    pushRight: held(pad, BTN.CROSS),
    triangle: held(pad, BTN.TRIANGLE),
    circle: held(pad, BTN.CIRCLE),
    dpadUp: held(pad, BTN.DUP),
    dpadDown: held(pad, BTN.DDOWN),
    r1: held(pad, BTN.R1),
    front,
    back,
    frontYVel,
    backYVel,
    frontXVel,
    backXVel,
    l2: trigger(pad, BTN.L2),
    r2: trigger(pad, BTN.R2),
  };
}

const FIXED_FALLBACK = 1 / 60;
