import { useState, useMemo } from "react";
import {
  PHASE1_QUESTIONS,
  PHASE2_QUESTIONS,
} from "../types";

export type Classification = {
  purpose: "marketing" | "non_marketing";
  subPurpose?: "transactional";
};

function decidePhase1(answers: Record<string, "yes" | "no">): "marketing" | "non_marketing" | null {
  const qs = Object.values(PHASE1_QUESTIONS);
  if (!qs.every(q => answers[q] !== undefined)) return null;
  if (answers[qs[0]] === "no" && answers[qs[1]] === "no" && answers[qs[2]] === "yes") return "non_marketing";
  return "marketing";
}

function decidePhase2(answers: Record<string, "yes" | "no">): "transactional" | "non_transactional" | "forced_marketing" | null {
  const qs = Object.values(PHASE2_QUESTIONS);
  if (!qs.every(q => answers[q] !== undefined)) return null;
  if (answers[qs[3]] === "yes") return "forced_marketing";
  return [qs[0], qs[1], qs[2]].every(q => answers[q] === "yes") ? "transactional" : "non_transactional";
}

interface Props {
  mode: "modal" | "inline";
  onConfirm?: (c: Classification) => void;
  onCancel?: () => void;
  onChange?: (c: Classification | null) => void;
}

export default function ClassificationQuestionnaire({ mode, onConfirm, onCancel, onChange }: Props) {
  const [responses, setResponses] = useState<Record<string, "yes" | "no">>({});

  const phase1Result = useMemo(() => decidePhase1(responses), [responses]);
  const q4Value = responses[Object.values(PHASE1_QUESTIONS)[3]];
  const showPhase2 = phase1Result === "non_marketing" && q4Value === "yes";
  const phase2Result = useMemo(() => (showPhase2 ? decidePhase2(responses) : null), [responses, showPhase2]);

  const decision = useMemo((): Classification | null => {
    if (phase1Result === "marketing") return { purpose: "marketing" };
    if (phase1Result === "non_marketing" && !showPhase2) return { purpose: "non_marketing" };
    if (showPhase2 && phase2Result === "forced_marketing") return { purpose: "marketing" };
    if (showPhase2 && phase2Result === "non_transactional") return { purpose: "non_marketing" };
    if (showPhase2 && phase2Result === "transactional") return { purpose: "non_marketing", subPurpose: "transactional" };
    return null;
  }, [phase1Result, showPhase2, phase2Result]);

  useMemo(() => { if (mode === "inline" && onChange) onChange(decision); }, [decision, mode, onChange]);

  function setAnswer(question: string, value: "yes" | "no") {
    setResponses(r => ({ ...r, [question]: value }));
  }

  const body = (
    <>
      <div style={{ marginBottom: 8, fontWeight: 700, fontSize: 13, color: "var(--color-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>
        Step 1{showPhase2 ? " of 2" : ""}: Promotional Intent Check
      </div>
      {Object.entries(PHASE1_QUESTIONS).map(([key, question]) => (
        <div key={key} className="question-block">
          <div className="question-text">{question}</div>
          <div className="question-radios">
            <label><input type="radio" name={`cq-${key}`} checked={responses[question] === "yes"} onChange={() => setAnswer(question, "yes")} /> Yes</label>
            <label><input type="radio" name={`cq-${key}`} checked={responses[question] === "no"} onChange={() => setAnswer(question, "no")} /> No</label>
          </div>
        </div>
      ))}
      {phase1Result === "marketing" && (
        <div className="alert alert-warning"><div className="alert-title">This is a Marketing message</div>Based on your answers, this message is classified as Marketing.</div>
      )}
      {showPhase2 && (
        <div className="tier-selection-appear">
          <div className="divider" />
          <div style={{ marginBottom: 8, fontWeight: 700, fontSize: 13, color: "var(--color-blue-600)", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Step 2 of 2: Is this Transactional?
          </div>
          <p className="text-muted mb-8" style={{ fontSize: 13 }}>Transactional messages bypass subscription preferences and receive priority delivery.</p>
          {Object.entries(PHASE2_QUESTIONS).map(([key, question]) => (
            <div key={key} className="question-block" style={{ background: "var(--color-blue-100)", border: "1px solid #b3d4fc" }}>
              <div className="question-text">{question}</div>
              <div className="question-radios">
                <label><input type="radio" name={`cq-${key}`} checked={responses[question] === "yes"} onChange={() => setAnswer(question, "yes")} /> Yes</label>
                <label><input type="radio" name={`cq-${key}`} checked={responses[question] === "no"} onChange={() => setAnswer(question, "no")} /> No</label>
              </div>
            </div>
          ))}
          {phase2Result === "non_transactional" && <div className="alert alert-info"><div className="alert-title">Non-marketing (not transactional)</div>Subscription categories will still apply.</div>}
          {phase2Result === "forced_marketing" && <div className="alert alert-warning"><div className="alert-title">Reclassified as Marketing</div>Contains promotional content. Remove to qualify as transactional.</div>}
        </div>
      )}
    </>
  );

  if (mode === "modal") {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-title">Message Classification</div>
          <div className="modal-subtitle">Answer the following questions to classify this message.</div>
          {body}
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onCancel}>Keep as Marketing</button>
            <button className="btn btn-primary" disabled={!decision || decision.purpose !== "non_marketing"} onClick={() => decision && onConfirm?.(decision)}>
              {decision?.subPurpose === "transactional" ? "Confirm as Transactional" : "Confirm as Non-marketing"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <div>{body}</div>;
}
