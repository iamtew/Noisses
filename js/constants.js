// Invented here. Heavy/realistic bias. Tune in place; do not copy commercial values.

/** Stick magnitude below this is treated as centered. */
export const STICK_DEADZONE = 0.12;

/** Physics tick. Render interpolates; rAF is the frame. */
export const FIXED_DT = 1 / 120;

/** Downward accel (m/s²). Earth-ish; the advanced slider multiplies this. */
export let GRAVITY = 9.81;

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

/**
 * Start wheel rays this far above the axle (m).
 * A pad taller than ride height sits above the wheels if you roll in at brick
 * height; a ray from the axle hits the brick (or the pad interior) and the
 * board clips. Walker already rays from y=6. This is that, on the deck.
 */
export const WHEEL_RAY_LIFT = 1.2;

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

/**
 * Max on-board side offset (m) at 0% / 100% of Cam offset.
 * 50% is dead-center. Default 35% is 0.3 × this (~0.6 m). Backside = board +X.
 */
export const CAM_OFFSET_MAX = 2;
export const CAM_OFFSET_STOCK = 0.35;
/** Signed meters, backside-positive. The advanced slider publishes this. */
export let CAM_OFFSET = (0.5 - CAM_OFFSET_STOCK) * 2 * CAM_OFFSET_MAX;

/** Follow camera height (m). */
export const CAM_HEIGHT = 1.05;

/** Camera look-at height above deck (m). */
export const CAM_LOOK_Y = 0.42;

/** Follow smoothing rate (1/s). Higher = snappier. */
export const CAM_FOLLOW = 7.5;

/** R1 low camera. Close to the deck, skate-video height. */
export const CAM_LOW_BACK = 1.45;
export const CAM_LOW_HEIGHT = 0.34;
export const CAM_LOW_LOOK = 0.16;

/** Off the board. Right stick orbits. Left stick walks. */
export const WALK_SPEED = 2.2;
export const RUN_SPEED = 5.5;
/** Upward speed on a walk jump (m/s). Same gravity as the board. */
export const WALK_JUMP = 4.2;
/** Second Cross inside this window runs instead of jumping (s). */
export const RUN_TAP = 0.22;
/** Get on / get off (s). */
export const CARRY_TIME = 0.45;
/** Left stick orbit (rad/s at full deflection). */
export const ORBIT_YAW = 2.4;
export const ORBIT_PITCH = 1.6;
export const ORBIT_PITCH_MIN = 0.08;
export const ORBIT_PITCH_MAX = 1.15;
/** Third-person distance and look height while walking (m). */
export const WALK_CAM_DIST = 3.15;
export const WALK_CAM_LOOK = 0.72;

/** D-pad down/up must be held this long to set / respawn (s). Taps do nothing. */
export const SPAWN_HOLD = 0.8;

/** Options must be held this long to open settings (s). A tap does not open it. */
export const MENU_HOLD = 0.55;

/** How-to / trick list stick scroll (px/s at full stick). Down-positive, same as the pad. */
export const MENU_SCROLL = 520;

/** Trick HUD line stays this long, then fades (ms). */
export const HUD_LOG_MS = 3000;
/** Fade window at the end of HUD_LOG_MS (ms). */
export const HUD_FADE_MS = 800;

/** Master gain for synthesized skate bed. */
export let AUDIO_MASTER = 0.38;

/** Game seconds per real second. Slider multiplies the 60× stock (1h = 1m). */
export let TIME_SCALE = 60;

/** Minutes past midnight, 0–1440. Default is a skateable afternoon. */
export const CLOCK_DEFAULT_MIN = 16 * 60 + 20;

/** Sun azimuth (deg). 0 = north, 90 = east. Plaza +X is north, +Z is east. */
export const SUN_AZIMUTH_DEFAULT = 45;

/** Civil-ish twilight band (deg). Below −8 is night, above +6 is day. */
export const TWILIGHT_BELOW = 8;
export const TWILIGHT_ABOVE = 6;

/** Embarcadero, mid-August PDT. Rise 06:30, set 20:00. Peak ~66° (lat 37.8° + Aug declination). */
export const SUN_RISE_MIN = 6 * 60 + 30;
export const SUN_SET_MIN = 20 * 60;
const SUN_PEAK_EL = 66;

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

/** Max board pitch from one foot, rad. Back foot down raises the nose. Front foot down lowers it. */
export const PITCH_MAX = 0.32;

/** How fast pitch chases stick weight (1/s). */
export const PITCH_FOLLOW = 12;

/** Butt spring (1/s²) and damping (1/s). Soft so a land still claps. */
export const BUTT_STIFF = 42;
export const BUTT_DAMP = 6;

/** Butt velocity added per m/s of hip-speed change. */
export const BUTT_KICK = 0.08;

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

/** Hold the pose this long before the manual locks (s). Longer than a pop charge. */
export const MANUAL_ENTER = 0.28;

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
export let FLIP_SPIN = 22.5;

/** Shuv spin around yaw (rad/s). Sign is opposite the back stick so the tail follows the scoop. */
export let SHUV_SPIN = 13.75;

/** Spin bleed (1/s). */
export const FLIP_DAMP = 1.4;

/** Land/catch if flip (or shuv) is this close to a full turn, rad. ~35°. */
export const CATCH_ANGLE = 0.6;

/** Land snap if past 45% of the trick, even when short of the target (rad of allowed error). */
export const CATCH_LAND = 8;

/** Stick |Y| that counts as planted for a catch. */
export const CATCH_STICK = 0.28;

/** Stick magnitude below this is idle when snapping to 8 dirs. Under TAIL_HOLD so a crouch counts. */
export const DIR_DEAD = 0.22;

/** Max pose error (sum of two unit-vector distances) to still name a trick. */
export const MATCH_MAX = 0.85;

/** Need this much speed (m/s) before fakie/normal can flip. Idle keeps the last one. */
export const FAKIE_SPEED = 0.45;

/** Rolling this far tail-first (m/s along the nose) counts as fakie. */
export const FAKIE_ALONG = 0.2;

/** Pop impulse scale by charge band. Invented; high is the old ollie. */
export const POP_SCALE = { high: 1, mid: 0.78, low: 0.58 };

/** Grind friction multipliers by chart band. Blunts die shorter than 50-50s. */
export const GRIND_FRIC_SCALE = { low: 0.7, mid: 1.2, hi: 2 };

/** |board forward · rail| below this is a slide (board across). */
export const GRIND_PARALLEL_SLIDE = 0.45;

/** Even more across than a slide: blunt / noseblunt lock. */
export const GRIND_PARALLEL_BLUNT = 0.22;

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

/** Cheek size multiplier. 1 is the stock seat. The advanced slider owns this. */
export let DUMPTRUCK = 0.8;

/** Stock values. Sliders store a multiplier of these. 1 = as shipped. */
const TUNE_BASE = {
  gravity: 9.81,
  timeScale: 60,
  pop: 165,
  flip: 22.5,
  shuv: 13.75,
  grind: 0.2,
  push: 180,
  steer: 1.6,
  turn: 1.8,
  volume: 0.38,
  dumptruck: 0.8,
};

export const TUNABLES = [
  // 20% is a lazy hang. 220% is a short hop. 100% is the stock drop.
  { id: "gravity", label: "Gravity", min: 0.2, max: 2.2 },
  // 1/60 = real time. 1 = 1h in 1m. 120 = 1h in 0.5s.
  { id: "timeScale", label: "Time scale", min: 1 / 60, max: 120 },
  { id: "pop", label: "Pop height", min: 0.55, max: 1.75 },
  { id: "flip", label: "Flip speed", min: 0.45, max: 1.8 },
  { id: "shuv", label: "Shuv speed", min: 0.45, max: 1.8 },
  { id: "grind", label: "Grind friction", min: 0.15, max: 3 },
  { id: "push", label: "Push", min: 0.5, max: 1.8 },
  { id: "steer", label: "Steer", min: 0.4, max: 1.8 },
  { id: "turn", label: "Trigger turn", min: 0.4, max: 1.8 },
  // 50% is today's centered follow cam. 0% full backside, 100% full frontside.
  { id: "camOffset", label: "Cam offset", min: 0, max: 1, default: CAM_OFFSET_STOCK },
  { id: "volume", label: "Volume", min: 0, max: 1.6 },
  { id: "dumptruck", label: "Dumptruck", min: 0.35, max: 3 },
];

/** Advanced menu. Volume lives under Options → Audio. */
export const ADVANCED_TUNABLES = TUNABLES.filter((t) => t.id !== "volume");

const TUNE_KEY = "noisses-tune";
const tune = Object.fromEntries(TUNABLES.map((t) => [t.id, t.default ?? 1]));

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
  DUMPTRUCK = TUNE_BASE.dumptruck * tune.dumptruck;
  GRAVITY = TUNE_BASE.gravity * tune.gravity;
  TIME_SCALE = TUNE_BASE.timeScale * tune.timeScale;
  CAM_OFFSET = (0.5 - tune.camOffset) * 2 * CAM_OFFSET_MAX;
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

export function resetTune(ids) {
  for (const t of TUNABLES) {
    if (ids && !ids.includes(t.id)) continue;
    tune[t.id] = t.default ?? 1;
  }
  publishTune();
  try {
    localStorage.setItem(TUNE_KEY, JSON.stringify(tune));
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

const STANCE_KEY = "noisses-stance";
let switched = false;

function loadStance() {
  try {
    const raw = localStorage.getItem(STANCE_KEY);
    if (raw === "switch") switched = true;
    else switched = false;
  } catch {
    /* private window */
  }
}

loadStance();

/** Regular or Switch. Leftover `goofy` in storage is Regular. */
export function getSwitched() {
  return switched;
}

export function setSwitched(on, persist = true) {
  switched = Boolean(on);
  if (!persist) return;
  try {
    localStorage.setItem(STANCE_KEY, switched ? "switch" : "regular");
  } catch {
    /* private window */
  }
}

const SKY_KEY = "noisses-sky";
const skyClock = { minutes: CLOCK_DEFAULT_MIN, azimuth: SUN_AZIMUTH_DEFAULT, cycle: false };

function wrapMin(m) {
  return ((m % 1440) + 1440) % 1440;
}

function wrapDeg(d) {
  return ((d % 360) + 360) % 360;
}

function saveSky() {
  try {
    localStorage.setItem(SKY_KEY, JSON.stringify(skyClock));
  } catch {
    /* private window */
  }
}

function loadSky() {
  try {
    const raw = JSON.parse(localStorage.getItem(SKY_KEY) || "null");
    if (!raw) return;
    if (typeof raw.azimuth === "number") skyClock.azimuth = wrapDeg(raw.azimuth);
    if (typeof raw.cycle === "boolean") {
      skyClock.cycle = raw.cycle;
      if (typeof raw.minutes === "number") skyClock.minutes = wrapMin(raw.minutes);
    }
  } catch {
    /* bad json */
  }
}

loadSky();

export function getSkyClock() {
  return { minutes: skyClock.minutes, azimuth: skyClock.azimuth, cycle: skyClock.cycle };
}

export function setSkyMinutes(minutes, persist = true) {
  skyClock.minutes = wrapMin(minutes);
  if (persist) saveSky();
}

export function setSkyAzimuth(deg, persist = true) {
  skyClock.azimuth = wrapDeg(deg);
  if (persist) saveSky();
}

export function setSkyCycle(on, persist = true) {
  skyClock.cycle = Boolean(on);
  if (persist) saveSky();
}

/** `dt` is real seconds. TIME_SCALE is game seconds per real second. */
export function advanceSkyClock(dt) {
  if (!skyClock.cycle) return;
  skyClock.minutes = wrapMin(skyClock.minutes + (dt * TIME_SCALE) / 60);
}

export function persistSkyClock() {
  saveSky();
}

/** Toy sun timed for SF August. Horizon at rise/set, peak at the midpoint (~13:15). */
export function sunElevationDeg(minutes) {
  const m = wrapMin(minutes);
  const rise = SUN_RISE_MIN;
  const set = SUN_SET_MIN;
  if (m >= rise && m <= set) {
    const t = (m - rise) / (set - rise);
    return SUN_PEAK_EL * Math.sin(t * Math.PI);
  }
  const nightLen = 1440 - set + rise;
  const u = m >= set ? (m - set) / nightLen : (1440 - set + m) / nightLen;
  return -SUN_PEAK_EL * Math.sin(u * Math.PI);
}

export function isTwilight(elev) {
  return elev > -TWILIGHT_BELOW && elev < TWILIGHT_ABOVE;
}

export function formatClock(minutes) {
  const m = Math.floor(wrapMin(minutes));
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function parseClock(value) {
  const m = /^(\d{1,2}):(\d{2})/.exec(value || "");
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Real seconds that one game hour lasts at this multiplier. */
export function realSecPerGameHour(mult) {
  return 3600 / (TUNE_BASE.timeScale * mult);
}

export function formatTimeScale(mult) {
  const sec = realSecPerGameHour(mult);
  if (sec >= 3590) return "1h = 1h";
  if (sec >= 59.5) {
    const mins = sec / 60;
    if (Math.abs(mins - 1) < 0.02) return "1h = 1m";
    return `1h = ${Math.round(mins)}m`;
  }
  if (Math.abs(sec - 5) < 0.2) return "1h = 5s";
  if (Math.abs(sec - 0.5) < 0.05) return "1h = 0.5s";
  return `1h = ${sec < 10 ? sec.toFixed(1) : Math.round(sec)}s`;
}

export function formatTune(spec, value) {
  if (spec.id === "timeScale") return formatTimeScale(value);
  return `${Math.round(value * 100)}%`;
}

export function selfCheckTune() {
  const snap = getTune();
  setTune("pop", 9, false);
  if (tune.pop !== 1.75) throw new Error("tune clamp");
  if (Math.abs(OLLIE_IMPULSE - TUNE_BASE.pop * 1.75) > 0.01) throw new Error("tune pop");
  setTune("dumptruck", 9, false);
  if (tune.dumptruck !== 3) throw new Error("tune dumptruck");
  if (Math.abs(DUMPTRUCK - TUNE_BASE.dumptruck * 3) > 0.01) throw new Error("tune dumptruck publish");
  setTune("gravity", 99, false);
  if (tune.gravity !== 2.2) throw new Error("tune gravity");
  if (Math.abs(GRAVITY - TUNE_BASE.gravity * 2.2) > 0.01) throw new Error("tune gravity publish");
  setTune("timeScale", 999, false);
  if (tune.timeScale !== 120) throw new Error("tune timeScale");
  if (Math.abs(TIME_SCALE - 7200) > 0.01) throw new Error("tune timeScale publish");
  if (formatTimeScale(1) !== "1h = 1m") throw new Error("tune timeScale label");
  if (formatTimeScale(1 / 60) !== "1h = 1h") throw new Error("tune timeScale realtime");
  if (formatTimeScale(12) !== "1h = 5s") throw new Error("tune timeScale 5s");
  if (formatTimeScale(120) !== "1h = 0.5s") throw new Error("tune timeScale max");
  setTune("camOffset", 9, false);
  if (tune.camOffset !== 1) throw new Error("tune camOffset clamp");
  if (Math.abs(CAM_OFFSET + CAM_OFFSET_MAX) > 0.01) throw new Error("tune camOffset max");
  setTune("camOffset", 0.5, false);
  if (Math.abs(CAM_OFFSET) > 1e-9) throw new Error("tune camOffset center");
  setTune("camOffset", CAM_OFFSET_STOCK, false);
  if (Math.abs(CAM_OFFSET - (0.5 - CAM_OFFSET_STOCK) * 2 * CAM_OFFSET_MAX) > 0.01) {
    throw new Error("tune camOffset stock");
  }
  for (const id of Object.keys(snap)) setTune(id, snap[id], false);
}

export function selfCheckSky() {
  if (!(sunElevationDeg(0) < -40)) throw new Error("sky midnight");
  if (Math.abs(sunElevationDeg(SUN_RISE_MIN)) > 0.5) throw new Error("sky sunrise");
  if (Math.abs(sunElevationDeg(SUN_SET_MIN)) > 0.5) throw new Error("sky sunset");
  const noon = (SUN_RISE_MIN + SUN_SET_MIN) / 2;
  if (!(sunElevationDeg(noon) > 60)) throw new Error("sky noon");
  if (!isTwilight(sunElevationDeg(SUN_RISE_MIN))) throw new Error("sky twilight dawn");
  if (!isTwilight(sunElevationDeg(SUN_SET_MIN))) throw new Error("sky twilight dusk");
  if (isTwilight(sunElevationDeg(0))) throw new Error("sky night not twilight");
  if (isTwilight(sunElevationDeg(CLOCK_DEFAULT_MIN))) throw new Error("sky day not twilight");
  if (parseClock("14:00") !== 840) throw new Error("sky parse");
  if (formatClock(840) !== "14:00") throw new Error("sky format");
  if (formatClock(CLOCK_DEFAULT_MIN) !== "16:20") throw new Error("sky default");
  const snap = getSkyClock();
  setSkyCycle(false, false);
  const m = getSkyClock().minutes;
  advanceSkyClock(10);
  if (getSkyClock().minutes !== m) throw new Error("sky cycle paused");
  setSkyCycle(true, false);
  if (!getSkyClock().cycle) throw new Error("sky cycle on");
  setSkyCycle(snap.cycle, false);
  setSkyMinutes(snap.minutes, false);
}
