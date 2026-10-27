import {
  ADVANCED_TUNABLES,
  AUDIO_MASTER,
  MENU_SCROLL,
  formatTune,
  getTune,
  resetTune,
  setTune,
} from "../constants.js";
import { iconHtml } from "./icons.js";

const SPECS = ADVANCED_TUNABLES;
const RESET_IDS = SPECS.map((t) => t.id);

/** Advanced sliders. D-pad or the left stick. Stick Y scrolls, like how-to. */
export function bindSettings(root, onChange) {
  const list = root.querySelector("[data-settings-list]");
  let index = 0;
  let open = false;

  const buttons = SPECS.map((spec) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "row";
    btn.innerHTML = `<span class="name"></span><span class="track"><span class="fill"></span></span><span class="val"></span><span class="tune-reset">${iconHtml("restore")}</span>`;
    btn.querySelector(".name").textContent = spec.label;
    const drag = (e) => {
      index = SPECS.indexOf(spec);
      setFromPointer(spec, btn, e);
      paint();
    };
    btn.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".tune-reset")) {
        index = SPECS.indexOf(spec);
        setTune(spec.id, 1);
        onChange(AUDIO_MASTER);
        paint();
        return;
      }
      btn.setPointerCapture(e.pointerId);
      drag(e);
    });
    btn.addEventListener("pointermove", (e) => {
      if (!btn.hasPointerCapture(e.pointerId)) return;
      drag(e);
    });
    list.appendChild(btn);
    return btn;
  });

  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.className = "row reset";
  resetBtn.innerHTML = `${iconHtml("restore")}<span>Reset</span>`;
  resetBtn.addEventListener("pointerdown", () => {
    index = SPECS.length;
    resetTune(RESET_IDS);
    onChange(AUDIO_MASTER);
    paint();
  });
  list.appendChild(resetBtn);

  function setFromPointer(spec, btn, e) {
    const track = btn.querySelector(".track");
    const box = track.getBoundingClientRect();
    const t = box.width > 0 ? (e.clientX - box.left) / box.width : 0;
    setTune(spec.id, spec.min + Math.min(1, Math.max(0, t)) * (spec.max - spec.min));
    onChange(AUDIO_MASTER);
  }

  function focusedRow() {
    return index >= SPECS.length ? resetBtn : buttons[index];
  }

  function paint() {
    const values = getTune();
    buttons.forEach((btn, i) => {
      const spec = SPECS[i];
      const u = (values[spec.id] - spec.min) / (spec.max - spec.min);
      btn.classList.toggle("on", open && i === index);
      btn.querySelector(".fill").style.width = `${Math.round(u * 100)}%`;
      btn.querySelector(".val").textContent = formatTune(spec, values[spec.id]);
    });
    resetBtn.classList.toggle("on", open && index === SPECS.length);
    if (open) focusedRow().scrollIntoView({ block: "nearest" });
  }

  function show() {
    open = true;
    root.hidden = false;
    paint();
  }

  function hide() {
    open = false;
    root.hidden = true;
  }

  paint();

  return {
    isOpen: () => open,
    show,
    hide,
    move(dir) {
      const n = SPECS.length + 1;
      index = (index + dir + n) % n;
      paint();
    },
    nudge(dir, dt) {
      if (index >= SPECS.length) return;
      const spec = SPECS[index];
      const cur = getTune()[spec.id];
      const span = spec.max - spec.min;
      setTune(spec.id, cur + dir * span * 0.45 * dt);
      onChange(AUDIO_MASTER);
      paint();
    },
    tick(dt, ly = 0) {
      if (!open) return;
      list.scrollTop += ly * MENU_SCROLL * dt;
    },
    confirm() {
      if (index >= SPECS.length) {
        resetTune(RESET_IDS);
        onChange(AUDIO_MASTER);
        paint();
        return;
      }
      setTune(SPECS[index].id, 1);
      onChange(AUDIO_MASTER);
      paint();
    },
  };
}
