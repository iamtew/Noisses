import * as THREE from "three";

// ponytail: posed meshes, not a ragdoll. Constraints if a bail should leave the board.

const _a = new THREE.Vector3();
const _unitY = new THREE.Vector3(0, 1, 0);
const _hip = new THREE.Vector3();
const _knee = new THREE.Vector3();
const _ankle = new THREE.Vector3();

function limb(radius, mat) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.85, 1, 6), mat);
  mesh.castShadow = true;
  return mesh;
}

function hung(radius, length, mat) {
  const geo = new THREE.CylinderGeometry(radius, radius * 0.85, length, 6);
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

/** Low-poly rider. Parent on the board so flips carry the body. */
export function createSkater() {
  const root = new THREE.Group();
  const pants = new THREE.MeshStandardMaterial({ color: 0x2a3140, roughness: 0.85 });
  const hoodie = new THREE.MeshStandardMaterial({ color: 0xc4532a, roughness: 0.78 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xc4926e, roughness: 0.7 });

  const chest = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.28, 0.26), hoodie);
  torso.position.y = 0.2;
  torso.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), skin);
  head.position.set(0.04, 0.4, 0);
  head.castShadow = true;
  const armL = hung(0.028, 0.32, hoodie);
  const armR = hung(0.028, 0.32, hoodie);
  armL.position.set(0.02, 0.22, 0.16);
  armR.position.set(0.02, 0.22, -0.16);
  chest.add(torso, head, armL, armR);

  const frontUpper = limb(0.04, pants);
  const frontLower = limb(0.032, pants);
  const backUpper = limb(0.04, pants);
  const backLower = limb(0.032, pants);
  root.add(chest, frontUpper, frontLower, backUpper, backLower);

  return {
    root,
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

function leg(upper, lower, hip, ankle, side) {
  _knee.copy(hip).lerp(ankle, 0.5);
  _knee.x += side * 0.07;
  _knee.y += 0.08;
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
  const hipY = 0.5 - weight * 0.1 - air;
  const side = board.regular ? 1 : -1;

  skater.chest.position.y = hipY;
  skater.chest.rotation.y = board.regular ? 0 : Math.PI;
  skater.armL.rotation.z = 0.15;
  skater.armR.rotation.z = -0.15;
  skater.armL.rotation.x = 0.35 + skater.kick * 0.8;
  skater.armR.rotation.x = 0.2 - skater.kick * 0.4;

  _hip.set(0, hipY, 0.06);
  _ankle.copy(model.frontFoot.position);
  _ankle.y += 0.02;
  leg(skater.frontUpper, skater.frontLower, _hip, _ankle, side);

  _hip.set(0, hipY, -0.06);
  _ankle.copy(model.backFoot.position);
  _ankle.y += 0.02;
  leg(skater.backUpper, skater.backLower, _hip, _ankle, side);

  const flop = Math.min(1, (board.bailed || 0) / 1.2);
  skater.root.rotation.z = flop * side * 1.15;
  skater.root.position.y = -flop * 0.1;
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
  if (!(skater.chest.position.y > 0.4)) throw new Error("skater hip is on the deck");
  if (!Number.isFinite(skater.frontUpper.quaternion.w)) throw new Error("skater leg");
}
