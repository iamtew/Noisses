# Noisses

Original dual-stick foot-control skate simulator in the browser. Clean-room implementation from `bootstrap.md`. Not affiliated with any commercial skate game.

Phase 3: dual-stick feet, ollie, air, landing, bail. Gamepad required.

## Run locally

Meat Bag hosts **http://localhost:8000**. Gamepad API needs a secure context (localhost or HTTPS).

Without a two-stick gamepad you get a blocking overlay. Connect a pad, press any button to start.

## Controls

PlayStation face buttons. Regular stance (default): left stick = front foot, right stick = back foot.

- **□ Square** — push with the **left** foot (once per press, on the ground)
- **× Cross** — push with the **right** foot (once per press, on the ground)
- **Stick Y** — weight nose ↔ tail (down = tail). Board pitches with the weight.
- **Stick X** — foot sideways (and a little steer)
- **Ollie** — hold **R** down (tail), flick **L** up
- **Nollie** — hold **L** down, flick **R** up
- **○ Circle** — toggle Regular / Goofy (on the ground)
- **△ Triangle** — stick debug overlay
- **L2** — turn left (ground and air)
- **R2** — turn right (ground and air)
- Land too tilted or too hard → **BAILED** (speed dies, board flattens)
- Keyboard is not skating

## Deploy (GitHub Pages)

Put this tree at the repo root (or `/docs`). Settings → Pages → deploy from that branch/folder. `index.html` must be the site entry.
