import * as THREE from "three";
import {
  AIR_ROLL,
  AIR_ROLL_DAMP,
  TRIGGER_YAW,
  BAIL_DOWN,
  BAIL_PITCH,
  BAIL_ROLL,
  CATCH_ANGLE,
  BOARD_MASS,
  BONE_IMPULSE,
  FIXED_DT,
  GRAVITY,
  GRIND_FRICTION,
  GRIND_LOCK,
  GRIND_MIN_ALONG,
  GRIND_RIDE,
  GRIND_SLIP,
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
  TRUCK_LOCAL,
  WHEEL_LOCAL,
  WHEEL_RADIUS,
} from "../constants.js";
import { detectPop, stepFlip, wrapPi } from "../tricks/detector.js";

const DOWN = new THREE.Vector3(0, -1, 0);
const _origin = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _truck = new THREE.Vector3();
const _to = new THREE.Vector3();
const _railPt = new THREE.Vector3();
const _euler = new THREE.Euler(0, 0, 0, "YXZ");
const _ray = new THREE.Raycaster();

export function stepWorld(board, dt, input, floors, grinds = [], solids = []) {
  const floorList = Array.isArray(floors) ? floors : [floors];
  for (const m of floorList) m.updateMatrixWorld(true);

  board.prevPos.copy(board.pos);
  board.prevQuat.copy(board.quat);

  const speed = Math.hypot(board.vel.x, board.vel.z);
  const airborne = !board.grounded;
  const front = input.front || { x: 0, y: 0 };
  const back = input.back || { x: 0, y: 0 };
  // L2 left, R2 right. Was R2−L2 and air-only; that felt inverted and dead on the pad.
  const lean = (input.l2 || 0) - (input.r2 || 0);
  const turn = STEER_RATE * Math.min(speed, 2) + STEER_PIVOT;
  board.yaw += lean * TRIGGER_YAW * (airborne ? 1 : turn / STEER_PIVOT) * dt;
  if (airborne) {
    // Front X is the scoop. Lean only from the back foot.
    board.roll += back.x * AIR_ROLL * dt;
    board.roll *= Math.exp(-AIR_ROLL_DAMP * dt);
  } else {
    board.yaw += input.steer * turn * dt;
    board.roll += (0 - board.roll) * (1 - Math.exp(-PITCH_FOLLOW * dt));
  }
  // Sticks down (+) load the tail → nose up → negative pitch (YXZ, +Z nose).
  const pitchTarget = -0.5 * (front.y + back.y) * PITCH_MAX;
  const pitchRate = airborne ? PITCH_FOLLOW * 0.25 : PITCH_FOLLOW;
  board.pitch += (pitchTarget - board.pitch) * (1 - Math.exp(-pitchRate * dt));

  const pop = detectPop(input, board, dt);
  if (pop > 0) board.vel.y += pop / BOARD_MASS;
  if (airborne && !board.boned && front.y < -0.5 && back.y < -0.5) {
    board.vel.y += BONE_IMPULSE / BOARD_MASS;
    board.boned = true;
  }
  if (!airborne) board.boned = false;

  if (!board.grinding) stepFlip(input, board, dt, airborne);
  _euler.set(board.pitch, board.yaw + board.shuv, board.roll + board.flip);
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

  const hSpeed = Math.hypot(board.vel.x, board.vel.z);
  if (hSpeed > MAX_SPEED) {
    const s = MAX_SPEED / hSpeed;
    board.vel.x *= s;
    board.vel.z *= s;
  }

  board.pos.addScaledVector(board.vel, dt);

  if (!board.grinding) tryLockGrind(board, grinds, front, back);
  if (board.grinding) {
    stepGrind(board, dt, front, back);
    board.wasGrounded = false;
    board.grounded = false;
    if (board.bailed > 0) board.bailed = Math.max(0, board.bailed - dt);
    return;
  }

  if (!board.grinding) {
    for (const g of grinds) bumpGrindBody(board, g);
  }
  resolveSolids(board, solids);

  let grounded = false;
  let lift = 0;
  _ray.far = RAY_FAR;
  for (const w of WHEEL_LOCAL) {
    _origin.set(w.x, w.y, w.z).applyQuaternion(board.quat).add(board.pos);
    _ray.set(_origin, DOWN);
    const hit = _ray.intersectObjects(floorList, false)[0];
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
    const hit = _ray.intersectObjects(floorList, false)[0];
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
      -board.vel.y > BAIL_DOWN ||
      Math.abs(wrapPi(board.flip)) > CATCH_ANGLE ||
      Math.abs(wrapPi(board.shuv)) > CATCH_ANGLE ||
      (!board.caught && (Math.abs(board.flip) > 0.35 || Math.abs(board.shuv) > 0.35));
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

function projectGrind(pos, grind) {
  _to.copy(pos).sub(grind.origin);
  let t = _to.dot(grind.dir);
  const atEnd = Math.abs(t) >= grind.halfLen - 0.04;
  t = Math.max(-grind.halfLen, Math.min(grind.halfLen, t));
  _railPt.copy(grind.dir).multiplyScalar(t).add(grind.origin);
  return { atEnd, dist: pos.distanceTo(_railPt) };
}

function nearestTruckDist(board, grind) {
  let best = Infinity;
  for (const tr of TRUCK_LOCAL) {
    _truck.set(tr.x, tr.y, tr.z).applyQuaternion(board.quat).add(board.pos);
    const hit = projectGrind(_truck, grind);
    if (hit.dist < best) best = hit.dist;
  }
  return best;
}

function grindName(front, back, parallel) {
  const tail = 0.5 * (front.y + back.y);
  if (parallel < 0.45) return front.x + back.x > 0 ? "lipslide" : "boardslide";
  if (tail > 0.32) return "5-0";
  if (tail < -0.32) return "nosegrind";
  return "50-50";
}

function bumpGrindBody(board, grind) {
  const hit = projectGrind(board.pos, grind);
  const dx = board.pos.x - _railPt.x;
  const dz = board.pos.z - _railPt.z;
  const d = Math.hypot(dx, dz);
  const rad = grind.radius + 0.09;
  if (d < 1e-4 || d >= rad) return;
  if (Math.abs(board.pos.y - grind.origin.y) > 0.28) return;
  const push = (rad - d) / d;
  board.pos.x += dx * push;
  board.pos.z += dz * push;
  const into = board.vel.x * dx + board.vel.z * dz;
  if (into < 0) {
    board.vel.x -= (into / (d * d)) * dx;
    board.vel.z -= (into / (d * d)) * dz;
  }
}

function resolveSolids(board, solids) {
  const y = board.pos.y;
  for (const b of solids) {
    if (y > b.max.y - 0.01) continue;
    if (y + 0.05 < b.min.y) continue;
    const x = board.pos.x;
    const z = board.pos.z;
    if (x < b.min.x || x > b.max.x || z < b.min.z || z > b.max.z) continue;
    const dx0 = x - b.min.x;
    const dx1 = b.max.x - x;
    const dz0 = z - b.min.z;
    const dz1 = b.max.z - z;
    const m = Math.min(dx0, dx1, dz0, dz1);
    if (m === dx0) {
      board.pos.x = b.min.x;
      if (board.vel.x < 0) board.vel.x = 0;
    } else if (m === dx1) {
      board.pos.x = b.max.x;
      if (board.vel.x > 0) board.vel.x = 0;
    } else if (m === dz0) {
      board.pos.z = b.min.z;
      if (board.vel.z < 0) board.vel.z = 0;
    } else {
      board.pos.z = b.max.z;
      if (board.vel.z > 0) board.vel.z = 0;
    }
  }
}

function tryLockGrind(board, grinds, front, back) {
  if (board.grounded) return;
  if (!board.caught && Math.abs(board.flip) > 0.45) return;
  for (const g of grinds) {
    if (nearestTruckDist(board, g) > GRIND_LOCK) continue;
    if (Math.abs(board.vel.dot(g.dir)) < GRIND_MIN_ALONG) continue;
    board.grinding = true;
    board.grind = g;
    board.trick = grindName(front, back, Math.abs(_forward.dot(g.dir)));
    return;
  }
}

function stepGrind(board, dt, front, back) {
  const g = board.grind;
  if (board.vel.y > 0.45) {
    board.grinding = false;
    board.grind = null;
    return;
  }
  const hit = projectGrind(board.pos, g);
  if (hit.atEnd || hit.dist > GRIND_SLIP) {
    board.grinding = false;
    board.grind = null;
    return;
  }
  board.pos.x = _railPt.x;
  board.pos.z = _railPt.z;
  board.pos.y = g.origin.y + GRIND_RIDE;
  const along = board.vel.dot(g.dir);
  board.vel.copy(g.dir).multiplyScalar(along);
  board.vel.y = 0;
  board.vel.multiplyScalar(Math.exp(-GRIND_FRICTION * dt));
  board.trick = grindName(front, back, Math.abs(_forward.dot(g.dir)));
}

function bail(board) {
  board.vel.set(0, 0, 0);
  board.pitch = 0;
  board.roll = 0;
  board.flip = 0;
  board.flipRate = 0;
  board.shuv = 0;
  board.shuvRate = 0;
  board.caught = true;
  board.trick = "";
  board.grinding = false;
  board.grind = null;
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
