import * as THREE from "three";
import { FOOT_X, FOOT_Z, WHEEL_LOCAL, WHEEL_RADIUS } from "../constants.js";

function gritMap() {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#1a1c1f";
  ctx.fillRect(0, 0, s, s);
  const img = ctx.getImageData(0, 0, s, s);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 28;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 14);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Popsicle outline: parallel rails, rounded nose and tail. Original geometry. */
function popsicleShape() {
  const halfW = 0.102;
  const shaft = 0.3;
  const steps = 20;
  const s = new THREE.Shape();
  s.moveTo(-halfW, -shaft);
  s.absarc(0, -shaft, halfW, Math.PI, 0, false);
  for (let i = 1; i <= steps; i++) s.lineTo(halfW, -shaft + (2 * shaft * i) / steps);
  s.absarc(0, shaft, halfW, 0, Math.PI, false);
  for (let i = 1; i < steps; i++) s.lineTo(-halfW, shaft - (2 * shaft * i) / steps);
  s.closePath();
  return s;
}

function kickLift(y) {
  const t = Math.min(1, Math.max(0, (Math.abs(y) - 0.22) / 0.2));
  const s = t * t * (3 - 2 * t);
  return s * s * 0.058;
}

function extrudeDeck(depth, bevel) {
  const geo = new THREE.ExtrudeGeometry(popsicleShape(), {
    depth,
    bevelEnabled: bevel,
    bevelThickness: 0.002,
    bevelSize: 0.003,
    bevelSegments: 3,
    curveSegments: 28,
  });
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setZ(i, pos.getZ(i) + kickLift(pos.getY(i)));
  }
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

/** Hanger wider than the deck so the truck reads from the follow camera. */
function truckAt(z, metal, bushing) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.01, 0.06), metal);
  base.position.y = -0.006;
  const king = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.04, 16), metal);
  king.position.y = -0.028;
  const bush = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.012, 16), bushing);
  bush.position.y = -0.022;
  const hanger = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.022, 0.032), metal);
  hanger.position.y = -0.048;
  const axle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.24, 16),
    metal,
  );
  axle.rotation.z = Math.PI / 2;
  axle.position.y = -0.05;
  g.add(base, king, bush, hanger, axle);
  g.position.z = z;
  g.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  return g;
}

/** Original popsicle deck + trucks + wheels. No commercial meshes. */
export function createBoardModel() {
  const group = new THREE.Group();

  const wood = new THREE.MeshStandardMaterial({
    color: 0xb8894a,
    roughness: 0.72,
  });
  const grip = new THREE.MeshStandardMaterial({
    map: gritMap(),
    color: 0x1a1c1f,
    roughness: 0.98,
  });
  const metal = new THREE.MeshStandardMaterial({
    color: 0xc5ccd4,
    roughness: 0.28,
    metalness: 0.8,
  });
  const bushing = new THREE.MeshStandardMaterial({
    color: 0x2a6b3f,
    roughness: 0.7,
  });
  const urethane = new THREE.MeshStandardMaterial({
    color: 0xd8c4a0,
    roughness: 0.55,
  });

  const deck = new THREE.Mesh(extrudeDeck(0.013, true), wood);
  deck.castShadow = true;
  const tape = new THREE.Mesh(extrudeDeck(0.002, false), grip);
  tape.position.y = 0.017;
  tape.castShadow = true;
  const markMat = new THREE.MeshStandardMaterial({ color: 0xd7d2c8, roughness: 0.55 });
  const noseMark = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.028), markMat);
  noseMark.rotation.x = -Math.PI / 2;
  noseMark.position.set(0, 0.021, 0.2);
  const tailMark = noseMark.clone();
  tailMark.position.z = -0.2;
  group.add(deck, tape, noseMark, tailMark);

  group.add(truckAt(0.205, metal, bushing));
  group.add(truckAt(-0.205, metal, bushing));

  const wheels = [];
  const geo = new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, 0.036, 28);
  for (const w of WHEEL_LOCAL) {
    const wheel = new THREE.Mesh(geo, urethane);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(w.x, -0.08, w.z);
    wheel.castShadow = true;
    group.add(wheel);
    wheels.push(wheel);
  }

  const shoe = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.55 });
  const sole = new THREE.MeshStandardMaterial({ color: 0xd4893a, roughness: 0.6 });
  const shoeGeo = new THREE.CapsuleGeometry(0.026, 0.08, 4, 12);
  const soleGeo = new THREE.CapsuleGeometry(0.028, 0.09, 3, 12);
  const frontFoot = new THREE.Group();
  const backFoot = new THREE.Group();
  for (const foot of [frontFoot, backFoot]) {
    const upper = new THREE.Mesh(shoeGeo, shoe);
    upper.rotation.x = Math.PI / 2;
    upper.position.y = 0.032;
    upper.scale.set(1.15, 1, 0.62);
    upper.castShadow = true;
    const gum = new THREE.Mesh(soleGeo, sole);
    gum.rotation.x = Math.PI / 2;
    gum.position.y = 0.012;
    gum.scale.set(1.2, 1, 0.4);
    gum.castShadow = true;
    foot.add(upper, gum);
  }
  frontFoot.castShadow = true;
  backFoot.castShadow = true;
  group.add(frontFoot, backFoot);

  return { group, wheels, frontFoot, backFoot };
}

/** Stick up (−Y) slides a foot toward the nose (+Z). Centered = over the trucks. */
export function placeFeet(model, front, back) {
  model.frontFoot.position.set(front.x * FOOT_X, 0.028, 0.18 - front.y * FOOT_Z);
  model.backFoot.position.set(back.x * FOOT_X, 0.028, -0.18 - back.y * FOOT_Z);
}
