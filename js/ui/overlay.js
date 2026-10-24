import iro from "@jaames/iro";
import { loadHoodie, saveHoodie } from "../scene/skaterModel.js";

const COPY = {
  missing: {
    title: "CONTROLLER REQUIRED",
    body:
      "Connect a gamepad with two analog sticks.\nThis is a dual-stick foot-control skate simulator.\nKeyboard is not supported for skating.",
  },
  press: {
    title: "PRESS ANY BUTTON TO START",
    body: "□  left foot     ×  right foot     L2/R2  turn\nHold ↓  set spawn     hold ↑  respawn     R1  low cam\nOptions  pause     hold Options  advanced\nEmbarcadero Plaza — face the bay\nFountain on your left · Ferry Building ahead, tower to the right\nLedge and kicker on your right · box and rails further out\n○ stance     △ sticks",
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
  { id: "advanced", label: "Advanced settings" },
  { id: "exit", label: "Exit" },
];

/** Pause: resume / restart / hoodie / advanced / exit. */
export function bindPause(root, hooks) {
  const list = root.querySelector("[data-pause-list]");
  const hoodieBox = root.querySelector("[data-hoodie]");
  const iroEl = root.querySelector("[data-iro]");
  let index = 0;
  let open = false;

  const picker = new iro.ColorPicker(iroEl, {
    width: 168,
    color: loadHoodie(),
    layout: [
      { component: iro.ui.Wheel },
      { component: iro.ui.Slider, options: { sliderType: "value" } },
    ],
  });
  picker.on("color:change", (color) => {
    const hex = color.hexString;
    saveHoodie(hex);
    hooks.onHoodie(hex);
  });

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

  function paint() {
    buttons.forEach((btn, i) => btn.classList.toggle("on", open && i === index));
    hoodieBox.hidden = !(open && ITEMS[index].id === "hoodie");
  }

  function show() {
    open = true;
    root.hidden = false;
    paint();
  }

  function hide() {
    open = false;
    root.hidden = true;
    paint();
  }

  return {
    isOpen: () => open,
    show,
    hide,
    move(dir) {
      index = (index + dir + ITEMS.length) % ITEMS.length;
      paint();
    },
    nudgeHue(dir) {
      if (ITEMS[index].id !== "hoodie") return;
      picker.color.hue = (picker.color.hue + dir * 8 + 360) % 360;
    },
    confirm() {
      hooks.onPick(ITEMS[index].id);
    },
  };
}
