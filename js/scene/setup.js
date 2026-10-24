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
} from "../constants.js";

const _desired = new THREE.Vector3();
const _back = new THREE.Vector3();
const _right = new THREE.Vector3();
const _look = new THREE.Vector3();

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
  scene.fog = new THREE.Fog(0x8b9aaa, 40, 150);

  const camera = new THREE.PerspectiveCamera(
    58,
    window.innerWidth / window.innerHeight,
    0.08,
    250,
  );
  camera.position.set(CAM_SIDE, CAM_HEIGHT, -CAM_BACK);

  scene.add(new THREE.HemisphereLight(0xd7e2ee, 0x746c62, 0.95));
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

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener("resize", resize);

  return { scene, camera, renderer, sun };
}

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

  if (sun) {
    sun.position.set(pos.x + 8, pos.y + 14, pos.z + 6);
    sun.target.position.copy(pos);
    sun.target.updateMatrixWorld();
  }
}
