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

/** Flat pad the rays can hit. Noise is generated here, not loaded from a pack. */
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

  return { ground, grid };
}
