import * as THREE from "three";

/** Flat pad the rays can hit. Visual grid is just orientation. */
export function createEnvironment() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x6d7176, roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.name = "ground";

  const grid = new THREE.GridHelper(40, 40, 0x5a5a5a, 0x333333);
  grid.position.y = 0.002;

  return { ground, grid };
}
