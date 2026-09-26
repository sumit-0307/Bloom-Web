// Lightweight global scroll progress store — no external state lib.
// Progress is 0..1 across the entire scrollable main. R3F reads via ref each frame.

const listeners = new Set();
const state = { progress: 0, raw: 0, sectionIndex: 0, sectionProgress: 0, seedPlanted: false };

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

export const SECTION_COUNT = 6;

const SECTION_SELECTORS = [
  '[data-testid="section-intro"]',
  '[data-testid="section-growth"]',
  '[data-testid="section-butterflies"]',
  '[data-testid="section-jellyfish"]',
  '[data-testid="section-reels"]',
  '[data-testid="section-finale"]',
];

export function measureSections() {
  if (typeof document === "undefined") return [];
  const total = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  return SECTION_SELECTORS.map((selector) => {
    const element = document.querySelector(selector);
    if (!element) return null;
    const start = Math.max(0, Math.min(1, (element.getBoundingClientRect().top + window.scrollY) / total));
    return { start };
  });
}

export function sectionStateFromProgress(p, sections = measureSections()) {
  const progress = Math.min(1, Math.max(0, p));
  if (sections.some((section) => !section)) return { index: 0, progress: 0 };
  const valid = sections;
  let index = 0;
  for (let i = 1; i < valid.length; i += 1) {
    if (progress >= valid[i].start) index = i;
    else break;
  }
  const start = valid[index].start;
  const end = valid[index + 1]?.start ?? 1;
  return {
    index,
    progress: Math.min(1, Math.max(0, (progress - start) / Math.max(0.0001, end - start))),
  };
}

export function sectionFromProgress(p) {
  return sectionStateFromProgress(p).index;
}

// Chapters have different heights, so navigation targets their measured starts.
export function sectionScrollTarget(index) {
  if (typeof document === "undefined") return 0;
  const selector = SECTION_SELECTORS[Math.max(0, Math.min(SECTION_COUNT - 1, index))];
  const element = document.querySelector(selector);
  return element ? element.getBoundingClientRect().top + window.scrollY : 0;
}

export function localProgress(p, sectionIndex) {
  const sections = measureSections();
  return sectionStateFromProgress(p, sections).index === sectionIndex
    ? sectionStateFromProgress(p, sections).progress
    : sectionStateFromProgress(p, sections).index > sectionIndex ? 1 : 0;
}
