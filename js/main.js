import { pollValidGamepad, anyButtonPressed } from "./input/gamepad.js";
import { setupScene } from "./scene/setup.js";
import { bindOverlay } from "./ui/overlay.js";

const canvas = document.getElementById("view");
const overlay = bindOverlay(document.getElementById("gate"));
const { renderer, scene, camera, cube, controls } = setupScene(canvas);

// playing = pad present AND start button was pressed this session.
let playing = false;

function tick() {
  const pad = pollValidGamepad();

  if (!pad) {
    playing = false;
    overlay.show("missing");
  } else if (!playing) {
    overlay.show("press");
    if (anyButtonPressed(pad)) playing = true;
  }

  if (playing) overlay.hide();

  cube.rotation.y += 0.01;
  cube.rotation.x += 0.006;
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
