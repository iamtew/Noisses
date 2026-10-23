const COPY = {
  missing: {
    title: "CONTROLLER REQUIRED",
    body:
      "Connect a gamepad with two analog sticks.\nThis is a dual-stick foot-control skate simulator.\nKeyboard is not supported for skating.",
  },
  press: {
    title: "PRESS ANY BUTTON TO START",
    body: "□  left foot push     ×  right foot push\nL2/R2  turn     D-pad up/down  spawn\nRail right, ledge left — skate along, then ollie\nKickflip  ollie + hard front-stick right\n○  stance     △  sticks",
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
