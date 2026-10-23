import { FIXED_DT } from "./constants.js";
import {
  IDLE_INPUT,
  anyButtonPressed,
  pollValidGamepad,
  readPlayInput,
} from "./input/gamepad.js";
import { applySpawn, createBoardState, poseAt } from "./physics/board.js";
import { selfCheck, stepWorld } from "./physics/world.js";
import { createBoardModel, placeFeet } from "./scene/boardModel.js";
import { createEnvironment } from "./scene/environment.js";
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
const { ground, grid, props, grinds, floors, solids, spawns } = createEnvironment();
scene.add(ground);
scene.add(grid);
for (const p of props) scene.add(p);

const board = createBoardState();
const model = createBoardModel();
scene.add(model.group);

for (let i = 0; i < 240 && !board.grounded; i++) {
  stepWorld(board, FIXED_DT, IDLE_INPUT, floors, grinds, solids);
}

const _pos = board.pos.clone();
const _quat = board.quat.clone();

let playing = false;
let stickDebug = false;
let spawnIndex = 0;
let spawnFlash = 0;
let acc = 0;
let last = performance.now();

function goSpawn(delta) {
  spawnIndex = (spawnIndex + delta + spawns.length) % spawns.length;
  applySpawn(board, spawns[spawnIndex]);
  for (let i = 0; i < 80 && !board.grounded; i++) {
    stepWorld(board, FIXED_DT, IDLE_INPUT, floors, grinds, solids);
  }
  spawnFlash = 1.6;
  followCamera(camera, board.pos, board.quat, 8, sun);
}

function hudText() {
  if (spawnFlash > 0) return `SPAWN  ${spawns[spawnIndex].name}`;
  if (board.bailed > 0) return "BAILED";
  const stance = board.regular ? "regular" : "goofy";
  const trick = board.grinding
    ? ` · ${board.trick} grind`
    : board.trick && !board.grounded
      ? ` · ${board.trick}${board.caught ? " caught" : ""}`
      : "";
  return `□/× push · L2/R2 turn · ollie then front-stick L/R flip · ○ ${stance} · △ sticks${trick}`;
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
  hud.textContent = hudText();

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
    if (input.dpadUp && !board.dpadUpLatch) goSpawn(1);
    board.dpadUpLatch = input.dpadUp;
    if (input.dpadDown && !board.dpadDownLatch) goSpawn(-1);
    board.dpadDownLatch = input.dpadDown;
    if (spawnFlash > 0) spawnFlash = Math.max(0, spawnFlash - frameDt);

    acc += frameDt;
    while (acc >= FIXED_DT) {
      stepWorld(board, FIXED_DT, input, floors, grinds, solids);
      acc -= FIXED_DT;
    }
  } else {
    acc = 0;
    board.prevPos.copy(board.pos);
    board.prevQuat.copy(board.quat);
  }

  const alpha = playing ? acc / FIXED_DT : 1;
  poseAt(board, alpha, _pos, _quat);
  model.group.position.copy(_pos);
  model.group.quaternion.copy(_quat);
  placeFeet(model, input.front, input.back);
  for (const wheel of model.wheels) wheel.rotation.x = board.wheelSpin;

  sticks.set(input, board.regular, playing && stickDebug);
  followCamera(camera, _pos, _quat, frameDt, sun);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
