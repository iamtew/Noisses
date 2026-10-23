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

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1c1e);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    250,
  );
  camera.position.set(CAM_SIDE, CAM_HEIGHT, -CAM_BACK);

  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(6, 12, 8);
  scene.add(sun);

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener("resize", resize);

  return { scene, camera, renderer };
}

export function followCamera(camera, pos, quat, dt) {
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
}
