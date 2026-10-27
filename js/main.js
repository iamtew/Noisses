import * as THREE from "three";
import { createAudio, selfCheckAudio } from "./audio/engine.js";
import { CAM_OFFSET_STOCK, FIXED_DT, HUD_FADE_MS, HUD_LOG_MS, MENU_HOLD, ORBIT_PITCH, ORBIT_PITCH_MAX, ORBIT_PITCH_MIN, ORBIT_YAW, RIDE_HEIGHT, SPAWN_HOLD, advanceSkyClock, getTune, persistSkyClock, selfCheckSky, selfCheckTune, setTune } from "./constants.js";
import { CLANKER, bindClankerPads } from "./input/clanker.js";
import {
  IDLE_INPUT,
  anyButtonPressed,
  pollValidGamepad,
  readPlayInput,
} from "./input/gamepad.js";
import { applySpawn, createBoardState, poseAt } from "./physics/board.js";
import { carryBusy, createWalker, plantUnderFeet, selfCheckWalker, stepCarry, stepWalker } from "./physics/skater.js";
import { selfCheck, stepWorld } from "./physics/world.js";
import { createBoardModel, orientFeet, paintFeet, placeFeet } from "./scene/boardModel.js";
import { createDust, createEnvironment, createSpawnMark } from "./scene/environment.js";
import { followCamera, orbitCamera, seedOrbit, setupScene } from "./scene/setup.js";
import { carryBoardWorld, createSkater, placeSkater, poseSkater, selfCheckSkater, setHoodie } from "./scene/skaterModel.js";
import { selfCheckHowto } from "./ui/howto.js";
import { bindOverlay, bindPause } from "./ui/overlay.js";
import { bindSettings } from "./ui/settings.js";
import { bindSticks } from "./ui/sticks.js";
import { selfCheckFlip, selfCheckManual, selfCheckPop, selfCheckSlide } from "./tricks/detector.js";

selfCheck();
selfCheckPop();
selfCheckFlip();
selfCheckManual();
selfCheckSlide();
selfCheckAudio();
selfCheckSkater();
selfCheckWalker();
selfCheckTune();
selfCheckSky();
selfCheckHowto();

if (CLANKER) document.body.classList.add("clanker");

const canvas = document.getElementById("view");
const overlay = bindOverlay(document.getElementById("gate"));
const hud = document.getElementById("hud");
const sticks = bindSticks(document.getElementById("sticks"));
bindClankerPads(document.getElementById("sticks"));
const { renderer, scene, camera, sun } = setupScene(canvas);
const { ground, props, grinds, floors, solids } = createEnvironment();
scene.add(ground);
for (const p of props) scene.add(p);
const dust = createDust();
scene.add(dust.points);

const board = createBoardState();
const walker = createWalker();
const loco = {
  carry: 0,
  moving: false,
  running: false,
  yaw: 0,
  pos: walker.pos,
  vel: walker.vel,
};
const model = createBoardModel();
const skater = createSkater();
skater.root.add(model.frontFoot, model.backFoot);
scene.add(model.group);
scene.add(skater.root);
const sfx = createAudio();
const menu = bindSettings(document.getElementById("menu"), (v) => sfx.setVolume(v));
let advancedFromPause = false;
const pause = bindPause(document.getElementById("pause"), {
  onHoodie(look) {
    setHoodie(skater, look);
  },
  onVolume(v) {
    sfx.setVolume(v);
  },
  onPick(id) {
    if (id === "resume") pause.hide();
    else if (id === "restart") {
      respawnHere();
      pause.hide();
    } else if (id === "options") pause.openOptions();
    else if (id === "howto") pause.openHowto();
    else if (id === "advanced") {
      pause.hide();
      advancedFromPause = true;
      menu.show();
    } else if (id === "exit") location.reload();
  },
});

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
const _carryPos = new THREE.Vector3();
const _carryQuat = new THREE.Quaternion();

let playing = false;
let stickDebug = CLANKER;
let stickLatch = false;
let lowCam = false;
let r1Latch = false;
let camLeftLatch = false;
let camRightLatch = false;
let camFlash = 0;
let camMsg = "";
let optHold = 0;
let optOpened = false;
let optWas = false;
let menuUp = false;
let menuDown = false;
let menuLeft = false;
let menuRight = false;
let menuCross = false;
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
  followCamera(camera, board.pos, board.quat, 8, sun, lowCam, board.regular);
}

function setSpawnHere() {
  const feet = walker.carry > 0 ? walker.pos : board.pos;
  spawnAt.x = feet.x;
  spawnAt.z = feet.z;
  spawnAt.yaw = walker.carry > 0 ? walker.yaw : board.yaw;
  plantMark();
  markPunch = 1;
  spawnMsg = "SPAWN SET";
  spawnFlash = 1.4;
  sfx.spawnSet();
}

function respawnHere() {
  walker.carry = 0;
  walker.carryTo = 0;
  walker.running = false;
  walker.moving = false;
  walker.jumpArm = 0;
  walker.vel.set(0, 0, 0);
  if (model.group.parent !== scene) scene.attach(model.group);
  applySpawn(board, spawnAt);
  settleBoard();
  spawnMsg = "RESPAWNED";
  spawnFlash = 1.4;
  sfx.spawnGo();
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
    const at = walker.carry > 0 ? walker.pos : board.pos;
    charge.position.set(at.x, floorY(at.x, at.z) + 0.04, at.z);
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

function placeDeck() {
  const carry = walker.carry;
  if (carry <= 0) {
    if (model.group.parent !== scene) scene.attach(model.group);
    model.group.position.copy(_pos);
    model.group.quaternion.copy(_quat);
    return;
  }
  carryBoardWorld(skater, _carryPos, _carryQuat);
  const ease = carry * carry * (3 - 2 * carry);
  if (carry >= 1 && model.group.parent === skater.hand) return;
  if (model.group.parent === skater.hand) scene.attach(model.group);
  model.group.position.lerpVectors(_pos, _carryPos, ease);
  model.group.quaternion.copy(_quat).slerp(_carryQuat, ease);
  model.group.scale.set(1, 1, 1);
  if (carry >= 1) skater.hand.attach(model.group);
}

function menusOpen() {
  return pause.isOpen() || menu.isOpen();
}

function onBoard() {
  return walker.carry <= 0 && walker.carryTo <= 0;
}

function beginDismount() {
  const yaw = board.yaw;
  const side = board.regular ? -1 : 1;
  walker.pos.set(
    board.pos.x + Math.sin(yaw) * 0.32 * side,
    0,
    board.pos.z + Math.cos(yaw) * 0.32 * side,
  );
  walker.pos.y = floorY(walker.pos.x, walker.pos.z);
  walker.yaw = yaw;
  walker.vel.set(0, 0, 0);
  walker.running = false;
  walker.moving = false;
  walker.grounded = true;
  walker.jumpArm = 0;
  walker.carryTo = 1;
  seedOrbit(walker, camera, board.pos);
}

function beginMount() {
  if (model.group.parent !== scene) scene.attach(model.group);
  plantUnderFeet(board, walker, floorY(walker.pos.x, walker.pos.z) + RIDE_HEIGHT);
  walker.carryTo = 0;
}

function closeAdvanced() {
  menu.hide();
  if (advancedFromPause) {
    pause.show();
    pause.openOptions();
  }
  advancedFromPause = false;
}

const hudLines = [];

function hudKey(text) {
  if (text.startsWith("ADVANCED")) return "ADVANCED";
  if (text.startsWith("SET SPAWN")) return "SET SPAWN";
  if (text.startsWith("RESPAWN")) return "RESPAWN";
  return text;
}

function paintHud(now) {
  const text = hudText();
  if (text) {
    const key = hudKey(text);
    const last = hudLines[hudLines.length - 1];
    if (last && last.key === key) {
      last.text = text;
      last.born = now;
    } else if (!last || last.text !== text) {
      hudLines.push({ text, key, born: now });
    }
  }
  const die = HUD_LOG_MS + HUD_FADE_MS;
  const fade = HUD_FADE_MS;
  const live = HUD_LOG_MS;
  while (hudLines.length > 1 && now - hudLines[0].born > die) hudLines.shift();
  while (hud.firstChild && hud.firstChild.nodeType !== 1) hud.firstChild.remove();
  while (hud.childElementCount > hudLines.length) hud.lastChild.remove();
  hudLines.forEach((line, i) => {
    let el = hud.children[i];
    if (!el) {
      el = document.createElement("span");
      hud.appendChild(el);
    }
    if (el.textContent !== line.text) el.textContent = line.text;
    const age = now - line.born;
    const op = i === hudLines.length - 1 || age <= live
      ? "0.92"
      : String(Math.max(0, 1 - (age - live) / fade) * 0.92);
    if (el.style.opacity !== op) el.style.opacity = op;
  });
}

function hudText() {
  if (!menusOpen() && optHold > 0) return `ADVANCED  ${Math.min(99, Math.floor((optHold / MENU_HOLD) * 100))}%`;
  if (holdDown > 0 && !firedDown) return `SET SPAWN  ${Math.min(99, Math.floor((holdDown / SPAWN_HOLD) * 100))}%`;
  if (holdUp > 0 && !firedUp) return `RESPAWN  ${Math.min(99, Math.floor((holdUp / SPAWN_HOLD) * 100))}%`;
  if (spawnFlash > 0) return spawnMsg;
  if (walker.carryTo > walker.carry) return "GETTING OFF";
  if (walker.carryTo < walker.carry) return "GETTING ON";
  if (walker.carry >= 1) {
    if (walker.running) return "running";
    if (walker.moving) return "walking";
    return "loitering";
  }
  if (camFlash > 0) return camMsg;
  if (board.bailed > 0) return "BAILED";
  const stance = board.regular ? "regular" : "goofy";
  const trick = board.grinding
    ? ` · ${board.trick} grind`
    : board.sliding
      ? " · slide"
      : board.manual
        ? ` · ${board.manual} manual`
        : board.trick && !board.grounded
          ? ` · ${board.trick}${board.caught ? " caught" : ""}`
          : "";
  return `${stance}${trick}`;
}

function tick(now) {
  const frameDt = Math.min(0.05, (now - last) / 1000);
  last = now;

  const pad = pollValidGamepad();
  if (!pad && !CLANKER) {
    playing = false;
    overlay.show("missing");
  } else if (!playing) {
    if (CLANKER && !pad) {
      playing = true;
      sfx.resume();
    } else {
      overlay.show("press");
      if (anyButtonPressed(pad)) {
        playing = true;
        sfx.resume();
      }
    }
  }
  if (playing) overlay.hide();
  if (CLANKER && playing) sfx.resume();
  hud.hidden = !playing || menusOpen();

  const input = playing ? readPlayInput(pad, board.regular, now) : IDLE_INPUT;
  if (!playing) {
    pause.hide();
    menu.hide();
    advancedFromPause = false;
  }
  if (playing && !menusOpen() && input.options) {
    optHold += frameDt;
    if (optHold >= MENU_HOLD && !optOpened) {
      menu.show();
      optOpened = true;
      advancedFromPause = false;
      acc = 0;
    }
  } else if (!input.options) {
    if (playing && !menusOpen() && optWas && !optOpened && optHold > 0 && optHold < MENU_HOLD) {
      persistSkyClock();
      pause.show();
    }
    optHold = 0;
    optOpened = false;
  }

  if (playing && menu.isOpen()) {
    if (input.options && !optWas && !optOpened) closeAdvanced();
    if (input.circle && !board.circleLatch) closeAdvanced();
    board.circleLatch = input.circle;
    if (input.dpadUp && !menuUp) menu.move(-1);
    if (input.dpadDown && !menuDown) menu.move(1);
    menuUp = input.dpadUp;
    menuDown = input.dpadDown;
    let dir = input.lx;
    if (input.dpadLeft) dir -= 1;
    if (input.dpadRight) dir += 1;
    if (dir) menu.nudge(dir, frameDt);
    const stickY = Math.abs(input.ly) >= Math.abs(input.ry) ? input.ly : input.ry;
    menu.tick(frameDt, stickY);
    if (input.pushRight && !menuCross) menu.confirm();
    menuCross = input.pushRight;
    walker.jumpArm = 0;
    sfx.tick(0, false, false, 0);
    acc = 0;
    board.prevPos.copy(board.pos);
    board.prevQuat.copy(board.quat);
  } else if (playing && pause.isOpen()) {
    if (input.options && !optWas && !pause.back()) pause.hide();
    if (input.circle && !board.circleLatch && !pause.back()) pause.hide();
    board.circleLatch = input.circle;
    if (input.dpadUp && !menuUp) pause.move(-1);
    if (input.dpadDown && !menuDown) pause.move(1);
    menuUp = input.dpadUp;
    menuDown = input.dpadDown;
    if (input.dpadLeft && !menuLeft) pause.nudge(-1);
    if (input.dpadRight && !menuRight) pause.nudge(1);
    menuLeft = input.dpadLeft;
    menuRight = input.dpadRight;
    if (input.pushRight && !menuCross) pause.confirm();
    menuCross = input.pushRight;
    walker.jumpArm = 0;
    const stickY = Math.abs(input.ly) >= Math.abs(input.ry) ? input.ly : input.ry;
    pause.tick(frameDt, stickY, input.lx);
    sfx.tick(0, false, false, 0);
    acc = 0;
    board.prevPos.copy(board.pos);
    board.prevQuat.copy(board.quat);
  } else if (playing) {
    const bothSticks = input.l3 && input.r3;
    if (bothSticks && !stickLatch) stickDebug = !stickDebug;
    stickLatch = bothSticks;
    if (input.triangle && !board.triangleLatch && !carryBusy(walker)) {
      if (walker.carryTo < 0.5) {
        if (board.grounded && !board.grinding && !(board.bailed > 0)) beginDismount();
      } else beginMount();
    }
    board.triangleLatch = input.triangle;
    if (onBoard() && input.r1 && !r1Latch) {
      lowCam = !lowCam;
      camMsg = lowCam ? "LOW CAM" : "FOLLOW";
      camFlash = 1.2;
    }
    r1Latch = input.r1;
    if (onBoard() && input.dpadLeft && !camLeftLatch) {
      const t = getTune().camOffset;
      const next = Math.abs(t - 0.5) < 1e-6 ? CAM_OFFSET_STOCK : Math.min(t, 1 - t);
      if (Math.abs(next - t) > 1e-6) setTune("camOffset", next);
    }
    if (onBoard() && input.dpadRight && !camRightLatch) {
      const t = getTune().camOffset;
      const next = Math.abs(t - 0.5) < 1e-6 ? 1 - CAM_OFFSET_STOCK : Math.max(t, 1 - t);
      if (Math.abs(next - t) > 1e-6) setTune("camOffset", next);
    }
    camLeftLatch = input.dpadLeft;
    camRightLatch = input.dpadRight;
    if (camFlash > 0) camFlash = Math.max(0, camFlash - frameDt);
    if (onBoard() && input.circle && !board.circleLatch) {
      if (board.grinding) {
        board.grinding = false;
        board.grind = null;
        board.vel.set(0, 0, 0);
        board.bailed = 1.2;
        sfx.bail();
      }
      else if (board.grounded) board.regular = !board.regular;
    }
    board.circleLatch = input.circle;
    advanceSkyClock(frameDt);
    tickHold(input, frameDt);
    if (spawnFlash > 0) spawnFlash = Math.max(0, spawnFlash - frameDt);
    paintCharge(frameDt);

    acc += frameDt;
    if (onBoard()) {
      while (acc >= FIXED_DT) {
        const wasGrounded = board.grounded;
        const wasBailed = board.bailed;
        const wasSliding = board.sliding;
        const vy = board.vel.y;
        const willPush =
          board.grounded &&
          ((input.pushLeft && !board.pushLeftLatch) ||
            (input.pushRight && !board.pushRightLatch));
        stepWorld(board, FIXED_DT, input, floors, grinds, solids);
        if (willPush || (board.sliding && !wasSliding)) {
          sfx.push();
          dust.burst(board.pos, 0.7);
        }
        if (!board.grounded && wasGrounded && board.vel.y > 0.35) sfx.pop();
        if (board.grounded && !wasGrounded) {
          if (board.bailed > 0 && wasBailed <= 0) sfx.bail();
          else sfx.land(-vy);
          dust.burst(board.pos, 0.5 + Math.min(1.2, Math.abs(vy) * 0.25));
        }
        acc -= FIXED_DT;
      }
      const speed = Math.hypot(board.vel.x, board.vel.z);
      sfx.tick(speed, board.grounded, board.grinding, board.flipRate);
    } else {
      board.prevPos.copy(board.pos);
      board.prevQuat.copy(board.quat);
      let jumped = false;
      let landed = false;
      let impact = 0;
      while (acc >= FIXED_DT) {
        stepCarry(walker, FIXED_DT);
        if (walker.carry >= 1 && walker.carryTo >= 1) {
          const step = stepWalker(walker, input, FIXED_DT, floorY, solids, board.regular);
          if (step.jumped) jumped = true;
          if (step.landed) {
            landed = true;
            impact = step.impact;
          }
        }
        acc -= FIXED_DT;
      }
      if (jumped) sfx.pop();
      if (landed) sfx.land(impact);
      sfx.tick(0, false, false, 0);
    }
  } else {
    sfx.tick(0, false, false, 0);
    acc = 0;
    holdDown = 0;
    holdUp = 0;
    board.prevPos.copy(board.pos);
    board.prevQuat.copy(board.quat);
  }
  optWas = input.options;

  hud.classList.toggle("up", playing && stickDebug);
  paintHud(now);

  const alpha = playing ? acc / FIXED_DT : 1;
  poseAt(board, alpha, _pos, _quat);
  const setT = holdDown > 0 && !firedDown ? Math.min(1, holdDown / SPAWN_HOLD) : 0;
  const upT = holdUp > 0 && !firedUp ? Math.min(1, holdUp / SPAWN_HOLD) : 0;
  if (walker.carry <= 0) {
    if (setT > 0) _pos.y += 0.05 * setT;
    if (upT > 0) _pos.y += 0.1 * upT;
  }
  loco.carry = walker.carry;
  loco.moving = walker.moving;
  loco.running = walker.running;
  loco.yaw = walker.yaw;
  if (walker.carry <= 0) placeFeet(model, input.front, input.back, board.regular);
  poseSkater(skater, model, input, board, frameDt, loco);
  if (walker.carry > 0) orientFeet(model, board.regular);
  paintFeet(model, playing && stickDebug, board.regular);
  placeSkater(skater, _pos, board, loco);
  placeDeck();
  if (walker.carry <= 0) {
    const squash = 1 + (setT + upT) * 0.04;
    model.group.scale.set(squash, 1 - (setT + upT) * 0.06, squash);
  }
  for (const wheel of model.wheels) wheel.rotation.x = board.wheelSpin;

  sticks.set(input, board.regular, playing && stickDebug);
  dust.step(frameDt);
  if (playing && !menusOpen() && walker.carry > 0) {
    walker.camYaw -= input.rx * ORBIT_YAW * frameDt;
    const pitch = walker.camPitch + input.ry * ORBIT_PITCH * frameDt;
    walker.camPitch = Math.min(ORBIT_PITCH_MAX, Math.max(ORBIT_PITCH_MIN, pitch));
  }
  // On the board, follow the rider. Off it, the right stick swings the orbit.
  if (walker.carry > 0) {
    orbitCamera(camera, skater.root.position, walker.camYaw, walker.camPitch, frameDt, sun);
  } else {
    followCamera(camera, _pos, skater.root.quaternion, frameDt, sun, lowCam, board.regular);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
