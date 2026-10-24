# Noisses

Original dual-stick foot-control skate simulator in the browser. Clean-room implementation from `bootstrap.md`. It is not Session, and it is not affiliated with Session.

Play it at **https://iamtew.github.io/Noisses/**. Bring a gamepad. The keyboard can watch.

Phase 6–7: Embarcadero Plaza in San Francisco, cropped to skate, plus Market, the Embarcadero, the Ferry Building, and Sue Bierman Park. Synthesized Web Audio. Gamepad required.

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
- **Powerslide** — one foot toward the nose and the other toward the tail. Speed scrubs off and the board pivots.
- **○ Circle** — toggle Regular / Goofy (on the ground)
- **△ Triangle** — stick debug overlay
- **R1** — low camera / follow camera
- **Options** — pause (resume, restart, hoodie color, advanced, exit). **Hold Options** — advanced settings (pop, flip, shuv, grind friction, push, steer, turn, volume). D-pad or left stick adjusts. ○ or Options closes. Saved in the browser. Exit reloads the page.
- **L2** — turn left (ground and air)
- **R2** — turn right (ground and air)
- **Hold D-pad down** — set spawn at your feet (tap does nothing). A mark paints on the ground.
- **Hold D-pad up** — respawn at that mark (tap does nothing)
- **Grind** — ledge lips, the two rails, and the south lip of the fountain plinth. No magnet. Weight changes 50-50 / 5-0 / nosegrind / boardslide. Pop or ride off the end to exit.
- **The spot** — one brick plaza. You spawn facing east, toward the bay. The fountain is on your left (north). Sue Bierman Park is past it. Market and Embarcadero Center are behind you. The Ferry Building is across the Embarcadero, clock tower to your right.
- Land too tilted or too hard → **BAILED** (speed dies, board flattens)
- Keyboard is not skating
- Sound starts when you press a button (rolling, push, pop, grind, land, bail). Noise is pink, then a resonant filter, with a high shelf on the master.

## License

Copyright 2026 Mikael. [GNU AGPL 3.0](LICENSE). If you run a changed copy on a server, the people using it get the source too. The site links to the repo for that.

## Deploy (GitHub Pages)

GitHub Pages serves `master` from the repo root. The share card is `og.png`. `index.html` is the site entry.
