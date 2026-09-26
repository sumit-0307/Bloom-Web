import React from "react";
import { motion } from "framer-motion";

const MobileFallback = () => {
  return (
    <div
      className="mesh-warm relative flex min-h-screen w-full flex-col items-center justify-center px-6 py-12 text-center"
      data-testid="mobile-fallback"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md"
      >
        <p className="mb-8 font-sans text-[11px] uppercase tracking-[0.35em] text-ink-700">
          Ch.00 — A note
        </p>
        <h1 className="font-serif text-5xl leading-[0.95] tracking-tight text-ink-900">
          This gift is <em className="font-serif italic text-peach">meant</em> for a wider screen.
        </h1>
        <p className="mt-8 font-script text-3xl text-ink-700">
          please open me on your laptop, love ✿
        </p>
        <p className="mt-10 font-sans text-sm leading-relaxed text-ink-700">
          A cinematic scroll-driven experience — sunflowers, jellyfish and letters — bloomed
          for you across a full desktop canvas. See you there.
        </p>
        <div className="mt-12 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-ink-900/40" />
          <p className="font-serif italic text-ink-900">for Sakshi · 17.09</p>
          <span className="h-px w-10 bg-ink-900/40" />
        </div>
      </motion.div>
    </div>
  );
};

export default MobileFallback;
