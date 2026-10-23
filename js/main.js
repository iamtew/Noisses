import { FIXED_DT } from "./constants.js";
import {
  anyButtonPressed,
  pollValidGamepad,
  readPlayInput,
} from "./input/gamepad.js";
import { createBoardState, poseAt } from "./physics/board.js";
import { selfCheck, stepWorld } from "./physics/world.js";
import { createBoardModel } from "./scene/boardModel.js";
import { createEnvironment } from "./scene/environment.js";
import { followCamera, setupScene } from "./scene/setup.js";
import { bindOverlay } from "./ui/overlay.js";

selfCheck();

const canvas = document.getElementById("view");
const overlay = bindOverlay(document.getElementById("gate"));
const hud = document.getElementById("hud");
const { renderer, scene, camera } = setupScene(canvas);
const { ground, grid } = createEnvironment();
scene.add(ground);
scene.add(grid);

const board = createBoardState();
const model = createBoardModel();
scene.add(model.group);

// Drop onto the pad before the first frame so the overlay shows a landed board.
for (let i = 0; i < 240 && !board.grounded; i++) {
  stepWorld(board, FIXED_DT, { steer: 0, push: false }, ground);
}

const _pos = board.pos.clone();
const _quat = board.quat.clone();

let playing = false;
let acc = 0;
let last = performance.now();

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

  const input = playing ? readPlayInput(pad) : { steer: 0, push: false };
  if (playing) {
    acc += frameDt;
    while (acc >= FIXED_DT) {
      stepWorld(board, FIXED_DT, input, ground);
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
  for (const wheel of model.wheels) wheel.rotation.x = board.wheelSpin;

  followCamera(camera, _pos, _quat, frameDt);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
