import { createContext, useContext, useState, type ReactNode } from "react";
import type { OrchestrationMode, JourneyOrchestrationType } from "../types";

export type Phase = "all" | "phase1" | "phase2";

interface PhaseContextValue {
  phase: Phase;
  setPhase: (p: Phase) => void;
  showBestChannel: boolean;
  showChannelPreferences: boolean;
  showAnalytics: boolean;
  /**
   * Best Channel does not exist in Phase 1. A campaign stored with that mode
   * runs as its fallback stage, so it is shown as Sequential Fallback there.
   */
  visibleMode: (mode: OrchestrationMode) => OrchestrationMode;
  /** Omni-channel journeys are Phase 2+; in Phase 1 they read as Cross-Channel. */
  visibleJourneyType: (type: JourneyOrchestrationType) => JourneyOrchestrationType;
}

const PhaseContext = createContext<PhaseContextValue>({ phase: "all", setPhase: () => {}, showBestChannel: true, showChannelPreferences: true, showAnalytics: true, visibleMode: m => m, visibleJourneyType: t => t });

export function PhaseProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("all");
  const showBestChannel = phase !== "phase1";
  const showChannelPreferences = phase !== "phase1";
  const showAnalytics = phase !== "phase1";
  const visibleMode = (mode: OrchestrationMode): OrchestrationMode => (!showBestChannel && mode === "best_channel") ? "sequential" : mode;
  const visibleJourneyType = (type: JourneyOrchestrationType): JourneyOrchestrationType => (!showBestChannel && type === "omni_channel") ? "cross_channel" : type;
  return <PhaseContext.Provider value={{ phase, setPhase, showBestChannel, showChannelPreferences, showAnalytics, visibleMode, visibleJourneyType }}>{children}</PhaseContext.Provider>;
}

export function usePhase() { return useContext(PhaseContext); }
