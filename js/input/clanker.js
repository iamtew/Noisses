// Clanker debug only. Meat Bag still needs a pad.
// `?clanker=yes` or `true`. See AGENTS.md.

import { STICK_DEADZONE } from "../constants.js";

const v = new URLSearchParams(location.search).get("clanker");
export const CLANKER =
  Boolean(v) && ["yes", "true"].includes(v.toLowerCase());

const KEYS = new Set();
const MAPPED = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyI",
  "KeyJ",
  "KeyK",
  "KeyL",
  "KeyF",
  "Space",
  "KeyE",
  "KeyQ",
  "Escape",
  "KeyR",
  "KeyU",
  "KeyO",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyZ",
  "KeyX",
]);

const mouse = { lx: 0, ly: 0, rx: 0, ry: 0 };
const held = { l: false, r: false };
const pointers = new Map();

function onMappedKey(e, down) {
  const t = e.target;
  if (t instanceof Element && (t.closest("input, textarea") || t.isContentEditable)) return;
  if (!MAPPED.has(e.code)) return;
  e.preventDefault();
  if (down) KEYS.add(e.code);
  else KEYS.delete(e.code);
}

function clearClanker() {
  KEYS.clear();
  pointers.clear();
  mouse.lx = mouse.ly = mouse.rx = mouse.ry = 0;
  held.l = held.r = false;
}

if (CLANKER) {
  addEventListener("keydown", (e) => onMappedKey(e, true));
  addEventListener("keyup", (e) => onMappedKey(e, false));
  addEventListener("blur", clearClanker);
}

function keyDown(code) {
  return KEYS.has(code);
}

function keyAxis(neg, pos) {
  const n = keyDown(neg);
  const p = keyDown(pos);
  if (n === p) return 0;
  return p ? 1 : -1;
}

function dead(n) {
  return Math.abs(n) < STICK_DEADZONE ? 0 : n;
}

function padAxes(el, e) {
  const r = el.getBoundingClientRect();
  const hx = r.width * 0.5;
  const hy = r.height * 0.5;
  let x = hx ? (e.clientX - r.left - hx) / hx : 0;
  let y = hy ? (e.clientY - r.top - hy) / hy : 0;
  const m = Math.hypot(x, y);
  if (m > 1) {
    x /= m;
    y /= m;
  }
  return { x: dead(x), y: dead(y) };
}

function writePad(side, x, y) {
  if (side === "l") {
    mouse.lx = x;
    mouse.ly = y;
    held.l = true;
  } else {
    mouse.rx = x;
    mouse.ry = y;
    held.r = true;
  }
}

function dropPad(side) {
  if (side === "l") {
    mouse.lx = 0;
    mouse.ly = 0;
    held.l = false;
  } else {
    mouse.rx = 0;
    mouse.ry = 0;
    held.r = false;
  }
}

function onPointerMove(e) {
  const p = pointers.get(e.pointerId);
  if (!p) return;
  const a = padAxes(p.el, e);
  writePad(p.side, a.x, a.y);
}

function onPointerUp(e) {
  const p = pointers.get(e.pointerId);
  if (!p) return;
  pointers.delete(e.pointerId);
  dropPad(p.side);
}

/** Drag the stick HUD. Two pointers can hold both feet. */
export function bindClankerPads(root) {
  if (!CLANKER) return;
  addEventListener("pointermove", onPointerMove);
  addEventListener("pointerup", onPointerUp);
  addEventListener("pointercancel", onPointerUp);
  const pads = root.querySelectorAll(".pad");
  [
    [pads[0], "l"],
    [pads[1], "r"],
  ].forEach(([el, side]) => {
    if (!el) return;
    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* synthetic events have no real pointer */
      }
      pointers.set(e.pointerId, { side, el });
      const a = padAxes(el, e);
      writePad(side, a.x, a.y);
    });
  });
}

/** Axes + buttons in the same shape readPlayInput packs. */
export function clankerRaw() {
  return {
    lx: held.l ? mouse.lx : keyAxis("KeyA", "KeyD"),
    ly: held.l ? mouse.ly : keyAxis("KeyW", "KeyS"),
    rx: held.r ? mouse.rx : keyAxis("KeyJ", "KeyL"),
    ry: held.r ? mouse.ry : keyAxis("KeyI", "KeyK"),
    pushLeft: keyDown("KeyF"),
    pushRight: keyDown("Space"),
    triangle: keyDown("KeyE"),
    circle: keyDown("KeyQ"),
    dpadUp: keyDown("ArrowUp"),
    dpadDown: keyDown("ArrowDown"),
    dpadLeft: keyDown("ArrowLeft"),
    dpadRight: keyDown("ArrowRight"),
    options: keyDown("Escape"),
    r1: keyDown("KeyR"),
    l3: keyDown("KeyZ"),
    r3: keyDown("KeyX"),
    l2: keyDown("KeyU") ? 1 : 0,
    r2: keyDown("KeyO") ? 1 : 0,
  };
}
