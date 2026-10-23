# Clean-Room Browser Implementation Spec
## Session-Style Skateboarding Simulator (Three.js + Web Audio + Mandatory Gamepad)

**Document version:** 1.0  
**Target:** Static website (GitHub Pages compatible)  
**Stack:** Three.js (WebGL), Web Audio API, Gamepad API, vanilla JS (or lightweight modules via import maps / esm.sh)  
**License note for implementers:** This is a clean-room design document. Do not reverse-engineer, decompile, or copy assets, code, models, sounds, or exact parameter values from the commercial game *Session: Skate Sim*. Implement from first principles using the high-level behavioral description below. Create all art, audio, and code originally.

---

## 1. Project Goal

Build a browser-based, physics-driven skateboarding simulator that captures the core *feel* of a hardcore dual-stick foot-control skate sim:

- Each analog stick represents one foot on the board.
- Weight transfer, pop, scoop, and foot placement drive tricks.
- Realistic (but tunable) physics with no “auto-snap” assist on rails/ledges.
- Mandatory gamepad. Keyboard/mouse is not a substitute for skating.
- Pure static site: HTML + JS + CSS + assets. No server, no build step required beyond optional bundling. Hostable on GitHub Pages.

Name the project something original (e.g. “Footboard”, “DualStick Skate”, “Concrete Session”, “Board & Feet”). Do **not** use “Session”, “Session: Skate Sim”, or any official branding, logos, or character likenesses.

---

## 2. Hard Requirements

### 2.1 Controller is Mandatory
- The game **must** require a connected gamepad (Gamepad API).
- On load and every frame while in “play” state:
  - Poll `navigator.getGamepads()`.
  - If no gamepad with at least two analog sticks is present → show a full-screen blocking overlay.
- Overlay text (example):
  > **CONTROLLER REQUIRED**  
  > Connect a gamepad with two analog sticks.  
  > This is a dual-stick foot-control skate simulator.  
  > Keyboard is not supported for skating.
- Overlay must be dismissible only after a valid gamepad is detected.
- Support standard mapping (Xbox, DualSense, Switch Pro, etc.). Provide a simple “stick deadzone & invert” settings screen.
- Detect disconnect mid-session → pause physics, show overlay again, resume only when reconnected.

### 2.2 Technology Constraints
- Three.js (r160+ recommended) for rendering and basic scene.
- Web Audio API for all sound (no external audio libraries required).
- Pure client-side. All assets in `/assets/` or inline.
- No Node server, no WebSockets, no backend.
- Works offline once cached (service worker optional but nice).
- Target 60 fps on mid-range hardware; graceful degradation on low-end.

### 2.3 Clean-Room Rules
- Original geometry, textures, animations, sound design.
- Physics parameters invented by the implementer (document them in a `PHYSICS.md` or in-code constants).
- Trick detection logic designed from the behavioral description, not from recorded game data.

---

## 3. Core Gameplay Loop

1. Player spawns on a flat concrete pad or simple skate plaza.
2. Push to gain speed (button or stick motion).
3. Use dual sticks to shift weight, crouch, pop, scoop, and land.
4. Approach obstacles (rails, ledges, stairs, banks, quarters) and attempt tricks / grinds / manuals.
5. Bail on bad landings; recover and try again.
6. Free-skate only (no score, no timer, no missions in v1). Optional later: simple “spot challenges”.

Primary emotion target: “I just landed a clean kickflip after 20 tries and it felt *earned*.”

---

## 4. Control Scheme (Dual-Stick Foot Model)

### 4.1 Stance
- **Regular** (default): chest faces screen-right. Right stick = back foot, Left stick = front foot.
- **Goofy**: reverse stick mapping.
- Toggle in pause menu. Changing stance mid-air or while grinding is forbidden (or causes bail).

### 4.2 Stick Semantics
Each stick has two axes:
- **Y axis (forward/back relative to board)**: weight along the length of the board (nose ↔ tail).
- **X axis (left/right)**: lateral foot position / scoop direction for flips.

**Weight transfer**
- Pushing a stick toward the nose or tail moves that foot’s pressure.
- Both feet near center = balanced.
- One foot heavily toward tail + other toward nose = coiled for pop / manual potential.

**Ollie / Nollie (basic pop)**
- Regular stance Ollie (example):
  1. Hold back-foot stick (right) downward (weight on tail).
  2. Quickly flick front-foot stick (left) upward (scoop / pop).
- Nollie: reverse the roles.
- Holding both sticks upward after the flick can “bone” the ollie for extra height (tunable).

**Flip tricks (high-level)**
- After or during the pop motion, move the front foot stick left or right to initiate kickflip / heelflip rotation.
- Combine with shuvit motion on the back foot stick (quarter-circle or hold) for varials, 360 flips, etc.
- Exact stick paths and timing windows are left to the implementer; document the chosen windows.

**Rotation in air**
- Left / Right triggers (or bumper) lean / pivot the body.
- Double-tap or hold for 180 / 360 / more.
- Air control should feel limited and physical (no arcade “full air steer”).

**Manuals**
- After landing or while rolling: partial tilt of one stick toward nose or tail while keeping the other centered → nose manual / tail manual.
- Balance meter (internal) decays; player must micro-correct with sticks.

**Grinds / Slides**
- No magnetic snap. Player must:
  1. Approach at reasonable angle and speed.
  2. Pop with correct height and rotation.
  3. Land trucks (or board) onto the rail/ledge with proper foot weight.
- Detect contact between truck collision volumes and grindable surfaces.
- Once locked, player can shift weight to change grind type (50-50, 5-0, nosegrind, boardslide, lipslide, etc.).
- Exit by popping off or sliding to the end.

**Pushing / Braking**
- Face button (A / Cross) = push with back foot (or configurable).
- Opposite button or stick motion = powerslide / brake (both feet toward nose+tail extremes).

**Camera**
- Soft follow camera behind / slightly above the skater.
- Optional free-look with right stick when not skating (or second mode).
- VX / low-angle “skate video” camera preset (very low, close to board).

---

## 5. Physics Model (High-Level Spec)

Implement a simplified rigid-body + constraint system. Suggested approach:

- Board = single rigid body with mass, inertia tensor, four wheel contact points (or simplified raycasts).
- Skater = ragdoll or simplified articulated body attached via “foot constraints” that can break on hard impacts.
- Gravity, friction, restitution tunable.
- Wheel friction higher when not sliding; lower when powersliding.
- Pop force applied as impulse at the tail/nose based on stick velocity at the moment of flick.
- Flip rotation applied as torque on the board based on scoop direction and speed.
- Air control limited: small torque from body lean.
- Landing: if board is too tilted or relative velocity too high → break foot constraints → ragdoll bail.
- Grind: once trucks contact a grind surface within angle/speed thresholds, apply a temporary constraint that keeps the board sliding along the surface while allowing rotation around the grind axis. Player can still shift weight to change which trucks are locked.

Document every constant (masses, friction coefficients, pop impulse magnitude, flip torque, grind lock thresholds, bail thresholds) in a clearly commented `constants.js` or equivalent.

No “auto-correct” alignment to rails. Slight off-center contact should produce unstable or failed grinds (or interesting new ones).

---

## 6. World & Content (v1 Scope)

### 6.1 Environment
- One small, hand-authored skate plaza or street spot:
  - Flat ground
  - A few ledges of different heights
  - One or two rails (straight + maybe a kink)
  - Stairs (3–5 sets)
  - A small bank or quarter pipe
  - Optional: a manual pad
- Use simple low-poly or mid-poly geometry. Concrete, metal, brick materials.
- Skybox or simple gradient + directional light + ambient.
- Collision meshes separate from visual meshes where helpful.

### 6.2 Skater & Board
- Simple humanoid skater (can be very low-poly or even a capsule + limbs for prototype).
- Board with visible trucks and wheels that rotate.
- Basic procedural or keyframed idle / push / crouch / bail animations.
- Stance visual: skater faces correct direction.

### 6.3 Audio (Web Audio)
- Rolling loop (pitch/volume scaled by speed)
- Push scrape
- Pop / ollie “snap”
- Flip “whoosh” or board spin
- Grind metal-on-metal loop (modulated by speed)
- Landing thud / wood impact
- Bail body impacts (multiple variants)
- Ambient city or skatepark bed (very low)
- UI clicks

All sounds generated or recorded originally. Use AudioContext, BufferSource, Gain, Filter, Convolver (optional short reverb).

---

## 7. UI / UX

### 7.1 Boot & Controller Gate
- Loading screen → Controller check overlay (mandatory).
- Once connected: “Press any button to start”.

### 7.2 In-Game HUD (minimal)
- Optional subtle speed indicator
- Stance indicator (Regular / Goofy)
- Small “stick visualization” debug overlay (toggleable) showing current foot positions – extremely useful for learning.
- Pause menu: resume, stance toggle, camera mode, sensitivity, deadzones, physics presets (Easy / Realistic / Custom), restart spot, quit.

### 7.3 Tutorial (strongly recommended)
- Short interactive tutorial that teaches:
  1. Pushing
  2. Turning / leaning
  3. Basic ollie
  4. Kickflip
  5. Manual
  6. 50-50 grind
- Can be a separate “Tutorial Plaza” or overlay prompts in the main spot.

### 7.4 Settings Persistence
- localStorage for sensitivity, deadzone, stance preference, camera style, audio volumes.

---

## 8. Technical Architecture (Suggested)

```
/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js              # entry, game loop
│   ├── input/gamepad.js     # Gamepad polling, mapping, disconnect handling
│   ├── physics/board.js     # board rigid body + wheels
│   ├── physics/skater.js    # foot constraints, ragdoll
│   ├── physics/world.js     # gravity, contacts, grind detection
│   ├── tricks/detector.js   # stick gesture → trick state machine
│   ├── audio/engine.js      # Web Audio wrapper
│   ├── scene/setup.js       # Three.js scene, lights, camera
│   ├── scene/skaterModel.js
│   ├── scene/boardModel.js
│   ├── scene/environment.js
│   ├── ui/overlay.js        # controller required, pause, HUD
│   └── constants.js
├── assets/
│   ├── models/              # glTF
│   ├── textures/
│   └── audio/               # .wav or .ogg
└── README.md
```

- Use ES modules.
- Three.js via CDN or import map (esm.sh / jsDelivr) so the site stays static.
- RequestAnimationFrame game loop.
- Fixed timestep physics (e.g. 1/120 s) with interpolation for rendering.
- Simple spatial hash or Three.js raycasting for ground/rail queries in v1; upgrade later if needed.

---

## 9. Implementation Phases (for the agent)

**Phase 0 – Skeleton**
- Static HTML page + Three.js spinning cube.
- Gamepad detection + mandatory overlay.
- Basic orbit camera.

**Phase 1 – Board on Ground**
- Board model + four raycasts or simple wheel colliders.
- Gravity, friction, push force from button.
- Camera follow.

**Phase 2 – Dual-Stick Weight**
- Visual foot markers or stick debug.
- Weight transfer affects board pitch (manual lean).
- Basic ollie impulse from stick flick.

**Phase 3 – Air & Landing**
- Board leaves ground, simple air control, landing detection, bail on bad angle.

**Phase 4 – Flip Tricks**
- Stick gesture recognition → apply torque → detect successful catch / land.

**Phase 5 – Grinds**
- Grindable mesh tags.
- Contact test → temporary constraint → weight-based grind type.

**Phase 6 – Audio + Polish**
- Web Audio integration, particle dust on push/land, simple ragdoll, UI polish, tutorial.

**Phase 7 – Content**
- Expand plaza, add more rails/ledges, camera presets, physics presets.

---

## 10. Acceptance Criteria (v1)

- [ ] Page loads on GitHub Pages with no console errors.
- [ ] If no gamepad → blocking overlay with clear message; cannot skate.
- [ ] Gamepad connect/disconnect handled cleanly.
- [ ] Dual-stick foot control works for Regular and Goofy.
- [ ] Player can push, turn, ollie, kickflip, manual, and 50-50 grind on at least one rail.
- [ ] Physics feels weighty; no arcade auto-correct on rails.
- [ ] Bails occur on bad landings.
- [ ] All audio via Web Audio API.
- [ ] 60 fps on a typical laptop with integrated GPU.
- [ ] No external paid assets or copyrighted material.
- [ ] README explains controls, how to run locally, and how to deploy to GitHub Pages.

---

## 11. Non-Goals (v1)

- Multiplayer
- Career / mission system
- Character customization beyond stance
- Vert / transition deep physics (simple banks ok)
- Mobile touch controls
- Exact replication of any commercial game’s numbers or animations

---

## 12. Deployment Notes (GitHub Pages)

1. Create a public repository.
2. Put `index.html` at the root (or in `/docs` and set Pages source to `/docs`).
3. Enable GitHub Pages in repo Settings → Pages → Deploy from branch.
4. Optional: add a simple `404.html` and service worker for offline.
5. Test with `npx serve .` or Live Server locally first.

---

## 13. Agent Instructions (feed this whole document)

You are implementing a clean-room dual-stick skate simulator for the browser.

Follow this specification exactly. Prioritize the mandatory controller gate, dual-stick foot model, and physics-based (non-magnetic) grinds.

Start with Phase 0 and proceed sequentially. After each phase, ensure the game still runs and the controller requirement is enforced.

Create original assets. When in doubt about a physics constant, choose a value that feels “heavy and realistic” and document it.

Do not reference or load any files from the commercial Session game.

At the end, produce a clean repository ready for GitHub Pages with a clear README.

---

**End of Specification**
