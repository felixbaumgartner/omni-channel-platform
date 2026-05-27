import { createContext, useContext, useState, type ReactNode } from "react";

export type Phase = "all" | "phase1" | "phase2";

interface PhaseContextValue {
  phase: Phase;
  setPhase: (p: Phase) => void;
  showBestChannel: boolean;
  showChannelPreferences: boolean;
  showAnalytics: boolean;
}

const PhaseContext = createContext<PhaseContextValue>({ phase: "all", setPhase: () => {}, showBestChannel: true, showChannelPreferences: true, showAnalytics: true });

export function PhaseProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("all");
  const showBestChannel = phase !== "phase1";
  const showChannelPreferences = phase !== "phase1";
  const showAnalytics = phase !== "phase1";
  return <PhaseContext.Provider value={{ phase, setPhase, showBestChannel, showChannelPreferences, showAnalytics }}>{children}</PhaseContext.Provider>;
}

export function usePhase() { return useContext(PhaseContext); }
