import {
  AUDIO_MASTER,
  TUNABLES,
  getTune,
  resetTune,
  setTune,
} from "../constants.js";

/** Options menu. D-pad or the left stick. Values are percent of the stock feel. */
export function bindSettings(root, onChange) {
  const list = root.querySelector("[data-settings-list]");
  let index = 0;
  let open = false;

  const buttons = TUNABLES.map((spec) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "row";
    btn.innerHTML = `<span class="name"></span><span class="track"><span class="fill"></span></span><span class="val"></span>`;
    btn.querySelector(".name").textContent = spec.label;
    const drag = (e) => {
      index = TUNABLES.indexOf(spec);
      setFromPointer(spec, btn, e);
      paint();
    };
    btn.addEventListener("pointerdown", (e) => {
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
  resetBtn.textContent = "Reset";
  resetBtn.addEventListener("pointerdown", () => {
    index = TUNABLES.length;
    resetTune();
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

  function paint() {
    const values = getTune();
    buttons.forEach((btn, i) => {
      const spec = TUNABLES[i];
      const u = (values[spec.id] - spec.min) / (spec.max - spec.min);
      btn.classList.toggle("on", open && i === index);
      btn.querySelector(".fill").style.width = `${Math.round(u * 100)}%`;
      btn.querySelector(".val").textContent = `${Math.round(values[spec.id] * 100)}%`;
    });
    resetBtn.classList.toggle("on", open && index === TUNABLES.length);
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
      const n = TUNABLES.length + 1;
      index = (index + dir + n) % n;
      paint();
    },
    nudge(dir, dt) {
      if (index >= TUNABLES.length) return;
      const spec = TUNABLES[index];
      const cur = getTune()[spec.id];
      const span = spec.max - spec.min;
      setTune(spec.id, cur + dir * span * 0.45 * dt);
      onChange(AUDIO_MASTER);
      paint();
    },
    confirm() {
      if (index !== TUNABLES.length) return;
      resetTune();
      onChange(AUDIO_MASTER);
      paint();
    },
  };
}
