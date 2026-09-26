import React, { useEffect, useRef } from "react";
import { scrollStore } from "@/hooks/useScrollStore";

// Scroll-driven, transparent PNG frame sequence of a real sunflower growing.
// Frames were AI-generated (fal.ai Kling) then blue-screen keyed to alpha.
const COUNT = 80;
const FRAME = (i) => `/sunflower_frames/frame_${String(i).padStart(3, "0")}.png`;

const smoothstep = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const lerpKeys = (keys, p) => {
  if (p <= keys[0].p) return keys[0].v;
  const last = keys[keys.length - 1];
  if (p >= last.p) return last.v;
  for (let i = 0; i < keys.length - 1; i++) {
    if (p >= keys[i].p && p <= keys[i + 1].p) {
      const t = smoothstep(keys[i].p, keys[i + 1].p, p);
      return keys[i].v + (keys[i + 1].v - keys[i].v) * t;
    }
  }
  return last.v;
};

// horizontal centre (vw): growth LEFT, butterfly RIGHT, jellyfish LEFT, reel drift, finale CENTRE
const KX = [
  { p: 0.0, v: 22 }, { p: 0.3, v: 22 },
  { p: 0.44, v: 80 }, { p: 0.6, v: 15 },
  { p: 0.76, v: 40 }, { p: 0.9, v: 50 }, { p: 1.0, v: 50 },
];
// element height (vh) — grows a touch bigger for the finale
const KH = [
  { p: 0.0, v: 58 }, { p: 0.44, v: 64 }, { p: 0.6, v: 64 },
  { p: 0.9, v: 82 }, { p: 1.0, v: 84 },
];
// gentle tilt toward centre (deg)
const KTILT = [
  { p: 0.0, v: -4 }, { p: 0.3, v: -4 },
  { p: 0.44, v: 5 }, { p: 0.6, v: -5 },
  { p: 0.78, v: 2 }, { p: 0.9, v: 0 },
];

const SunflowerSequence = () => {
  const wrapRef = useRef(null);
  const imgRef = useRef(null);
  const preload = useRef([]);
  const st = useRef({ x: 22, h: 58, tilt: -4, vis: 0, idx: -1 });

  useEffect(() => {
    for (let i = 0; i < COUNT; i++) {
      const im = new Image();
      im.src = FRAME(i);
      preload.current.push(im);
    }
  }, []);

  useEffect(() => {
    let raf;
    const loop = () => {
      const { progress: globalProgress } = scrollStore.get();
      const p = globalProgress;
      const planted = scrollStore.get().seedPlanted;
      const s = st.current;
      s.x += (lerpKeys(KX, p) - s.x) * 0.1;
      s.h += (lerpKeys(KH, p) - s.h) * 0.1;
      s.tilt += (lerpKeys(KTILT, p) - s.tilt) * 0.1;
      s.vis += ((planted ? 1 : 0) - s.vis) * 0.08;

      // Frame 79 is reserved for the final scroll boundary of the entire story.
      const gi = Math.min(COUNT - 1, Math.floor(globalProgress * (COUNT - 1)));
      if (gi !== s.idx && imgRef.current) {
        s.idx = gi;
        imgRef.current.src = FRAME(gi);
      }

      const sway = Math.sin(performance.now() * 0.0006) * 1.4;
      const w = wrapRef.current;
      if (w) {
        w.style.opacity = s.vis.toFixed(3);
        w.style.height = s.h.toFixed(2) + "vh";
        w.style.left = s.x.toFixed(2) + "vw";
        w.style.transform = `translate(-50%, -100%) rotate(${(s.tilt + sway).toFixed(2)}deg)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={wrapRef}
      data-testid="sunflower-sequence"
      aria-hidden="true"
      style={{
        position: "fixed",
        left: "22vw",
        top: "100vh",
        height: "58vh",
        transform: "translate(-50%, -100%) rotate(-4deg)",
        transformOrigin: "50% 100%",
        zIndex: 6,
        pointerEvents: "none",
        opacity: 0,
        filter: "drop-shadow(0 26px 30px rgba(40,30,10,0.28))",
        willChange: "transform, height, left, opacity",
      }}
    >
      <img
        ref={imgRef}
        src={FRAME(0)}
        alt=""
        draggable={false}
        style={{
          height: "100%",
          width: "auto",
          display: "block",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 6%, #000 94%, transparent 100%)",
          maskImage: "linear-gradient(to right, transparent 0%, #000 6%, #000 94%, transparent 100%)",
        }}
      />
    </div>
  );
};

export default SunflowerSequence;
