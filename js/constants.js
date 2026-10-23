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
export const PUSH_IMPULSE = 180;

/** Horizontal speed cap (m/s). ~25 km/h. */
export const MAX_SPEED = 7;

/** Exponential friction when wheels are on the ground (1/s). */
export const GROUND_FRICTION = 0.55;

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
export const STEER_RATE = 1.6;

/** Slow pivot so you can turn almost still (rad/s per unit stick). */
export const STEER_PIVOT = 0.9;

/** Follow camera distance behind the board (m). */
export const CAM_BACK = 2.15;

/** Nudge right so we see deck, not a tail sliver (m). */
export const CAM_SIDE = 0.82;

/** Follow camera height (m). */
export const CAM_HEIGHT = 0.92;

/** Camera look-at height above deck (m). */
export const CAM_LOOK_Y = 0.28;

/** Follow smoothing rate (1/s). Higher = snappier. */
export const CAM_FOLLOW = 6;

/** D-pad down/up must be held this long to set / respawn (s). Taps do nothing. */
export const SPAWN_HOLD = 0.8;

/** Master gain for synthesized skate bed. */
export const AUDIO_MASTER = 0.38;

/** Max board pitch from weight, rad. Tail-heavy (sticks down) raises the nose. */
export const PITCH_MAX = 0.32;

/** How fast pitch chases stick weight (1/s). */
export const PITCH_FOLLOW = 12;

/** Charge stick Y (down = +) to load tail / nollie reverse. */
export const TAIL_HOLD = 0.28;

/** Flick stick must finish this far up (−). */
export const FLICK_UP = -0.18;

/** Stick Y velocity (units/s). More negative = faster upward flick. */
export const FLICK_SPEED = -5;

/** Remember a flick this long so charge+flick need not be the same frame (s). */
export const FLICK_WINDOW = 0.16;

/** Base pop impulse (N·s). Enough for the rail, not a launch. */
export const OLLIE_IMPULSE = 165;

/** Extra pop from flick speed, N·s per (stick-unit/s). */
export const OLLIE_FLICK_GAIN = 3;

/** Foot marker travel on the deck (m). */
export const FOOT_X = 0.07;
export const FOOT_Z = 0.28;

/** Trigger yaw (rad/s at full squeeze). L2 − R2 so L2 turns left, R2 right. */
export const TRIGGER_YAW = 1.8;

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
export const FLIP_SPIN = 9;

/** Shuv spin around yaw from back stick X (rad/s). */
export const SHUV_SPIN = 5.5;

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
export const GRIND_FRICTION = 0.2;
