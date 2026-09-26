import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import { measureSections, sectionStateFromProgress, scrollStore } from "@/hooks/useScrollStore";

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

    const updateScrollState = (scroll, limit) => {
      const p = limit > 0 ? scroll / limit : 0;
      const section = sectionStateFromProgress(p, measureSections());
      scrollStore.set({ progress: p, raw: scroll, sectionIndex: section.index, sectionProgress: section.progress });
    };
    const onScroll = ({ scroll, limit }) => updateScrollState(scroll, limit);
    lenis.on("scroll", onScroll);
    const onResize = () => updateScrollState(lenis.scroll, lenis.limit);
    window.addEventListener("resize", onResize);
    updateScrollState(lenis.scroll, lenis.limit);

    // Expose for programmatic control (e.g., after seed click)
    window.__lenis = lenis;

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.removeEventListener("resize", onResize);
      lenisRef.current = null;
      delete window.__lenis;
    };
  }, []);

  return <>{children}</>;
};

export default SmoothScroll;
