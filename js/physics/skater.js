// Off the board. Kinematic walk, not a second skate sim.
// ponytail: same box shove as the deck. No step-up; a ledge is a wall until the feet clear it.

import * as THREE from "three";
import {
  CARRY_TIME,
  GRAVITY,
  MAX_SPEED,
  RUN_SPEED,
  RUN_TAP,
  WALK_JUMP,
  WALK_SPEED,
  getTune,
  setTune,
} from "../constants.js";
import { resolveSolids } from "./world.js";

export function createWalker() {
  return {
    carry: 0,
    carryTo: 0,
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    yaw: 0,
    camYaw: 0,
    camPitch: 0.35,
    running: false,
    moving: false,
    grounded: true,
    jumpArm: 0,
    crossWas: false,
  };
}

export function carryEase(t) {
  const u = Math.min(1, Math.max(0, t));
  return u * u * (3 - 2 * u);
}

/** True while the get-on / get-off blend is still moving. */
export function carryBusy(walker) {
  return Math.abs(walker.carry - walker.carryTo) > 0.0001;
}

export function stepCarry(walker, dt) {
  if (!carryBusy(walker)) {
    walker.carry = walker.carryTo;
    return;
  }
  const step = dt / CARRY_TIME;
  if (walker.carry < walker.carryTo) walker.carry = Math.min(walker.carryTo, walker.carry + step);
  else walker.carry = Math.max(walker.carryTo, walker.carry - step);
}

/**
 * Root yaw so the face tracks the move. Same axes as on the board:
 * regular looks along root −X, switch along root +X. The chest yaw does not change.
 */
export function faceYaw(moveX, moveZ, regular) {
  if (regular) return Math.atan2(moveZ, -moveX);
  return Math.atan2(-moveZ, moveX);
}

/** Board nose along the way the face was pointing, so a push keeps that direction. */
export function noseYaw(faceYaw, regular) {
  const faceX = regular ? -Math.cos(faceYaw) : Math.cos(faceYaw);
  const faceZ = regular ? Math.sin(faceYaw) : -Math.sin(faceYaw);
  return Math.atan2(faceX, faceZ);
}

/**
 * Left stick, camera-relative. Cross jumps after RUN_TAP unless a second
 * press lands in that window, which runs until the stick recenters.
 * `floorY(x, z)` is the plaza ray. Solids are the same boxes as the deck.
 */
export function stepWalker(walker, input, dt, floorY, solids, regular = true) {
  let jumped = false;
  let landed = false;
  let impact = 0;
  const lx = input.lx || 0;
  const ly = input.ly || 0;
  const mag = Math.hypot(lx, ly);
  if (mag < 0.01) walker.running = false;

  const pressed = Boolean(input.pushRight);
  if (pressed && !walker.crossWas) {
    if (walker.jumpArm > 0) {
      walker.running = mag >= 0.01;
      walker.jumpArm = 0;
    } else walker.jumpArm = RUN_TAP;
  }
  walker.crossWas = pressed;
  if (walker.jumpArm > 0) {
    walker.jumpArm -= dt;
    if (walker.jumpArm <= 0) {
      walker.jumpArm = 0;
      if (walker.grounded) {
        walker.vel.y = WALK_JUMP;
        walker.grounded = false;
        jumped = true;
      }
    }
  }

  // camYaw 0: camera sits at +Z and looks toward −Z. Stick up walks that way.
  const sy = Math.sin(walker.camYaw);
  const cy = Math.cos(walker.camYaw);
  let mx = -sy * -ly + cy * lx;
  let mz = -cy * -ly + -sy * lx;
  const mlen = Math.hypot(mx, mz);
  if (mlen > 1e-4) {
    const stick = Math.min(1, mlen);
    mx /= mlen;
    mz /= mlen;
    const speed = walker.running ? RUN_SPEED : WALK_SPEED;
    walker.vel.x = mx * speed * stick;
    walker.vel.z = mz * speed * stick;
    walker.yaw = faceYaw(mx, mz, regular);
    walker.moving = true;
  } else {
    walker.vel.x = 0;
    walker.vel.z = 0;
    walker.moving = false;
  }

  walker.vel.y -= GRAVITY * dt;
  walker.pos.x += walker.vel.x * dt;
  walker.pos.y += walker.vel.y * dt;
  walker.pos.z += walker.vel.z * dt;
  resolveSolids(walker, solids);

  const gy = floorY(walker.pos.x, walker.pos.z);
  if (walker.pos.y <= gy) {
    if (!walker.grounded && walker.vel.y < 0) {
      landed = true;
      impact = -walker.vel.y;
    }
    if (walker.vel.y < 0) walker.vel.y = 0;
    walker.pos.y = gy;
    walker.grounded = true;
  } else walker.grounded = false;

  return { jumped, landed, impact };
}

/** Drop the deck under the feet. Nose faces the walk. Horizontal speed carries over. */
export function plantUnderFeet(board, walker, y) {
  const h = Math.hypot(walker.vel.x, walker.vel.z);
  const scale = h > MAX_SPEED ? MAX_SPEED / h : 1;
  board.pos.set(walker.pos.x, y, walker.pos.z);
  board.prevPos.copy(board.pos);
  board.vel.set(walker.vel.x * scale, 0, walker.vel.z * scale);
  const yaw = noseYaw(walker.yaw, board.regular !== false);
  board.yaw = yaw;
  board.pitch = 0;
  board.roll = 0;
  board.flip = 0;
  board.flipRate = 0;
  board.shuv = 0;
  board.shuvRate = 0;
  board.quat.setFromEuler(new THREE.Euler(0, yaw, 0, "YXZ"));
  board.prevQuat.copy(board.quat);
  board.grounded = true;
  board.wasGrounded = true;
  board.caught = true;
  board.trick = "";
  board.grinding = false;
  board.grind = null;
  board.sliding = false;
  board.manual = "";
  board.balance = 0;
  board.manualCharge = 0;
  board.bailed = 0;
  board.airTime = 0;
  board.boned = false;
  walker.vel.x = 0;
  walker.vel.z = 0;
  walker.running = false;
  walker.moving = false;
  walker.jumpArm = 0;
}

export function selfCheckWalker() {
  // Saved gravity is live. A heavy slider dips the foot under the test wall
  // in one 50ms step and the boot check kills the page.
  const savedG = getTune().gravity;
  setTune("gravity", 1, false);
  try {
  const w = createWalker();
  w.carry = 1;
  w.carryTo = 1;
  w.camYaw = 0;
  w.pos.set(0, 0, 0);
  w.grounded = true;
  const floor = () => 0;
  const up = { lx: 0, ly: -1, pushRight: false, rx: 0, ry: 0 };
  stepWalker(w, up, 0.1, floor, []);
  if (!(w.pos.z < -0.15)) throw new Error("walk should move away from the camera");
  if (!(Math.abs(w.yaw + Math.PI / 2) < 0.2)) throw new Error("walk yaw should face the move");

  w.running = false;
  w.jumpArm = 0;
  w.crossWas = false;
  w.vel.y = 0;
  w.grounded = true;
  stepWalker(w, { ...up, pushRight: true }, 0.016, floor, []);
  stepWalker(w, up, 0.05, floor, []);
  const hop = stepWalker(w, { ...up, pushRight: true }, 0.016, floor, []);
  if (!w.running) throw new Error("double tap should run");
  if (hop.jumped || w.vel.y !== 0) throw new Error("double tap should not jump");

  w.running = true;
  w.jumpArm = 0;
  w.crossWas = false;
  stepWalker(w, { lx: 0, ly: 0, pushRight: false }, 0.016, floor, []);
  if (w.running) throw new Error("recenter should drop the run");

  w.grounded = true;
  w.pos.y = 0;
  w.vel.y = 0;
  w.jumpArm = 0;
  w.crossWas = false;
  stepWalker(w, { lx: 0, ly: 0, pushRight: true }, 0.016, floor, []);
  w.jumpArm = 0.001;
  const jumped = stepWalker(w, { lx: 0, ly: 0, pushRight: false }, 0.016, floor, []);
  if (!jumped.jumped) throw new Error("cross should jump");
  if (!(w.vel.y > 0)) throw new Error("jump never left the ground");

  const box = new THREE.Box3(new THREE.Vector3(-1, 0, -3), new THREE.Vector3(1, 2, -1));
  w.pos.set(0, 0, 0);
  w.vel.set(0, 0, 0);
  w.camYaw = 0;
  w.grounded = true;
  w.jumpArm = 0;
  for (let i = 0; i < 40; i++) stepWalker(w, up, 0.05, floor, [box]);
  if (w.pos.z < -1.05) throw new Error("walk should stop at a wall");

  const face = faceYaw(-1, 0, true);
  if (!(Math.abs(face) < 0.05)) throw new Error("regular face yaw");
  const nose = noseYaw(0, true);
  if (!(Math.abs(nose + Math.PI / 2) < 0.05)) throw new Error("nose should follow the face");
  } finally {
    setTune("gravity", savedG, false);
  }
}
