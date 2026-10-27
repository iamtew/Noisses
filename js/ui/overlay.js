import iro from "@jaames/iro";
import {
  AUDIO_MASTER,
  MENU_SCROLL,
  TUNABLES,
  formatClock,
  formatTune,
  getSkyClock,
  getTune,
  parseClock,
  persistSkyClock,
  setSkyAzimuth,
  setSkyCycle,
  setSkyMinutes,
  setTune,
} from "../constants.js";
import {
  HOODIE_PATTERNS,
  loadHoodie,
  offsetHoodie,
  saveHoodie,
} from "../scene/skaterModel.js";
import { HOWTO_BODY, TRICKS, sampleTrick } from "./howto.js";
import { iconHtml } from "./icons.js";
import { bindSticks } from "./sticks.js";

const COPY = {
  missing: {
    title: "CONTROLLER REQUIRED",
    body:
      "Connect a gamepad with two analog sticks.\nThis is a dual-stick foot-control skate simulator.\nKeyboard is not supported for skating.",
  },
  press: {
    title: "PRESS ANY BUTTON TO START",
    body: "□  left foot     ×  right foot     L2/R2  turn\nHold ↓  set spawn     hold ↑  respawn     R1  low cam\nOptions  pause     hold Options  advanced\nEmbarcadero Plaza — face the bay\nFountain on your left · Ferry Building ahead, tower to the right\nTerrace toward the palms · octagon on the brick · kicker to the right\n○ stance on the board\n△ off / on the board     L3+R3 sticks\nOff the board: left stick walks, right stick looks, × jumps, ×× runs",
  },
};

export function bindOverlay(root) {
  const titleEl = root.querySelector("[data-overlay-title]");
  const bodyEl = root.querySelector("[data-overlay-body]");

  function show(kind) {
    const copy = COPY[kind];
    titleEl.textContent = copy.title;
    bodyEl.textContent = copy.body;
    root.hidden = false;
  }

  function hide() {
    root.hidden = true;
  }

  return { show, hide };
}

const ITEMS = [
  { id: "resume", label: "Resume", icon: "player-play" },
  { id: "restart", label: "Restart", icon: "reload" },
  { id: "options", label: "Options", icon: "settings" },
  { id: "howto", label: "How to play", icon: "book" },
  { id: "exit", label: "Exit", icon: "logout" },
];

const OPTION_ITEMS = [
  { id: "hoodie", label: "Hoodie", icon: "shirt" },
  { id: "daynight", label: "Day / Night", icon: "sun-moon" },
  { id: "audio", label: "Audio", icon: "volume" },
  { id: "advanced", label: "Advanced settings", icon: "adjustments-horizontal" },
];

const VOLUME = TUNABLES.find((t) => t.id === "volume");

const TITLES = {
  root: "NOISSES",
  options: "OPTIONS",
  hoodie: "HOODIE",
  daynight: "DAY / NIGHT",
  audio: "AUDIO",
  howto: "HOW TO PLAY",
  tricks: "TRICK LIST",
};

const HINTS = {
  root: "↑↓ select · × confirm · ○ or Options closes · hold Options for advanced",
  options: "↑↓ select · × open · ○ back",
  hoodie: "↑↓ select · ←→ pattern or hue · ○ back",
  daynight: "↑↓ select · ←→ cycle, time, or sun angle · ○ back",
  audio: "↑↓ select · ←→ volume · × restore · ○ back",
  howto: "↑↓ select · sticks scroll · × open · ○ back",
  tricks: "↑↓ pick a trick · sticks scroll · ○ back · paths are Regular (Goofy swaps the sticks)",
};

function patternLabel(id) {
  return id[0].toUpperCase() + id.slice(1);
}

function makePicker(el, hex) {
  return new iro.ColorPicker(el, {
    width: 148,
    color: hex,
    layout: [
      { component: iro.ui.Wheel },
      { component: iro.ui.Slider, options: { sliderType: "value" } },
    ],
  });
}

/** Pause: nested hoodie / how-to / trick list. ○ pops one screen. */
export function bindPause(root, hooks) {
  const titleEl = root.querySelector("[data-pause-title]");
  const tagEl = root.querySelector("[data-pause-tag]");
  const hintEl = root.querySelector("[data-pause-hint]");
  const screens = {
    root: root.querySelector("[data-screen='root']"),
    options: root.querySelector("[data-screen='options']"),
    hoodie: root.querySelector("[data-screen='hoodie']"),
    daynight: root.querySelector("[data-screen='daynight']"),
    audio: root.querySelector("[data-screen='audio']"),
    howto: root.querySelector("[data-screen='howto']"),
    tricks: root.querySelector("[data-screen='tricks']"),
  };
  const list = root.querySelector("[data-pause-list]");
  const optionList = root.querySelector("[data-options-list]");
  const patternBtn = root.querySelector("[data-hoodie-pattern]");
  const colorABtn = root.querySelector("[data-hoodie-a]");
  const colorBBtn = root.querySelector("[data-hoodie-b]");
  const hoodieBack = root.querySelector("[data-hoodie-back]");
  const colorBBox = root.querySelector("[data-color-b]");
  const cycleBtn = root.querySelector("[data-clock-cycle]");
  const timeBtn = root.querySelector("[data-clock-time]");
  const timeInput = root.querySelector("[data-clock-input]");
  const azBtn = root.querySelector("[data-clock-az]");
  const clockBack = root.querySelector("[data-clock-back]");
  const volBtn = root.querySelector("[data-audio-volume]");
  const audioBack = root.querySelector("[data-audio-back]");
  const howtoBody = root.querySelector("[data-howto-body]");
  const howtoList = root.querySelector("[data-howto-list]");
  const trickList = root.querySelector("[data-trick-list]");
  const trickBlurb = root.querySelector("[data-trick-blurb]");
  const demo = bindSticks(root.querySelector("[data-trick-sticks]"));

  howtoBody.textContent = HOWTO_BODY;

  let screen = "root";
  let open = false;
  let index = 0;
  let optionIndex = 0;
  let hoodieIndex = 0;
  let clockIndex = 0;
  let audioIndex = 0;
  let howtoIndex = 0;
  let trickIndex = 0;
  let look = loadHoodie();
  let autoB = true;
  let syncing = false;
  let ready = false;
  let demoT = 0;

  const pickerA = makePicker(root.querySelector("[data-iro-a]"), look.a);
  const pickerB = makePicker(root.querySelector("[data-iro-b]"), look.b);

  const buttons = ITEMS.map((item, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "row reset";
    btn.innerHTML = `${iconHtml(item.icon)}<span>${item.label}</span>`;
    btn.addEventListener("pointerdown", () => {
      index = i;
      paint();
      hooks.onPick(item.id);
    });
    list.appendChild(btn);
    return btn;
  });

  const optionBtns = OPTION_ITEMS.map((item, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "row reset";
    btn.innerHTML = `${iconHtml(item.icon)}<span>${item.label}</span>`;
    btn.addEventListener("pointerdown", () => {
      optionIndex = i;
      paint();
      pickOption(item.id);
    });
    optionList.appendChild(btn);
    return btn;
  });

  const hoodieBtns = [patternBtn, colorABtn, colorBBtn, hoodieBack];
  hoodieBtns.forEach((btn, i) => {
    btn.addEventListener("pointerdown", () => {
      hoodieIndex = i;
      if (look.pattern === "solid" && i === 2) hoodieIndex = 1;
      paint();
      if (i === 0) cyclePattern(1);
      if (i === 3) go("options");
    });
  });

  cycleBtn.addEventListener("pointerdown", () => {
    clockIndex = 0;
    setSkyCycle(!getSkyClock().cycle);
    paint();
  });
  timeBtn.addEventListener("pointerdown", () => {
    clockIndex = 1;
    paint();
  });
  timeInput.addEventListener("pointerdown", (e) => e.stopPropagation());
  function commitClock() {
    const mins = parseClock(timeInput.value);
    if (mins == null) {
      timeInput.value = formatClock(getSkyClock().minutes);
      return;
    }
    setSkyMinutes(mins);
    paint();
  }
  timeInput.addEventListener("change", commitClock);
  timeInput.addEventListener("blur", commitClock);
  azBtn.addEventListener("pointerdown", (e) => {
    clockIndex = 2;
    const track = azBtn.querySelector(".track");
    const box = track.getBoundingClientRect();
    const t = box.width > 0 ? (e.clientX - box.left) / box.width : 0;
    setSkyAzimuth(Math.min(1, Math.max(0, t)) * 360);
    paint();
    azBtn.setPointerCapture(e.pointerId);
  });
  azBtn.addEventListener("pointermove", (e) => {
    if (!azBtn.hasPointerCapture(e.pointerId)) return;
    const track = azBtn.querySelector(".track");
    const box = track.getBoundingClientRect();
    const t = box.width > 0 ? (e.clientX - box.left) / box.width : 0;
    setSkyAzimuth(Math.min(1, Math.max(0, t)) * 360);
    paint();
  });
  clockBack.addEventListener("pointerdown", () => go("options"));

  volBtn.addEventListener("pointerdown", (e) => {
    audioIndex = 0;
    if (e.target.closest(".tune-reset")) {
      setTune("volume", 1);
      hooks.onVolume(AUDIO_MASTER);
      paint();
      return;
    }
    const track = volBtn.querySelector(".track");
    const box = track.getBoundingClientRect();
    const t = box.width > 0 ? (e.clientX - box.left) / box.width : 0;
    setTune("volume", VOLUME.min + Math.min(1, Math.max(0, t)) * (VOLUME.max - VOLUME.min));
    hooks.onVolume(AUDIO_MASTER);
    paint();
    volBtn.setPointerCapture(e.pointerId);
  });
  volBtn.addEventListener("pointermove", (e) => {
    if (!volBtn.hasPointerCapture(e.pointerId)) return;
    const track = volBtn.querySelector(".track");
    const box = track.getBoundingClientRect();
    const t = box.width > 0 ? (e.clientX - box.left) / box.width : 0;
    setTune("volume", VOLUME.min + Math.min(1, Math.max(0, t)) * (VOLUME.max - VOLUME.min));
    hooks.onVolume(AUDIO_MASTER);
    paint();
  });
  audioBack.addEventListener("pointerdown", () => go("options"));

  const howtoBtns = [];
  for (const item of [
    { id: "tricks", label: "Trick list" },
    { id: "back", label: "Back" },
  ]) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "row reset";
    btn.innerHTML = `${iconHtml(item.id === "tricks" ? "book" : "logout")}<span>${item.label}</span>`;
    btn.addEventListener("pointerdown", () => {
      howtoIndex = howtoBtns.length;
      paint();
      if (item.id === "tricks") go("tricks");
      else go("root");
    });
    howtoList.appendChild(btn);
    howtoBtns.push(btn);
  }

  const trickBtns = TRICKS.map((trick, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "row reset";
    btn.textContent = trick.name;
    btn.addEventListener("pointerdown", () => {
      trickIndex = i;
      demoT = 0;
      demo.reset();
      paint();
    });
    trickList.appendChild(btn);
    return btn;
  });
  const trickBack = document.createElement("button");
  trickBack.type = "button";
  trickBack.className = "row reset";
  trickBack.innerHTML = `${iconHtml("logout")}<span>Back</span>`;
  trickBack.addEventListener("pointerdown", () => go("howto"));
  trickList.appendChild(trickBack);

  pickerA.on("color:change", (color) => {
    if (syncing || !ready) return;
    look = { ...look, a: color.hexString };
    if (autoB) {
      look.b = offsetHoodie(look.a);
      syncing = true;
      pickerB.color.hexString = look.b;
      syncing = false;
    }
    emitLook();
    paint();
  });
  pickerB.on("color:change", (color) => {
    if (syncing || !ready) return;
    autoB = false;
    look = { ...look, b: color.hexString };
    emitLook();
  });

  function emitLook() {
    saveHoodie(look);
    hooks.onHoodie(look);
  }

  function hoodieRows() {
    return look.pattern === "solid"
      ? [patternBtn, colorABtn, hoodieBack]
      : hoodieBtns;
  }

  function cyclePattern(dir) {
    const i = HOODIE_PATTERNS.indexOf(look.pattern);
    const n = HOODIE_PATTERNS.length;
    look = { ...look, pattern: HOODIE_PATTERNS[(i + dir + n) % n] };
    emitLook();
    paint();
  }

  function pickOption(id) {
    if (id === "hoodie") go("hoodie");
    else if (id === "daynight") go("daynight");
    else if (id === "audio") go("audio");
    else if (id === "advanced") hooks.onPick("advanced");
  }

  function go(next) {
    screen = next;
    if (next === "tricks") {
      demoT = 0;
      demo.reset();
    }
    paint();
  }

  function paint() {
    titleEl.textContent = TITLES[screen];
    tagEl.hidden = screen !== "root";
    hintEl.textContent = HINTS[screen];
    root.dataset.screen = screen;
    for (const [id, el] of Object.entries(screens)) el.hidden = id !== screen;

    buttons.forEach((btn, i) => btn.classList.toggle("on", open && screen === "root" && i === index));
    optionBtns.forEach((btn, i) =>
      btn.classList.toggle("on", open && screen === "options" && i === optionIndex),
    );

    patternBtn.querySelector("[data-val]").textContent = patternLabel(look.pattern);
    const rows = hoodieRows();
    if (hoodieIndex >= rows.length) hoodieIndex = rows.length - 1;
    hoodieBtns.forEach((btn) => btn.classList.toggle("on", false));
    colorBBtn.hidden = look.pattern === "solid";
    colorBBox.hidden = look.pattern === "solid";
    rows.forEach((btn, i) => btn.classList.toggle("on", open && screen === "hoodie" && i === hoodieIndex));

    const clock = getSkyClock();
    const stamp = formatClock(clock.minutes);
    if (document.activeElement !== timeInput && timeInput.value !== stamp) timeInput.value = stamp;
    cycleBtn.querySelector("[data-val]").textContent = clock.cycle ? "On" : "Off";
    azBtn.querySelector(".fill").style.width = `${Math.round((clock.azimuth / 360) * 100)}%`;
    azBtn.querySelector("[data-val]").textContent = `${Math.round(clock.azimuth)}°`;
    const clockRows = [cycleBtn, timeBtn, azBtn, clockBack];
    clockRows.forEach((btn, i) =>
      btn.classList.toggle("on", open && screen === "daynight" && i === clockIndex),
    );

    const vol = getTune().volume;
    const vu = (vol - VOLUME.min) / (VOLUME.max - VOLUME.min);
    volBtn.querySelector(".fill").style.width = `${Math.round(vu * 100)}%`;
    volBtn.querySelector("[data-val]").textContent = formatTune(VOLUME, vol);
    const audioRows = [volBtn, audioBack];
    audioRows.forEach((btn, i) =>
      btn.classList.toggle("on", open && screen === "audio" && i === audioIndex),
    );

    howtoBtns.forEach((btn, i) =>
      btn.classList.toggle("on", open && screen === "howto" && i === howtoIndex),
    );

    const trickN = TRICKS.length + 1;
    if (trickIndex >= trickN) trickIndex = trickN - 1;
    trickBtns.forEach((btn, i) =>
      btn.classList.toggle("on", open && screen === "tricks" && i === trickIndex),
    );
    trickBack.classList.toggle("on", open && screen === "tricks" && trickIndex === TRICKS.length);
    if (open && screen === "tricks") {
      const row = trickIndex < TRICKS.length ? trickBtns[trickIndex] : trickBack;
      row.scrollIntoView({ block: "nearest" });
    }
    const trick = TRICKS[Math.min(trickIndex, TRICKS.length - 1)];
    trickBlurb.textContent = trick.blurb;
    if (!(open && screen === "tricks")) {
      demo.set({ lx: 0, ly: 0, rx: 0, ry: 0 }, true, false);
    }
  }

  function show() {
    open = true;
    screen = "root";
    root.hidden = false;
    paint();
  }

  function hide() {
    persistSkyClock();
    open = false;
    screen = "root";
    root.hidden = true;
    demo.set({ lx: 0, ly: 0, rx: 0, ry: 0 }, true, false);
    paint();
  }

  ready = true;

  return {
    isOpen: () => open,
    screen: () => screen,
    show,
    hide,
    /** Pop a sub-screen. False means Meat Bag is on root and should close pause. */
    back() {
      if (screen === "tricks") {
        go("howto");
        return true;
      }
      if (screen === "hoodie" || screen === "daynight" || screen === "audio") {
        go("options");
        return true;
      }
      if (screen === "options" || screen === "howto") {
        go("root");
        return true;
      }
      return false;
    },
    move(dir) {
      if (screen === "root") {
        index = (index + dir + ITEMS.length) % ITEMS.length;
      } else if (screen === "options") {
        optionIndex = (optionIndex + dir + OPTION_ITEMS.length) % OPTION_ITEMS.length;
      } else if (screen === "hoodie") {
        const n = hoodieRows().length;
        hoodieIndex = (hoodieIndex + dir + n) % n;
      } else if (screen === "daynight") {
        clockIndex = (clockIndex + dir + 4) % 4;
      } else if (screen === "audio") {
        audioIndex = (audioIndex + dir + 2) % 2;
      } else if (screen === "howto") {
        howtoIndex = (howtoIndex + dir + howtoBtns.length) % howtoBtns.length;
      } else {
        const n = TRICKS.length + 1;
        const next = (trickIndex + dir + n) % n;
        if (next !== trickIndex && next < TRICKS.length) {
          demoT = 0;
          demo.reset();
        }
        trickIndex = next;
      }
      paint();
    },
    nudge(dir) {
      if (screen === "hoodie") {
        const row = hoodieRows()[hoodieIndex];
        if (row === patternBtn) cyclePattern(dir > 0 ? 1 : -1);
        else if (row === colorABtn) pickerA.color.hue = (pickerA.color.hue + dir * 8 + 360) % 360;
        else if (row === colorBBtn) pickerB.color.hue = (pickerB.color.hue + dir * 8 + 360) % 360;
        return;
      }
      if (screen === "daynight") {
        if (clockIndex === 0) setSkyCycle(!getSkyClock().cycle);
        else if (clockIndex === 1) setSkyMinutes(getSkyClock().minutes + dir * 15);
        else if (clockIndex === 2) setSkyAzimuth(getSkyClock().azimuth + dir * 8);
        paint();
        return;
      }
      if (screen !== "audio" || audioIndex !== 0) return;
      const cur = getTune().volume;
      const span = VOLUME.max - VOLUME.min;
      setTune("volume", cur + dir * span * 0.08);
      hooks.onVolume(AUDIO_MASTER);
      paint();
    },
    confirm() {
      if (screen === "root") hooks.onPick(ITEMS[index].id);
      else if (screen === "options") pickOption(OPTION_ITEMS[optionIndex].id);
      else if (screen === "hoodie") {
        const row = hoodieRows()[hoodieIndex];
        if (row === hoodieBack) go("options");
        else if (row === patternBtn) cyclePattern(1);
      } else if (screen === "daynight") {
        if (clockIndex === 0) {
          setSkyCycle(!getSkyClock().cycle);
          paint();
        } else if (clockIndex === 3) go("options");
      } else if (screen === "audio") {
        if (audioIndex === 1) go("options");
        else {
          setTune("volume", 1);
          hooks.onVolume(AUDIO_MASTER);
          paint();
        }
      } else if (screen === "howto") {
        if (howtoIndex === 0) go("tricks");
        else go("root");
      } else if (trickIndex === TRICKS.length) go("howto");
    },
    tick(dt, ly = 0, lx = 0) {
      if (!open) return;
      if (screen === "audio" && audioIndex === 0 && lx) {
        const span = VOLUME.max - VOLUME.min;
        setTune("volume", getTune().volume + lx * span * 0.45 * dt);
        hooks.onVolume(AUDIO_MASTER);
        paint();
      }
      if (screen === "howto" || screen === "tricks") {
        const pane = screen === "howto" ? howtoBody : trickList;
        pane.scrollTop += ly * MENU_SCROLL * dt;
      }
      if (screen !== "tricks") return;
      if (trickIndex >= TRICKS.length) {
        demo.set({ lx: 0, ly: 0, rx: 0, ry: 0 }, true, true);
        return;
      }
      demoT += dt;
      demo.set(sampleTrick(TRICKS[trickIndex].keys, demoT), true, true);
    },
    openHoodie() {
      go("hoodie");
    },
    openHowto() {
      go("howto");
    },
    openOptions() {
      go("options");
    },
  };
}
