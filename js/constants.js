// Invented here. Heavy/realistic bias. Tune in place; do not copy commercial values.

/** Stick magnitude below this is treated as centered. */
export const STICK_DEADZONE = 0.12;

/** Physics tick. Render interpolates; rAF is the frame. */
export const FIXED_DT = 1 / 120;

/** Downward accel (m/s²). Earth-ish; feels heavy on a light board. */
export const GRAVITY = 9.81;

/** Board + skater lump mass (kg). Heavy on purpose. */
export const BOARD_MASS = 75;

/** Impulse along the nose per push. □ left foot, × right foot (N·s). */
export let PUSH_IMPULSE = 180;

/** Horizontal speed cap (m/s). ~25 km/h. */
export const MAX_SPEED = 7;

/** Exponential friction when wheels are on the ground (1/s). */
export const GROUND_FRICTION = 0.55;

/** Feet this far apart on Y (one nose, one tail) counts as a powerslide. */
export const SLIDE_SPLIT = 0.38;

/** Extra slowdown while powersliding (1/s), on top of ground friction. */
export const SLIDE_FRICTION = 3.4;

/** Yaw while the feet are split (rad/s). The board pivots as it scrubs. */
export const SLIDE_YAW = 1.5;

/** Extra damping on vertical slam into the ground. */
export const LANDING_DAMP = 0.15;

/** Target ray length from deck center down to pavement (m). */
export const RIDE_HEIGHT = 0.11;

/** Wheel ray length (m). Long enough to hit from spawn height. */
export const RAY_FAR = 4;

/** Rescue ray from above if wheels miss (m). Recovers a fall-through. */
export const RESCUE_RAY = 8;

/** Local wheel attach points (x right, y up, z nose). */
export const WHEEL_LOCAL = [
  { x: 0.115, y: 0, z: 0.205 },
  { x: -0.115, y: 0, z: 0.205 },
  { x: 0.115, y: 0, z: -0.205 },
  { x: -0.115, y: 0, z: -0.205 },
];

/** Front / back truck centers for grind tests (local). */
export const TRUCK_LOCAL = [
  { x: 0, y: -0.05, z: 0.205 },
  { x: 0, y: -0.05, z: -0.205 },
];

/** Visual wheel radius (m). */
export const WHEEL_RADIUS = 0.03;

/** Yaw from combined stick X while rolling (rad/s per unit stick at 1 m/s). */
export let STEER_RATE = 1.6;

/** Slow pivot so you can turn almost still (rad/s per unit stick). */
export const STEER_PIVOT = 0.9;

/** Follow camera distance behind the board (m). Far enough to see the rider. */
export const CAM_BACK = 2.45;

/** Nudge right so we see deck, not a tail sliver (m). */
export const CAM_SIDE = 0.85;

/** Follow camera height (m). */
export const CAM_HEIGHT = 1.05;

/** Camera look-at height above deck (m). */
export const CAM_LOOK_Y = 0.42;

/** Follow smoothing rate (1/s). Higher = snappier. */
export const CAM_FOLLOW = 7.5;

/** R1 low camera. Close to the deck, skate-video height. */
export const CAM_LOW_BACK = 1.45;
export const CAM_LOW_SIDE = 0.4;
export const CAM_LOW_HEIGHT = 0.34;
export const CAM_LOW_LOOK = 0.16;

/** D-pad down/up must be held this long to set / respawn (s). Taps do nothing. */
export const SPAWN_HOLD = 0.8;

/** Options must be held this long to open settings (s). A tap does not open it. */
export const MENU_HOLD = 0.55;

/** Master gain for synthesized skate bed. */
export let AUDIO_MASTER = 0.38;

/** Resonant lowpass on rolling noise. Q is the ring; higher = more tone, less hiss. */
export const ROLL_Q = 4.5;
export const ROLL_HZ = 260;
export const ROLL_HZ_SPEED = 70;

/** Resonant band on a grind, then a lowpass so the ring does not fizz. */
export const GRIND_Q = 5.5;
export const GRIND_HZ = 640;
export const GRIND_HZ_SPEED = 45;
export const GRIND_LP = 2200;

/** Flip whoosh. Bandpass, not an open highpass. */
export const WHOOSH_Q = 1.8;
export const WHOOSH_HZ = 520;

/** Master high-shelf (dB, negative = cut). Catches leftover hiss above the voices. */
export const NOISE_SHELF_HZ = 2800;
export const NOISE_SHELF_DB = -9;

/** Max board pitch from weight, rad. Tail-heavy (sticks down) raises the nose. */
export const PITCH_MAX = 0.32;

/** How fast pitch chases stick weight (1/s). */
export const PITCH_FOLLOW = 12;

/** One foot this far down, the other near center, and you are in a manual. */
export const MANUAL_HOLD = 0.42;
export const MANUAL_CENTER = 0.22;

/** Need this much speed (m/s) to lock a manual. */
export const MANUAL_SPEED = 1.1;

/** Nose-up angle while holding a tail manual (rad). */
export const MANUAL_PITCH = 0.42;

/** How fast the balance wanders, and how hard the heavy foot corrects it. */
export const MANUAL_DRIFT = 0.65;
export const MANUAL_CORRECT = 1.6;

/** Hold the pose this long before the manual locks (s). */
export const MANUAL_ENTER = 0.1;

/** Charge stick Y (down = +) to load tail / nollie reverse. */
export const TAIL_HOLD = 0.28;

/** Flick stick must finish this far up (−). */
export const FLICK_UP = -0.18;

/** Stick Y velocity (units/s). More negative = faster upward flick. */
export const FLICK_SPEED = -5;

/** Remember a flick this long so charge+flick need not be the same frame (s). */
export const FLICK_WINDOW = 0.16;

/** Base pop impulse (N·s). Enough for the rail, not a launch. */
export let OLLIE_IMPULSE = 165;

/** Extra pop from flick speed, N·s per (stick-unit/s). */
export const OLLIE_FLICK_GAIN = 3;

/** Foot marker travel on the deck (m). */
export const FOOT_X = 0.07;
export const FOOT_Z = 0.28;

/** Trigger yaw (rad/s at full squeeze). L2 − R2 so L2 turns left, R2 right. */
export let TRIGGER_YAW = 1.8;

/** Air roll from combined stick X (rad/s). */
export const AIR_ROLL = 0.9;

/** Roll bleed in air (1/s). */
export const AIR_ROLL_DAMP = 1.2;

/** Land steeper than this pitch (rad) → bail. ~35°. */
export const BAIL_PITCH = 0.62;

/** Land rolled past this (rad) → bail. */
export const BAIL_ROLL = 0.7;

/** Downward speed on land that always bails (m/s). */
export const BAIL_DOWN = 9;

/** Extra pop if both sticks stay up after leaving the ground (N·s). */
export const BONE_IMPULSE = 18;

/** After pop, this long to start a flip/shuv (s). */
export const SCOOP_WINDOW = 0.16;

/** Front stick |X| to count as a scoop. High so an ollie Y-flick is not a flip. */
export const SCOOP_X = 0.62;

/** |stick X velocity| (units/s) that counts as a scoop flick. */
export const SCOOP_SPEED = 9;

/** Kick/heelflip spin (rad/s). Sign from front stick X. */
export let FLIP_SPIN = 9;

/** Shuv spin around yaw from back stick X (rad/s). */
export let SHUV_SPIN = 5.5;

/** Spin bleed (1/s). */
export const FLIP_DAMP = 1.4;

/** Sticks inside this radius = trying to catch. */
export const CATCH_STICK = 0.28;

/** Land/catch if flip (or shuv) is this close to a full turn, rad. ~35°. */
export const CATCH_ANGLE = 0.6;

/** Truck-to-rail distance that counts as contact (m). Not a magnet. */
export const GRIND_LOCK = 0.13;

/** Once locked, slip off if the board drifts farther than this (m). */
export const GRIND_SLIP = 0.2;

/** Need this much speed along the grind axis (m/s). */
export const GRIND_MIN_ALONG = 0.45;

/** Board origin above the grind axis while locked (m). */
export const GRIND_RIDE = 0.08;

/** Slide friction on a grind (1/s). */
export let GRIND_FRICTION = 0.2;

/** Stock values. Sliders store a multiplier of these. 1 = as shipped. */
const TUNE_BASE = {
  pop: 165,
  flip: 9,
  shuv: 5.5,
  grind: 0.2,
  push: 180,
  steer: 1.6,
  turn: 1.8,
  volume: 0.38,
};

export const TUNABLES = [
  { id: "pop", label: "Pop height", min: 0.55, max: 1.75 },
  { id: "flip", label: "Flip speed", min: 0.45, max: 1.8 },
  { id: "shuv", label: "Shuv speed", min: 0.45, max: 1.8 },
  { id: "grind", label: "Grind friction", min: 0.15, max: 3 },
  { id: "push", label: "Push", min: 0.5, max: 1.8 },
  { id: "steer", label: "Steer", min: 0.4, max: 1.8 },
  { id: "turn", label: "Trigger turn", min: 0.4, max: 1.8 },
  { id: "volume", label: "Volume", min: 0, max: 1.6 },
];

const TUNE_KEY = "noisses-tune";
const tune = Object.fromEntries(TUNABLES.map((t) => [t.id, 1]));

function clampTune(id, value) {
  const spec = TUNABLES.find((t) => t.id === id);
  return Math.min(spec.max, Math.max(spec.min, value));
}

function publishTune() {
  OLLIE_IMPULSE = TUNE_BASE.pop * tune.pop;
  FLIP_SPIN = TUNE_BASE.flip * tune.flip;
  SHUV_SPIN = TUNE_BASE.shuv * tune.shuv;
  GRIND_FRICTION = TUNE_BASE.grind * tune.grind;
  PUSH_IMPULSE = TUNE_BASE.push * tune.push;
  STEER_RATE = TUNE_BASE.steer * tune.steer;
  TRIGGER_YAW = TUNE_BASE.turn * tune.turn;
  AUDIO_MASTER = TUNE_BASE.volume * tune.volume;
}

export function getTune() {
  return { ...tune };
}

/** Set one slider. `value` is a multiplier of the stock number. */
export function setTune(id, value, persist = true) {
  if (!(id in tune)) return;
  tune[id] = clampTune(id, value);
  publishTune();
  if (!persist) return;
  try {
    localStorage.setItem(TUNE_KEY, JSON.stringify(tune));
  } catch {
    /* private window */
  }
}

export function resetTune() {
  for (const t of TUNABLES) tune[t.id] = 1;
  publishTune();
  try {
    localStorage.removeItem(TUNE_KEY);
  } catch {
    /* private window */
  }
}

function loadTune() {
  try {
    const raw = JSON.parse(localStorage.getItem(TUNE_KEY) || "null");
    if (!raw) return;
    for (const t of TUNABLES) {
      if (typeof raw[t.id] === "number") tune[t.id] = clampTune(t.id, raw[t.id]);
    }
  } catch {
    /* bad json */
  }
  publishTune();
}

loadTune();

export function selfCheckTune() {
  const snap = getTune();
  setTune("pop", 9, false);
  if (tune.pop !== 1.75) throw new Error("tune clamp");
  if (Math.abs(OLLIE_IMPULSE - TUNE_BASE.pop * 1.75) > 0.01) throw new Error("tune pop");
  for (const id of Object.keys(snap)) setTune(id, snap[id], false);
}
