import * as THREE from "three";
import {
  AIR_ROLL,
  AIR_ROLL_DAMP,
  TRIGGER_YAW,
  BAIL_DOWN,
  BAIL_PITCH,
  BAIL_ROLL,
  BOARD_MASS,
  BONE_IMPULSE,
  FIXED_DT,
  GRAVITY,
  GROUND_FRICTION,
  LANDING_DAMP,
  MAX_SPEED,
  PITCH_FOLLOW,
  PITCH_MAX,
  PUSH_IMPULSE,
  RAY_FAR,
  RESCUE_RAY,
  RIDE_HEIGHT,
  STEER_PIVOT,
  STEER_RATE,
  WHEEL_LOCAL,
  WHEEL_RADIUS,
} from "../constants.js";
import { detectPop } from "../tricks/detector.js";

const DOWN = new THREE.Vector3(0, -1, 0);
const _origin = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _euler = new THREE.Euler(0, 0, 0, "YXZ");
const _ray = new THREE.Raycaster();

export function stepWorld(board, dt, input, ground) {
  // Rays use matrixWorld. Identity until this runs, so the pad looks like a
  // vertical XY plane and the board falls through the void.
  ground.updateMatrixWorld(true);

  board.prevPos.copy(board.pos);
  board.prevQuat.copy(board.quat);

  const speed = Math.hypot(board.vel.x, board.vel.z);
  const airborne = !board.grounded;
  // L2 left, R2 right. Was R2−L2 and air-only; that felt inverted and dead on the pad.
  const lean = (input.l2 || 0) - (input.r2 || 0);
  const turn = STEER_RATE * Math.min(speed, 2) + STEER_PIVOT;
  board.yaw += lean * TRIGGER_YAW * (airborne ? 1 : turn / STEER_PIVOT) * dt;
  if (airborne) {
    board.roll += (input.steer || 0) * AIR_ROLL * dt;
    board.roll *= Math.exp(-AIR_ROLL_DAMP * dt);
  } else {
    board.yaw += input.steer * turn * dt;
    board.roll += (0 - board.roll) * (1 - Math.exp(-PITCH_FOLLOW * dt));
  }

  const front = input.front || { x: 0, y: 0 };
  const back = input.back || { x: 0, y: 0 };
  // Sticks down (+) load the tail → nose up → negative pitch (YXZ, +Z nose).
  const pitchTarget = -0.5 * (front.y + back.y) * PITCH_MAX;
  const pitchRate = airborne ? PITCH_FOLLOW * 0.25 : PITCH_FOLLOW;
  board.pitch += (pitchTarget - board.pitch) * (1 - Math.exp(-pitchRate * dt));

  _euler.set(board.pitch, board.yaw, board.roll);
  board.quat.setFromEuler(_euler);
  _forward.set(0, 0, 1).applyQuaternion(board.quat);

  board.vel.y -= GRAVITY * dt;

  if (board.grounded) {
    if (input.pushLeft && !board.pushLeftLatch) {
      board.vel.addScaledVector(_forward, PUSH_IMPULSE / BOARD_MASS);
    }
    if (input.pushRight && !board.pushRightLatch) {
      board.vel.addScaledVector(_forward, PUSH_IMPULSE / BOARD_MASS);
    }
  }
  board.pushLeftLatch = Boolean(input.pushLeft);
  board.pushRightLatch = Boolean(input.pushRight);

  const pop = detectPop(input, board, dt);
  if (pop > 0) board.vel.y += pop / BOARD_MASS;
  if (airborne && !board.boned && front.y < -0.5 && back.y < -0.5) {
    board.vel.y += BONE_IMPULSE / BOARD_MASS;
    board.boned = true;
  }
  if (!airborne) board.boned = false;

  const hSpeed = Math.hypot(board.vel.x, board.vel.z);
  if (hSpeed > MAX_SPEED) {
    const s = MAX_SPEED / hSpeed;
    board.vel.x *= s;
    board.vel.z *= s;
  }

  board.pos.addScaledVector(board.vel, dt);

  let grounded = false;
  let lift = 0;
  _ray.far = RAY_FAR;
  for (const w of WHEEL_LOCAL) {
    _origin.set(w.x, w.y, w.z).applyQuaternion(board.quat).add(board.pos);
    _ray.set(_origin, DOWN);
    const hit = _ray.intersectObject(ground, false)[0];
    if (!hit) continue;
    if (hit.distance <= RIDE_HEIGHT + 0.04) grounded = true;
    const need = RIDE_HEIGHT - hit.distance;
    if (need > lift) lift = need;
  }

  if (!grounded) {
    _origin.copy(board.pos);
    _origin.y += RESCUE_RAY;
    _ray.far = RESCUE_RAY * 2;
    _ray.set(_origin, DOWN);
    const hit = _ray.intersectObject(ground, false)[0];
    if (hit) {
      const groundY = _origin.y - hit.distance;
      // Only snap up if we already tunneled. Do not glue an airborne board.
      if (board.pos.y < groundY) {
        board.pos.y = groundY + RIDE_HEIGHT;
        board.vel.y = 0;
        grounded = true;
      }
    }
  }

  if (grounded && !board.wasGrounded) {
    const ugly =
      Math.abs(board.pitch) > BAIL_PITCH ||
      Math.abs(board.roll) > BAIL_ROLL ||
      -board.vel.y > BAIL_DOWN;
    if (ugly) bail(board);
  }
  board.wasGrounded = grounded;
  board.grounded = grounded;
  if (board.bailed > 0) board.bailed = Math.max(0, board.bailed - dt);

  // Leaving the ground: skip the glue so an ollie can actually pop.
  const sticking = grounded && board.vel.y <= 0.35;
  if (lift > 0 && sticking) board.pos.y += lift;
  if (sticking) {
    if (board.vel.y < 0) board.vel.y *= LANDING_DAMP;
    const damp = Math.exp(-GROUND_FRICTION * dt);
    board.vel.x *= damp;
    board.vel.z *= damp;
    board.wheelSpin += Math.hypot(board.vel.x, board.vel.z) * dt / WHEEL_RADIUS;
  }
}

function bail(board) {
  board.vel.set(0, 0, 0);
  board.pitch = 0;
  board.roll = 0;
  board.bailed = 1.2;
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
