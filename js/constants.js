// Invented here. Heavy/realistic bias. Tune in place; do not copy commercial values.

/** Stick magnitude below this is treated as centered. */
export const STICK_DEADZONE = 0.12;

/** Physics tick. Render interpolates; rAF is the frame. */
export const FIXED_DT = 1 / 120;

/** Downward accel (m/s²). Earth-ish; feels heavy on a light board. */
export const GRAVITY = 9.81;

/** Board + skater lump mass (kg). Heavy on purpose. */
export const BOARD_MASS = 75;

/** Impulse added along the nose when A/Cross is pressed while grounded (N·s). */
export const PUSH_IMPULSE = 180;

/** Horizontal speed cap (m/s). ~25 km/h. */
export const MAX_SPEED = 7;

/** Exponential friction when wheels are on the ground (1/s). */
export const GROUND_FRICTION = 0.55;

/** Extra damping on vertical slam into the ground. */
export const LANDING_DAMP = 0.15;

/** Target ray length from deck center down to pavement (m). */
export const RIDE_HEIGHT = 0.11;

/** Ray length past ride height so we still find the floor (m). */
export const RAY_EXTRA = 0.25;

/** Local wheel attach points (x right, y up, z nose). */
export const WHEEL_LOCAL = [
  { x: 0.085, y: 0, z: 0.205 },
  { x: -0.085, y: 0, z: 0.205 },
  { x: 0.085, y: 0, z: -0.205 },
  { x: -0.085, y: 0, z: -0.205 },
];

/** Visual wheel radius (m). */
export const WHEEL_RADIUS = 0.03;

/** Yaw from combined stick X while rolling (rad/s per unit stick at 1 m/s). */
export const STEER_RATE = 1.6;

/** Slow pivot so you can turn almost still (rad/s per unit stick). */
export const STEER_PIVOT = 0.9;

/** Follow camera distance behind the board (m). */
export const CAM_BACK = 2.6;

/** Nudge right so we see deck, not a tail sliver (m). */
export const CAM_SIDE = 0.95;

/** Follow camera height (m). */
export const CAM_HEIGHT = 1.2;

/** Camera look-at height above deck (m). */
export const CAM_LOOK_Y = 0.45;

/** Follow smoothing rate (1/s). Higher = snappier. */
export const CAM_FOLLOW = 6;
