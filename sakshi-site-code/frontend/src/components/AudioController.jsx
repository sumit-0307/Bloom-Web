import React, { useEffect, useRef, useState } from "react";
import { Howl } from "howler";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { scrollStore, sectionFromProgress } from "@/hooks/useScrollStore";

// Section-aware audio system. Each section has a Howl track. When the user
// scrolls into a new section: pause the previous (remember its seek), fade in
// the new one from its saved seek. When a track fully ends we let it stop and
// restart from 0 on next entry (Howler default is stop-at-end since loop=false).

const TRACK_SRCS = [
  { key: "intro", src: ["/audio/intro.mp3"], fallback: ["/audio/intro.mp3"], mood: "hushed piano · airy pads" },
  { key: "growth", src: ["/audio/growth.mp3"], fallback: ["/audio/growth.mp3"], mood: "warm strings · slow bloom" },
  { key: "butterfly", src: ["/audio/butterfly.mp3"], fallback: ["/audio/butterfly.mp3"], mood: "acoustic guitar · light bells" },
  { key: "jellyfish", src: ["/audio/jellyfish.mp3"], fallback: ["/audio/jellyfish.mp3"], mood: "underwater synths · reverb" },
  { key: "reels", src: ["/audio/reels.mp3"], fallback: ["/audio/reels.mp3"], mood: "lofi beat · nostalgic" },
  { key: "finale", src: ["/audio/finale.mp3"], fallback: ["/audio/finale.mp3"], mood: "cinematic swell · golden" },
];

const AudioController = ({ enabled }) => {
  const [muted, setMuted] = useState(true); // user must opt-in
  const mutedRef = useRef(true);
  const howlsRef = useRef([]);
  const seekRef = useRef([0, 0, 0, 0, 0, 0]);
  const pauseTimersRef = useRef([]);
  const currentIdxRef = useRef(-1);
  const [currentIdx, setCurrentIdx] = useState(-1);

  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // Initialize Howls once — external track first, local file as automatic fallback.
  useEffect(() => {
    const build = (i, useFallback = false) => {
      const t = TRACK_SRCS[i];
      return new Howl({
        src: useFallback ? t.fallback : t.src,
        html5: false,
        loop: true,
        volume: 0,
        preload: true,
        onloaderror: (_, error) => {
          if (!useFallback) {
            howlsRef.current[i]?.unload();
            howlsRef.current[i] = build(i, true);
            if (i === currentIdxRef.current && !mutedRef.current) {
              const fallback = howlsRef.current[i];
              fallback.play();
              fallback.seek(seekRef.current[i] || 0);
              fallback.fade(0, 0.55, 900);
            }
            return;
          }
          console.warn(`Unable to load ${t.key} birthday audio`, error);
        },
        onplayerror: () => { /* autoplay blocked — will retry on user interaction */ },
      });
    };
    howlsRef.current = TRACK_SRCS.map((_, i) => build(i));
    return () => {
      pauseTimersRef.current.forEach((timer) => clearTimeout(timer));
      pauseTimersRef.current = [];
      howlsRef.current.forEach((h) => { try { h.unload(); } catch { /* noop */ } });
    };
  }, []);

  // React to scroll → change section audio
  useEffect(() => {
    if (!enabled) return;
    const onScroll = ({ progress }) => {
      const idx = sectionFromProgress(progress);
      if (idx !== currentIdxRef.current) {
        const prev = currentIdxRef.current;
        currentIdxRef.current = idx;
        setCurrentIdx(idx);
        // Save seek for previous
        if (prev >= 0 && howlsRef.current[prev]) {
          try {
            const s = howlsRef.current[prev].seek();
            seekRef.current[prev] = typeof s === "number" ? s : 0;
            howlsRef.current[prev].fade(howlsRef.current[prev].volume(), 0, 600);
            const timer = setTimeout(() => howlsRef.current[prev]?.pause(), 620);
            pauseTimersRef.current.push(timer);
          } catch { /* noop */ }
        }
        // Start / resume current
        if (!muted) {
          const h = howlsRef.current[idx];
          if (h) {
            try {
              if (!h.playing()) h.play();
              h.seek(seekRef.current[idx] || 0);
              h.fade(0, 0.55, 900);
            } catch { /* audio not loaded */ }
          }
        }
      }
    };
    const unsub = scrollStore.subscribe(onScroll);
    onScroll(scrollStore.get());
    return unsub;
  }, [enabled, muted]);

  // Toggle mute
  const toggle = () => {
    setMuted((m) => {
      const nextMuted = !m;
      const idx = currentIdxRef.current >= 0 ? currentIdxRef.current : 0;
      const h = howlsRef.current[idx];
      if (h) {
        if (nextMuted) {
          h.fade(h.volume(), 0, 500);
          const timer = setTimeout(() => h.pause(), 520);
          pauseTimersRef.current.push(timer);
        } else {
          try {
            if (!h.playing()) h.play();
            h.seek(seekRef.current[idx] || 0);
            h.fade(0, 0.55, 800);
          } catch { /* noop */ }
        }
      }
      return nextMuted;
    });
  };

  if (!enabled) return null;

  return (
    <div className="pointer-events-auto fixed bottom-6 right-6 z-[75] flex items-center gap-3" data-testid="audio-controller">
      <AnimatePresence>
        {currentIdx >= 0 && (
          <motion.span
            key={currentIdx}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 0.8, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            className="rounded-full border border-ink-900/15 bg-white/60 px-4 py-2 font-sans text-[10px] uppercase tracking-[0.3em] text-ink-700 backdrop-blur-xl"
            data-testid="audio-track-label"
          >
            {`0${currentIdx + 1} · ${TRACK_SRCS[currentIdx].key}`}
          </motion.span>
        )}
      </AnimatePresence>
      <button
        onClick={toggle}
        aria-label={muted ? "Unmute" : "Mute"}
        data-testid="audio-toggle"
        className="flex h-12 w-12 items-center justify-center rounded-full border border-ink-900/15 bg-white/70 text-ink-900 backdrop-blur-xl hover:bg-sunflower"
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </div>
  );
};

export default AudioController;
