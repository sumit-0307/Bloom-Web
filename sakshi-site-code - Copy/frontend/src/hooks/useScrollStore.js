// Lightweight global scroll progress store — no external state lib.
// Progress is 0..1 across the entire scrollable main. R3F reads via ref each frame.

const listeners = new Set();
const state = { progress: 0, raw: 0, sectionIndex: 0, seedPlanted: false };

export const scrollStore = {
  get() { return state; },
  set(patch) {
    Object.assign(state, patch);
    listeners.forEach((l) => l(state));
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

// Compute which section a global progress falls into (6 sections, equal thirds of scroll)
export const SECTION_COUNT = 6;
export function sectionFromProgress(p) {
  return Math.min(SECTION_COUNT - 1, Math.max(0, Math.floor(p * SECTION_COUNT)));
}

// Ranged 0..1 within a section boundary
export function localProgress(p, sectionIndex, count = SECTION_COUNT) {
  const start = sectionIndex / count;
  const end = (sectionIndex + 1) / count;
  return Math.min(1, Math.max(0, (p - start) / (end - start)));
}
