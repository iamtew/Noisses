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
  tex.repeat.set(18, 18);
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
 * Facts used: Market meets the plaza on the west, the brick bowl is sunken,
 * the fountain sits at the northeast, Sue Bierman Park is north, the
 * Embarcadero and the Ferry Building are east. About 4 acres in real life.
 * The fountain tubes are ours, inside the real footprint, not a trace of the sculpture.
 */
export function createEnvironment() {
  const root = new THREE.Group();
  const floors = [];
  const solidMeshes = [];

  const brick = new THREE.MeshStandardMaterial({
    map: brickMap(),
    color: 0xd8d0cc,
    roughness: 0.92,
  });
  const brickDark = new THREE.MeshStandardMaterial({
    map: brickMap(),
    color: 0xb8aea8,
    roughness: 0.94,
  });
  const street = new THREE.MeshStandardMaterial({
    map: concreteMap(6),
    color: 0x9aa1a6,
    roughness: 0.95,
  });
  const walk = new THREE.MeshStandardMaterial({
    map: concreteMap(4),
    color: 0xc5ccd0,
    roughness: 0.9,
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

  // Catch if a wheel misses every slab.
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

  // Market Street, behind the spawn, running north-south along X.
  slab(70, 0.3, 16, 0, 0, -26, street, { floor: true });
  for (let i = -3; i <= 3; i++) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.02, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xe6e2d8, roughness: 0.6 }),
    );
    stripe.position.set(i * 4.2, 0.02, -26);
    root.add(stripe);
  }

  // Upper brick plaza. Spawn sits here, facing the bay. Meets Market at z=-18.
  slab(48, 0.4, 24, 0, 0, -6, brick, { floor: true });

  // Four shallow steps down into the bowl. Treads overlap so a wheel cannot drop between them.
  for (let i = 0; i < 4; i++) {
    const top = -0.18 * (i + 1);
    slab(36, 0.4, 1.55, 2, top, 6.7 + i * 1.45, brickDark, { floor: true, solid: true });
  }

  // Sunken brick bowl.
  slab(40, 0.4, 17, 2, -0.72, 20, brickDark, { floor: true });

  // Steps back up to the Embarcadero sidewalk.
  for (let i = 0; i < 4; i++) {
    const top = -0.72 + 0.18 * (i + 1);
    slab(36, 0.4, 1.55, 2, top, 29.2 + i * 1.45, brick, { floor: true, solid: true });
  }

  slab(50, 0.3, 6.4, 2, 0, 37.3, walk, { floor: true });
  slab(50, 0.3, 12, 2, 0, 46, street, { floor: true });
  slab(50, 0.3, 5, 2, 0, 54.5, walk, { floor: true });

  // Bay, past the promenade. Not a floor.
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 40),
    waterMat,
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(2, -0.35, 74);
  root.add(water);

  // Ferry Building, simplified: a long hall and a clock tower. 1898 building.
  slab(16, 14, 36, 2, 14, 68, ferryMat, { solid: true });
  slab(6, 28, 6, 2, 28, 68, towerMat, { solid: true });

  // Sue Bierman Park, north of the plaza.
  slab(22, 0.3, 36, 34, 0.05, 8, lawn, { floor: true });

  // Embarcadero Center block, south-west, across Market.
  slab(22, 55, 16, -8, 55, -62, glass, { solid: true });

  // Seat wall on the north side of the upper plaza, running east.
  slab(0.7, 0.45, 12, 14, 0.45, -6, stone, { floor: true, solid: true });

  // Low block where a monument stands. Not the sculpture.
  slab(1.6, 0.7, 1.6, 18, 0.7, 2, stone, { floor: true, solid: true });

  // 1983 stage, west edge of the bowl, facing back toward Market.
  slab(8, 0.55, 4, -10, -0.17, 16, stone, { floor: true, solid: true });

  // Fountain plinth in the northeast of the bowl.
  const plinth = slab(16, 0.45, 12, 8, -0.27, 22, tubeMat, { floor: true, solid: true });
  // Square tubes in that footprint. Leans are original, not measured off the artwork.
  const tubes = [
    [3, 18, 7, 0.15],
    [6, 21, 11, -0.2],
    [10, 19, 8, 0.35],
    [13, 23, 6, -0.1],
    [8, 25, 12, 0.05],
    [4, 24, 5, 0.4],
  ];
  for (const [x, z, h, lean] of tubes) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, h, 1.8), tubeMat);
    mesh.position.set(x, -0.27 + h / 2, z);
    mesh.rotation.z = lean;
    put(mesh, { solid: true });
  }

  root.updateMatrixWorld(true);
  const solids = solidMeshes.map((m) => new THREE.Box3().setFromObject(m));

  // Step lip you can grind while riding across the drop, and the plinth's near edge.
  const stepLip = grindSpec(
    new THREE.Vector3(0, 0.02, 5.9),
    new THREE.Vector3(1, 0, 0),
    14,
    0.06,
  );
  const plinthEdge = grindSpec(
    new THREE.Vector3(plinth.position.x, -0.22, plinth.position.z - 6),
    new THREE.Vector3(1, 0, 0),
    7,
    0.08,
  );

  floors.push(ground);

  return {
    ground,
    props: [root],
    floors,
    solids,
    grinds: [stepLip, plinthEdge],
  };
}
