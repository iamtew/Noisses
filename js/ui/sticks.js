export const STICK_LEFT = "#00FFFF";
export const STICK_RIGHT = "#FF00FF";

const REACH = 28;
const TRAIL_MS = 150;
const TRAIL_MAX = 10;
const SIZE = 72;

function bindPad(el, color) {
  let canvas = el.querySelector("canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    el.insertBefore(canvas, el.firstChild);
  }
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  const hub = el.querySelector("[data-hub]");
  const thumb = el.querySelector("[data-dot]");
  hub.style.background = color;
  thumb.style.background = color;
  const trail = [];

  function reset() {
    trail.length = 0;
    ctx.clearRect(0, 0, SIZE, SIZE);
  }

  function set(x, y) {
    const now = performance.now();
    trail.push({ x, y, t: now });
    while (trail.length && now - trail[0].t > TRAIL_MS) trail.shift();
    while (trail.length > TRAIL_MAX) trail.shift();

    ctx.clearRect(0, 0, SIZE, SIZE);
    if (trail.length > 1) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = color;
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1];
        const b = trail[i];
        const age = (now - b.t) / TRAIL_MS;
        ctx.globalAlpha = Math.max(0.12, 1 - age);
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(SIZE / 2 + a.x * REACH, SIZE / 2 + a.y * REACH);
        ctx.lineTo(SIZE / 2 + b.x * REACH, SIZE / 2 + b.y * REACH);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    thumb.style.transform = `translate(${x * REACH}px, ${y * REACH}px)`;
  }

  return { set, reset };
}

/** Two pads: left stick cyan, right stick magenta. Trails die in ~150ms. */
export function bindSticks(root) {
  const pads = root.querySelectorAll(".pad");
  const left = bindPad(pads[0], STICK_LEFT);
  const right = bindPad(pads[1], STICK_RIGHT);
  const leftLabel = pads[0].querySelector("[data-label]");
  const rightLabel = pads[1].querySelector("[data-label]");

  function reset() {
    left.reset();
    right.reset();
  }

  function set(input, regular, visible) {
    root.hidden = !visible;
    if (!visible) {
      reset();
      return;
    }
    leftLabel.textContent = regular ? "L front" : "L back";
    rightLabel.textContent = regular ? "R back" : "R front";
    left.set(input.lx || 0, input.ly || 0);
    right.set(input.rx || 0, input.ry || 0);
  }

  return { set, reset };
}
