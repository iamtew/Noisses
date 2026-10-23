# Noisses

Original dual-stick foot-control skate simulator in the browser. Clean-room implementation from `bootstrap.md`. Not affiliated with any commercial skate game.

Phase 1: board on a flat pad, gravity, push, steer, follow camera. Gamepad required.

## Run locally

Meat Bag hosts **http://localhost:8000**. Gamepad API needs a secure context (localhost or HTTPS).

Without a two-stick gamepad you get a blocking overlay. Connect a pad, press any button to start.

## Controls

PlayStation face buttons (standard gamepad mapping).

- **× Cross** — push (once per press, while on the ground)
- **Left + right stick X** — steer
- **□ ○ △** — unused for now
- Keyboard is not skating

## Deploy (GitHub Pages)

Put this tree at the repo root (or `/docs`). Settings → Pages → deploy from that branch/folder. `index.html` must be the site entry.
