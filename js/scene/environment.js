import * as THREE from "three";

function concreteMap() {
  const s = 256;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#6c7074";
  ctx.fillRect(0, 0, s, s);
  const img = ctx.getImageData(0, 0, s, s);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 26;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n * 0.9;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(48, 48);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function grindSpec(origin, dir, halfLen, radius) {
  return {
    origin: origin.clone(),
    dir: dir.clone().normalize(),
    halfLen,
    radius,
  };
}

function makeRail() {
  const metal = new THREE.MeshStandardMaterial({
    color: 0x9aa3ab,
    metalness: 0.75,
    roughness: 0.32,
  });
  const paint = new THREE.MeshStandardMaterial({
    color: 0x3a3d42,
    roughness: 0.8,
  });
  const group = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 5.2, 16), metal);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, 0.5, 7);
  bar.castShadow = true;
  group.add(bar);
  for (const x of [-2.4, 2.4]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.06), paint);
    post.position.set(x, 0.25, 7);
    post.castShadow = true;
    group.add(post);
  }
  const grind = grindSpec(
    new THREE.Vector3(0, 0.5, 7),
    new THREE.Vector3(1, 0, 0),
    2.55,
    0.028,
  );
  return { group, grind };
}

function makeLedge() {
  const conc = new THREE.MeshStandardMaterial({
    color: 0x7a7e82,
    roughness: 0.9,
  });
  const cope = new THREE.MeshStandardMaterial({
    color: 0xb0b6bc,
    metalness: 0.55,
    roughness: 0.4,
  });
  const group = new THREE.Group();
  const block = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.36, 0.5), conc);
  block.position.set(0, 0.18, 11.5);
  block.castShadow = true;
  block.receiveShadow = true;
  const edge = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.04, 0.06), cope);
  edge.position.set(0, 0.38, 11.28);
  edge.castShadow = true;
  group.add(block, edge);
  const grind = grindSpec(
    new THREE.Vector3(0, 0.38, 11.28),
    new THREE.Vector3(1, 0, 0),
    2.05,
    0.04,
  );
  return { group, grind };
}

/** Flat pad plus a round rail and a coped ledge. Generated here. */
export function createEnvironment() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({
      map: concreteMap(),
      roughness: 0.94,
      side: THREE.DoubleSide,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.name = "ground";
  ground.receiveShadow = true;

  const grid = new THREE.GridHelper(24, 24, 0x5e6266, 0x4a4e52);
  grid.position.y = 0.01;
  grid.material.transparent = true;
  grid.material.opacity = 0.35;

  const rail = makeRail();
  const ledge = makeLedge();

  return {
    ground,
    grid,
    props: [rail.group, ledge.group],
    grinds: [rail.grind, ledge.grind],
  };
}
