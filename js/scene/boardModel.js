import * as THREE from "three";
import { FOOT_X, FOOT_Z, WHEEL_LOCAL, WHEEL_RADIUS } from "../constants.js";

/** Original low-poly deck + trucks + wheels. No commercial meshes. */
export function createBoardModel() {
  const group = new THREE.Group();

  const wood = new THREE.MeshStandardMaterial({
    color: 0xc4a06a,
    roughness: 0.8,
  });
  const metal = new THREE.MeshStandardMaterial({
    color: 0x6b7076,
    roughness: 0.45,
    metalness: 0.4,
  });
  const urethane = new THREE.MeshStandardMaterial({
    color: 0xcfc8b8,
    roughness: 0.6,
  });

  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.04, 0.8), wood);
  deck.position.y = 0.02;
  group.add(deck);

  for (const z of [0.205, -0.205]) {
    const truck = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.05), metal);
    truck.position.set(0, -0.01, z);
    group.add(truck);
  }

  const wheels = [];
  const geo = new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, 0.04, 12);
  for (const w of WHEEL_LOCAL) {
    const wheel = new THREE.Mesh(geo, urethane);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(w.x, -0.08, w.z);
    group.add(wheel);
    wheels.push(wheel);
  }

  const rubber = new THREE.MeshStandardMaterial({ color: 0x22262a, roughness: 0.7 });
  const frontFoot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), rubber);
  const backFoot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), rubber);
  frontFoot.position.set(0, 0.055, FOOT_Z * 0.4);
  backFoot.position.set(0, 0.055, -FOOT_Z * 0.4);
  group.add(frontFoot);
  group.add(backFoot);

  return { group, wheels, frontFoot, backFoot };
}

/** Stick up (−Y) slides a foot toward the nose (+Z). Centered = over the trucks. */
export function placeFeet(model, front, back) {
  model.frontFoot.position.set(front.x * FOOT_X, 0.055, 0.18 - front.y * FOOT_Z);
  model.backFoot.position.set(back.x * FOOT_X, 0.055, -0.18 - back.y * FOOT_Z);
}
