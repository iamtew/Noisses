import * as THREE from "three";

function concreteMap(repeat) {
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
  tex.repeat.set(repeat, repeat);
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

/** Rail runs forward (+Z) so a straight push can ollie along it. */
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
  bar.rotation.x = Math.PI / 2;
  bar.position.set(1.7, 0.34, 5.5);
  bar.castShadow = true;
  bar.receiveShadow = true;
  group.add(bar);
  for (const z of [3.1, 7.9]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.06), paint);
    post.position.set(1.7, 0.17, z);
    post.castShadow = true;
    post.receiveShadow = true;
    group.add(post);
  }
  const grind = grindSpec(
    new THREE.Vector3(1.7, 0.34, 5.5),
    new THREE.Vector3(0, 0, 1),
    2.55,
    0.028,
  );
  return { group, grind };
}

function makeLedge(tex) {
  const conc = new THREE.MeshStandardMaterial({
    map: tex,
    color: 0xb8bcc0,
    roughness: 0.9,
  });
  const cope = new THREE.MeshStandardMaterial({
    color: 0xb0b6bc,
    metalness: 0.55,
    roughness: 0.4,
  });
  const group = new THREE.Group();
  const block = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.32, 4.5), conc);
  block.position.set(-2.0, 0.16, 5.5);
  block.castShadow = true;
  block.receiveShadow = true;
  const edge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 4.5), cope);
  edge.position.set(-1.75, 0.34, 5.5);
  edge.castShadow = true;
  group.add(block, edge);
  const grind = grindSpec(
    new THREE.Vector3(-1.75, 0.34, 5.5),
    new THREE.Vector3(0, 0, 1),
    2.2,
    0.04,
  );
  return { group, grind, floor: block };
}

function markMat(color, opacity) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
}

/** Painted circle + facing chevron. Charge ring is animated from main. */
export function createSpawnMark() {
  const group = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.4, 28), markMat(0x1a4a82, 0.48));
  disc.rotation.x = -Math.PI / 2;
  const rim = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 32), markMat(0xe4eef8, 0.88));
  rim.rotation.x = -Math.PI / 2;
  const nose = new THREE.Mesh(new THREE.CircleGeometry(0.13, 3), markMat(0xe4eef8, 0.95));
  nose.rotation.x = -Math.PI / 2;
  nose.rotation.z = -Math.PI / 2;
  nose.position.z = 0.22;
  group.add(disc, rim, nose);
  group.position.y = 0.03;

  const charge = new THREE.Mesh(new THREE.RingGeometry(0.24, 0.34, 40), markMat(0xffffff, 0));
  charge.rotation.x = -Math.PI / 2;
  charge.position.y = 0.04;
  charge.visible = false;
  return { group, charge };
}

function concMat(tex, color) {
  return new THREE.MeshStandardMaterial({
    map: tex,
    color,
    roughness: 0.92,
  });
}

function wedgeGeometry(len, height, width) {
  const hw = width * 0.5;
  const v = [
    [-hw, 0, 0],
    [hw, 0, 0],
    [hw, height, len],
    [-hw, height, len],
    [-hw, 0, len],
    [hw, 0, len],
  ];
  const faces = [
    [0, 1, 2],
    [0, 2, 3],
    [0, 3, 4],
    [1, 5, 2],
    [4, 3, 2],
    [4, 2, 5],
    [0, 4, 5],
    [0, 5, 1],
  ];
  const pos = new Float32Array(faces.length * 9);
  const uv = new Float32Array(faces.length * 6);
  let i = 0;
  let u = 0;
  for (const f of faces) {
    for (const vi of f) {
      pos[i++] = v[vi][0];
      pos[i++] = v[vi][1];
      pos[i++] = v[vi][2];
      uv[u++] = (v[vi][0] + hw) / width;
      uv[u++] = v[vi][2] / len;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

/** Four treads plus a side stringer. */
function makeStairs(tex) {
  const group = new THREE.Group();
  const floors = [];
  const solids = [];
  const mat = concMat(tex, 0xb0b4b8);
  for (let i = 0; i < 4; i++) {
    const tread = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.15, 0.36), mat);
    tread.position.set(-5.4, 0.075 + i * 0.15, 11.2 + i * 0.36);
    tread.castShadow = true;
    tread.receiveShadow = true;
    tread.updateMatrixWorld(true);
    group.add(tread);
    floors.push(tread);
    solids.push(new THREE.Box3().setFromObject(tread));
  }
  const side = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 1.5), mat);
  side.position.set(-6.22, 0.3, 11.74);
  side.castShadow = true;
  side.receiveShadow = true;
  group.add(side);
  return { group, floors, solids };
}

/** Wedge sitting on the pad so you can roll it. */
function makeBank(tex) {
  const slab = new THREE.Mesh(wedgeGeometry(5.2, 1.15, 3.4), concMat(tex, 0xd8dce0));
  slab.position.set(5.6, 0, 4.2);
  slab.castShadow = true;
  slab.receiveShadow = true;
  slab.updateMatrixWorld(true);
  return { group: slab, floor: slab };
}

/** Push/land grit. Reuses one Points cloud. */
export function createDust() {
  const n = 28;
  const pos = new Float32Array(n * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xcbbfae,
    size: 0.055,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  const vel = Array.from({ length: n }, () => new THREE.Vector3());
  let life = 0;

  function burst(origin, strength) {
    life = 0.42;
    const s = Math.max(0.4, strength);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = origin.x + (Math.random() - 0.5) * 0.22;
      pos[i * 3 + 1] = origin.y + 0.02;
      pos[i * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.22;
      vel[i].set(
        (Math.random() - 0.5) * 1.6 * s,
        0.35 + Math.random() * 1.1 * s,
        (Math.random() - 0.5) * 1.6 * s,
      );
    }
    geo.attributes.position.needsUpdate = true;
  }

  function step(dt) {
    if (life <= 0) {
      mat.opacity = 0;
      return;
    }
    life -= dt;
    mat.opacity = Math.max(0, life * 2.1);
    for (let i = 0; i < n; i++) {
      vel[i].y -= 9 * dt;
      pos[i * 3] += vel[i].x * dt;
      pos[i * 3 + 1] += vel[i].y * dt;
      pos[i * 3 + 2] += vel[i].z * dt;
    }
    geo.attributes.position.needsUpdate = true;
  }

  return { points, burst, step };
}

/** Pad, rail right, ledge left, stairs back-left, bank right. */
export function createEnvironment() {
  const groundTex = concreteMap(40);
  const propTex = concreteMap(2);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.94,
      color: 0xc8ccd0,
      side: THREE.DoubleSide,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.name = "ground";
  ground.receiveShadow = true;

  const rail = makeRail();
  const ledge = makeLedge(propTex);
  const stairs = makeStairs(propTex);
  const bank = makeBank(propTex);
  ledge.floor.updateMatrixWorld(true);
  const ledgeBox = new THREE.Box3().setFromObject(ledge.floor);

  return {
    ground,
    props: [rail.group, ledge.group, stairs.group, bank.group],
    floors: [ground, ledge.floor, bank.floor, ...stairs.floors],
    solids: [ledgeBox, ...stairs.solids],
    grinds: [rail.grind, ledge.grind],
  };
}
