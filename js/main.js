import * as THREE from "three";
import { FIXED_DT, SPAWN_HOLD } from "./constants.js";
import {
  IDLE_INPUT,
  anyButtonPressed,
  pollValidGamepad,
  readPlayInput,
} from "./input/gamepad.js";
import { applySpawn, createBoardState, poseAt } from "./physics/board.js";
import { selfCheck, stepWorld } from "./physics/world.js";
import { createBoardModel, placeFeet } from "./scene/boardModel.js";
import { createEnvironment, createSpawnMark } from "./scene/environment.js";
import { followCamera, setupScene } from "./scene/setup.js";
import { bindOverlay } from "./ui/overlay.js";
import { bindSticks } from "./ui/sticks.js";
import { selfCheckFlip, selfCheckPop } from "./tricks/detector.js";

selfCheck();
selfCheckPop();
selfCheckFlip();

const canvas = document.getElementById("view");
const overlay = bindOverlay(document.getElementById("gate"));
const hud = document.getElementById("hud");
const sticks = bindSticks(document.getElementById("sticks"));
const { renderer, scene, camera, sun } = setupScene(canvas);
const { ground, grid, props, grinds, floors, solids } = createEnvironment();
scene.add(ground);
scene.add(grid);
for (const p of props) scene.add(p);

const board = createBoardState();
const model = createBoardModel();
scene.add(model.group);

const spawnMark = createSpawnMark();
scene.add(spawnMark.group);
scene.add(spawnMark.charge);

const _ray = new THREE.Raycaster();
const _down = new THREE.Vector3(0, -1, 0);
const _from = new THREE.Vector3();

function floorY(x, z) {
  _from.set(x, 6, z);
  _ray.set(_from, _down);
  const hits = _ray.intersectObjects(floors, false);
  return hits.length ? hits[0].point.y : 0;
}

const spawnAt = { x: 0, z: 0, yaw: 0 };

function plantMark() {
  spawnMark.group.position.set(spawnAt.x, floorY(spawnAt.x, spawnAt.z) + 0.03, spawnAt.z);
  spawnMark.group.rotation.y = spawnAt.yaw;
}

plantMark();

for (let i = 0; i < 240 && !board.grounded; i++) {
  stepWorld(board, FIXED_DT, IDLE_INPUT, floors, grinds, solids);
}

const _pos = board.pos.clone();
const _quat = board.quat.clone();

let playing = false;
let stickDebug = false;
let holdDown = 0;
let holdUp = 0;
let firedDown = false;
let firedUp = false;
let spawnFlash = 0;
let spawnMsg = "";
let markPunch = 0;
let acc = 0;
let last = performance.now();

function settleBoard() {
  for (let i = 0; i < 80 && !board.grounded; i++) {
    stepWorld(board, FIXED_DT, IDLE_INPUT, floors, grinds, solids);
  }
  followCamera(camera, board.pos, board.quat, 8, sun);
}

function setSpawnHere() {
  spawnAt.x = board.pos.x;
  spawnAt.z = board.pos.z;
  spawnAt.yaw = board.yaw;
  plantMark();
  markPunch = 1;
  spawnMsg = "SPAWN SET";
  spawnFlash = 1.4;
}

function respawnHere() {
  applySpawn(board, spawnAt);
  settleBoard();
  spawnMsg = "RESPAWNED";
  spawnFlash = 1.4;
}

function tickHold(input, dt) {
  if (input.dpadDown && !input.dpadUp) {
    holdDown += dt;
    holdUp = 0;
    firedUp = false;
    if (holdDown >= SPAWN_HOLD && !firedDown) {
      setSpawnHere();
      firedDown = true;
    }
  } else {
    holdDown = 0;
    firedDown = false;
  }

  if (input.dpadUp && !input.dpadDown) {
    holdUp += dt;
    holdDown = 0;
    firedDown = false;
    if (holdUp >= SPAWN_HOLD && !firedUp) {
      respawnHere();
      firedUp = true;
    }
  } else {
    holdUp = 0;
    firedUp = false;
  }
}

function paintCharge(dt) {
  const chargingDown = holdDown > 0 && !firedDown;
  const chargingUp = holdUp > 0 && !firedUp;
  const charge = spawnMark.charge;
  if (chargingDown) {
    const t = Math.min(1, holdDown / SPAWN_HOLD);
    charge.visible = true;
    charge.position.set(board.pos.x, floorY(board.pos.x, board.pos.z) + 0.04, board.pos.z);
    charge.scale.setScalar(0.35 + t * 1.15);
    charge.material.opacity = 0.22 + t * 0.7;
    charge.material.color.setHex(0x7ec8ff);
  } else if (chargingUp) {
    const t = Math.min(1, holdUp / SPAWN_HOLD);
    charge.visible = true;
    charge.position.copy(spawnMark.group.position);
    charge.position.y += 0.01;
    charge.scale.setScalar(1.45 - t * 1.1);
    charge.material.opacity = 0.25 + t * 0.7;
    charge.material.color.setHex(0xffd56a);
  } else {
    charge.visible = false;
  }

  if (markPunch > 0) {
    markPunch = Math.max(0, markPunch - dt * 4);
    const s = 1 + markPunch * 0.45;
    spawnMark.group.scale.setScalar(s);
  } else {
    spawnMark.group.scale.setScalar(1);
  }
}

function hudText() {
  if (holdDown > 0 && !firedDown) return `SET SPAWN  ${Math.min(99, Math.floor((holdDown / SPAWN_HOLD) * 100))}%`;
  if (holdUp > 0 && !firedUp) return `RESPAWN  ${Math.min(99, Math.floor((holdUp / SPAWN_HOLD) * 100))}%`;
  if (spawnFlash > 0) return spawnMsg;
  if (board.bailed > 0) return "BAILED";
  const stance = board.regular ? "regular" : "goofy";
  const trick = board.grinding
    ? ` · ${board.trick} grind`
    : board.trick && !board.grounded
      ? ` · ${board.trick}${board.caught ? " caught" : ""}`
      : "";
  return `□/× push · L2/R2 turn · hold ↓ set spawn · hold ↑ respawn · ○ ${stance} · △ sticks${trick}`;
}

function tick(now) {
  const frameDt = Math.min(0.05, (now - last) / 1000);
  last = now;

  const pad = pollValidGamepad();
  if (!pad) {
    playing = false;
    overlay.show("missing");
  } else if (!playing) {
    overlay.show("press");
    if (anyButtonPressed(pad)) playing = true;
  }
  if (playing) overlay.hide();
  hud.hidden = !playing;

  const input = playing ? readPlayInput(pad, board.regular, now) : IDLE_INPUT;
  if (playing) {
    if (input.triangle && !board.triangleLatch) stickDebug = !stickDebug;
    board.triangleLatch = input.triangle;
    if (input.circle && !board.circleLatch) {
      if (board.grinding) {
        board.grinding = false;
        board.grind = null;
        board.vel.set(0, 0, 0);
        board.bailed = 1.2;
      }
      else if (board.grounded) board.regular = !board.regular;
    }
    board.circleLatch = input.circle;
    tickHold(input, frameDt);
    if (spawnFlash > 0) spawnFlash = Math.max(0, spawnFlash - frameDt);
    paintCharge(frameDt);

    acc += frameDt;
    while (acc >= FIXED_DT) {
      stepWorld(board, FIXED_DT, input, floors, grinds, solids);
      acc -= FIXED_DT;
    }
  } else {
    acc = 0;
    holdDown = 0;
    holdUp = 0;
    board.prevPos.copy(board.pos);
    board.prevQuat.copy(board.quat);
  }

  hud.textContent = hudText();

  const alpha = playing ? acc / FIXED_DT : 1;
  poseAt(board, alpha, _pos, _quat);
  const setT = holdDown > 0 && !firedDown ? Math.min(1, holdDown / SPAWN_HOLD) : 0;
  const upT = holdUp > 0 && !firedUp ? Math.min(1, holdUp / SPAWN_HOLD) : 0;
  if (setT > 0) _pos.y += 0.05 * setT;
  if (upT > 0) _pos.y += 0.1 * upT;
  model.group.position.copy(_pos);
  model.group.quaternion.copy(_quat);
  const squash = 1 + (setT + upT) * 0.04;
  model.group.scale.set(squash, 1 - (setT + upT) * 0.06, squash);
  placeFeet(model, input.front, input.back);
  for (const wheel of model.wheels) wheel.rotation.x = board.wheelSpin;

  sticks.set(input, board.regular, playing && stickDebug);
  followCamera(camera, _pos, _quat, frameDt, sun);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
