import React, { useEffect, useRef } from "react";
import { scrollStore } from "@/hooks/useScrollStore";

const smoothstep = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

// deterministic bubble field for the ocean layer
const BUBBLES = Array.from({ length: 30 }).map((_, i) => {
  const r = (n) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  const size = 5 + Math.round(r(1) * 20);
  return {
    left: (r(2) * 100).toFixed(1) + "%",
    size: size + "px",
    dur: (7 + r(3) * 11).toFixed(1) + "s",
    delay: (-r(4) * 14).toFixed(1) + "s",
    op: (0.18 + r(5) * 0.42).toFixed(2),
    drift: (r(6) * 40 - 20).toFixed(0) + "px",
  };
});

/* Underwater ocean gradient + light rays + rising bubbles — Jellyfish section */
export const OceanLayer = () => {
  const ref = useRef(null);
  useEffect(() => {
    const unsub = scrollStore.subscribe(({ progress }) => {
      const { sectionIndex, sectionProgress } = scrollStore.get();
      const chapterProgress = sectionIndex < 3 ? 0 : sectionIndex > 3 ? 1 : sectionProgress;
      const vis = smoothstep(0.05, 0.2, chapterProgress) * (1 - smoothstep(0.78, 0.98, chapterProgress));
      if (ref.current) ref.current.style.opacity = vis.toFixed(3);
    });
    return unsub;
  }, []);
  return (
    <div
      ref={ref}
      className="ocean-layer pointer-events-none fixed inset-0 z-[3]"
      aria-hidden="true"
      data-testid="ocean-layer"
      style={{ opacity: 0 }}
    >
      <div className="ocean-rays" />
      <div className="bubbles">
        {BUBBLES.map((b, i) => (
          <span
            key={i}
            className="bubble"
            style={{
              left: b.left,
              width: b.size,
              height: b.size,
              opacity: b.op,
              animationDuration: b.dur,
              animationDelay: b.delay,
              "--drift": b.drift,
            }}
          />
        ))}
      </div>
    </div>
  );
};

/* Warm sunrise backlight behind the finale sunflower */
export const FinaleGlow = () => {
  const ref = useRef(null);
  useEffect(() => {
    const unsub = scrollStore.subscribe(({ progress }) => {
      const { sectionIndex, sectionProgress } = scrollStore.get();
      const finaleProgress = sectionIndex < 5 ? 0 : sectionProgress;
      const vis = smoothstep(0.1, 0.75, finaleProgress);
      if (ref.current) ref.current.style.opacity = vis.toFixed(3);
    });
    return unsub;
  }, []);
  return (
    <div
      ref={ref}
      className="finale-glow pointer-events-none fixed inset-0 z-[4]"
      aria-hidden="true"
      data-testid="finale-glow"
      style={{ opacity: 0 }}
    />
  );
};

/* Soft drifting colour wash for the growth + butterfly chapters */
export const AuroraGlow = () => {
  const ref = useRef(null);
  useEffect(() => {
    const unsub = scrollStore.subscribe(({ progress }) => {
      const { sectionIndex, sectionProgress } = scrollStore.get();
      const growthProgress = sectionIndex < 1 ? 0 : sectionIndex > 2 ? 1 : sectionIndex === 1 ? sectionProgress : 1;
      const vis = smoothstep(0.05, 0.3, growthProgress) * (1 - smoothstep(0.8, 1, growthProgress));
      if (ref.current) ref.current.style.opacity = (vis * 0.9).toFixed(3);
    });
    return unsub;
  }, []);
  return (
    <div
      ref={ref}
      className="aurora-glow pointer-events-none fixed inset-0 z-[3]"
      aria-hidden="true"
      style={{ opacity: 0 }}
    />
  );
};
