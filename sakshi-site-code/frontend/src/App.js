import { useEffect, useState } from "react";
import "@/App.css";
import PasswordGate from "@/components/PasswordGate";
import MobileFallback from "@/components/MobileFallback";
import SmoothScroll from "@/components/SmoothScroll";
import GrainOverlay from "@/components/GrainOverlay";
import CustomCursor from "@/components/CustomCursor";
import AudioController from "@/components/AudioController";
import Scene3D from "@/experience/Scene3D";
import SunflowerSequence from "@/experience/SunflowerSequence";
import { OceanLayer, FinaleGlow, AuroraGlow } from "@/experience/Atmosphere";
import Experience, { ScrollBackground, ChapterNav } from "@/experience/Experience";
import { scrollStore } from "@/hooks/useScrollStore";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => {
      const narrow = window.matchMedia("(max-width: 900px)").matches;
      const touchOnly = window.matchMedia("(hover: none)").matches;
      setIsMobile(narrow || touchOnly);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function App() {
  const isMobile = useIsMobile();
  const [unlocked, setUnlocked] = useState(false);
  const [planted, setPlanted] = useState(false);

  useEffect(() => { scrollStore.set({ seedPlanted: planted }); }, [planted]);

  const handlePlant = () => {
    setPlanted(true);
    // gently scroll down to trigger growth
    setTimeout(() => {
      const first = document.querySelector('[data-testid="section-growth"]');
      if (first) {
        const y = first.getBoundingClientRect().top + window.scrollY - 40;
        window.__lenis?.scrollTo(y, { duration: 2.2, easing: (t) => 1 - Math.pow(1 - t, 3) });
      }
    }, 500);
  };

  if (isMobile) {
    return (
      <div className="App">
        <GrainOverlay />
        <MobileFallback />
      </div>
    );
  }

  return (
    <div className="App relative min-h-screen">
      {!unlocked && <PasswordGate onUnlock={() => setUnlocked(true)} />}

      {unlocked && (
        <SmoothScroll>
          <ScrollBackground />
          <AuroraGlow />
          <OceanLayer />
          <FinaleGlow />
          <Scene3D />
          <SunflowerSequence />
          <GrainOverlay />
          <CustomCursor />
          <ChapterNav />
          <AudioController enabled={unlocked} />
          <Experience onPlant={handlePlant} planted={planted} />
        </SmoothScroll>
      )}
    </div>
  );
}

export default App;
