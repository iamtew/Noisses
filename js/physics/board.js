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
    pushLeftLatch: false,
    pushRightLatch: false,
    popLatch: false,
    flickFront: 0,
    flickBack: 0,
    triangleLatch: false,
    circleLatch: false,
    regular: true,
    wasGrounded: true,
    boned: false,
    bailed: 0,
    airTime: 0,
    flip: 0,
    flipRate: 0,
    shuv: 0,
    shuvRate: 0,
    caught: true,
    trick: "",
    flickFrontX: 0,
    flickBackX: 0,
    grinding: false,
    grind: null,
    dpadUpLatch: false,
    dpadDownLatch: false,
    wheelSpin: 0,
  };
}

/** Drop onto a spawn. Clears motion and trick state. */
export function applySpawn(board, spawn) {
  board.pos.set(spawn.x, 0.4, spawn.z);
  board.prevPos.copy(board.pos);
  board.vel.set(0, 0, 0);
  board.yaw = spawn.yaw;
  board.pitch = 0;
  board.roll = 0;
  board.flip = 0;
  board.flipRate = 0;
  board.shuv = 0;
  board.shuvRate = 0;
  board.quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), spawn.yaw);
  board.prevQuat.copy(board.quat);
  board.grounded = false;
  board.wasGrounded = false;
  board.grinding = false;
  board.grind = null;
  board.caught = true;
  board.trick = "";
  board.popLatch = false;
  board.bailed = 0;
  board.airTime = 0;
  board.boned = false;
}

export function poseAt(board, alpha, outPos, outQuat) {
  outPos.lerpVectors(board.prevPos, board.pos, alpha);
  outQuat.copy(board.prevQuat).slerp(board.quat, alpha);
}
