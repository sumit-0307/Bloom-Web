import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Password gate — accepts "Sakshi" (case-insensitive). On success plays a
// two-panel ribbon-split reveal, then invokes onUnlock().
const PasswordGate = ({ onUnlock }) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [phase, setPhase] = useState("idle"); // idle | opening | done
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 700);
    return () => clearTimeout(t);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const answer = value.trim().toLowerCase();
    if (answer === "sakshi") {
      setError(false);
      setPhase("opening");
      // Let ribbon animation play before revealing experience
      setTimeout(() => {
        setPhase("done");
        onUnlock?.();
      }, 2100);
    } else {
      setError(true);
      // gentle shake
      setTimeout(() => setError(false), 900);
    }
  };

  return (
    <div className="fixed inset-0 z-[80]" data-testid="password-gate">
      <AnimatePresence>
        {phase !== "done" && (
          <motion.div
            key="scene"
            className="absolute inset-0 mesh-warm"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Top ribbon */}
            <motion.div
              className="absolute inset-x-0 top-0 h-1/2 origin-top bg-[#F6EFE0]"
              initial={{ y: 0 }}
              animate={phase === "opening" ? { y: "-100%" } : { y: 0 }}
              transition={{ duration: 1.6, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
            >
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-b from-transparent to-black/10" />
            </motion.div>
            {/* Bottom ribbon */}
            <motion.div
              className="absolute inset-x-0 bottom-0 h-1/2 origin-bottom bg-[#F6EFE0]"
              initial={{ y: 0 }}
              animate={phase === "opening" ? { y: "100%" } : { y: 0 }}
              transition={{ duration: 1.6, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-t from-transparent to-black/10" />
            </motion.div>

            {/* Center content */}
            <motion.div
              className="relative z-10 flex min-h-screen items-center justify-center px-6"
              animate={phase === "opening" ? { opacity: 0, scale: 0.98 } : { opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-full max-w-xl">
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2, delay: 0.4 }}
                  className="mb-4 text-center font-sans text-[11px] uppercase tracking-[0.4em] text-ink-700"
                  data-testid="gate-chapter"
                >
                  Ch.00 — The Unwrap
                </motion.p>

                <motion.h1
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center font-serif text-5xl leading-[0.95] tracking-tight text-ink-900 md:text-6xl"
                >
                  A gift, folded <em className="italic text-peach">softly</em>,
                  <br />
                  for one name only.
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.2, delay: 1.1 }}
                  className="mt-6 text-center font-script text-2xl text-ink-700"
                >
                  whisper it below to unwrap
                </motion.p>

                <motion.form
                  onSubmit={submit}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2, delay: 1.3 }}
                  className="mx-auto mt-10 w-full max-w-md"
                >
                  <div
                    className={`relative flex items-center rounded-full border border-ink-900/15 bg-white/60 px-6 py-3 shadow-[0_10px_40px_-24px_rgba(44,42,38,0.4)] backdrop-blur-xl ${
                      error ? "animate-pulse border-destructive" : ""
                    }`}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="your name"
                      autoComplete="off"
                      spellCheck="false"
                      aria-label="Enter the recipient's name"
                      aria-invalid={error}
                      className="w-full bg-transparent font-serif text-2xl italic text-ink-900 outline-none placeholder:text-ink-500/70"
                      data-testid="gate-input"
                    />
                    <button
                      type="submit"
                      className="ml-3 rounded-full bg-ink-900 px-5 py-2 font-sans text-xs uppercase tracking-[0.25em] text-paper hover:bg-peach hover:text-ink-900"
                      data-testid="gate-submit"
                    >
                      unwrap
                    </button>
                  </div>
                  <p
                    className={`mt-3 h-4 text-center font-sans text-xs uppercase tracking-[0.3em] transition-opacity ${
                      error ? "opacity-100 text-destructive" : "opacity-0"
                    }`}
                    data-testid="gate-error"
                    role="status"
                  >
                    not quite — try again
                  </p>
                </motion.form>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ duration: 1.2, delay: 1.6 }}
                  className="mt-16 flex items-center justify-center gap-3"
                >
                  <span className="h-px w-8 bg-ink-900/40" />
                  <span className="font-sans text-[10px] uppercase tracking-[0.4em] text-ink-700">
                    17 · September
                  </span>
                  <span className="h-px w-8 bg-ink-900/40" />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PasswordGate;
