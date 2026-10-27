import iro from "@jaames/iro";
import {
  HOODIE_PATTERNS,
  loadHoodie,
  offsetHoodie,
  saveHoodie,
} from "../scene/skaterModel.js";
import { HOWTO_BODY, TRICKS, sampleTrick } from "./howto.js";
import { bindSticks } from "./sticks.js";

const COPY = {
  missing: {
    title: "CONTROLLER REQUIRED",
    body:
      "Connect a gamepad with two analog sticks.\nThis is a dual-stick foot-control skate simulator.\nKeyboard is not supported for skating.",
  },
  press: {
    title: "PRESS ANY BUTTON TO START",
    body: "□  left foot     ×  right foot     L2/R2  turn\nHold ↓  set spawn     hold ↑  respawn     R1  low cam\nOptions  pause     hold Options  advanced\nEmbarcadero Plaza — face the bay\nFountain on your left · Ferry Building ahead, tower to the right\nLedge and kicker on your right · box and rails further out\n○ stance on the board\n△ off / on the board     L3+R3 sticks\nOff the board: left stick walks, right stick looks, × jumps, ×× runs",
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
  { id: "resume", label: "Resume" },
  { id: "restart", label: "Restart" },
  { id: "hoodie", label: "Hoodie" },
  { id: "howto", label: "How to play" },
  { id: "advanced", label: "Advanced settings" },
  { id: "exit", label: "Exit" },
];

const TITLES = {
  root: "NOISSES",
  hoodie: "HOODIE",
  howto: "HOW TO PLAY",
  tricks: "TRICK LIST",
};

const HINTS = {
  root: "↑↓ select · × confirm · ○ or Options closes · hold Options for advanced",
  hoodie: "↑↓ select · ←→ pattern or hue · ○ back",
  howto: "↑↓ select · × open · ○ back",
  tricks: "↑↓ pick a trick · ○ back · paths are Regular (Goofy swaps the sticks)",
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
    hoodie: root.querySelector("[data-screen='hoodie']"),
    howto: root.querySelector("[data-screen='howto']"),
    tricks: root.querySelector("[data-screen='tricks']"),
  };
  const list = root.querySelector("[data-pause-list]");
  const patternBtn = root.querySelector("[data-hoodie-pattern]");
  const colorABtn = root.querySelector("[data-hoodie-a]");
  const colorBBtn = root.querySelector("[data-hoodie-b]");
  const hoodieBack = root.querySelector("[data-hoodie-back]");
  const colorBBox = root.querySelector("[data-color-b]");
  const howtoBody = root.querySelector("[data-howto-body]");
  const howtoList = root.querySelector("[data-howto-list]");
  const trickList = root.querySelector("[data-trick-list]");
  const trickBlurb = root.querySelector("[data-trick-blurb]");
  const demo = bindSticks(root.querySelector("[data-trick-sticks]"));

  howtoBody.textContent = HOWTO_BODY;

  let screen = "root";
  let open = false;
  let index = 0;
  let hoodieIndex = 0;
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
    btn.textContent = item.label;
    btn.addEventListener("pointerdown", () => {
      index = i;
      paint();
      hooks.onPick(item.id);
    });
    list.appendChild(btn);
    return btn;
  });

  const hoodieBtns = [patternBtn, colorABtn, colorBBtn, hoodieBack];
  hoodieBtns.forEach((btn, i) => {
    btn.addEventListener("pointerdown", () => {
      hoodieIndex = i;
      if (look.pattern === "solid" && i === 2) hoodieIndex = 1;
      paint();
      if (i === 0) cyclePattern(1);
      if (i === 3) go("root");
    });
  });

  const howtoBtns = [];
  for (const item of [
    { id: "tricks", label: "Trick list" },
    { id: "back", label: "Back" },
  ]) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "row reset";
    btn.textContent = item.label;
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
  trickBack.textContent = "Back";
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

    patternBtn.querySelector("[data-val]").textContent = patternLabel(look.pattern);
    const rows = hoodieRows();
    if (hoodieIndex >= rows.length) hoodieIndex = rows.length - 1;
    hoodieBtns.forEach((btn) => btn.classList.toggle("on", false));
    colorBBtn.hidden = look.pattern === "solid";
    colorBBox.hidden = look.pattern === "solid";
    rows.forEach((btn, i) => btn.classList.toggle("on", open && screen === "hoodie" && i === hoodieIndex));

    howtoBtns.forEach((btn, i) =>
      btn.classList.toggle("on", open && screen === "howto" && i === howtoIndex),
    );

    const trickN = TRICKS.length + 1;
    if (trickIndex >= trickN) trickIndex = trickN - 1;
    trickBtns.forEach((btn, i) =>
      btn.classList.toggle("on", open && screen === "tricks" && i === trickIndex),
    );
    trickBack.classList.toggle("on", open && screen === "tricks" && trickIndex === TRICKS.length);
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
      if (screen === "hoodie" || screen === "howto") {
        go("root");
        return true;
      }
      return false;
    },
    move(dir) {
      if (screen === "root") {
        index = (index + dir + ITEMS.length) % ITEMS.length;
      } else if (screen === "hoodie") {
        const n = hoodieRows().length;
        hoodieIndex = (hoodieIndex + dir + n) % n;
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
      if (screen !== "hoodie") return;
      const row = hoodieRows()[hoodieIndex];
      if (row === patternBtn) cyclePattern(dir > 0 ? 1 : -1);
      else if (row === colorABtn) pickerA.color.hue = (pickerA.color.hue + dir * 8 + 360) % 360;
      else if (row === colorBBtn) pickerB.color.hue = (pickerB.color.hue + dir * 8 + 360) % 360;
    },
    confirm() {
      if (screen === "root") hooks.onPick(ITEMS[index].id);
      else if (screen === "hoodie") {
        const row = hoodieRows()[hoodieIndex];
        if (row === hoodieBack) go("root");
        else if (row === patternBtn) cyclePattern(1);
      } else if (screen === "howto") {
        if (howtoIndex === 0) go("tricks");
        else go("root");
      } else if (trickIndex === TRICKS.length) go("howto");
    },
    tick(dt) {
      if (!open || screen !== "tricks") return;
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
  };
}
