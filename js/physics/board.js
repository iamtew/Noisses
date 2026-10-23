import * as THREE from "three";

export function createBoardState() {
  const pos = new THREE.Vector3(0, 0.4, 0);
  return {
    pos,
    prevPos: pos.clone(),
    quat: new THREE.Quaternion(),
    prevQuat: new THREE.Quaternion(),
    vel: new THREE.Vector3(),
    yaw: 0,
    pitch: 0,
    roll: 0,
    grounded: false,
    pushLatch: false,
    popLatch: false,
    triangleLatch: false,
    circleLatch: false,
    regular: true,
    wheelSpin: 0,
  };
}

export function poseAt(board, alpha, outPos, outQuat) {
  outPos.lerpVectors(board.prevPos, board.pos, alpha);
  outQuat.copy(board.prevQuat).slerp(board.quat, alpha);
}
