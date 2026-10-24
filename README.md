# Noisses

Original dual-stick foot-control skate simulator in the browser. Clean-room implementation from `bootstrap.md`. Not affiliated with any commercial skate game.

Phase 6–7: plaza pad with rail, ledge, stairs, bank, and a rider on the deck. Synthesized Web Audio. Gamepad required.

## Run locally

Meat Bag hosts **http://localhost:8000**. Gamepad API needs a secure context (localhost or HTTPS).

Without a two-stick gamepad you get a blocking overlay. Connect a pad, press any button to start.

## Controls

PlayStation face buttons. Regular stance (default): left stick = front foot, right stick = back foot.

- **□ Square** — push with the **left** foot (once per press, on the ground)
- **× Cross** — push with the **right** foot (once per press, on the ground)
- **Stick Y** — weight nose ↔ tail (down = tail). Board pitches with the weight.
- **Stick X** — foot sideways. In the air, **front stick L/R** scoops a flip.
- **Ollie** — hold **R** down (tail), flick **L** up
- **Nollie** — hold **L** down, flick **R** up
- **Kickflip** — ollie, scoop **front stick right** (regular). Return sticks to center to catch.
- **Heelflip** — ollie, scoop **front stick left**. Catch the same way.
- **Shuvit** — ollie, scoop **back stick** left or right.
- **Manual** — while rolling, hold one foot down and keep the other near center. Back foot is a tail manual, front foot a nose manual. The heavy foot balances it. Let go to drop out. Fall over and you bail.
- **○ Circle** — toggle Regular / Goofy (on the ground)
- **△ Triangle** — stick debug overlay
- **R1** — low camera / follow camera
- **Hold Options** — settings (pop, flip, shuv, grind friction, push, steer, turn, volume). D-pad or left stick adjusts. ○ or Options closes. Saved in the browser.
- **L2** — turn left (ground and air)
- **R2** — turn right (ground and air)
- **Hold D-pad down** — set spawn at your feet (tap does nothing). A mark paints on the ground.
- **Hold D-pad up** — respawn at that mark (tap does nothing)
- **Grind** — rail is on the **right**, ledge on the **left**, both run forward. Push, stay along them, ollie so trucks hit. No magnet. Weight changes 50-50 / 5-0 / nosegrind / boardslide. Pop or ride off the end to exit.
- Land too tilted or too hard → **BAILED** (speed dies, board flattens)
- Keyboard is not skating
- Sound starts when you press a button (rolling, push, pop, grind, land, bail). Noise is pink, then a resonant filter, with a high shelf on the master.

## Deploy (GitHub Pages)

Put this tree at the repo root (or `/docs`). Settings → Pages → deploy from that branch/folder. `index.html` must be the site entry.
