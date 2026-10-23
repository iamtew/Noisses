# Noisses

Original dual-stick foot-control skate simulator in the browser. Clean-room implementation from `bootstrap.md`. Not affiliated with any commercial skate game.

Phase 0: spinning cube, orbit camera, mandatory gamepad gate.

## Run locally

Gamepad API needs a secure context (localhost or HTTPS).

```
npx serve .
```

Open the printed URL. Without a two-stick gamepad you get a blocking overlay. Connect a pad, press any button to start. Orbit-drag the cube.

## Deploy (GitHub Pages)

Put this tree at the repo root (or `/docs`). Settings → Pages → deploy from that branch/folder. `index.html` must be the site entry.

## Controls (v1 direction)

Skating is gamepad-only. Keyboard is not supported for skating. Dual analog sticks are the feet. See `bootstrap.md`.
