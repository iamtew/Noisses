import * as THREE from "three";
import {
  AIR_ROLL,
  AIR_ROLL_DAMP,
  TRIGGER_YAW,
  BAIL_DOWN,
  BAIL_PITCH,
  BAIL_ROLL,
  CATCH_ANGLE,
  CATCH_LAND,
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
  SLIDE_FRICTION,
  SLIDE_YAW,
  LANDING_DAMP,
  MAX_SPEED,
  MANUAL_PITCH,
  PITCH_FOLLOW,
  PITCH_MAX,
  PUSH_IMPULSE,
  RAY_FAR,
  RESCUE_RAY,
  WHEEL_RAY_LIFT,
  RIDE_HEIGHT,
  STEER_PIVOT,
  STEER_RATE,
  TRUCK_LOCAL,
  WHEEL_LOCAL,
  WHEEL_RADIUS,
} from "../constants.js";
import { grindFric, grindLabel, matchGrind, stickDir, updateRide } from "../tricks/catalog.js";
import { detectPop, feetSplit, stepFlip, stepManual, tryCatch, wrapPi } from "../tricks/detector.js";

const DOWN = new THREE.Vector3(0, -1, 0);
const UP = new THREE.Vector3(0, 1, 0);
const _origin = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _ride = new THREE.Vector3();
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
  _euler.set(board.pitch, board.yaw, board.roll);
  _ride.set(0, 0, 1).applyEuler(_euler);
  updateRide(board, _ride);
  // L2 left, R2 right. Was R2−L2 and air-only; that felt inverted and dead on the pad.
  const lean = (input.l2 || 0) - (input.r2 || 0);
  const turn = STEER_RATE * Math.min(speed, 2) + STEER_PIVOT;
  const yaw0 = board.yaw;
  board.yaw += lean * TRIGGER_YAW * (airborne ? 1 : turn / STEER_PIVOT) * dt;
  if (airborne) {
    // Front X is the scoop. Lean only from the back foot.
    board.roll += back.x * AIR_ROLL * dt;
    board.roll *= Math.exp(-AIR_ROLL_DAMP * dt);
  } else {
    board.yaw += input.steer * turn * dt;
    board.roll += (0 - board.roll) * (1 - Math.exp(-PITCH_FOLLOW * dt));
  }
  const dYaw = board.yaw - yaw0;
  if (!airborne && !board.sliding) yawVel(board.vel, dYaw);
  const fell = stepManual(board, input, dt, !airborne, speed);
  if (fell) bail(board);
  // Back 6 o'clock lifts the nose. Front 12 o'clock presses it.
  // Powerslide holds both ends, so the deck stays flat once the slide is locked.
  let pitchTarget = board.sliding ? 0 : stancePitch(front.y, back.y);
  if (board.manual === "tail") pitchTarget = -(MANUAL_PITCH + board.balance * 0.12);
  if (board.manual === "nose") pitchTarget = MANUAL_PITCH + board.balance * 0.12;
  const pitchRate = airborne ? PITCH_FOLLOW * 0.25 : PITCH_FOLLOW;
  if (!fell) board.pitch += (pitchTarget - board.pitch) * (1 - Math.exp(-pitchRate * dt));

  const pop = detectPop(input, board, dt);
  if (pop > 0) board.vel.y += pop / BOARD_MASS;
  // stepFlip clears trick on the ground. Put the pop name back so it survives into the air.
  const popped = pop > 0 ? board.trick : "";
  const poppedRow = pop > 0 ? board.trickRow : null;
  if (airborne && !board.boned && front.y < -0.5 && back.y < -0.5) {
    board.vel.y += BONE_IMPULSE / BOARD_MASS;
    board.boned = true;
  }
  if (!airborne) board.boned = false;

  if (!board.grinding) stepFlip(input, board, dt, airborne);
  if (popped) {
    board.trick = popped;
    board.trickRow = poppedRow;
    board.spinApplied = false;
  }
  _euler.set(board.pitch, board.yaw + board.shuv, board.roll + board.flip);
  board.quat.setFromEuler(_euler);
  _forward.set(0, 0, 1).applyQuaternion(board.quat);
  _euler.set(board.pitch, board.yaw, board.roll);
  _ride.set(0, 0, 1).applyEuler(_euler);

  board.vel.y -= GRAVITY * dt;

  if (board.grounded) {
    if (input.pushLeft && !board.pushLeftLatch) {
      board.vel.addScaledVector(_ride, PUSH_IMPULSE / BOARD_MASS);
    }
    if (input.pushRight && !board.pushRightLatch) {
      board.vel.addScaledVector(_ride, PUSH_IMPULSE / BOARD_MASS);
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
    board.sliding = false;
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
    _origin.y += WHEEL_RAY_LIFT;
    _ray.set(_origin, DOWN);
    const hit = _ray.intersectObjects(floorList, false)[0];
    if (!hit) continue;
    const dist = hit.distance - WHEEL_RAY_LIFT;
    if (dist <= RIDE_HEIGHT + 0.04) grounded = true;
    const need = RIDE_HEIGHT - dist;
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
    const trickLand = tryCatch(board, CATCH_LAND);
    const ugly =
      -board.vel.y > BAIL_DOWN ||
      (!trickLand && (Math.abs(board.pitch) > BAIL_PITCH || Math.abs(board.roll) > BAIL_ROLL)) ||
      (!board.caught &&
        (Math.abs(wrapPi(board.flip - (board.flipBase || 0))) > CATCH_ANGLE ||
          Math.abs(wrapPi(board.shuv - (board.shuvBase || 0))) > CATCH_ANGLE ||
          Math.abs(board.flip - (board.flipBase || 0)) > 0.35 ||
          Math.abs(board.shuv - (board.shuvBase || 0)) > 0.35));
    if (ugly) bail(board);
  }
  board.wasGrounded = grounded;
  board.grounded = grounded;
  if (board.bailed > 0) board.bailed = Math.max(0, board.bailed - dt);

  // Leaving the ground: skip the glue so an ollie can actually pop.
  const sticking = grounded && board.vel.y <= 0.35;
  if (lift > 0 && sticking) board.pos.y += lift;
  board.sliding = sticking && !board.manual && feetSplit(front, back);
  if (board.sliding) board.yaw += Math.sign(front.y - back.y) * SLIDE_YAW * dt;
  if (sticking) {
    if (board.vel.y < 0) board.vel.y *= LANDING_DAMP;
    const friction = GROUND_FRICTION + (board.sliding ? SLIDE_FRICTION : 0);
    const damp = Math.exp(-friction * dt);
    board.vel.x *= damp;
    board.vel.z *= damp;
    board.wheelSpin += Math.hypot(board.vel.x, board.vel.z) * dt / WHEEL_RADIUS;
  } else {
    board.sliding = false;
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

/** Invented: rail on the rider's right is frontside. */
function grindSide(forward, pos) {
  const dx = _railPt.x - pos.x;
  const dz = _railPt.z - pos.z;
  return dx * forward.z - dz * forward.x >= 0 ? "fs" : "bs";
}

function nameGrind(board, front, back) {
  const g = board.grind;
  if (!g) return "";
  projectGrind(board.pos, g);
  const parallel = Math.abs(_forward.dot(g.dir));
  const side = grindSide(_forward, board.pos);
  const row = matchGrind(stickDir(front.x, front.y), stickDir(back.x, back.y), side, parallel);
  board.grindFric = grindFric(row);
  board.grindSide = side;
  return grindLabel(row, side);
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

export function resolveSolids(board, solids) {
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
  // Pads glue the wheels from a high ray, so grounded is often true on the lip.
  // Lock from the trucks; a rail still needs the hop because it sits above brick.
  if (!board.caught && Math.abs(board.flip) > 0.45) return;
  for (const g of grinds) {
    if (nearestTruckDist(board, g) > GRIND_LOCK) continue;
    if (Math.abs(board.vel.dot(g.dir)) < GRIND_MIN_ALONG) continue;
    board.grinding = true;
    board.grind = g;
    board.trick = nameGrind(board, front, back);
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
  board.vel.multiplyScalar(Math.exp(-GRIND_FRICTION * (board.grindFric || 1) * dt));
  board.trick = nameGrind(board, front, back);
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
  board.trickRow = null;
  board.grinding = false;
  board.grind = null;
  board.sliding = false;
  board.manual = "";
  board.balance = 0;
  board.manualCharge = 0;
  board.bailed = 1.2;
}

function yawVel(vel, dYaw) {
  if (dYaw) vel.applyAxisAngle(UP, dYaw);
}

/**
 * Nose-down pitch (rad) from the feet. 12 o'clock = nose, 6 o'clock = tail.
 * Back 6 lifts the nose. Front 12 drops it. Split 12+6 is flat.
 */
export function stancePitch(frontY, backY) {
  return (-frontY - backY) * 0.5 * PITCH_MAX;
}

/** Fails loud if gravity integration is broken. Fixed 9.81, not the slider. */
export function selfCheck() {
  const g = 9.81;
  let y = 2;
  let v = 0;
  for (let t = 0; t < 1; t += FIXED_DT) {
    v -= g * FIXED_DT;
    y += v * FIXED_DT;
  }
  if (!(y < 0)) throw new Error("gravity self-check failed");
  const ollie = stancePitch(0, 0.8);
  const nollie = stancePitch(-0.8, 0);
  if (!(ollie < 0 && nollie === -ollie)) throw new Error("nollie pitch should invert the ollie");
  if (stancePitch(-0.8, 0.8) !== 0) throw new Error("front 12 and back 6 should stay flat");
  const carve = new THREE.Vector3(0, 0, 2);
  yawVel(carve, Math.PI / 2);
  if (Math.abs(carve.x - 2) > 0.01 || Math.abs(carve.z) > 0.01) {
    throw new Error("yaw should carry velocity with the nose");
  }
}
