import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// A soft glowing petal that follows the cursor with a trailing petal shower.
const CustomCursor = () => {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [petals, setPetals] = useState([]);
  const lastEmit = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;

    const onMove = (e) => {
      x = e.clientX;
      y = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${x - 4}px, ${y - 4}px, 0)`;
      }
      const now = performance.now();
      if (now - lastEmit.current > 80) {
        lastEmit.current = now;
        const id = now + Math.random();
        setPetals((p) => [
          ...p.slice(-14),
          { id, x, y, rot: Math.random() * 360, hue: Math.random() },
        ]);
      }
    };

    let rafId;
    const tick = () => {
      rx += (x - rx) * 0.12;
      ry += (y - ry) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx - 22}px, ${ry - 22}px, 0)`;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    window.addEventListener("mousemove", onMove);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  useEffect(() => {
    if (petals.length === 0) return;
    const t = setTimeout(() => setPetals((p) => p.slice(1)), 900);
    return () => clearTimeout(t);
  }, [petals]);

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden="true"
        data-testid="cursor-ring"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "1px solid rgba(234,191,69,0.6)",
          pointerEvents: "none",
          zIndex: 70,
          mixBlendMode: "multiply",
        }}
      />
      <div
        ref={dotRef}
        aria-hidden="true"
        data-testid="cursor-dot"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#EABF45",
          boxShadow: "0 0 18px 4px rgba(234,191,69,0.55)",
          pointerEvents: "none",
          zIndex: 71,
        }}
      />
      <AnimatePresence>
        {petals.map((p) => (
          <motion.span
            key={p.id}
            initial={{ opacity: 0.9, x: p.x - 6, y: p.y - 6, rotate: p.rot, scale: 1 }}
            animate={{ opacity: 0, y: p.y + 40, rotate: p.rot + 90, scale: 0.4 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            aria-hidden="true"
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              width: 12,
              height: 12,
              pointerEvents: "none",
              zIndex: 69,
              background: `radial-gradient(circle at 30% 30%, ${
                p.hue > 0.5 ? "#F2A68D" : "#EABF45"
              }, transparent 70%)`,
              borderRadius: "60% 40% 60% 40%",
              filter: "blur(0.5px)",
            }}
          />
        ))}
      </AnimatePresence>
    </>
  );
};

export default CustomCursor;
