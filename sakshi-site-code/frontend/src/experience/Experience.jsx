import React, { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import HTMLFlipBook from "react-pageflip";
import { scrollStore, sectionFromProgress, sectionScrollTarget } from "@/hooks/useScrollStore";
import { HeroBouquetScene, BouquetInteraction } from "@/experience/Scene3D";

/* ============= dynamic scroll background ============= */
export const ScrollBackground = () => {
  const layerRef = useRef(null);

  useEffect(() => {
    const unsub = scrollStore.subscribe(({ progress }) => {
      // Map progress → color stops via interpolation
      // 0.0 warm cream, 0.35 peach, 0.50 dusky pink, 0.55 deep night, 0.72 warm cream, 0.90 golden hour
      const stops = [
        { p: 0.0, c: [253, 251, 247] },
        { p: 0.28, c: [250, 240, 220] },
        { p: 0.45, c: [246, 220, 210] },
        { p: 0.55, c: [26, 29, 46] },
        { p: 0.68, c: [30, 33, 60] },
        { p: 0.72, c: [253, 245, 232] },
        { p: 0.88, c: [246, 226, 178] },
        { p: 1.0, c: [244, 208, 152] },
      ];
      let a = stops[0], b = stops[stops.length - 1];
      for (let i = 0; i < stops.length - 1; i++) {
        if (progress >= stops[i].p && progress <= stops[i + 1].p) {
          a = stops[i]; b = stops[i + 1]; break;
        }
      }
      const t = (progress - a.p) / Math.max(0.0001, b.p - a.p);
      const c = a.c.map((v, i) => Math.round(v + (b.c[i] - v) * t));
      if (layerRef.current) {
        layerRef.current.style.background = `radial-gradient(70% 80% at 30% 30%, rgba(${c[0]+8},${c[1]+4},${c[2]-8},1) 0%, rgb(${c[0]},${c[1]},${c[2]}) 60%, rgb(${Math.max(0,c[0]-12)},${Math.max(0,c[1]-8)},${Math.max(0,c[2]-4)}) 100%)`;
      }
    });
    return unsub;
  }, []);

  return <div ref={layerRef} className="pointer-events-none fixed inset-0 z-[2] mesh-warm" aria-hidden="true" data-testid="scroll-background" />;
};

/* ============= chapter side nav ============= */
const CHAPTERS = [
  { n: "00", label: "Unfurling" },
  { n: "01", label: "Grow" },
  { n: "02", label: "Patience" },
  { n: "03", label: "Drift" },
  { n: "04", label: "Memories" },
  { n: "05", label: "Bloom" },
];

export const ChapterNav = () => {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const unsub = scrollStore.subscribe(({ progress }) => setActive(sectionFromProgress(progress)));
    return unsub;
  }, []);
  return (
    <nav
      aria-label="Chapters"
      data-testid="chapter-nav"
      className="fixed left-6 top-1/2 z-[55] hidden -translate-y-1/2 flex-col gap-4 lg:flex"
    >
      {CHAPTERS.map((c, i) => (
        <button
          key={c.n}
          onClick={() => {
            window.__lenis?.scrollTo(sectionScrollTarget(i), { duration: 1.6 });
          }}
          data-testid={`chapter-jump-${c.n}`}
          className="group flex items-center gap-3 text-left"
        >
          <span
            className={`h-px transition-all ${
              active === i ? "w-10 bg-ink-900" : "w-4 bg-ink-900/40 group-hover:bg-ink-900/70"
            }`}
          />
          <span
            className={`font-sans text-[10px] uppercase tracking-[0.3em] transition-colors ${
              active === i ? "text-ink-900" : "text-ink-700/60 group-hover:text-ink-900"
            }`}
          >
            {c.n} · {c.label}
          </span>
        </button>
      ))}
    </nav>
  );
};

/* ============= animation primitives ============= */
export const LineReveal = ({ children, delay = 0, className = "" }) => {
  return (
    <span className={`line-mask ${className}`}>
      <motion.span
        initial={{ y: "110%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
};

export const FadeUp = ({ children, delay = 0, className = "", once = true }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once, margin: "-15% 0px -15% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ============= Section 0 — Intro ============= */
export const IntroSection = ({ onPlant, planted }) => {
  const [ready, setReady] = useState(false);
  const bouquetRotationRef = useRef({ x: 0, y: 0, z: 0 });
  const bouquetVisibleRef = useRef(1);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const unsub = scrollStore.subscribe(({ sectionIndex, sectionProgress }) => {
      if (sectionIndex !== 0) {
        bouquetVisibleRef.current = 0;
        return;
      }

      const t = Math.min(1, Math.max(0, (sectionProgress - 0.72) / 0.28));
      const eased = t * t * (3 - 2 * t);
      bouquetVisibleRef.current = 1 - eased;
    });

    return unsub;
  }, []);

  return (
    <section className="relative min-h-[110vh] w-full overflow-hidden" data-testid="section-intro">
      <HeroBouquetScene rotationRef={bouquetRotationRef} visibleRef={bouquetVisibleRef} />
      <BouquetInteraction rotationRef={bouquetRotationRef} />
      <div className="relative z-[30] mx-auto flex min-h-[100vh] max-w-[1400px] flex-col justify-between px-10 pb-24 pt-24">
        <div className="flex items-center justify-between">
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 0.9 }} transition={{ duration: 1.2, delay: 0.3 }}
            className="font-sans text-[11px] uppercase tracking-[0.4em] text-ink-700"
          >
           Beginning
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ duration: 1.2, delay: 0.4 }}
            className="font-sans text-[11px] uppercase tracking-[0.4em] text-ink-700"
          >
            Haseen · Dilruba
          </motion.p>
        </div>

        <div className="max-w-[85%]">
          <h1 className="font-serif text-[9vw] font-light leading-[0.88] tracking-[-0.03em] text-ink-900">
            {ready && (
              <>
                <LineReveal delay={0.05}>a garden of</LineReveal>
                <LineReveal delay={0.22} className="italic text-peach">ordinary years,</LineReveal>
                <LineReveal delay={0.42}>the ordinary —</LineReveal>
                <LineReveal delay={0.62} className="italic text-ink-900/85">which I hope, lasts forever.</LineReveal>
              </>
            )}
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1.6 }}
            className="mt-14 flex items-end justify-between gap-6"
          >
            <p className="max-w-md font-sans text-sm leading-relaxed text-ink-700">
              I created a garden of thoughts for you,
              drown and drift in them as long as you like. You can't keep a garden in a pocket, but you can keep 
              it in your heart (or on a website ofcourse)
            </p>
            <button
              onClick={onPlant}
              disabled={planted}
              data-testid="plant-seed-btn"
              style={{ pointerEvents: "auto" }}
              className="group relative flex h-20 w-20 shrink-0 -translate-x-36 items-center justify-center rounded-full border border-ink-900 bg-transparent font-serif italic text-ink-900 hover:bg-ink-900 hover:text-paper disabled:opacity-60"
            >
              <span className="relative">
                {planted ? "✿" : "♥"}
                <span className="absolute -inset-6 -z-10 rounded-full bg-sunflower/0 group-hover:bg-sunflower/20" />
              </span>
              {!planted && (
                <motion.span
                  className="absolute inset-0 rounded-full border border-sunflower/60"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </button>
          </motion.div>
        </div>

        <div className="flex items-end justify-between font-sans text-[8px] uppercase tracking-[0.35em] text-ink-700">
          <span>A day which might be something to you · but everything to me</span>
          <span className="flex items-center gap-2">
            <span className="h-px w-8 bg-ink-900/40" /> Mujhse Dosti Karoge?
          </span>
        </div>
      </div>
    </section>
  );
};

/* ============= Section 1 — Growth + Photo Book ============= */
/* ═══════════════════════════════════════════════════════════════════
   📸 ADD YOUR PHOTOS HERE — the flip-book pages (right side of section)
        and the QUOTES that show up on the left side, per page.
   Put image files in  /public/photos/  then set  img: "/photos/yourfile.jpg".
   Leave img: "" to keep the pretty gradient placeholder.
   • quote = short quote/poem displayed on the LEFT column when this page is active
   • note  = handwritten caption on the front of the page (over the image)
   • back  = the little note on the back (verso) of the page
   You can add as many entries as you like — the section auto-grows.
   ═══════════════════════════════════════════════════════════════════ */
const PHOTO_TILES = [
  { label: "photo 01", img: "/photos/photo-01.jpg", quote: "first light — that laugh, uncontainable.",           note: "morning, kept.",           back: "you talk with your hands. the sun listens.",   from: "from-peach",         to: "to-dusty" },
  { label: "photo 02", img: "/photos/photo-02.jpg", quote: "sunlight on your shoulder, exactly there.",          note: "ordinary rare.",              back: "the sun always knows where to land.", from: "from-sunflower/80",  to: "to-peach" },
  { label: "photo 03", img: "/photos/photo-03.jpg", quote: "an ordinary tuesday. i kept it.",                    note: "you're superior to the sun itself.",           back: "ordinary is our favourite kind of rare.",   from: "from-dusty",         to: "to-sage/70" },
  { label: "photo 04", img: "/photos/photo-04.jpg", quote: "the way you tilt your head when you listen.",        note: "attention.",               back: "attention is the quietest form of love.",   from: "from-sage/60",       to: "to-sunflower/70" },
  { label: "photo 05", img: "/photos/photo-05.jpg", quote: "we were laughing at nothing. it was everything.",    note: "everything.",              back: "the book loops — like us, it starts over.", from: "from-jelly",         to: "to-peach" },
  { label: "photo 06", img: "/photos/photo-06.jpg", quote: "the year the small things became the whole year.",   note: "small things.",            back: "little joys, kept in glass jars.",          from: "from-peach",         to: "to-sunflower/70" },
  { label: "photo 07", img: "/photos/photo-07.jpg", quote: "you, in a photograph i did not take — and still see.",note: "still seen.",             back: "some pictures the heart takes for itself.", from: "from-sunflower/70",  to: "to-dusty" },
  { label: "photo 08", img: "/photos/photo-08.jpg", quote: "we invented weekends. patented them.",               note: "weekend co.",              back: "the office was your couch. the boss was joy.", from: "from-dusty",       to: "to-jelly" },
  { label: "photo 09", img: "/photos/photo-09.jpg", quote: "you, mid-sentence, mid-sun.",                         note: "sun listens.",           back: "some mornings are kept, not remembered.",       from: "from-sage/60",       to: "to-peach" },
  { label: "photo 10", img: "/photos/photo-10.jpg", quote: "loud music. quiet love. small kitchen.",              note: "kitchen days.",            back: "the songs we hummed. the tea we forgot.",   from: "from-jelly",         to: "to-sunflower/70" },
  { label: "photo 11", img: "/photos/photo-11.jpg", quote: "a photograph is a promise the day made to us.",     note: "the promise.",             back: "so we keep them. all of them. carefully.",  from: "from-peach",         to: "to-sage/60" },
  { label: "photo 12", img: "/photos/photo-12.jpg", quote: "the book ends. so we open it again.",                 note: "encore.",                  back: "your story loops — quietly, on purpose. I hope you have a wonderful birthday",     from: "from-sunflower/80",  to: "to-peach" },
];

export const GrowthSection = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const stickyRef = useRef(null);
  // The sticky book itself only needs 100vh — page turns are wheel/gesture-driven,
  // not tied to scroll distance, so the flip interaction is unaffected either way.
  // The extra 45vh below is pure runway for the exit crossfade: once the reader
  // releases Lenis (start or end of the book), that runway is what the section
  // scrolls through before Ch.02 takes over, giving the fade below room to ease
  // out gradually instead of snapping the moment the section starts to leave.
  const sectionVh = 145;

  // Ease the sticky column out over the back half of that runway, so leaving
  // Ch.01 feels like a slow crossfade into Ch.02 rather than a hard cut.
  useEffect(() => {
    const compute = () => {
      const el = document.querySelector('[data-testid="section-growth"]');
      const node = stickyRef.current;
      if (!el || !node) return;
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      // Guard against there being no real runway (e.g. a future edit shrinks
      // sectionVh back down) — without this, dividing by a ~0 "scrollable"
      // turns `local` into raw scrolled pixels and the column can snap to
      // opacity 0 after a single pixel of scroll. Just stay visible instead.
      if (scrollable < 40) {
        node.style.opacity = "1";
        return;
      }
      const local = Math.min(1, Math.max(0, -rect.top / scrollable));
      // Fully visible through the first half of the runway (while the book is
      // still being read), then a smooth eased fade through the back half.
      const t = Math.min(1, Math.max(0, (local - 0.5) / 0.5));
      const eased = t * t * (3 - 2 * t); // smoothstep — gentle in/out, no snap
      node.style.opacity = (1 - eased).toFixed(3);
    };
    const unsub = scrollStore.subscribe(compute);
    compute();
    return unsub;
  }, []);

  return (
    <section
      className="relative w-full"
      style={{ minHeight: `${sectionVh}vh` }}
      data-testid="section-growth"
    >
      {/* Sticky column: left = active page quote, right = book */}
      <div ref={stickyRef} className="sticky top-0 flex min-h-screen items-center px-10" style={{ willChange: "opacity" }}>
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-12 gap-8">
          {/* LEFT — chapter label + rotating quote for the currently-active page */}
          <div className="col-span-5 col-start-1">
            <FadeUp>
              <p className="mb-6 font-sans text-[11px] uppercase tracking-[0.4em] text-ink-700">
                Growth
              </p>
            </FadeUp>
            <FadeUp delay={0.1}>
              <h2 className="font-serif text-[5.2vw] font-light leading-[0.92] tracking-tight text-ink-900">
                a slow, <em className="italic text-peach">stubborn</em>
                <br /> kind of blooming.
                <br /> For a Nakchadi Girl
              </h2>
            </FadeUp>

            {/* rotating quote — changes with the current book page */}
            <div className="mt-10 min-h-[10rem]" data-testid="growth-active-quote">
              <p className="mb-3 font-sans text-[10px] uppercase tracking-[0.35em] text-ink-700">
                page {String(activeIdx + 1).padStart(2, "0")} · {PHOTO_TILES[activeIdx].label}
              </p>
              <motion.p
                key={activeIdx}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="font-serif text-3xl font-light italic leading-snug text-ink-900"
              >
                {PHOTO_TILES[activeIdx].quote}
              </motion.p>
              {/* delicate divider + page progress dots — reads like a book index */}
              <div className="mt-5 flex items-center gap-3">
                <span className="h-px w-10 bg-ink-900/25" />
                <div className="flex items-center gap-1.5">
                  {PHOTO_TILES.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1 rounded-full transition-all ${
                        i === activeIdx ? "w-4 bg-ink-900/70" : i < activeIdx ? "w-1 bg-ink-900/35" : "w-1 bg-ink-900/15"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <FadeUp delay={0.4}>
              <p className="mt-6 font-script text-2xl text-ink-900/70">
                a week isn't enough for me to admire you ✿
                <br/> I need a month, a year, a decade, a lifetime ♥
              </p>
            </FadeUp>
          </div>

          {/* RIGHT — interactive photo book (15% bigger than before) */}
          <div className="col-span-6 col-start-7 flex items-center justify-center">
            <PhotoBook onActiveChange={setActiveIdx} />
          </div>
        </div>
      </div>
    </section>
  );
};

const COVER_PAGE = { cover: true };

// Dependency-free "paper flip" whoosh via WebAudio — decaying filtered noise.
// Reuses a single AudioContext; silently no-ops if audio isn't allowed yet.
let _flipCtx;
function playFlipSound() {
  try {
    _flipCtx = _flipCtx || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = _flipCtx;
    if (ctx.state === "suspended") ctx.resume();
    const dur = 0.24;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.4); // quick decay
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(1500, ctx.currentTime);
    bp.frequency.exponentialRampToValueAtTime(620, ctx.currentTime + dur);
    bp.Q.value = 0.7;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.connect(bp); bp.connect(gain); gain.connect(ctx.destination);
    src.start();
    src.stop(ctx.currentTime + dur);
  } catch (e) { /* audio not available — silent */ }
}

// Detail layers are deliberately part of the turning page, inspired by the
// nested flip strips in the supplied reference. They add paper depth without
// introducing a second page-state or changing the photo content.
const PageTurnDetail = ({ active, opacity }) => (
  <>
    <div
      className="page-turn-shade pointer-events-none"
      aria-hidden="true"
      style={{ opacity: active ? Math.max(0.08, opacity) : 0 }}
    />
    <div
      className="page-turn-edge pointer-events-none"
      aria-hidden="true"
      style={{ opacity: active ? Math.max(0.12, opacity * 0.85) : 0 }}
    />
  </>
);

const LegacyPhotoBook = ({ onActiveChange }) => {
  const pages = [COVER_PAGE, ...PHOTO_TILES];
  const total = pages.length;
  const containerRef = useRef(null);
  const [scrollFlip, setScrollFlip] = useState(0);
  const [drag, setDrag] = useState(null);
  const [ripples, setRipples] = useState([]);
  const rippleTimers = useRef([]);
  const scrollFlipRef = useRef(0);
  const dragRef = useRef(null);
  const turningRef = useRef(false);
  const interactionRef = useRef(false);
  const completeRef = useRef(false);
  const wheelReleaseAtRef = useRef(0);
  const lastWheelAtRef = useRef(0);
  const animationFrameRef = useRef(null);

  // eff is driven purely by scroll → clamped to [0, total]. The book stays inside
  // the (sticky) section until it is fully flipped, then the section releases.
  const eff = Math.max(0, Math.min(total, scrollFlip));
  const flipped = Math.floor(eff);
  const fraction = eff - flipped;
  const isAtEnd = flipped >= total;
  const current = isAtEnd ? null : flipped;
  const atStart = flipped <= 0 && fraction <= 0.001;

  // Which page (if any) is being turned BACK by a reverse drag.
  const reverseIdx = drag && drag.dir === -1 ? flipped - 1 : -1;

  // Live angle of whichever page is mid-flip → drives the cast shadow + watery
  // wash. Peaks (sin=1) when the page stands vertical at 90°.
  let flipAngle = 0;
  if (drag && drag.dir === -1 && flipped - 1 >= 0) {
    flipAngle = 180 - drag.angle; // an un-flipping page swings from 180 → 0
  } else if (!isAtEnd) {
    const scrollAngle = fraction * 180;
    flipAngle = drag && drag.dir === 1 ? Math.max(scrollAngle, drag.angle) : scrollAngle;
  }
  const curlShadow = Math.sin((Math.min(180, flipAngle) / 180) * Math.PI);

  // report which page is currently on top to the parent (for the left-side quote).
  // Page 0 is the cover → maps to photo 01; photo pages (i>=1) map to photo i-1.
  useEffect(() => {
    if (!onActiveChange) return;
    const photoIdx = current === null ? PHOTO_TILES.length - 1 : Math.max(0, current - 1);
    onActiveChange(Math.min(PHOTO_TILES.length - 1, photoIdx));
  }, [current, onActiveChange]);

  // Soft paper-flip whoosh each time a whole page turns (either direction).
  const prevFlipRef = useRef(flipped);
  useEffect(() => {
    if (prevFlipRef.current !== flipped) {
      prevFlipRef.current = flipped;
      playFlipSound();
    }
  }, [flipped]);

  const spawnRipple = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rx = ((e.clientX - rect.left) / rect.width) * 100;
    const ry = ((e.clientY - rect.top) / rect.height) * 100;
    const id = Date.now() + Math.random();
    setRipples((r) => [...r.slice(-4), { id, rx, ry }]);
    rippleTimers.current.push(setTimeout(() => setRipples((r) => r.filter((p) => p.id !== id)), 1050));
  };

  const stopLenis = () => {
    window.__lenis?.stop();
  };

  const releaseLenis = () => {
    window.__lenis?.start();
  };

  const animateFlip = useCallback((target) => {
    if (turningRef.current) return;
    const start = scrollFlipRef.current;
    const end = Math.max(0, Math.min(total, target));
    if (start === end) return;
    turningRef.current = true;
    interactionRef.current = true;
    if (end < total) completeRef.current = false;
    stopLenis();
    const startedAt = performance.now();
    const duration = 540;
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = start + (end - start) * eased;
      scrollFlipRef.current = next;
      setScrollFlip(next);
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(tick);
      } else {
        turningRef.current = false;
        interactionRef.current = false;
        // Wait for wheel momentum to go quiet before accepting another page turn.
        wheelReleaseAtRef.current = Math.max(performance.now() + 110, lastWheelAtRef.current + 110);
        // This is the only locked-to-unlocked transition at the bottom.
        if (end === total) completeRef.current = true;
        releaseLenis();
      }
    };
    animationFrameRef.current = requestAnimationFrame(tick);
  }, [total]);

  useEffect(() => () => {
    rippleTimers.current.forEach((timer) => clearTimeout(timer));
    cancelAnimationFrame(animationFrameRef.current);
    releaseLenis();
  }, []);

  useEffect(() => {
    const onWheel = (e) => {
      const el = document.querySelector('[data-testid="section-growth"]');
      if (!el || e.deltaY === 0) return;
      const rect = el.getBoundingClientRect();
      // Use the actual viewport boundary instead of synthetic page-progress ranges.
      const inBook = rect.top <= 24 && rect.bottom >= window.innerHeight - 24;
      if (!inBook) return;

      const direction = e.deltaY > 0 ? 1 : -1;
      const current = scrollFlipRef.current;
      const atBeginning = current <= 0.001;
      const atEnd = current >= total - 0.001;
      const leaving = (direction < 0 && atBeginning) || (direction > 0 && atEnd && completeRef.current);

      if (leaving && !turningRef.current && !dragRef.current) {
        interactionRef.current = false;
        releaseLenis();
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      const now = performance.now();
      lastWheelAtRef.current = now;
      if (turningRef.current || dragRef.current) return;
      if (now < wheelReleaseAtRef.current) {
        wheelReleaseAtRef.current = now + 110;
        return;
      }

      // Lenis may settle a few pixels either side of the boundary.  Pin to the
      // measured section start before changing a page, so the site never drifts
      // while the book is handling this gesture.
      window.__lenis?.scrollTo(sectionScrollTarget(1), { immediate: true, force: true });
      const base = Math.round(current);
      interactionRef.current = true;
      stopLenis();
      animateFlip(base + direction);
    };

    document.addEventListener("wheel", onWheel, { capture: true, passive: false });
    return () => document.removeEventListener("wheel", onWheel, { capture: true });
  }, [animateFlip, total]);

  const onPointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (turningRef.current) return;
    interactionRef.current = true;
    if (scrollFlipRef.current < total) completeRef.current = false;
    stopLenis();
    dragRef.current = { startX: e.clientX, angle: 0, dir: 0 };
    setDrag(dragRef.current);
    spawnRipple(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragRef.current || turningRef.current) return;
    const w = containerRef.current?.offsetWidth || 420;
    const move = e.clientX - dragRef.current.startX; // - = drag left (forward), + = drag right (back)
    let dir = dragRef.current.dir;
    if (dir === 0 && Math.abs(move) > 5) dir = move < 0 ? 1 : -1;
    if (dir === 1 && isAtEnd) dir = 0;       // can't go past the last page
    if (dir === -1 && atStart) dir = 0;      // can't go before the cover
    const mag = Math.min(180, (Math.abs(move) / w) * 300);
    dragRef.current = { ...dragRef.current, dir, angle: mag };
    setDrag(dragRef.current);
  };
  const onPointerUp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const activeDrag = dragRef.current;
    if (!activeDrag) { setDrag(null); return; }
    let turned = false;
    if (activeDrag.angle > 32) {
      const base = Math.round(scrollFlipRef.current);
      if (activeDrag.dir === 1 && !isAtEnd) {
        turned = true;
        animateFlip(base + 1);
      } else if (activeDrag.dir === -1 && !atStart) {
        turned = true;
        animateFlip(base - 1);
      }
    }
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
    if (!turned) {
      interactionRef.current = false;
      releaseLenis();
    }
    setDrag(null);
  };

  const onPointerCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
    interactionRef.current = false;
    setDrag(null);
    releaseLenis();
  };

  return (
    <div className="relative flex flex-col items-center gap-5">
      {/* watery wash that pools behind the album and blooms as a page turns */}
      <div className="pointer-events-none absolute" aria-hidden="true" style={{ inset: 0, zIndex: 0 }}>
        <div
          className="water-ripple absolute"
          style={{
            left: "-22%", right: "-22%", top: "-16%", bottom: "-16%",
            opacity: 0.35 + curlShadow * 0.55,
            transition: drag ? "none" : "opacity 320ms ease",
          }}
        />
      </div>
      <div
        ref={containerRef}
        className="book-perspective relative aspect-[3/4] w-full max-w-[600px] cursor-grab select-none active:cursor-grabbing"
        style={{
          touchAction: "none",
          transform: "rotate(-4deg)",
          transition: drag ? "none" : "transform 600ms cubic-bezier(0.22,1,0.36,1)",
          zIndex: 1,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        data-testid="photo-book"
      >
        {/* caustic light rings sweeping from the spine — only during a flip */}
        <div
          className="water-caustic pointer-events-none absolute book-wavy"
          aria-hidden="true"
          style={{
            left: "-8%", right: "-8%", top: "-6%", bottom: "-6%",
            zIndex: 0,
            opacity: curlShadow * 0.5,
            transition: drag ? "none" : "opacity 300ms ease",
          }}
        />
        {/* Underlying subtle back-plate (adds paper depth behind the stack) */}
        <div
          className="page-paper book-wavy absolute inset-0 border border-ink-900/10"
          style={{
            transform: "translate3d(0px, 0px, -60px)",
            zIndex: 0,
            boxShadow: "0 42px 90px -44px rgba(92,62,32,0.5)",
          }}
          aria-hidden="true"
        />
        <div className="book-binding pointer-events-none" aria-hidden="true" />
        <div className="book-page-edges pointer-events-none" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        {/* "The End" plate — fades in ON TOP once every photo has been flipped.
            A soft warm paper title page with the same watery edge as the album. */}
        <div
          className="page-paper book-wavy absolute inset-0 flex flex-col items-center justify-center border border-ink-900/10 p-8 text-center"
          style={{
            zIndex: total + 10,
            opacity: isAtEnd ? 1 : 0,
            transform: isAtEnd ? "scale(1)" : "scale(0.965)",
            pointerEvents: isAtEnd ? "auto" : "none",
            boxShadow: "0 46px 100px -40px rgba(92,62,32,0.5)",
            transition: "opacity 700ms cubic-bezier(0.22,1,0.36,1), transform 700ms cubic-bezier(0.22,1,0.36,1)",
          }}
          data-testid="book-the-end"
        >
          <div className="pointer-events-none absolute inset-5 rounded-[1rem] border border-ink-900/15" style={{ borderRadius: "inherit" }} />
          <p
            className="font-serif text-7xl italic leading-none"
            style={{
              background: "linear-gradient(180deg, #4a3220 0%, #7a5a37 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 2px 24px rgba(120, 80, 40, 0.15)",
            }}
          >
            The End
          </p>
          <div className="mt-6 flex items-center gap-3">
            <span className="h-px w-10 bg-ink-900/30" />
            <span className="font-sans text-[10px] uppercase tracking-[0.5em] text-ink-700/70">until next time ✿</span>
            <span className="h-px w-10 bg-ink-900/30" />
          </div>
          <p className="mt-6 max-w-[75%] font-script text-2xl text-ink-900/70 items-center">
            for you, always.
          </p>
          <p className="mt-8 font-sans text-[9px] uppercase tracking-[0.4em] text-ink-700/50">drag right to look back ↺</p>
        </div>
        {/* soft, warm cast shadow thrown by the page currently mid-flip — sits above
            the revealed page but below the flipping page, strongest near the spine */}
        <div
          className="pointer-events-none absolute inset-0 book-wavy"
          style={{
            zIndex: total + 1,
            opacity: curlShadow * 0.9,
            background:
              "linear-gradient(90deg, rgba(74,50,26,0.26) 0%, rgba(74,50,26,0.12) 34%, rgba(74,50,26,0.03) 58%, transparent 74%)",
            transition: drag ? "none" : "opacity 220ms ease",
          }}
          aria-hidden="true"
        />
        {/* water ripple layer — blooms from the grab point, clipped to the wavy page */}
        <div
          className="book-wavy pointer-events-none absolute inset-0 overflow-hidden"
          style={{ zIndex: total + 6 }}
          aria-hidden="true"
        >
          {ripples.map((r) => (
            <span key={r.id} className="book-ripple" style={{ left: `${r.rx}%`, top: `${r.ry}%` }} />
          ))}
        </div>
        {pages.map((page, i) => {
          let angle = 0;
          let isDraggingPage = false;
          if (i === reverseIdx) {
            // this page is being turned BACK (un-flipping from 180° → 0°)
            angle = 180 - drag.angle;
            isDraggingPage = true;
          } else if (i < flipped) {
            angle = 180;
          } else if (i === flipped && current !== null) {
            const scrollAngle = fraction * 180;
            if (drag && drag.dir === 1) { angle = Math.max(scrollAngle, drag.angle); isDraggingPage = true; }
            else angle = scrollAngle;
          }
          let zIndex;
          if (i === reverseIdx) zIndex = total + 3;
          else if (i === current && angle > 0) zIndex = total + 2;
          else if (i < flipped) zIndex = i + 1;
          else zIndex = total - i;
          // pages still in the stack peek out behind the top page → depth.
          // Only a small x/y offset (no scale, no translateZ) so EVERY page stays
          // the exact same size as the cover and the end page.
          const behind = Math.max(0, i - flipped);
          const d = Math.min(behind, 4);
          const stack = behind > 0
            ? `translate3d(${d * 2}px, ${d * 2}px, 0px)`
            : "translate3d(0px, 0px, 0px)";
          const midFlipCurl = isDraggingPage || (angle > 0 && angle < 180 && (i === flipped || i === reverseIdx));
          const curlOpacity = Math.sin((Math.min(180, angle) / 180) * Math.PI);

          /* ── Cover / title page — the very first flip, like opening a real album ── */
          if (page.cover) {
            return (
              <div
                key={i}
                className="book-page"
                data-testid="book-cover"
                style={{
                  zIndex,
                  transform: `${stack} rotateY(${-angle}deg)`,
                  transition: isDraggingPage ? "none" : "transform 540ms cubic-bezier(0.22,1,0.36,1)",
                }}
              >
                {/* bookmark ribbon peeking from the top of the album */}
                <div
                  className="pointer-events-none absolute"
                  aria-hidden="true"
                  style={{
                    top: "-22px", left: "64%", width: "26px", height: "72px", zIndex: 0,
                    background: "linear-gradient(180deg,#d24a33 0%,#b23a26 55%,#8f2c1c 100%)",
                    clipPath: "polygon(0 0,100% 0,100% 100%,50% 74%,0 100%)",
                    borderRadius: "3px 3px 0 0",
                    boxShadow: "0 10px 16px -8px rgba(60,20,10,0.55)",
                  }}
                />
                {/* front of the cover */}
                <div className="page-face book-wavy page-paper border border-ink-900/15" style={{ boxShadow: "0 30px 78px -42px rgba(92,62,32,0.5)" }}>
                  <div className="pointer-events-none absolute inset-5 rounded-[0.4rem] border border-ink-900/20" />
                  <div className="pointer-events-none absolute inset-7 rounded-[0.3rem] border border-ink-900/10" />
                  {/* soft embossed inner panel behind the title */}
                  <div className="pointer-events-none absolute inset-x-10 top-1/4 h-40 rounded-[1.2rem]" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.35), rgba(120,90,50,0.06))", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -2px 6px rgba(120,80,40,0.12)" }} />
                  <div className="relative flex h-full w-full flex-col items-center justify-center p-8 text-center">
                    <p className="font-sans text-[10px] uppercase tracking-[0.5em] text-ink-700/70">a keepsake album</p>
                    <p
                      className="mt-8 font-serif text-7xl italic leading-none foil-text"
                      style={{ filter: "drop-shadow(0 1px 0 rgba(255,255,255,0.6)) drop-shadow(0 2px 2px rgba(90,60,30,0.4))" }}
                    >
                      Sakshi
                    </p>
                    <div className="my-6 flex items-center gap-3">
                      <span className="h-px w-10 bg-ink-900/30" />
                      <span className="h-1.5 w-1.5 rounded-full bg-sunflower" />
                      <span className="h-px w-10 bg-ink-900/30" />
                    </div>
                    <p className="font-sans text-[11px] uppercase tracking-[0.45em] text-ink-900/70">Vol. 01</p>
                    <p className="mt-8 font-script text-2xl text-ink-900/60">a garden of ordinary years</p>
                    <p className="mt-2 font-sans text-[10px] uppercase tracking-[0.4em] text-ink-700/60">17 · September</p>
                  </div>
                  <div className="absolute bottom-0 right-0 top-0 w-8 bg-gradient-to-l from-black/10 to-transparent" />
                  {midFlipCurl ? (
                    <div
                      className="pointer-events-none absolute inset-y-0 left-0 w-2/5"
                      style={{
                        background: "linear-gradient(90deg, rgba(60,40,20,0.30) 0%, rgba(60,40,20,0.10) 45%, transparent 100%)",
                        opacity: curlOpacity,
                      }}
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
                {/* back of the cover */}
                <div className="page-face page-face--back book-wavy page-paper border border-ink-900/10" style={{ boxShadow: "0 30px 78px -42px rgba(92,62,32,0.4)" }}>
                  <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
                    <p className="font-sans text-[9px] uppercase tracking-[0.4em] text-ink-700/60">for you, always</p>
                    <p className="mt-4 max-w-[80%] font-script text-3xl leading-relaxed text-ink-900/80">
                      a metadata for a moment. a record of a day. a keepsake for a lifetime.
                    </p>
                    <span className="mt-6 h-px w-10 bg-ink-900/20" />
                  </div>
                  <div className="absolute bottom-0 left-0 top-0 w-8 bg-gradient-to-r from-black/8 to-transparent" />
                </div>
                <PageTurnDetail active={midFlipCurl} opacity={curlOpacity} />
              </div>
            );
          }

          const tile = page;
          const photoNum = i; // photo pages start at i=1 → photo 01, 02, …
          return (
            <div
              key={i}
              className="book-page"
              data-testid={`photo-card-${photoNum - 1}`}
              style={{
                zIndex,
                transform: `${stack} rotateY(${-angle}deg)`,
                transition: isDraggingPage ? "none" : "transform 540ms cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              {/* front: photo tile */}
              <div className={`page-face book-wavy border border-ink-900/10 bg-gradient-to-br ${tile.from} ${tile.to}`} style={{ boxShadow: "0 30px 78px -42px rgba(92,62,32,0.5)" }}>
                {/* real photo (shown when tile.img is set), else the gradient shows */}
                {tile.img ? (
                  <>
                    <img src={tile.img} alt={tile.label} draggable={false} className="absolute inset-0 h-full w-full object-cover" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
                  </>
                ) : (
                  /* ── placeholder marker so you can see exactly where to drop your photo ── */
                  <>
                    <div className="pointer-events-none absolute inset-4 rounded-md border border-dashed border-ink-900/25" />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-ink-900/50">
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-ink-900/25">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                            <rect x="3" y="5" width="18" height="14" rx="2" />
                            <circle cx="9" cy="11" r="1.5" />
                            <path d="M21 17l-5-5-6 6" />
                          </svg>
                        </div>
                        <p className="font-sans text-[9px] uppercase tracking-[0.4em]">add photo</p>
                        <p className="mt-1 font-mono text-[10px] tracking-tight">/photos/photo-{String(photoNum).padStart(2, "0")}.jpg</p>
                      </div>
                    </div>
                  </>
                )}
                <div className="relative flex h-full w-full flex-col justify-end p-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className={`font-sans text-[10px] uppercase tracking-[0.35em] ${tile.img ? "text-white/80" : "text-ink-900/70"}`}>{tile.label}</p>
                      <p className={`mt-1 max-w-[80%] font-script text-2xl ${tile.img ? "text-white" : "text-ink-900"}`}>{tile.note}</p>
                    </div>
                    <div className={`text-right font-serif italic ${tile.img ? "text-white/80" : "text-ink-900/70"}`}>no. 0{photoNum}</div>
                  </div>
                </div>
                {/* right-edge page curl hint (static) */}
                <div className="absolute bottom-0 right-0 top-0 w-8 bg-gradient-to-l from-black/10 to-transparent" />
                {/* dynamic curl shadow on the actively-flipping page — makes paper feel real */}
                {midFlipCurl ? (
                  <div
                    className="pointer-events-none absolute inset-y-0 left-0 w-2/5"
                    style={{
                      background: "linear-gradient(90deg, rgba(60,40,20,0.30) 0%, rgba(60,40,20,0.10) 45%, transparent 100%)",
                      opacity: curlOpacity,
                    }}
                    aria-hidden="true"
                  />
                ) : null}
                <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-multiply bg-[radial-gradient(ellipse_at_top_left,rgba(0,0,0,0.15),transparent_70%)]" />
              </div>
              {/* back: paper note — subtle grain so it reads as real paper, not flat cream */}
              <div className="page-face page-face--back book-wavy border border-ink-900/10 page-paper" style={{ boxShadow: "0 30px 78px -42px rgba(92,62,32,0.4)" }}>
                <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
                  <p className="font-sans text-[9px] uppercase tracking-[0.4em] text-ink-700/60">verso · 0{photoNum}</p>
                  <p className="mt-4 font-script text-3xl leading-relaxed text-ink-900/80">{tile.back}</p>
                  <span className="mt-6 h-px w-10 bg-ink-900/20" />
                </div>
                <div className="absolute bottom-0 left-0 top-0 w-8 bg-gradient-to-r from-black/8 to-transparent" />
              </div>
              <PageTurnDetail active={midFlipCurl} opacity={curlOpacity} />
            </div>
          );
        })}
      </div>

      <div className="relative z-[1] flex w-full max-w-[600px] items-center justify-between font-sans text-[10px] uppercase tracking-[0.35em] text-ink-700" data-testid="book-hint">
        <span>{isAtEnd ? "drag right to look back ↺" : atStart ? "a treasure opens a treasure →" : "← explore →"}</span>
        <span data-testid="book-page-counter">
          {String(Math.min(flipped + 1, total)).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
};

const FlipBookPage = forwardRef(({ children, className = "" }, ref) => (
  <div ref={ref} className={`photobook-page ${className}`}>
    {children}
  </div>
));
FlipBookPage.displayName = "FlipBookPage";

const PhotoBook = ({ onActiveChange }) => {
  const bookRef = useRef(null);
  const currentPageRef = useRef(0);
  const turningRef = useRef(false);
  const completeRef = useRef(false);
  const scrollLockRef = useRef(false);
  const wheelReleaseAtRef = useRef(0);
  const lastWheelAtRef = useRef(0);
  const [pageIndex, setPageIndex] = useState(0);
  const pageCount = PHOTO_TILES.length * 2 + 3;

  const getBook = useCallback(() => bookRef.current?.pageFlip?.(), []);
  const releaseLenis = useCallback(() => window.__lenis?.start(), []);
  const stopLenis = useCallback(() => window.__lenis?.stop(), []);

  const syncPage = useCallback((nextPage) => {
    const page = Math.max(0, Math.min(pageCount - 1, nextPage));
    currentPageRef.current = page;
    setPageIndex(page);
    const photoIndex = Math.min(PHOTO_TILES.length - 1, Math.max(0, Math.floor((page - 2) / 2)));
    onActiveChange?.(photoIndex);
  }, [onActiveChange, pageCount]);

  const readCurrentPage = useCallback(() => {
    const page = getBook()?.getCurrentPageIndex?.() ?? currentPageRef.current;
    syncPage(page);
    return page;
  }, [getBook, syncPage]);

  const onFlip = useCallback((event) => {
    syncPage(event.data);
  }, [syncPage]);

  const onChangeState = useCallback((event) => {
    if (event.data === "read") {
      turningRef.current = false;

      const page = readCurrentPage();
      const isComplete = page >= pageCount - 1;

      completeRef.current = isComplete;

      wheelReleaseAtRef.current = Math.max(
        performance.now() + 110,
        lastWheelAtRef.current + 110
      );

      // The book has finished. From this point onward,
      // it must stop consuming downward wheel input.
      if (isComplete) {
        scrollLockRef.current = false;
      }

      releaseLenis();
      return;
    }

    turningRef.current = true;
    stopLenis();
  }, [pageCount, readCurrentPage, releaseLenis, stopLenis]);

  useEffect(() => () => releaseLenis(), [releaseLenis]);

  useEffect(() => {
    const onWheel = (event) => {
      const section = document.querySelector('[data-testid="section-growth"]');
      if (!section || event.deltaY === 0) return;
      const rect = section.getBoundingClientRect();
      const isPinned = rect.top <= 24 && rect.bottom >= window.innerHeight - 24;
      if (!isPinned) return;

      if (!scrollLockRef.current) {
        releaseLenis();
        return;
      } 

      const direction = event.deltaY > 0 ? 1 : -1;
      const page = currentPageRef.current;
      const leaving = (direction < 0 && page === 0) || (direction > 0 && page >= pageCount - 1 && completeRef.current);
      if (leaving && !turningRef.current) {
        releaseLenis();
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const now = performance.now();
      lastWheelAtRef.current = now;
      if (turningRef.current) return;
      if (now < wheelReleaseAtRef.current) {
        wheelReleaseAtRef.current = now + 110;
        return;
      }

      const book = getBook();
      if (!book) return;
      window.__lenis?.scrollTo(sectionScrollTarget(1), { immediate: true, force: true });
      turningRef.current = true;
      completeRef.current = false;
      stopLenis();
      if (direction > 0) book.flipNext();
      else book.flipPrev();
    };

    document.addEventListener("wheel", onWheel, { capture: true, passive: false });
    return () => document.removeEventListener("wheel", onWheel, { capture: true });
  }, [getBook, pageCount, releaseLenis, stopLenis]);

  const onPointerDown = (event) => {
    event.stopPropagation();
    stopLenis();
  };
  const onPointerUp = (event) => {
    event.stopPropagation();
    if (!turningRef.current) releaseLenis();
  };

  return (
    <div
      className="photobook-shell relative flex flex-col items-center gap-5"
      style={{ touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      data-testid="photo-book"
    >
      <HTMLFlipBook
        ref={bookRef}
        width={300}
        height={420}
        size="fixed"
        maxShadowOpacity={0.5}
        drawShadow
        showCover
        usePortrait={false}
        mobileScrollSupport={false}
        onInit={readCurrentPage}
        onFlip={onFlip}
        onChangeState={onChangeState}
        className="photobook"
      >
        <FlipBookPage className="photobook-cover page-paper">
          <div className="photobook-cover-inner">
            <p className="font-sans text-[10px] uppercase tracking-[0.5em] text-ink-700/70">a keepsake album</p>
            <p className="mt-8 font-serif text-7xl italic leading-none foil-text">Sakshi</p>
            <div className="my-6 flex items-center justify-center gap-3"><span className="h-px w-10 bg-ink-900/30" /><span className="h-1.5 w-1.5 rounded-full bg-sunflower" /><span className="h-px w-10 bg-ink-900/30" /></div>
            <p className="font-sans text-[11px] uppercase tracking-[0.45em] text-ink-900/70">Vol. 01</p>
            <p className="mt-8 font-script text-2xl text-ink-900/60">a garden of ordinary years</p>
            <p className="mt-2 font-sans text-[10px] uppercase tracking-[0.4em] text-ink-700/60">17 · September</p>
          </div>
        </FlipBookPage>
        <FlipBookPage className="page-paper photobook-note">
          <p className="font-sans text-[9px] uppercase tracking-[0.4em] text-ink-700/60">for you</p>
          <p className="mt-4 max-w-[80%] font-script text-3xl leading-relaxed text-ink-900/80">every page after this one is a day I kept.</p>
          <span className="mt-6 h-px w-10 bg-ink-900/20" />
        </FlipBookPage>
        {PHOTO_TILES.flatMap((tile, index) => [
          <FlipBookPage key={`${tile.label}-photo`} className={`photobook-photo bg-gradient-to-br ${tile.from} ${tile.to}`}>
            {tile.img && <img src={tile.img} alt={tile.label} draggable={false} className="absolute inset-0 h-full w-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
            <div className="relative flex h-full w-full flex-col justify-end p-6">
              <div className="flex items-end justify-between"><div><p className="font-sans text-[10px] uppercase tracking-[0.35em] text-white/80">{tile.label}</p><p className="mt-1 max-w-[80%] font-script text-2xl text-white">{tile.note}</p></div><div className="text-right font-serif italic text-white/80">{String(index + 1).padStart(2, "0")}</div></div>
            </div>
          </FlipBookPage>,
          <FlipBookPage key={`${tile.label}-note`} className="page-paper photobook-note">
            <p className="font-sans text-[9px] uppercase tracking-[0.4em] text-ink-700/60">verso · {String(index + 1).padStart(2, "0")}</p>
            <p className="mt-4 font-script text-3xl leading-relaxed text-ink-900/80">{tile.back}</p>
            <span className="mt-6 h-px w-10 bg-ink-900/20" />
          </FlipBookPage>,
        ])}
        <FlipBookPage className="page-paper photobook-end">
          <p className="font-serif text-7xl italic leading-none text-ink-900">The End</p>
          <div className="mt-6 flex items-center gap-3"><span className="h-px w-10 bg-ink-900/30" /><span className="font-sans text-[10px] uppercase tracking-[0.5em] text-ink-700/70">until next year ✿</span><span className="h-px w-10 bg-ink-900/30" /></div>
          <p className="mt-6 max-w-[75%] font-script text-2xl text-ink-900/70">for you, always.</p>
        </FlipBookPage>
      </HTMLFlipBook>
      <div className="relative z-[1] flex w-full max-w-[600px] items-center justify-between font-sans text-[10px] uppercase tracking-[0.35em] text-ink-700" data-testid="book-hint">
        <span>{pageIndex >= pageCount - 1 ? "drag right to look back ↺" : pageIndex === 0 ? "a treasure opens a treasure →" : "← explore →"}</span>
        <span data-testid="book-page-counter">{String(pageIndex + 1).padStart(2, "0")} / {String(pageCount).padStart(2, "0")}</span>
      </div>
    </div>
  );
};

/* ============= Section 2 — Butterflies + Poems ============= */
/* ═══════════════════════════════════════════════════════════════════
   ✍️  EDIT POEMS HERE — the drifting poems in the Butterflies chapter.
   Change title/body freely. align: "left" or "right" controls the side.
   The section auto-grows so long poems never overflow — add as many
   entries as you like, and use \n inside body for line breaks.
   ═══════════════════════════════════════════════════════════════════ */
const POEMS = [
  { title: "on you, in march",  body: "You arrive like weather — unannounced, everywhere at once, and I begin to reorganise the sky.", align: "left" },
  { title: "an inventory",       body: "Two freckles I know by heart. One laugh I know by pulse. A voice that made me a softer draft of myself.", align: "right" },
  { title: "small forever",      body: "There are people who happen to us like folded notes — read once, kept forever.", align: "left" },
  { title: "a soft accounting",  body: "I keep score of small things — the way you say my name after coffee, the pause before you laugh, the exact minute you fall asleep.", align: "right" },
  { title: "seventeen septembers", body: "If years were rooms, I'd walk into yours slowly. Sit on the floor. Learn the light. Stay.", align: "left" },
];

export const ButterfliesSection = () => {
  return (
    // Pulled up so Ch.02 enters right as the book's "The End" fades — tightened
    // further to remove the leftover gap after the album.
    <section className="relative w-full" data-testid="section-butterflies">
      <div className="mx-auto flex max-w-[1400px] items-start px-10 pt-32">
        <div className="w-full">
          <FadeUp>
            <p className="font-sans text-[11px] uppercase tracking-[0.4em] text-ink-700">Patience</p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h2 className="mt-4 max-w-3xl font-serif text-[6vw] font-light leading-[0.9] tracking-tight text-ink-900">
              some things are only ever <em className="italic text-peach">said</em> quietly, in poems.
            </h2>
          </FadeUp>
        </div>
      </div>

      {/* Layout grows naturally with poem length — no fixed height */}
      <div className="mx-auto max-w-[1400px] px-10 pb-48 pt-24">
        <div className="flex flex-col gap-24 md:gap-32">
          {POEMS.map((p, i) => (
            <FadeUp key={i} delay={0.05}>
              <div className={`flex ${p.align === "right" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-2xl">
                  <p className="mb-4 font-sans text-[10px] uppercase tracking-[0.35em] text-ink-700">
                    poem no.0{i + 1} · {p.title}
                  </p>
                  <p className="whitespace-pre-line break-words font-serif text-3xl font-light italic leading-snug text-ink-900 md:text-4xl">
                    {p.body}
                  </p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ============= Section 3 — Jellyfish + Humor ============= */
/* ═══════════════════════════════════════════════════════════════════
   😄 EDIT THE FUNNY NOTES HERE — the "drifting notes" in the Jellyfish chapter.
   ═══════════════════════════════════════════════════════════════════ */
const HUMOR = [
  "reasons you're impossible: you argue with google maps and win.",
  "your camera roll is 40% food, 40% skies, 20% blurry proof of joy.",
  "you fall asleep during movies you chose. every time. we love this about you.",
  "you say 'one more episode' at 2am like it's a scientific term.",
  "your playlist is called 'vibes' and has 847 songs. bold. iconic.",
];

export const JellyfishSection = () => {
  return (
    <section className="relative min-h-[220vh] w-full" data-testid="section-jellyfish">
      <div className="mx-auto max-w-[1400px] px-10 pt-32">
        <FadeUp>
          <p className="font-sans text-[11px] uppercase tracking-[0.4em] text-jelly">Drift into our first connection</p>
        </FadeUp>
        <FadeUp delay={0.1}>
          <h2 className="mt-4 max-w-3xl font-serif text-[6vw] font-light leading-[0.9] tracking-tight text-paper">
            deep in the <em className="italic text-jelly">dreamwater</em>, some truths float by.
          </h2>
        </FadeUp>
      </div>

      <div className="mx-auto max-w-[1400px] px-10 pb-40 pt-20">
        <div className="grid grid-cols-12 gap-x-8 gap-y-24">
          {HUMOR.map((h, i) => (
            <FadeUp
              key={i}
              delay={i * 0.05}
              className={`col-span-8 ${
                i % 3 === 0 ? "col-start-1" : i % 3 === 1 ? "col-start-4" : "col-start-3"
              }`}
            >
              <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-8 backdrop-blur-md">
                <p className="mb-3 font-sans text-[10px] uppercase tracking-[0.35em] text-jelly/80">
                  drifting note · 0{i + 1}
                </p>
                <p className="font-script text-3xl text-paper md:text-4xl">{h}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ============= Section 4 — Reel Wall ============= */
/* ═══════════════════════════════════════════════════════════════════
   🎬 ADD YOUR VIDEOS HERE — the reel wall.
   Put clips in  /public/reels/  then set  src: "/reels/yourclip.mp4".
   Optional poster (thumbnail image) shown on the tile: poster: "/reels/thumb.jpg".
   Leave src: "" / poster: "" to keep the gradient placeholder tile.
   ═══════════════════════════════════════════════════════════════════ */
const REELS = [
  { label: "video 01", src: "/reels/reel-01.mp4", poster: "", from: "from-sunflower", to: "to-peach", tall: false },
  { label: "video 02", src: "/reels/reel-02.mp4", poster: "", from: "from-dusty", to: "to-sunflower", tall: true },
  { label: "video 03", src: "/reels/reel-03.mp4", poster: "", from: "from-sage", to: "to-jelly", tall: false },
  { label: "video 04", src: "/reels/reel-04.mp4", poster: "", from: "from-peach", to: "to-dusty", tall: true },
  { label: "video 05", src: "/reels/reel-05.mp4", poster: "", from: "from-jelly", to: "to-peach", tall: false },
  { label: "video 06", src: "/reels/reel-06.mp4", poster: "", from: "from-sunflower/80", to: "to-sage", tall: true },
  { label: "video 07", src: "/reels/reel-07.mp4", poster: "", from: "from-peach", to: "to-jelly", tall: false },
  { label: "video 08", src: "/reels/reel-08.mp4", poster: "", from: "from-dusty", to: "to-sage", tall: false },
];

export const ReelSection = () => {
  const [expanded, setExpanded] = useState(null);
  const videoRef = useRef(null);
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    scrollStore.set({ reelOpen: expanded !== null });
    if (expanded === null) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setExpanded(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    };
  }, [expanded]);
  return (
    <section className="relative min-h-[110vh] w-full" data-testid="section-reels">
      <div className="mx-auto max-w-[1400px] px-10 pt-32">
        <div className="mb-16 flex items-end justify-between">
          <div>
            <FadeUp>
              <p className="font-sans text-[11px] uppercase tracking-[0.4em] text-ink-700">a few memories/ <br/> many more to make</p>
            </FadeUp>
            <FadeUp delay={0.1}>
              <h2 className="mt-4 max-w-3xl font-serif text-[6vw] font-light leading-[0.9] tracking-tight text-ink-900">
                a wall of <em className="italic text-peach">frames.</em>
              </h2>
            </FadeUp>
          </div>
          <FadeUp delay={0.2}>
            <p className="max-w-sm font-sans text-sm leading-relaxed text-ink-700">
              Well I tried to fit all the memories I have of you, but it seems it won't be enough, still here's a few which are my favourites&nbsp;
            </p>
          </FadeUp>
        </div>

        <div className="grid grid-cols-4 gap-4 pb-32">
          {REELS.map((r, i) => (
            <ReelTile key={i} tile={r} index={i} onOpen={() => setExpanded(i)} />
          ))}
        </div>
      </div>

      {expanded !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[85] flex items-center justify-center bg-ink-900/70 p-10 backdrop-blur-xl"
          onClick={() => setExpanded(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${REELS[expanded].label} reel`}
          data-testid="reel-modal"
        >
          <motion.div
            layout
            initial={{ scale: 0.9, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`relative flex max-h-[82vh] max-w-5xl overflow-hidden rounded-xl bg-gradient-to-br ${REELS[expanded].from} ${REELS[expanded].to}`}
            onClick={(e) => e.stopPropagation()}
          >
            {REELS[expanded].src ? (
              /* real video plays here when a src is provided */
              <video
                ref={videoRef}
                src={REELS[expanded].src}
                poster={REELS[expanded].poster || undefined}
                controls
                autoPlay
                playsInline
                className="max-h-[82vh] max-w-full w-auto h-auto rounded-xl bg-black object-contain"
                data-testid="reel-video"
              />
            ) : (
              <div className={`flex aspect-video w-full items-center justify-center bg-gradient-to-br ${REELS[expanded].from} ${REELS[expanded].to}`}>
                <div className="text-center">
                  <p className="font-sans text-xs uppercase tracking-[0.4em] text-ink-900/70">now playing</p>
                  <p className="mt-3 font-serif text-6xl italic text-ink-900">{REELS[expanded].label}</p>
                  <p className="mt-4 font-script text-2xl text-ink-900/80">a memory in motion ✿</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setExpanded(null)}
              aria-label="Close reel"
              className="absolute right-6 top-6 rounded-full border border-ink-900/30 bg-white/60 px-5 py-2 font-sans text-xs uppercase tracking-[0.3em] text-ink-900 hover:bg-white"
              data-testid="reel-close"
            >
              close
            </button>
            {/* delicate corner-mark frame — gallery print feel */}
            <div className="pointer-events-none absolute inset-3 z-10" aria-hidden="true">
              <span className="absolute left-0 top-0 h-6 w-6 border-l border-t border-white/70" />
              <span className="absolute right-0 top-0 h-6 w-6 border-r border-t border-white/70" />
              <span className="absolute bottom-0 left-0 h-6 w-6 border-b border-l border-white/70" />
              <span className="absolute bottom-0 right-0 h-6 w-6 border-b border-r border-white/70" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
};

const ReelTile = ({ tile, index, onOpen }) => {
  const [hover, setHover] = useState(false);
  const hasVideo = Boolean(tile.src);
  const hasPoster = Boolean(tile.poster);
  return (
    <motion.button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onOpen}
      data-testid={`reel-tile-${index}`}
      className={`tile-clip relative overflow-hidden rounded-lg text-left ${tile.tall ? "aspect-[3/4]" : "aspect-[4/5]"} bg-gradient-to-br ${tile.from} ${tile.to}`}
      style={{ transform: hover ? "translateY(-6px) scale(1.02)" : "translateY(0) scale(1)" }}
    >
      {/* video-as-thumbnail: muted, silent, first frame preview, blurred + filtered so it feels stylised */}
      {hasVideo && !hasPoster && (
        <video
          src={tile.src}
          muted
          loop
          playsInline
          preload="metadata"
          autoPlay
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            filter: hover
              ? "blur(1px) saturate(1.25) contrast(1.05) brightness(0.95)"
              : "blur(3px) saturate(1.35) contrast(1.08) brightness(0.9)",
            transition: "filter 700ms ease",
          }}
        />
      )}
      {/* static poster (jpg/png) — same aesthetic filters as the video path */}
      {hasPoster && (
        <img
          src={tile.poster}
          alt={tile.label}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            filter: hover
              ? "blur(1px) saturate(1.25) contrast(1.05) brightness(0.95)"
              : "blur(3px) saturate(1.35) contrast(1.08) brightness(0.9)",
            transition: "filter 700ms ease",
          }}
        />
      )}
      {/* warm tint overlay makes every thumbnail feel curated & consistent */}
      {(hasVideo || hasPoster) && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-peach/25 via-transparent to-ink-900/35 mix-blend-multiply" />
      )}
      {/* film grain + soft vignette — overlays sit ON TOP of the video/poster,
          so they adapt automatically to whatever reel you drop in later */}
      <div className="pointer-events-none absolute inset-0 reel-grain" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 reel-vignette" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.35),transparent_60%)]" />
      <div className="absolute left-4 top-4">
        <p className={`font-sans text-[9px] uppercase tracking-[0.4em] ${hasVideo || hasPoster ? "text-white/90" : "text-ink-900/70"}`}>reel · 0{index + 1}</p>
      </div>
      <div className="absolute inset-x-4 bottom-4 flex items-end justify-between">
        <p className={`font-serif text-2xl italic ${hasVideo || hasPoster ? "text-white" : "text-ink-900"}`}>{tile.label}</p>
        <motion.span
          animate={hover ? { rotate: 45, opacity: 1 } : { rotate: 0, opacity: 0.75 }}
          className={`rounded-full border ${hasVideo || hasPoster ? "border-white/60 bg-white/25 text-white" : "border-ink-900/40 bg-white/40 text-ink-900"} px-3 py-1 font-sans text-[10px] uppercase tracking-[0.3em] backdrop-blur-sm`}
        >
          play
        </motion.span>
      </div>
      {/* hover shimmer */}
      <motion.div
        animate={hover ? { opacity: 1 } : { opacity: 0 }}
        className="pointer-events-none absolute inset-0 mix-blend-overlay bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.35)_50%,transparent_70%)] bg-[length:200%_100%]"
        style={{ backgroundPosition: hover ? "100% 0" : "0 0", transition: "background-position 1200ms ease" }}
      />
    </motion.button>
  );
};

/* ============= Section 5 — Editorial Marquee + Finale ============= */
// Finale ribbon phrases. Swap the nickname lines below for the ones you call her.
// 💛 EDIT NICKNAMES / PHRASES HERE — the scrolling ribbon in the finale.
export const FINALE_PHRASES = [
  "For Sakshi",
  "My Baby",
  "My Moon",
  "My Momos",
  "My Shawarma",
  "My KFC",
  "My Pookie",
  "My Charm",
  "My Teddy",
  "My Sunflower",
  "My Sunshine",
  "My Sunset",
  "My Eclipse",
  "My Sadness",
  "My Happiness",
  "My Saku",
  "My Kaju Katli",
  "My Love",
  "My Heart",
  "My obsession",
  "My nakhre wali",
  "My treasure",
  "My charm",
  "My Anam Cara",
  "My Senorita",
  "My radiant",
  "My angel",
  "My divine",
  "My eternal",
  "My ethereal",
  "My graceful",
  "My enchanting"
];

export const MarqueeStrip = () => {
  const trackRef = useRef(null);
  const rowRef = useRef(null);
  const offsetRef = useRef(0);        // current translateX in px (negative = moved left)
  const rowWidthRef = useRef(0);      // width of a single duplicated row (for looping)
  const dragRef = useRef(null);       // { startX, startOffset, moved }
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);

  // measure row width
  useEffect(() => {
    const measure = () => {
      if (rowRef.current) rowWidthRef.current = rowRef.current.getBoundingClientRect().width;
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // rAF loop for auto-scroll + wrap-around
  useEffect(() => {
    let raf;
    let last = performance.now();
    const speed = 60; // px/sec, leftward
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!dragging && !paused) offsetRef.current -= speed * dt;
      const w = rowWidthRef.current || 1;
      // Wrap so translateX is always within (-w, 0]
      if (offsetRef.current <= -w) offsetRef.current += w;
      if (offsetRef.current > 0) offsetRef.current -= w;
      if (trackRef.current) trackRef.current.style.transform = `translate3d(${offsetRef.current}px,0,0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dragging, paused]);

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startOffset: offsetRef.current, moved: 0 };
    setDragging(true);
  };
  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    dragRef.current.moved = Math.abs(dx);
    offsetRef.current = dragRef.current.startOffset + dx; // drag right → show previous words
  };
  const onPointerUp = () => {
    dragRef.current = null;
    setDragging(false);
  };

  return (
    <div
      className="relative overflow-hidden border-y border-ink-900/10 bg-paper/40 py-6"
      data-testid="marquee"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className={`marquee-track flex whitespace-nowrap select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{
          touchAction: "none",
          willChange: "transform",
          WebkitUserSelect: "none",
          userSelect: "none",
          WebkitUserDrag: "none",
        }}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        data-testid="marquee-track"
      >
        {/* Two identical rows, side by side, allow seamless wrap. */}
        {[0, 1].map((k) => (
          <div
            key={k}
            ref={k === 0 ? rowRef : null}
            className="flex shrink-0 items-center gap-10 pr-10"
          >
            {FINALE_PHRASES.map((t, i) => (
              <span key={i} className="flex items-center gap-10">
                <span
                  className="font-serif text-6xl italic text-ink-900/85 md:text-7xl"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  style={{ WebkitUserDrag: "none" }}
                >
                  {t}
                </span>
                <span className="h-2 w-2 rounded-full bg-sunflower" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const FinaleSection = () => {
  const triggeredRef = useRef(false);

  // Auto-scroll from the end of the Ch.04 Reel section straight into the
  // finale — user should NOT have to manually scroll through the gap. Fires
  // once, then never fights the user again.
  useEffect(() => {
    const compute = () => {
      if (triggeredRef.current) return;
      const reels = document.querySelector('[data-testid="section-reels"]');
      const finale = document.querySelector('[data-testid="section-finale"]');
      if (!reels || !finale) return;
      const r = reels.getBoundingClientRect();
      // Trigger as soon as the reel wall is ~90% scrolled past — i.e. the user
      // has clearly finished the second-to-last chapter.
      const reelsBottomFromTop = r.bottom; // rect.bottom relative to viewport top
      if (reelsBottomFromTop <= window.innerHeight * 0.6 && reelsBottomFromTop > 0) {
        triggeredRef.current = true;
        const target = window.scrollY + finale.getBoundingClientRect().top;
        if (window.__lenis) {
          window.__lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 3) });
        } else {
          window.scrollTo({ top: target, behavior: "smooth" });
        }
      }
    };
    const unsub = scrollStore.subscribe(compute);
    compute();
    return unsub;
  }, []);

  return (
    // Finale is exactly one viewport tall: strip pinned to top, birthday
    // headline sits around 25–30% down, everything else stacks below it.
    <section className="relative min-h-screen w-full" data-testid="section-finale">
      {/* Marquee strip lives at the very top of the viewport */}
      <div className="pt-6">
        <MarqueeStrip />
      </div>

      {/* Birthday block — offset from top so it sits ABOVE the vertical middle */}
      <div className="flex flex-col items-center px-10 pb-16" style={{ paddingTop: "16vh" }}>
        <FadeUp>
          <p className="mb-5 text-center font-sans text-[11px] uppercase tracking-[0.4em] text-ink-700">
            Full Bloom
          </p>
        </FadeUp>
        <FadeUp delay={0.1}>
          <h2 className="text-center font-serif text-[9vw] font-light leading-[0.85] tracking-[-0.03em] text-ink-900">
            Happy Birthday,
            <br />
            <em className="italic text-peach">Sakshi.</em>
          </h2>
        </FadeUp>
        <FadeUp delay={0.3}>
          <p className="mt-8 text-center font-script text-4xl text-ink-900/85">
             yours dearly, faithfully, forever, safe space ✿
          </p>
        </FadeUp>
        <FadeUp delay={0.5}>
          <div className="mx-auto mt-10 max-w-lg rounded-2xl bg-paper/60 px-8 py-5 backdrop-blur-md">
            <p className="text-center font-sans text-sm leading-relaxed text-ink-700">
              your endless warmth, light and beauty shines brightly in everyone's eyes. I hope you feel the love and joy you bring to the world, today and always.
            </p>
          </div>
        </FadeUp>
        <FadeUp delay={0.8}>
          <div className="mt-8 flex items-center gap-4 font-sans text-[10px] uppercase tracking-[0.4em] text-ink-700">
            <span className="h-px w-16 bg-ink-900/40" />
            <span>with love · always</span>
            <span className="h-px w-16 bg-ink-900/40" />
          </div>
        </FadeUp>
      </div>
    </section>
  );
};

/* ============= main Experience wrapper ============= */
export const Experience = ({ onPlant, planted }) => {
  return (
    <main className="relative z-10" data-testid="experience-main">
      <IntroSection onPlant={onPlant} planted={planted} />
      <GrowthSection />
      <ButterfliesSection />
      <JellyfishSection />
      <ReelSection />
      <FinaleSection />
    </main>
  );
};

export default Experience;
