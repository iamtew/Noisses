// Invented here. Heavy/realistic bias. Tune in place; do not copy commercial values.

/** Stick magnitude below this is treated as centered. */
export const STICK_DEADZONE = 0.12;

/** Physics tick. Render interpolates; rAF is the frame. Unused until Phase 1. */
export const FIXED_DT = 1 / 120;
