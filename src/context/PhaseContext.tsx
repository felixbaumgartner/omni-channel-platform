import { createContext, useContext, useState, type ReactNode } from "react";

export type Phase = "all" | "phase1" | "phase2";

interface PhaseContextValue {
  phase: Phase;
  setPhase: (p: Phase) => void;
  showBestChannel: boolean;
}

const PhaseContext = createContext<PhaseContextValue>({ phase: "all", setPhase: () => {}, showBestChannel: true });

export function PhaseProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("all");
  const showBestChannel = phase !== "phase1";
  return <PhaseContext.Provider value={{ phase, setPhase, showBestChannel }}>{children}</PhaseContext.Provider>;
}

export function usePhase() { return useContext(PhaseContext); }
