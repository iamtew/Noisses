import * as THREE from "three";
import {
  CAM_BACK,
  CAM_FOLLOW,
  CAM_HEIGHT,
  CAM_LOOK_Y,
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
  scene.fog = new THREE.Fog(0x8b9aaa, 22, 85);

  const camera = new THREE.PerspectiveCamera(
    58,
    window.innerWidth / window.innerHeight,
    0.08,
    250,
  );
  camera.position.set(CAM_SIDE, CAM_HEIGHT, -CAM_BACK);

  scene.add(new THREE.HemisphereLight(0xd4e0ec, 0x6e6860, 0.88));
  const sun = new THREE.DirectionalLight(0xfff1dd, 1.22);
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

export function followCamera(camera, pos, quat, dt, sun) {
  _back.set(0, 0, -1).applyQuaternion(quat);
  _back.y = 0;
  if (_back.lengthSq() < 1e-6) _back.set(0, 0, -1);
  _back.setLength(CAM_BACK);
  _right.set(1, 0, 0).applyQuaternion(quat);
  _right.y = 0;
  if (_right.lengthSq() < 1e-6) _right.set(1, 0, 0);
  else _right.normalize();
  _desired.copy(pos).add(_back).addScaledVector(_right, CAM_SIDE);
  _desired.y = pos.y + CAM_HEIGHT;
  camera.position.lerp(_desired, 1 - Math.exp(-CAM_FOLLOW * dt));
  _look.copy(pos);
  _look.y += CAM_LOOK_Y;
  camera.lookAt(_look);

  if (sun) {
    sun.position.set(pos.x + 8, pos.y + 14, pos.z + 6);
    sun.target.position.copy(pos);
    sun.target.updateMatrixWorld();
  }
}
