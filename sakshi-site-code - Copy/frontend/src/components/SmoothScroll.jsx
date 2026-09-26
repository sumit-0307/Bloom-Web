import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import { scrollStore } from "@/hooks/useScrollStore";

// Wraps children with a Lenis smooth-scroll instance and streams progress to the store.
const SmoothScroll = ({ children }) => {
  const lenisRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.2,
    });
    lenisRef.current = lenis;

    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    const onScroll = ({ scroll, limit }) => {
      const p = limit > 0 ? scroll / limit : 0;
      scrollStore.set({ progress: p, raw: scroll });
    };
    lenis.on("scroll", onScroll);

    // Expose for programmatic control (e.g., after seed click)
    window.__lenis = lenis;

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
      delete window.__lenis;
    };
  }, []);

  return <>{children}</>;
};

export default SmoothScroll;
