import * as THREE from "three";
import {
  CAM_BACK,
  CAM_FOLLOW,
  CAM_HEIGHT,
  CAM_LOOK_Y,
  CAM_LOW_BACK,
  CAM_LOW_HEIGHT,
  CAM_LOW_LOOK,
  CAM_LOW_SIDE,
  CAM_SIDE,
  ORBIT_PITCH_MAX,
  ORBIT_PITCH_MIN,
  TWILIGHT_ABOVE,
  TWILIGHT_BELOW,
  WALK_CAM_DIST,
  WALK_CAM_LOOK,
  getSkyClock,
  sunElevationDeg,
} from "../constants.js";

const _desired = new THREE.Vector3();
const _back = new THREE.Vector3();
const _right = new THREE.Vector3();
const _look = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _moonDir = new THREE.Vector3();
const _ca = new THREE.Color();
const _cb = new THREE.Color();

/** Keep the caster near the rider so the shadow frustum still fits. Discs sit farther. */
const LIGHT_DIST = 18;
const DISC_DIST = 42;

// Invented plaza sky. Day bg is the old 0x8b9aaa fog.
const SKY_STOPS = [
  { m: 0, bg: 0x0b1020, fog: 0x0b1020, hemiSky: 0x4a5a78, hemiGnd: 0x1c1816, hemi: 0.28, fill: 0.08, sun: 0xc9d4ea, sunI: 0.22, fillCol: 0x6a7a98, exp: 0.68 },
  { m: 330, bg: 0x14182a, fog: 0x14182a, hemiSky: 0x5a4a68, hemiGnd: 0x2a201c, hemi: 0.32, fill: 0.1, sun: 0xd0c8e0, sunI: 0.24, fillCol: 0x7a6a88, exp: 0.72 },
  { m: 360, bg: 0xc56a52, fog: 0xb8624c, hemiSky: 0xffb090, hemiGnd: 0x6a3a32, hemi: 0.62, fill: 0.28, sun: 0xffb070, sunI: 0.75, fillCol: 0xffa090, exp: 0.95 },
  { m: 420, bg: 0x8b9aaa, fog: 0x8b9aaa, hemiSky: 0xd7e2ee, hemiGnd: 0x746c62, hemi: 0.95, fill: 0.42, sun: 0xfff1dd, sunI: 1.28, fillCol: 0xc9d7ea, exp: 1.12 },
  { m: 720, bg: 0x8b9aaa, fog: 0x8b9aaa, hemiSky: 0xd7e2ee, hemiGnd: 0x746c62, hemi: 0.95, fill: 0.42, sun: 0xfff1dd, sunI: 1.28, fillCol: 0xc9d7ea, exp: 1.12 },
  { m: 1020, bg: 0x8b9aaa, fog: 0x8b9aaa, hemiSky: 0xd7e2ee, hemiGnd: 0x746c62, hemi: 0.95, fill: 0.42, sun: 0xffe4c4, sunI: 1.15, fillCol: 0xc9d7ea, exp: 1.08 },
  { m: 1080, bg: 0x9a4a62, fog: 0x8a4258, hemiSky: 0xf0a888, hemiGnd: 0x4a2a38, hemi: 0.58, fill: 0.26, sun: 0xff9068, sunI: 0.7, fillCol: 0xd08090, exp: 0.92 },
  { m: 1140, bg: 0x12162a, fog: 0x12162a, hemiSky: 0x3a4a70, hemiGnd: 0x1a1618, hemi: 0.3, fill: 0.09, sun: 0xb8c8e8, sunI: 0.22, fillCol: 0x5a6a88, exp: 0.7 },
  { m: 1440, bg: 0x0b1020, fog: 0x0b1020, hemiSky: 0x4a5a78, hemiGnd: 0x1c1816, hemi: 0.28, fill: 0.08, sun: 0xc9d4ea, sunI: 0.22, fillCol: 0x6a7a98, exp: 0.68 },
];

function sampleStop(minutes, key) {
  const m = ((minutes % 1440) + 1440) % 1440;
  let i = 0;
  while (i < SKY_STOPS.length - 1 && SKY_STOPS[i + 1].m <= m) i += 1;
  const a = SKY_STOPS[i];
  const b = SKY_STOPS[i + 1];
  const span = b.m - a.m || 1;
  const t = (m - a.m) / span;
  const av = a[key];
  const bv = b[key];
  if (typeof av === "number" && av > 0xff) {
    _ca.set(av);
    _cb.set(bv);
    _ca.lerp(_cb, t);
    return _ca;
  }
  return av + (bv - av) * t;
}

function skyDir(out, azDeg, elevDeg) {
  const az = (azDeg * Math.PI) / 180;
  const el = (elevDeg * Math.PI) / 180;
  const c = Math.cos(el);
  // +X north, +Z east. Azimuth 0 = north, 90 = east.
  out.set(c * Math.cos(az), Math.sin(el), c * Math.sin(az));
  if (out.lengthSq() < 1e-8) out.set(0, 1, 0);
  else out.normalize();
}

function discMesh(color, r) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(r, 20, 16),
    new THREE.MeshBasicMaterial({
      color,
      fog: false,
      depthWrite: false,
      transparent: true,
      opacity: 1,
    }),
  );
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.frustumCulled = false;
  return mesh;
}

let sky = null;

export function setupScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const bg = new THREE.Color(0x8b9aaa);
  scene.background = bg;
  scene.fog = new THREE.Fog(0x8b9aaa, 80, 230);

  const camera = new THREE.PerspectiveCamera(
    58,
    window.innerWidth / window.innerHeight,
    0.08,
    250,
  );
  camera.position.set(CAM_SIDE, CAM_HEIGHT, -CAM_BACK);

  const hemi = new THREE.HemisphereLight(0xd7e2ee, 0x746c62, 0.95);
  scene.add(hemi);
  const fill = new THREE.DirectionalLight(0xc9d7ea, 0.42);
  fill.position.set(-7, 6, -3);
  scene.add(fill);
  const sun = new THREE.DirectionalLight(0xfff1dd, 1.28);
  sun.position.set(8, 14, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 48;
  sun.shadow.camera.left = -14;
  sun.shadow.camera.right = 14;
  sun.shadow.camera.top = 14;
  sun.shadow.camera.bottom = -14;
  sun.shadow.bias = -0.00035;
  scene.add(sun);
  scene.add(sun.target);

  const sunDisc = discMesh(0xffe8b0, 6.5);
  const moonDisc = discMesh(0xdde6f4, 5);
  scene.add(sunDisc, moonDisc);

  sky = { renderer, scene, hemi, fill, sun, sunDisc, moonDisc };

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener("resize", resize);

  return { scene, camera, renderer, sun };
}

/** `quat` is rider heading (pitch/yaw/roll). Do not pass the flipping deck. */
export function followCamera(camera, pos, quat, dt, sun, low) {
  const back = low ? CAM_LOW_BACK : CAM_BACK;
  const side = low ? CAM_LOW_SIDE : CAM_SIDE;
  const height = low ? CAM_LOW_HEIGHT : CAM_HEIGHT;
  const lookY = low ? CAM_LOW_LOOK : CAM_LOOK_Y;
  _back.set(0, 0, -1).applyQuaternion(quat);
  _back.y = 0;
  if (_back.lengthSq() < 1e-6) _back.set(0, 0, -1);
  _back.setLength(back);
  _right.set(1, 0, 0).applyQuaternion(quat);
  _right.y = 0;
  if (_right.lengthSq() < 1e-6) _right.set(1, 0, 0);
  else _right.normalize();
  _desired.copy(pos).add(_back).addScaledVector(_right, side);
  _desired.y = pos.y + height;
  camera.position.lerp(_desired, 1 - Math.exp(-CAM_FOLLOW * dt));
  _look.copy(pos);
  _look.y += lookY;
  camera.lookAt(_look);

  parkSun(sun, pos);
}

function parkSun(sun, pos) {
  if (!sun || !sky) return;
  const { minutes, azimuth } = getSkyClock();
  const elev = sunElevationDeg(minutes);
  skyDir(_dir, azimuth, elev);
  skyDir(_moonDir, azimuth + 180, -elev);

  const lightDir = elev >= 0 ? _dir : _moonDir;
  sun.position.copy(pos).addScaledVector(lightDir, LIGHT_DIST);
  sun.target.position.copy(pos);
  sun.target.updateMatrixWorld();

  sky.sunDisc.position.copy(pos).addScaledVector(_dir, DISC_DIST);
  sky.moonDisc.position.copy(pos).addScaledVector(_moonDir, DISC_DIST);
  const sunA = THREE.MathUtils.clamp((elev + TWILIGHT_BELOW) / (TWILIGHT_BELOW + TWILIGHT_ABOVE), 0, 1);
  const moonA = 1 - THREE.MathUtils.clamp((elev + 4) / (TWILIGHT_BELOW + TWILIGHT_ABOVE), 0, 1);
  sky.sunDisc.material.opacity = sunA;
  sky.moonDisc.material.opacity = moonA;
  sky.sunDisc.visible = sunA > 0.02;
  sky.moonDisc.visible = moonA > 0.02;

  sky.scene.background.copy(sampleStop(minutes, "bg"));
  sky.scene.fog.color.copy(sampleStop(minutes, "fog"));
  sky.hemi.color.copy(sampleStop(minutes, "hemiSky"));
  sky.hemi.groundColor.copy(sampleStop(minutes, "hemiGnd"));
  sky.hemi.intensity = sampleStop(minutes, "hemi");
  sky.fill.color.copy(sampleStop(minutes, "fillCol"));
  sky.fill.intensity = sampleStop(minutes, "fill");
  sky.fill.position.copy(pos).addScaledVector(lightDir, -10).setY(pos.y + 6);
  sun.color.copy(sampleStop(minutes, "sun"));
  sun.intensity = sampleStop(minutes, "sunI");
  sky.renderer.toneMappingExposure = sampleStop(minutes, "exp");
}

/** Match the orbit to wherever the follow cam already is, so a dismount does not snap. */
export function seedOrbit(walker, camera, pos) {
  const dx = camera.position.x - pos.x;
  const dz = camera.position.z - pos.z;
  const dy = camera.position.y - (pos.y + WALK_CAM_LOOK);
  walker.camYaw = Math.atan2(dx, dz);
  const pitch = Math.atan2(dy, Math.hypot(dx, dz) || 1);
  walker.camPitch = Math.min(ORBIT_PITCH_MAX, Math.max(ORBIT_PITCH_MIN, pitch));
}

/** Right stick owns this. `yaw` / `pitch` are the orbit, already updated by the pad. */
export function orbitCamera(camera, pos, yaw, pitch, dt, sun) {
  const horiz = WALK_CAM_DIST * Math.cos(pitch);
  _desired.set(
    pos.x + Math.sin(yaw) * horiz,
    pos.y + WALK_CAM_LOOK + Math.sin(pitch) * WALK_CAM_DIST,
    pos.z + Math.cos(yaw) * horiz,
  );
  camera.position.lerp(_desired, 1 - Math.exp(-CAM_FOLLOW * dt));
  _look.set(pos.x, pos.y + WALK_CAM_LOOK, pos.z);
  camera.lookAt(_look);
  parkSun(sun, pos);
}
