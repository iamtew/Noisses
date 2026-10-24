import * as THREE from "three";

// ponytail: posed meshes, not a ragdoll. Constraints if a bail should leave the board.

const _a = new THREE.Vector3();
const _pole = new THREE.Vector3();
const _unitY = new THREE.Vector3(0, 1, 0);
const _hip = new THREE.Vector3();
const _knee = new THREE.Vector3();
const _ankle = new THREE.Vector3();
const _euler = new THREE.Euler(0, 0, 0, "YXZ");

const THIGH = 0.26;
const SHIN = 0.25;

function limb(radius, mat) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.82, 1, 16), mat);
  mesh.castShadow = true;
  return mesh;
}

function bentArm(cloth, skin) {
  const g = new THREE.Group();
  const upper = hung(0.03, 0.2, cloth);
  const fore = hung(0.025, 0.18, cloth);
  fore.position.y = -0.2;
  fore.rotation.x = 0.7;
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 10), skin);
  hand.position.y = -0.18;
  hand.castShadow = true;
  fore.add(hand);
  g.add(upper, fore);
  return g;
}

function hung(radius, length, mat) {
  const geo = new THREE.CylinderGeometry(radius, radius * 0.85, length, 14);
  geo.translate(0, -length / 2, 0);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

function aim(mesh, from, to) {
  _a.copy(to).sub(from);
  const len = Math.max(0.06, _a.length());
  mesh.position.copy(from).addScaledVector(_a, 0.5);
  _a.multiplyScalar(1 / len);
  mesh.quaternion.setFromUnitVectors(_unitY, _a);
  mesh.scale.y = len;
}

/** Low-poly rider. Lives in the scene, not on the deck, so the board can flip under the feet. */
export function createSkater() {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const pants = new THREE.MeshStandardMaterial({ color: 0x243044, roughness: 0.86 });
  const hoodie = new THREE.MeshStandardMaterial({ color: 0xb8432e, roughness: 0.8 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xc4926e, roughness: 0.65 });

  const chest = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.2, 6, 16), hoodie);
  torso.position.y = 0.2;
  torso.castShadow = true;
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), hoodie);
  hood.scale.set(0.95, 1.05, 1.12);
  hood.position.set(-0.02, 0.4, 0);
  hood.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.072, 24, 16), skin);
  head.position.set(0.045, 0.4, 0);
  head.castShadow = true;
  const armL = bentArm(hoodie, skin);
  const armR = bentArm(hoodie, skin);
  armL.position.set(0.02, 0.28, 0.15);
  armR.position.set(0.02, 0.28, -0.15);
  chest.add(torso, hood, head, armL, armR);

  const frontUpper = limb(0.04, pants);
  const frontLower = limb(0.032, pants);
  const backUpper = limb(0.04, pants);
  const backLower = limb(0.032, pants);
  body.add(chest, frontUpper, frontLower, backUpper, backLower);

  return {
    root,
    body,
    chest,
    armL,
    armR,
    frontUpper,
    frontLower,
    backUpper,
    backLower,
    kick: 0,
  };
}

/** Knee pokes toward the toes so the shin meets the shoe. */
function leg(upper, lower, hip, ankle, side) {
  _a.copy(ankle).sub(hip);
  const dist = Math.max(0.08, Math.min(_a.length(), THIGH + SHIN - 0.02));
  const along = (dist * dist + THIGH * THIGH - SHIN * SHIN) / (2 * dist);
  const height = Math.sqrt(Math.max(0, THIGH * THIGH - along * along));
  _knee.copy(hip).addScaledVector(_a, along / _a.length());
  _pole.set(side, 0.35, 0);
  const proj = _pole.dot(_a) / _a.lengthSq();
  _pole.addScaledVector(_a, -proj);
  if (_pole.lengthSq() < 1e-8) _pole.set(side, 0, 0);
  _pole.normalize();
  _knee.addScaledVector(_pole, height);
  aim(upper, hip, _knee);
  aim(lower, _knee, ankle);
}

/**
 * Crouch with stick weight, kick the back foot on a push, flop on a bail.
 * Feet are already placed on the deck.
 */
export function poseSkater(skater, model, input, board, dt) {
  const pushing = (input.pushLeft || input.pushRight) && board.grounded ? 1 : 0;
  skater.kick += (pushing - skater.kick) * (1 - Math.exp(-12 * dt));
  if (skater.kick > 0.01) {
    model.backFoot.position.z -= 0.14 * skater.kick;
    model.backFoot.position.y += 0.03 * skater.kick;
  }

  const weight = Math.max(0, Math.min(1, (input.front.y + input.back.y) * 0.5));
  const air = board.grounded ? 0 : 0.1;
  const hipY = 0.46 - weight * 0.08 - air;
  const side = board.regular ? 1 : -1;

  skater.chest.position.y = hipY;
  skater.chest.rotation.y = board.regular ? 0 : Math.PI;
  skater.armL.rotation.z = 0.15;
  skater.armR.rotation.z = -0.15;
  skater.armL.rotation.x = 0.35 + skater.kick * 0.8;
  skater.armR.rotation.x = 0.2 - skater.kick * 0.4;

  _hip.set(0, hipY, 0.06);
  _ankle.copy(model.frontFoot.position);
  _ankle.y += 0.04;
  leg(skater.frontUpper, skater.frontLower, _hip, _ankle, side);

  _hip.set(0, hipY, -0.06);
  _ankle.copy(model.backFoot.position);
  _ankle.y += 0.04;
  leg(skater.backUpper, skater.backLower, _hip, _ankle, side);

  const flop = Math.min(1, (board.bailed || 0) / 1.2);
  skater.body.rotation.z = flop * side * 1.15;
  skater.body.position.y = -flop * 0.1;
}

/**
 * Yaw and pitch only. Flip and shuv stay on the deck.
 * While a flip is in the air, the body hangs above the board.
 */
export function placeSkater(skater, pos, board) {
  skater.root.position.copy(pos);
  if (!board.grounded && !board.caught) skater.root.position.y += 0.22;
  _euler.set(board.pitch, board.yaw, board.roll);
  skater.root.quaternion.setFromEuler(_euler);
}

export function selfCheckSkater() {
  const skater = createSkater();
  const model = {
    frontFoot: { position: new THREE.Vector3(0, 0.03, 0.18) },
    backFoot: { position: new THREE.Vector3(0, 0.03, -0.18) },
  };
  const board = { regular: true, grounded: true, bailed: 0 };
  const input = {
    front: { x: 0, y: 0 },
    back: { x: 0, y: 0 },
    pushLeft: false,
    pushRight: false,
  };
  poseSkater(skater, model, input, board, 0.016);
  if (!(skater.chest.position.y > 0.35)) throw new Error("skater hip is on the deck");
  if (!Number.isFinite(skater.frontUpper.quaternion.w)) throw new Error("skater leg");

  board.grounded = false;
  board.caught = false;
  board.pitch = 0;
  board.yaw = 0.4;
  board.roll = 0;
  board.flip = Math.PI;
  placeSkater(skater, new THREE.Vector3(1, 2, 3), board);
  if (!(skater.root.position.y > 2.15)) throw new Error("skater should hang above a flipping board");
  const upright = new THREE.Euler().setFromQuaternion(skater.root.quaternion, "YXZ");
  if (Math.abs(upright.z) > 0.05) throw new Error("skater rolled with the kickflip");
  if (Math.abs(upright.y - 0.4) > 0.05) throw new Error("skater lost yaw");
}
