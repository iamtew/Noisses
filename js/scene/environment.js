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
 * One brick field with a hole for the north basin. Invented tube stack in
 * that pit. East terrace and a three-tier octagon sit on the brick.
 * Sue Bierman Park is past the fountain. Market and Embarcadero Center
 * are west. The Embarcadero and the Ferry Building (clock tower at the
 * south end) are east.
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
    color: 0xc4b8a4,
    roughness: 0.84,
  });
  const stone = new THREE.MeshStandardMaterial({ color: 0xc4b8a4, roughness: 0.8 });
  const grey = new THREE.MeshStandardMaterial({
    map: concreteMap(5),
    color: 0xc5c8cb,
    roughness: 0.9,
  });
  const wallDark = new THREE.MeshStandardMaterial({
    map: concreteMap(2),
    color: 0x5f646a,
    roughness: 0.93,
  });
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

  // Four overlapping slabs around a rect hole. Overlap so a seam cannot drop you.
  function ringHole(fx0, fx1, fz0, fz1, hx0, hx1, hz0, hz1, h, top, mat, flags) {
    const ov = 0.15;
    slab(fx1 - fx0, h, hz0 + ov - fz0, (fx0 + fx1) / 2, top, (fz0 + hz0 + ov) / 2, mat, flags);
    slab(fx1 - fx0, h, fz1 - (hz1 - ov), (fx0 + fx1) / 2, top, (hz1 - ov + fz1) / 2, mat, flags);
    slab(hx0 + ov - fx0, h, hz1 - hz0, (fx0 + hx0 + ov) / 2, top, (hz0 + hz1) / 2, mat, flags);
    slab(fx1 - (hx1 - ov), h, hz1 - hz0, (hx1 - ov + fx1) / 2, top, (hz0 + hz1) / 2, mat, flags);
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

  const fx = 28;
  const fz = 4;
  const hx0 = 19;
  const hx1 = 37;
  const hz0 = -4;
  const hz1 = 12;
  const brickTop = 0.04;
  const basinTop = -1.16;
  const curbH = 0.34;
  const curbTop = brickTop + curbH;
  const ts = 2.6;

  // Street and brick leave a hole for the basin. Overlaps hide the joints.
  ringHole(-85, 85, -80, 120, hx0, hx1, hz0, hz1, 0.6, 0, street, { floor: true });
  ringHole(-33, 45, -22, 34, hx0, hx1, hz0, hz1, 0.3, brickTop, brick, { floor: true });

  // Sue Bierman Park, north of the brick. Overlaps the plaza edge.
  slab(40, 0.2, 52, 62, 0.05, 2, lawn, { floor: true });

  // Basin floor and walls. Walls reach curb height so plaza board height cannot ghost in.
  slab(hx1 - hx0, 0.22, hz1 - hz0, fx, basinTop, fz, grey, { floor: true });
  const wallH = curbTop - (basinTop - 0.22);
  const wallTop = curbTop;
  slab(0.5, wallH, hz1 - hz0, hx0, wallTop, fz, grey, { solid: true });
  slab(0.5, wallH, hz1 - hz0, hx1, wallTop, fz, grey, { solid: true });
  slab(hx1 - hx0, wallH, 0.5, fx, wallTop, hz0, grey, { solid: true });
  slab(hx1 - hx0, wallH, 0.5, fx, wallTop, hz1, grey, { solid: true });
  const cw = 0.7;
  slab(cw, curbH, hz1 - hz0 + cw, hx0 - cw / 2, curbTop, fz, grey, { floor: true });
  slab(cw, curbH, hz1 - hz0 + cw, hx1 + cw / 2, curbTop, fz, grey, { floor: true });
  slab(hx1 - hx0 + cw, curbH, cw, fx, curbTop, hz0 - cw / 2, grey, { floor: true });
  slab(hx1 - hx0 + cw, curbH, cw, fx, curbTop, hz1 + cw / 2, grey, { floor: true });

  // Square tubes in that pit. Leans are invented, not measured off the artwork.
  const tubes = [
    [22.2, 3.5, ts, 9.5, ts, basinTop, 0.38, 0.62, 0.48],
    [33.8, 4.8, ts, 8.8, ts, basinTop, -0.28, -0.72, -0.52],
    [26.5, -0.5, ts, 10.2, ts, basinTop, 0.12, 0.95, -0.58],
    [29.5, 9.5, ts, 7.8, ts, basinTop, -0.42, -0.38, 0.22],
    [28.0, 4.2, 10.5, ts, ts, basinTop + 6.8, 0.24, 0.68, -0.18],
    [27.5, 5.5, ts, ts, 8.5, basinTop + 5.6, 0.48, -0.58, 0.22],
    [32.2, 1.2, ts, 4.2, ts, basinTop, 0.55, 0.42, -0.38],
  ];
  for (const [x, z, w, h, d, y0, rx, ry, rz] of tubes) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), tubeMat);
    mesh.position.set(x, y0 + h / 2, z);
    mesh.rotation.set(rx, ry, rz);
    put(mesh, { solid: true });
  }

  // Three-tier octagon on open brick. Floor only: a solid AABB would shove you off.
  const ox = 2;
  const oz = 12;
  const octH = [0.18, 0.36, 0.54];
  const octR = [4.2, 3.2, 2.2];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(octR[i], octR[i], octH[i], 8), grey);
    m.position.set(ox, brickTop + octH[i] / 2, oz);
    m.rotation.y = Math.PI / 8;
    put(m, { floor: true });
  }

  // East terrace toward the palms. Spawn at 0,0 stays clear.
  const padW = 36;
  const padD = 5.2;
  const padH = 0.55;
  const padX = 2;
  const padZ = 23.8;
  const padTop = brickTop + padH;
  const padFront = padZ - padD / 2;
  const padBack = padZ + padD / 2;
  const padSouth = padX - padW / 2;
  const padNorth = padX + padW / 2;
  slab(padW, padH, padD, padX, padTop, padZ, grey, { floor: true });
  const tread = 0.48;
  const rise = padH / 3;
  const endW = padD - 0.2;
  for (let i = 0; i < 3; i++) {
    const h = (i + 1) * rise;
    slab(padW, h, tread, padX, brickTop + h, padFront - (2.5 - i) * tread, grey, { floor: true });
    slab(tread, h, endW, padSouth - (2.5 - i) * tread, brickTop + h, padZ, grey, { floor: true });
    slab(tread, h, endW, padNorth + (2.5 - i) * tread, brickTop + h, padZ, grey, { floor: true });
  }
  function wallSeg(w, h, d, x, top, z, ry) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallDark);
    mesh.position.set(x, top - h / 2, z);
    mesh.rotation.y = ry;
    put(mesh, { solid: true });
  }
  wallSeg(13, 1.32, 0.5, -9, 1.36, padBack + 0.2, 0.12);
  wallSeg(14, 1.32, 0.5, 2, 1.36, padBack + 0.55, 0);
  wallSeg(13, 1.32, 0.5, 13, 1.36, padBack + 0.2, -0.12);

  // Lower box ahead-left. Ride it or grind the long sides.
  slab(1.5, 0.32, 4, 10, 0.36, 4, grey, { floor: true, solid: true });
  // Kicker on the right, launches toward the bay.
  kicker(2.2, 0.62, 2.6, -22, 10);
  const railBay = rail(16, 0.48, 32, 5, false);
  const railSide = rail(-26, 0.6, 6, 5, true);

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

  const curbLenZ = (hz1 - hz0) / 2 - 0.2;
  const curbLenX = (hx1 - hx0) / 2 - 0.2;
  const basinLips = [
    grindSpec(new THREE.Vector3(hx0 - cw, curbTop, fz), new THREE.Vector3(0, 0, 1), curbLenZ, 0.08),
    grindSpec(new THREE.Vector3(hx1 + cw, curbTop, fz), new THREE.Vector3(0, 0, 1), curbLenZ, 0.08),
    grindSpec(new THREE.Vector3(fx, curbTop, hz0 - cw), new THREE.Vector3(1, 0, 0), curbLenX, 0.08),
    grindSpec(new THREE.Vector3(fx, curbTop, hz1 + cw), new THREE.Vector3(1, 0, 0), curbLenX, 0.08),
  ];
  const topNose = padFront - tread;
  const octA0 = octR[0] * Math.cos(Math.PI / 8);
  const octF0 = octR[0] * Math.sin(Math.PI / 8);
  const octA2 = octR[2] * Math.cos(Math.PI / 8);
  const octF2 = octR[2] * Math.sin(Math.PI / 8);
  const octY0 = brickTop + octH[0];
  const octY2 = brickTop + octH[2];
  const ledgeLips = [
    grindSpec(new THREE.Vector3(padX, padTop, topNose), new THREE.Vector3(1, 0, 0), padW / 2 - 0.4, 0.07),
    grindSpec(new THREE.Vector3(padX, padTop, padBack), new THREE.Vector3(1, 0, 0), padW / 2 - 0.4, 0.07),
    grindSpec(new THREE.Vector3(padSouth, padTop, padZ), new THREE.Vector3(0, 0, 1), padD / 2 - 0.2, 0.07),
    grindSpec(new THREE.Vector3(padNorth, padTop, padZ), new THREE.Vector3(0, 0, 1), padD / 2 - 0.2, 0.07),
    grindSpec(new THREE.Vector3(ox, octY0, oz - octA0), new THREE.Vector3(1, 0, 0), octF0, 0.07),
    grindSpec(new THREE.Vector3(ox, octY0, oz + octA0), new THREE.Vector3(1, 0, 0), octF0, 0.07),
    grindSpec(new THREE.Vector3(ox - octA0, octY0, oz), new THREE.Vector3(0, 0, 1), octF0, 0.07),
    grindSpec(new THREE.Vector3(ox + octA0, octY0, oz), new THREE.Vector3(0, 0, 1), octF0, 0.07),
    grindSpec(new THREE.Vector3(ox, octY2, oz - octA2), new THREE.Vector3(1, 0, 0), octF2, 0.07),
    grindSpec(new THREE.Vector3(ox, octY2, oz + octA2), new THREE.Vector3(1, 0, 0), octF2, 0.07),
    grindSpec(new THREE.Vector3(ox - octA2, octY2, oz), new THREE.Vector3(0, 0, 1), octF2, 0.07),
    grindSpec(new THREE.Vector3(ox + octA2, octY2, oz), new THREE.Vector3(0, 0, 1), octF2, 0.07),
    grindSpec(new THREE.Vector3(9.25, 0.36, 4), new THREE.Vector3(0, 0, 1), 1.85, 0.06),
    grindSpec(new THREE.Vector3(10.75, 0.36, 4), new THREE.Vector3(0, 0, 1), 1.85, 0.06),
  ];

  floors.push(ground);

  return {
    ground,
    props: [root],
    floors,
    solids,
    grinds: [...basinLips, ...ledgeLips, railBay, railSide],
  };
}
