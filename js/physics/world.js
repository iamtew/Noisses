import * as THREE from "three";
import {
  BOARD_MASS,
  FIXED_DT,
  GRAVITY,
  GROUND_FRICTION,
  LANDING_DAMP,
  MAX_SPEED,
  PUSH_IMPULSE,
  RAY_EXTRA,
  RIDE_HEIGHT,
  STEER_PIVOT,
  STEER_RATE,
  WHEEL_LOCAL,
  WHEEL_RADIUS,
} from "../constants.js";

const UP = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);
const _origin = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _ray = new THREE.Raycaster();

export function stepWorld(board, dt, input, ground) {
  board.prevPos.copy(board.pos);
  board.prevQuat.copy(board.quat);

  const speed = Math.hypot(board.vel.x, board.vel.z);
  board.yaw += input.steer * (STEER_RATE * Math.min(speed, 2) + STEER_PIVOT) * dt;
  board.quat.setFromAxisAngle(UP, board.yaw);
  _forward.set(0, 0, 1).applyQuaternion(board.quat);

  board.vel.y -= GRAVITY * dt;

  if (input.push && !board.pushLatch && board.grounded) {
    board.vel.addScaledVector(_forward, PUSH_IMPULSE / BOARD_MASS);
  }
  board.pushLatch = input.push;

  const hSpeed = Math.hypot(board.vel.x, board.vel.z);
  if (hSpeed > MAX_SPEED) {
    const s = MAX_SPEED / hSpeed;
    board.vel.x *= s;
    board.vel.z *= s;
  }

  board.pos.addScaledVector(board.vel, dt);

  let grounded = false;
  let lift = 0;
  _ray.far = RIDE_HEIGHT + RAY_EXTRA;
  for (const w of WHEEL_LOCAL) {
    _origin.set(w.x, w.y, w.z).applyQuaternion(board.quat).add(board.pos);
    _ray.set(_origin, DOWN);
    const hit = _ray.intersectObject(ground, false)[0];
    if (!hit) continue;
    if (hit.distance <= RIDE_HEIGHT + 0.04) grounded = true;
    const need = RIDE_HEIGHT - hit.distance;
    if (need > lift) lift = need;
  }

  board.grounded = grounded;
  if (lift > 0) board.pos.y += lift;
  if (grounded) {
    if (board.vel.y < 0) board.vel.y *= LANDING_DAMP;
    const damp = Math.exp(-GROUND_FRICTION * dt);
    board.vel.x *= damp;
    board.vel.z *= damp;
    board.wheelSpin += Math.hypot(board.vel.x, board.vel.z) * dt / WHEEL_RADIUS;
  }
}

/** Fails loud if gravity integration is broken. */
export function selfCheck() {
  let y = 2;
  let v = 0;
  for (let t = 0; t < 1; t += FIXED_DT) {
    v -= GRAVITY * FIXED_DT;
    y += v * FIXED_DT;
  }
  if (!(y < 0)) throw new Error("gravity self-check failed");
}
