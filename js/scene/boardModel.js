import * as THREE from "three";
import { WHEEL_LOCAL, WHEEL_RADIUS } from "../constants.js";

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

  return { group, wheels };
}
