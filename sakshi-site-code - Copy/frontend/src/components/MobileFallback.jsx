import React, { useState } from "react";
import { motion } from "framer-motion";
import PasswordGate from "@/components/PasswordGate";

const MOBILE_PHOTOS = Array.from({ length: 6 }, (_, index) => ({
  src: `/photos/photo-${String(index + 1).padStart(2, "0")}.jpg`,
  alt: `A memory from chapter ${index + 1}`,
}));

const MobileFallback = () => {
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <main
      className="mesh-warm relative min-h-screen w-full px-6 py-12"
      data-testid="mobile-fallback"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-md text-center"
      >
        <p className="mb-6 font-sans text-[11px] uppercase tracking-[0.35em] text-ink-700">
          A little garden for you
        </p>
        <h1 className="font-serif text-5xl leading-[0.95] tracking-tight text-ink-900">
          Happy birthday, <em className="font-serif italic text-peach">Sakshi.</em>
        </h1>
        <p className="mt-6 font-script text-3xl text-ink-700">
          a few favourite memories, wherever you are ✿
        </p>
        <p className="mt-8 font-sans text-sm leading-relaxed text-ink-700">
          The full desktop garden has extra animations, but this little version is made for
          your phone too. Scroll slowly and keep the sound on if you feel like it.
        </p>
      </motion.div>
      <section aria-label="Birthday memories" className="mx-auto mt-12 grid max-w-md grid-cols-2 gap-3">
        {MOBILE_PHOTOS.map((photo, index) => (
          <figure key={photo.src} className="overflow-hidden rounded-2xl bg-white/50 shadow-sm">
            <img src={photo.src} alt={photo.alt} loading={index > 1 ? "lazy" : "eager"} className="aspect-[4/5] w-full object-cover" />
            <figcaption className="px-3 py-3 text-left font-script text-xl text-ink-700">
              memory · 0{index + 1}
            </figcaption>
          </figure>
        ))}
      </section>
      <p className="mx-auto mt-12 max-w-md text-center font-serif italic text-ink-900">
        for Sakshi · 17 September
      </p>
    </main>
  );
};

export default MobileFallback;
