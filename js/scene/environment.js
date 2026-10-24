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

function brickMap() {
  const s = 128;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#8d4638";
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = "#a85a48";
  const bw = 28;
  const bh = 12;
  for (let row = 0; row < s / bh; row++) {
    const ox = row % 2 ? bw / 2 : 0;
    for (let x = -bw; x < s + bw; x += bw) {
      ctx.fillRect(x + ox + 1, row * bh + 1, bw - 2, bh - 2);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(32, 32);
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

/**
 * Embarcadero Plaza, San Francisco, cropped so it can be skated.
 * +Z is east, toward the bay. +X is north.
 * Facing +Z, +X is on the left, which is north when you face the bay.
 * The brick is one field. The fountain sits at the north end, Sue Bierman
 * Park is past that, Market and Embarcadero Center are west, the Embarcadero
 * and the Ferry Building (clock tower at the south end) are east.
 * The tennis courts on the current map are brick here.
 * Tubes are ours, inside that north footprint, not a trace of the sculpture.
 */
export function createEnvironment() {
  const root = new THREE.Group();
  const floors = [];
  const solidMeshes = [];

  const brick = new THREE.MeshStandardMaterial({
    map: brickMap(),
    color: 0xfff4ef,
    roughness: 0.92,
  });
  const street = new THREE.MeshStandardMaterial({
    map: concreteMap(6),
    color: 0x9aa1a6,
    roughness: 0.95,
  });
  const lawn = new THREE.MeshStandardMaterial({ color: 0x3e6a45, roughness: 0.95 });
  const tubeMat = new THREE.MeshStandardMaterial({
    color: 0xb7b3aa,
    roughness: 0.72,
  });
  const stone = new THREE.MeshStandardMaterial({ color: 0xc4b8a4, roughness: 0.8 });
  const ferryMat = new THREE.MeshStandardMaterial({ color: 0xd9d3c6, roughness: 0.7 });
  const towerMat = new THREE.MeshStandardMaterial({ color: 0xeee6d6, roughness: 0.55 });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x31424c,
    roughness: 0.35,
    metalness: 0.45,
  });
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x35586a,
    roughness: 0.35,
    metalness: 0.15,
  });

  function put(mesh, { floor = false, solid = false } = {}) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    if (floor) floors.push(mesh);
    if (solid) solidMeshes.push(mesh);
    return mesh;
  }

  function slab(w, h, d, x, top, z, mat, flags) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, top - h / 2, z);
    return put(mesh, flags);
  }

  // Rises toward +Z. Bottom sits on the brick. Floor only: a solid box would block the slope.
  function kicker(w, h, d, x, z) {
    const x0 = -w / 2;
    const x1 = w / 2;
    const z0 = -d / 2;
    const z1 = d / 2;
    const pos = new Float32Array([
      x0, 0, z0, x1, 0, z0, x1, h, z1,
      x0, 0, z0, x1, h, z1, x0, h, z1,
      x0, 0, z1, x0, h, z1, x1, h, z1,
      x0, 0, z1, x1, h, z1, x1, 0, z1,
      x0, 0, z0, x0, h, z1, x0, 0, z1,
      x1, 0, z0, x1, 0, z1, x1, h, z1,
    ]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, stone);
    mesh.position.set(x, 0.04, z);
    return put(mesh, { floor: true });
  }

  // Round bar on two posts. Grind line is the top of the bar.
  function rail(x, y, z, len, alongX) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, len, 12), metal);
    bar.rotation[alongX ? "z" : "x"] = Math.PI / 2;
    bar.position.set(x, y, z);
    put(bar, { solid: true });
    const inset = len / 2 - 0.25;
    for (const t of [-inset, inset]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, y - 0.04, 8), metal);
      post.position.set(x + (alongX ? t : 0), (y + 0.04) / 2, z + (alongX ? 0 : t));
      put(post, { solid: true });
    }
    const dir = alongX ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
    return grindSpec(new THREE.Vector3(x, y + 0.04, z), dir, inset, 0.06);
  }

  // Off the map only. The land itself is one slab, so a seam cannot drop you.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardMaterial({
      map: concreteMap(24),
      color: 0x8e9599,
      roughness: 0.96,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.6;
  ground.name = "ground";
  ground.receiveShadow = true;

  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xe6e2d8, roughness: 0.6 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b5344, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f6a3a, roughness: 0.85 });
  const clockMat = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.4 });
  const metal = new THREE.MeshStandardMaterial({
    color: 0xb7bcc2,
    roughness: 0.32,
    metalness: 0.72,
  });

  // Streets, sidewalk, and promenade. Brick and lawn sit on this, overlapping.
  slab(170, 0.6, 200, 0, 0, 20, street, { floor: true });

  // One brick field. Spawn is on it, nose toward the bay.
  slab(78, 0.3, 56, 6, 0.04, 6, brick, { floor: true });

  // Sue Bierman Park, north of the brick. Overlaps the plaza edge.
  slab(40, 0.2, 52, 62, 0.05, 2, lawn, { floor: true });

  // Fountain plinth, north end of the brick. A ledge, not a pit.
  const plinth = slab(18, 0.42, 14, 28, 0.46, 4, tubeMat, { floor: true, solid: true });
  // Square tubes in that footprint. Leans are original, not measured off the artwork.
  const tubes = [
    [32, 2, 9, 0.12],
    [28, 6, 12, -0.1],
    [24, 1, 8, 0.16],
    [26, 9, 7, -0.08],
    [30, 8, 10, 0.05],
    [22, 5, 6, 0.14],
  ];
  for (const [x, z, h, lean] of tubes) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, h, 1.8), tubeMat);
    mesh.position.set(x, 0.46 + h / 2, z);
    mesh.rotation.z = lean;
    put(mesh, { solid: true });
  }

  // Round stage on the east half of the brick, from the aerial.
  const stage = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 0.12, 28), stone);
  stage.position.set(-4, 0.1, 18);
  put(stage, { floor: true });

  // Skate obstacles on open brick. Spawn at 0,0 stays clear.
  // Ledge on the right, long toward the bay. Both lips grind.
  slab(0.8, 0.46, 7, -14, 0.5, 3, stone, { floor: true, solid: true });
  // Lower box ahead-left. Ride it or grind the long sides.
  slab(1.5, 0.32, 4, 9, 0.36, 6, stone, { floor: true, solid: true });
  // Kicker on the right, launches toward the bay.
  kicker(2.2, 0.62, 2.6, -22, 10);
  const railBay = rail(12, 0.48, 20, 6, false);
  const railSide = rail(-18, 0.6, 22, 5, true);

  // Palms along the east sidewalk, between the brick and the Embarcadero.
  for (let x = -28; x <= 40; x += 8) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 5.2, 6), trunkMat);
    trunk.position.set(x, 2.6, 37);
    put(trunk, { solid: true });
    const crown = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1.3, 6), leafMat);
    crown.position.set(x, 5.5, 37);
    crown.castShadow = true;
    root.add(crown);
  }

  // Lane lines on the Embarcadero. The road runs north-south.
  for (let i = 0; i < 5; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(90, 0.02, 0.16), stripeMat);
    line.position.set(6, 0.02, 46 + i * 8);
    root.add(line);
  }
  // Crosswalk off the west edge, toward Market.
  for (let i = -4; i <= 4; i++) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.02, 3.6), stripeMat);
    stripe.position.set(8 + i * 3.4, 0.03, -26);
    root.add(stripe);
  }

  // Bay past the promenade. Not a floor. The land slab ends just before it.
  const water = new THREE.Mesh(new THREE.PlaneGeometry(160, 70), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.45, 150);
  root.add(water);

  // Ferry Building. Long hall along the water, clock tower at the south end.
  // Hall runs north. The tower stands at the south end, toward Market.
  slab(72, 16, 18, 16, 16, 100, ferryMat, { solid: true });
  slab(10, 56, 10, -26, 56, 100, towerMat, { solid: true });
  const clockW = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.2, 20), clockMat);
  clockW.rotation.x = Math.PI / 2;
  clockW.position.set(-26, 42, 94.8);
  root.add(clockW);
  const clockE = clockW.clone();
  clockE.position.z = 105.2;
  root.add(clockE);

  // Embarcadero Center, west across Market.
  slab(22, 52, 18, 12, 52, -50, glass, { solid: true });
  slab(18, 40, 16, -14, 40, -48, glass, { solid: true });

  root.updateMatrixWorld(true);
  const solids = solidMeshes.map((m) => new THREE.Box3().setFromObject(m));

  // South lip of the fountain plinth. Ride east-west along it.
  const plinthEdge = grindSpec(
    new THREE.Vector3(plinth.position.x - 9, 0.46, plinth.position.z),
    new THREE.Vector3(0, 0, 1),
    6,
    0.08,
  );
  const ledgeLips = [
    grindSpec(new THREE.Vector3(-14.4, 0.5, 3), new THREE.Vector3(0, 0, 1), 3.3, 0.06),
    grindSpec(new THREE.Vector3(-13.6, 0.5, 3), new THREE.Vector3(0, 0, 1), 3.3, 0.06),
    grindSpec(new THREE.Vector3(8.25, 0.36, 6), new THREE.Vector3(0, 0, 1), 1.85, 0.06),
    grindSpec(new THREE.Vector3(9.75, 0.36, 6), new THREE.Vector3(0, 0, 1), 1.85, 0.06),
  ];

  floors.push(ground);

  return {
    ground,
    props: [root],
    floors,
    solids,
    grinds: [plinthEdge, ...ledgeLips, railBay, railSide],
  };
}
