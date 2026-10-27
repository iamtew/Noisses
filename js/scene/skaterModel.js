import * as THREE from "three";
import { BUTT_DAMP, BUTT_KICK, BUTT_STIFF, DUMPTRUCK } from "../constants.js";

// ponytail: posed meshes, not a ragdoll. Constraints if a bail should leave the board.

const _a = new THREE.Vector3();
const _pole = new THREE.Vector3();
const _unitY = new THREE.Vector3(0, 1, 0);
const _hip = new THREE.Vector3();
const _knee = new THREE.Vector3();
const _ankle = new THREE.Vector3();
const _euler = new THREE.Euler(0, 0, 0, "YXZ");

const THIGH = 0.26;
const SHIN = 0.25;
const FLOSS_MIN = 0.5;
const HOODIE_KEY = "noisses-hoodie";
const HOODIE_TEX = 128;
const HEX = /^#[0-9a-fA-F]{6}$/;

export const HOODIE_PATTERNS = ["solid", "stripes", "checks", "dots", "chevrons"];
export const HOODIE_DEFAULT_A = "#2e6fbf";

function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h * 60, s, l };
}

function hue2rgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToHex(h, s, l) {
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hh = ((h % 360) + 360) % 360 / 360;
  const r = Math.round(hue2rgb(p, q, hh + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, hh) * 255);
  const b = Math.round(hue2rgb(p, q, hh - 1 / 3) * 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** Second dye: hue +36°, a little darker. */
export function offsetHoodie(hex) {
  const { r, g, b } = hexToRgb(hex);
  const hsl = rgbToHsl(r, g, b);
  return hslToHex(hsl.h + 36, hsl.s, clamp(hsl.l * 0.78, 0.12, 0.72));
}

export function defaultHoodie() {
  return { pattern: "solid", a: HOODIE_DEFAULT_A, b: offsetHoodie(HOODIE_DEFAULT_A) };
}

function parseLook(raw) {
  if (!raw) return null;
  if (HEX.test(raw)) return { pattern: "solid", a: raw, b: offsetHoodie(raw) };
  try {
    const o = JSON.parse(raw);
    if (!o || !HEX.test(o.a)) return null;
    const pattern = HOODIE_PATTERNS.includes(o.pattern) ? o.pattern : "solid";
    const b = HEX.test(o.b) ? o.b : offsetHoodie(o.a);
    return { pattern, a: o.a, b };
  } catch {
    return null;
  }
}

export function loadHoodie() {
  try {
    return parseLook(localStorage.getItem(HOODIE_KEY)) || defaultHoodie();
  } catch {
    return defaultHoodie();
  }
}

export function saveHoodie(look) {
  try {
    localStorage.setItem(HOODIE_KEY, JSON.stringify(look));
  } catch {
    /* private window */
  }
}

function paintPattern(ctx, look) {
  const { a, b, pattern } = look;
  const n = HOODIE_TEX;
  ctx.fillStyle = a;
  ctx.fillRect(0, 0, n, n);
  if (pattern === "solid") return;
  ctx.fillStyle = b;
  if (pattern === "stripes") {
    for (let y = 0; y < n; y += 32) ctx.fillRect(0, y, n, 16);
  } else if (pattern === "checks") {
    const s = 32;
    for (let y = 0; y < n; y += s) {
      for (let x = 0; x < n; x += s) {
        if (((x + y) / s) % 2 === 0) ctx.fillRect(x, y, s, s);
      }
    }
  } else if (pattern === "dots") {
    for (let y = 12; y < n; y += 24) {
      for (let x = 12; x < n; x += 24) {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (pattern === "chevrons") {
    ctx.lineWidth = 10;
    ctx.strokeStyle = b;
    for (let y = -16; y < n + 16; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y + 16);
      ctx.lineTo(n / 2, y);
      ctx.lineTo(n, y + 16);
      ctx.stroke();
    }
  }
}

export function setHoodie(skater, look) {
  paintPattern(skater.hoodieCtx, look);
  skater.hoodieMap.needsUpdate = true;
  skater.hoodie.color.set(0xffffff);
}

/** Leg segment. aim() points +Y at the far joint, so nearR is the hip or knee. */
function limb(nearR, farR, mat) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(farR, nearR, 1, 16), mat);
  mesh.castShadow = true;
  return mesh;
}

function bentArm(cloth, skin) {
  const g = new THREE.Group();
  const upper = hung(0.03, 0.2, cloth);
  const fore = hung(0.025, 0.18, cloth);
  fore.position.y = -0.2;
  fore.rotation.x = 0.7;
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 10), skin);
  hand.position.y = -0.18;
  hand.castShadow = true;
  fore.add(hand);
  g.add(upper, fore);
  return g;
}

function hung(radius, length, mat) {
  const geo = new THREE.CylinderGeometry(radius, radius * 0.85, length, 14);
  geo.translate(0, -length / 2, 0);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

function aim(mesh, from, to) {
  _a.copy(to).sub(from);
  const len = Math.max(0.06, _a.length());
  mesh.position.copy(from).addScaledVector(_a, 0.5);
  _a.multiplyScalar(1 / len);
  mesh.quaternion.setFromUnitVectors(_unitY, _a);
  mesh.scale.y = len;
}

/** Low-poly rider. Lives in the scene, not on the deck, so the board can flip under the feet. */
export function createSkater() {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const pants = new THREE.MeshStandardMaterial({ color: 0x7d8ea3, roughness: 0.86 });
  const hoodieCanvas = document.createElement("canvas");
  hoodieCanvas.width = HOODIE_TEX;
  hoodieCanvas.height = HOODIE_TEX;
  const hoodieCtx = hoodieCanvas.getContext("2d");
  const hoodieMap = new THREE.CanvasTexture(hoodieCanvas);
  hoodieMap.colorSpace = THREE.SRGBColorSpace;
  hoodieMap.wrapS = THREE.RepeatWrapping;
  hoodieMap.wrapT = THREE.RepeatWrapping;
  const hoodie = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: hoodieMap,
    roughness: 0.8,
  });
  const skin = new THREE.MeshStandardMaterial({ color: 0xc4926e, roughness: 0.65 });

  const chest = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.2, 6, 16), hoodie);
  torso.position.y = 0.2;
  torso.castShadow = true;
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), hoodie);
  hood.scale.set(0.95, 1.05, 1.12);
  hood.position.set(-0.02, 0.4, 0);
  hood.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.072, 24, 16), skin);
  head.position.set(0.045, 0.4, 0);
  head.castShadow = true;
  const ink = new THREE.MeshBasicMaterial({ color: 0x1c140f });
  const eyeWhite = new THREE.MeshBasicMaterial({ color: 0xf3efe6 });
  for (const z of [0.026, -0.026]) {
    const white = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), eyeWhite);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), ink);
    pupil.position.x = 0.012;
    white.position.set(0.058, 0.02, z);
    white.add(pupil);
    head.add(white);
  }
  // Upper arc of a torus, flipped so it reads as a smile facing +X.
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.005, 6, 14, Math.PI), ink);
  mouth.rotation.order = "YXZ";
  mouth.rotation.set(0, Math.PI / 2, Math.PI);
  mouth.position.set(0.06, -0.022, 0);
  head.add(mouth);
  const armL = bentArm(hoodie, skin);
  const armR = bentArm(hoodie, skin);
  armL.position.set(0.02, 0.28, 0.15);
  armR.position.set(0.02, 0.28, -0.15);
  chest.add(torso, hood, head, armL, armR);

  // Pants. Sits in the crook: top at the hoodie hem, underside in the thigh.
  const butt = new THREE.Group();
  const cheekGeo = new THREE.SphereGeometry(0.07, 20, 16);
  for (const z of [0.036, -0.036]) {
    const cheek = new THREE.Mesh(cheekGeo, pants);
    cheek.position.set(-0.05, -0.04, z);
    cheek.scale.set(1.15, 1.05, 1.25);
    cheek.castShadow = true;
    butt.add(cheek);
  }
  chest.add(butt);

  // Hip is thick so the thigh meets the seat, then it thins toward the knee.
  const frontUpper = limb(0.074, 0.034, pants);
  const frontLower = limb(0.034, 0.026, pants);
  const backUpper = limb(0.074, 0.034, pants);
  const backLower = limb(0.034, 0.026, pants);
  body.add(chest, frontUpper, frontLower, backUpper, backLower);

  const skater = {
    root,
    body,
    chest,
    armL,
    armR,
    frontUpper,
    frontLower,
    backUpper,
    backLower,
    hoodie,
    hoodieCtx,
    hoodieMap,
    butt,
    kick: 0,
    floss: 0,
    flossAmp: 0,
    jigX: 0,
    jigY: 0,
    jigZ: 0,
    jigVX: 0,
    jigVY: 0,
    jigVZ: 0,
    prevVy: 0,
    prevSp: 0,
  };
  setHoodie(skater, loadHoodie());
  return skater;
}

/** Knee pokes toward the toes so the shin meets the shoe. */
function leg(upper, lower, hip, ankle, side) {
  _a.copy(ankle).sub(hip);
  const dist = Math.max(0.08, Math.min(_a.length(), THIGH + SHIN - 0.02));
  const along = (dist * dist + THIGH * THIGH - SHIN * SHIN) / (2 * dist);
  const height = Math.sqrt(Math.max(0, THIGH * THIGH - along * along));
  _knee.copy(hip).addScaledVector(_a, along / _a.length());
  _pole.set(side, 0.35, 0);
  const proj = _pole.dot(_a) / _a.lengthSq();
  _pole.addScaledVector(_a, -proj);
  if (_pole.lengthSq() < 1e-8) _pole.set(side, 0, 0);
  _pole.normalize();
  _knee.addScaledVector(_pole, height);
  aim(upper, hip, _knee);
  aim(lower, _knee, ankle);
}

/**
 * Crouch with stick weight, kick the back foot on a push, flop on a bail.
 * Rolling = floss. Standing still is too dignified.
 * Feet are already placed on the deck.
 */
export function poseSkater(skater, model, input, board, dt) {
  const pushing = (input.pushLeft || input.pushRight) && board.grounded ? 1 : 0;
  skater.kick += (pushing - skater.kick) * (1 - Math.exp(-12 * dt));
  if (skater.kick > 0.01) {
    model.backFoot.position.z -= 0.14 * skater.kick;
    model.backFoot.position.y += 0.03 * skater.kick;
  }

  const weight = Math.max(0, Math.min(1, (input.front.y + input.back.y) * 0.5));
  const air = board.grounded ? 0 : 0.1;
  const hipY = 0.46 - weight * 0.08 - air;
  const side = board.regular ? -1 : 1;
  const vx = board.vel ? board.vel.x : 0;
  const vz = board.vel ? board.vel.z : 0;
  const speed = Math.hypot(vx, vz);
  const ride = board.grounded && !(board.bailed > 0) && speed > FLOSS_MIN;
  const want = ride ? Math.min(1, (speed - FLOSS_MIN) / 3) : 0;
  skater.flossAmp += (want - skater.flossAmp) * (1 - Math.exp(-10 * dt));
  if (ride) skater.floss += dt * (5 + speed * 0.8);
  const s = Math.sin(skater.floss) * skater.flossAmp;
  const kickScale = 1 - skater.flossAmp * 0.55;

  skater.chest.position.y = hipY;
  skater.chest.rotation.y = (board.regular ? Math.PI : 0) + s * 0.5;
  skater.body.rotation.y = -s * 0.28;
  skater.armL.rotation.z = 0.15 + s * 0.85;
  skater.armR.rotation.z = -0.15 + s * 0.85;
  skater.armL.rotation.x = 0.35 + skater.kick * 0.8 * kickScale;
  skater.armR.rotation.x = 0.2 - skater.kick * 0.4 * kickScale;
  skater.armL.rotation.y = -s * 1.15;
  skater.armR.rotation.y = -s * 1.15;

  _hip.set(0, hipY, 0.06);
  _ankle.copy(model.frontFoot.position);
  _ankle.y += 0.04;
  leg(skater.frontUpper, skater.frontLower, _hip, _ankle, side);

  _hip.set(0, hipY, -0.06);
  _ankle.copy(model.backFoot.position);
  _ankle.y += 0.04;
  leg(skater.backUpper, skater.backLower, _hip, _ankle, side);

  const flop = Math.min(1, (board.bailed || 0) / 1.2);
  skater.body.rotation.z = flop * side * 1.15;
  skater.body.position.y = -flop * 0.1;

  // Cheeks lag the hips, then the spring claps them back.
  const h = Math.min(0.05, Math.max(0.001, dt));
  const vy = board.vel && Number.isFinite(board.vel.y) ? board.vel.y : 0;
  skater.jigVX += -(speed - skater.prevSp) * BUTT_KICK;
  skater.jigVY += (vy - skater.prevVy) * BUTT_KICK;
  skater.jigVY += Math.sin(skater.floss * 2) * skater.flossAmp * 1.4 * h;
  skater.jigVZ += Math.cos(skater.floss) * skater.flossAmp * 1.1 * h;
  skater.prevVy = vy;
  skater.prevSp = speed;
  const pull = BUTT_STIFF * h;
  skater.jigVX += -skater.jigX * pull;
  skater.jigVY += -skater.jigY * pull;
  skater.jigVZ += -skater.jigZ * pull;
  const damp = Math.exp(-BUTT_DAMP * h);
  skater.jigVX *= damp;
  skater.jigVY *= damp;
  skater.jigVZ *= damp;
  skater.jigX = Math.max(-0.07, Math.min(0.07, skater.jigX + skater.jigVX * h));
  skater.jigY = Math.max(-0.06, Math.min(0.06, skater.jigY + skater.jigVY * h));
  skater.jigZ = Math.max(-0.05, Math.min(0.05, skater.jigZ + skater.jigVZ * h));
  skater.butt.position.set(skater.jigX, skater.jigY, skater.jigZ);
  skater.butt.rotation.z = skater.jigX * 5;
  const dump = DUMPTRUCK;
  skater.butt.scale.set(dump, dump * (1 + skater.jigY * 6), dump);
}

/**
 * Yaw and pitch only. Flip and shuv stay on the deck.
 * While a flip is in the air, the body hangs above the board.
 */
export function placeSkater(skater, pos, board) {
  skater.root.position.copy(pos);
  if (!board.grounded && !board.caught) skater.root.position.y += 0.22;
  _euler.set(board.pitch, board.yaw, board.roll);
  skater.root.quaternion.setFromEuler(_euler);
}

export function selfCheckSkater() {
  const skater = createSkater();
  const model = {
    frontFoot: { position: new THREE.Vector3(0, 0.03, 0.18) },
    backFoot: { position: new THREE.Vector3(0, 0.03, -0.18) },
  };
  const board = { regular: true, grounded: true, bailed: 0, vel: { x: 0, z: 0 } };
  const input = {
    front: { x: 0, y: 0 },
    back: { x: 0, y: 0 },
    pushLeft: false,
    pushRight: false,
  };
  poseSkater(skater, model, input, board, 0.016);
  if (!(skater.chest.position.y > 0.35)) throw new Error("skater hip is on the deck");
  if (!Number.isFinite(skater.frontUpper.quaternion.w)) throw new Error("skater leg");
  const restY = skater.armL.rotation.y;
  board.vel.x = 4;
  for (let i = 0; i < 40; i++) poseSkater(skater, model, input, board, 0.016);
  if (!(Math.abs(skater.armL.rotation.y - restY) > 0.08)) throw new Error("skater should floss while rolling");
  board.vel.x = 0;
  board.grounded = true;
  for (let i = 0; i < 80; i++) poseSkater(skater, model, input, board, 0.016);
  if (!(Math.abs(skater.armL.rotation.y) < 0.05)) throw new Error("skater flossed while standing still");

  board.grounded = false;
  board.caught = false;
  board.pitch = 0;
  board.yaw = 0.4;
  board.roll = 0;
  board.flip = Math.PI;
  board.shuv = Math.PI;
  placeSkater(skater, new THREE.Vector3(1, 2, 3), board);
  if (!(skater.root.position.y > 2.15)) throw new Error("skater should hang above a flipping board");
  const upright = new THREE.Euler().setFromQuaternion(skater.root.quaternion, "YXZ");
  if (Math.abs(upright.z) > 0.05) throw new Error("skater rolled with the kickflip");
  if (Math.abs(upright.y - 0.4) > 0.05) throw new Error("skater spun with the shuv");

  board.vel.y = 0;
  skater.prevVy = 0;
  poseSkater(skater, model, input, board, 0.016);
  board.vel.y = 5;
  for (let i = 0; i < 8; i++) poseSkater(skater, model, input, board, 0.016);
  if (!(Math.abs(skater.jigY) > 0.01)) throw new Error("butt ignored the pop");
  for (let i = 0; i < 200; i++) poseSkater(skater, model, input, board, 0.016);
  if (!(Math.abs(skater.jigY) < 0.005)) throw new Error("butt never settled");

  const dye = offsetHoodie("#2e6fbf");
  if (dye === "#2e6fbf") throw new Error("hoodie offset is a no-op");
  setHoodie(skater, { pattern: "checks", a: "#2e6fbf", b: dye });
}
