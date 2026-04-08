import { useState, useMemo, useCallback } from "react";
import {
  PHASE1_QUESTIONS,
  PHASE2_QUESTIONS,
} from "../types";

export type Classification = {
  purpose: "marketing" | "non_marketing";
  subPurpose?: "transactional";
};

/* ── Decision logic with early exit ── */

type Phase1Result = "marketing" | "continue_to_q3" | "continue_to_q4" | "non_marketing_final" | "proceed_to_phase2" | null;

function decidePhase1Progressive(answers: Record<string, "yes" | "no">): {
  result: "marketing" | "non_marketing" | null;
  showPhase2: boolean;
  resolvedAtQuestion: number | null;
} {
  const qs = Object.values(PHASE1_QUESTIONS);

  // Q1: Is the purpose to make a sale or promote?
  if (answers[qs[0]] === undefined) return { result: null, showPhase2: false, resolvedAtQuestion: null };
  if (answers[qs[0]] === "yes") return { result: "marketing", showPhase2: false, resolvedAtQuestion: 1 };

  // Q1=No → Q2: Does it include ads, offers, invitations to buy?
  if (answers[qs[1]] === undefined) return { result: null, showPhase2: false, resolvedAtQuestion: null };
  if (answers[qs[1]] === "yes") return { result: "marketing", showPhase2: false, resolvedAtQuestion: 2 };

  // Q1=No, Q2=No → Q3: Only about existing booking/benefits?
  if (answers[qs[2]] === undefined) return { result: null, showPhase2: false, resolvedAtQuestion: null };
  if (answers[qs[2]] === "no") return { result: "marketing", showPhase2: false, resolvedAtQuestion: 3 };

  // Q1=No, Q2=No, Q3=Yes → Q4: Critical to the trip?
  if (answers[qs[3]] === undefined) return { result: null, showPhase2: false, resolvedAtQuestion: null };
  if (answers[qs[3]] === "no") return { result: "non_marketing", showPhase2: false, resolvedAtQuestion: 4 };

  // Q1=No, Q2=No, Q3=Yes, Q4=Yes → proceed to Phase 2
  return { result: "non_marketing", showPhase2: true, resolvedAtQuestion: 4 };
}

function decidePhase2Progressive(answers: Record<string, "yes" | "no">): "transactional" | "non_transactional" | "forced_marketing" | null {
  const qs = Object.values(PHASE2_QUESTIONS);

  // Q5: Triggered by customer action or regulatory event?
  if (answers[qs[0]] === undefined) return null;
  if (answers[qs[0]] === "no") return "non_transactional";

  // Q6: Customer expects regardless of marketing prefs?
  if (answers[qs[1]] === undefined) return null;
  if (answers[qs[1]] === "no") return "non_transactional";

  // Q7: Primary purpose is operational/informational?
  if (answers[qs[2]] === undefined) return null;
  if (answers[qs[2]] === "no") return "non_transactional";

  // Q8: Contains ANY promotional content? (must be No for transactional)
  if (answers[qs[3]] === undefined) return null;
  if (answers[qs[3]] === "yes") return "forced_marketing";

  // Q5=Yes, Q6=Yes, Q7=Yes, Q8=No → Transactional
  return "transactional";
}

/* ── Quick-select presets ── */

interface Preset {
  label: string;
  badge: string;
  badgeClass: string;
  description: string;
  answers: Record<string, "yes" | "no">;
}

function buildPresets(): Preset[] {
  const q = Object.values({ ...PHASE1_QUESTIONS, ...PHASE2_QUESTIONS });
  return [
    {
      label: "Marketing",
      badge: "Marketing",
      badgeClass: "badge-marketing",
      description: "e.g., Summer deals email, Genius promo push",
      answers: { [q[0]]: "yes" },
    },
    {
      label: "Non-marketing",
      badge: "Non-marketing",
      badgeClass: "badge-outline",
      description: "e.g., Review request, check-in reminder",
      answers: { [q[0]]: "no", [q[1]]: "no", [q[2]]: "yes", [q[3]]: "no" },
    },
    {
      label: "Transactional",
      badge: "Transactional",
      badgeClass: "badge-constructive",
      description: "e.g., Booking confirmation, OTP, payment receipt",
      answers: {
        [q[0]]: "no", [q[1]]: "no", [q[2]]: "yes", [q[3]]: "yes",
        [q[4]]: "yes", [q[5]]: "yes", [q[6]]: "yes", [q[7]]: "no",
      },
    },
  ];
}

/* ── Props ── */

interface Props {
  mode: "modal" | "inline";
  onConfirm?: (c: Classification) => void;
  onCancel?: () => void;
  onChange?: (c: Classification | null) => void;
}

/* ── Component ── */

export default function ClassificationQuestionnaire({ mode, onConfirm, onCancel, onChange }: Props) {
  const [responses, setResponses] = useState<Record<string, "yes" | "no">>({});
  const presets = useMemo(() => buildPresets(), []);

  const phase1 = useMemo(() => decidePhase1Progressive(responses), [responses]);
  const phase2Result = useMemo(
    () => (phase1.showPhase2 ? decidePhase2Progressive(responses) : null),
    [responses, phase1.showPhase2]
  );

  const decision = useMemo((): Classification | null => {
    if (phase1.result === "marketing") return { purpose: "marketing" };
    if (phase1.result === "non_marketing" && !phase1.showPhase2) return { purpose: "non_marketing" };
    if (phase1.showPhase2 && phase2Result === "forced_marketing") return { purpose: "marketing" };
    if (phase1.showPhase2 && phase2Result === "non_transactional") return { purpose: "non_marketing" };
    if (phase1.showPhase2 && phase2Result === "transactional") return { purpose: "non_marketing", subPurpose: "transactional" };
    return null;
  }, [phase1, phase2Result]);

  useMemo(() => { if (mode === "inline" && onChange) onChange(decision); }, [decision, mode, onChange]);

  function setAnswer(question: string, value: "yes" | "no") {
    setResponses(r => ({ ...r, [question]: value }));
  }

  function applyPreset(preset: Preset) {
    setResponses(preset.answers);
  }

  function resetAll() {
    setResponses({});
  }

  const p1Questions = Object.entries(PHASE1_QUESTIONS);
  const p2Questions = Object.entries(PHASE2_QUESTIONS);

  // Determine which Phase 1 questions to show (progressive disclosure)
  const p1qs = Object.values(PHASE1_QUESTIONS);
  const visibleP1Count =
    responses[p1qs[0]] === undefined ? 1 :
    responses[p1qs[0]] === "yes" ? 1 :
    responses[p1qs[1]] === undefined ? 2 :
    responses[p1qs[1]] === "yes" ? 2 :
    responses[p1qs[2]] === undefined ? 3 :
    responses[p1qs[2]] === "no" ? 3 :
    4;

  // Phase 2 progressive disclosure
  const p2qs = Object.values(PHASE2_QUESTIONS);
  const visibleP2Count = !phase1.showPhase2 ? 0 :
    responses[p2qs[0]] === undefined ? 1 :
    responses[p2qs[0]] === "no" ? 1 :
    responses[p2qs[1]] === undefined ? 2 :
    responses[p2qs[1]] === "no" ? 2 :
    responses[p2qs[2]] === undefined ? 3 :
    responses[p2qs[2]] === "no" ? 3 :
    4;

  const body = (
    <>
      {/* Quick-select presets */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-gray-500)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Quick Select
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {presets.map(p => (
            <button
              key={p.label}
              className="btn btn-secondary"
              style={{ padding: "6px 14px", fontSize: 13 }}
              onClick={() => applyPreset(p)}
            >
              <span className={`badge ${p.badgeClass}`} style={{ marginRight: 6 }}>{p.badge}</span>
              {p.description}
            </button>
          ))}
          {Object.keys(responses).length > 0 && (
            <button className="btn btn-tertiary" style={{ fontSize: 12 }} onClick={resetAll}>
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="divider" style={{ margin: "12px 0 16px" }} />

      {/* Phase 1 */}
      <div style={{ marginBottom: 8, fontWeight: 700, fontSize: 13, color: "var(--color-gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>
        Step 1{phase1.showPhase2 ? " of 2" : ""}: Promotional Intent Check
      </div>

      {p1Questions.slice(0, visibleP1Count).map(([key, question], i) => {
        const isResolved = phase1.result !== null && phase1.resolvedAtQuestion !== null && i < phase1.resolvedAtQuestion;
        const isDeciding = phase1.resolvedAtQuestion === i + 1 || (phase1.resolvedAtQuestion === null && i === visibleP1Count - 1);
        return (
          <div key={key} className="question-block" style={{ opacity: isResolved && !isDeciding ? 0.6 : 1, transition: "opacity 0.2s" }}>
            <div className="question-text">
              <span style={{ color: "var(--color-gray-300)", marginRight: 6, fontSize: 12 }}>Q{i + 1}.</span>
              {question}
            </div>
            <div className="question-radios">
              <label><input type="radio" name={`cq-${key}`} checked={responses[question] === "yes"} onChange={() => setAnswer(question, "yes")} /> Yes</label>
              <label><input type="radio" name={`cq-${key}`} checked={responses[question] === "no"} onChange={() => setAnswer(question, "no")} /> No</label>
            </div>
          </div>
        );
      })}

      {/* Phase 1 result — early exit */}
      {phase1.result === "marketing" && !phase1.showPhase2 && (
        <div className="alert alert-warning tier-selection-appear">
          <div className="alert-title">Classified as Marketing</div>
          {phase1.resolvedAtQuestion === 1 && "The message promotes products/services — this is a marketing message."}
          {phase1.resolvedAtQuestion === 2 && "The message includes ads or offers — this is a marketing message."}
          {phase1.resolvedAtQuestion === 3 && "The message is not exclusively about existing bookings/benefits — this is a marketing message."}
        </div>
      )}

      {phase1.result === "non_marketing" && !phase1.showPhase2 && (
        <div className="alert alert-info tier-selection-appear">
          <div className="alert-title">Classified as Non-marketing</div>
          The message is informational about existing bookings/benefits but not trip-critical. Subscription categories will apply. Marketing holdout does not apply.
        </div>
      )}

      {/* Phase 2 — transactional validation */}
      {phase1.showPhase2 && (
        <div className="tier-selection-appear">
          <div className="divider" />
          <div style={{ marginBottom: 8, fontWeight: 700, fontSize: 13, color: "var(--color-blue-600)", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Step 2 of 2: Transactional Validation
          </div>
          <p className="text-muted mb-8" style={{ fontSize: 13 }}>
            This message is trip-critical. Answer the following to determine if it qualifies as transactional (priority delivery, bypasses Janeway).
          </p>

          {p2Questions.slice(0, visibleP2Count).map(([key, question], i) => (
            <div key={key} className="question-block tier-selection-appear" style={{ background: "var(--color-blue-100)", border: "1px solid #b3d4fc" }}>
              <div className="question-text">
                <span style={{ color: "var(--color-blue-500)", marginRight: 6, fontSize: 12 }}>Q{i + 5}.</span>
                {question}
              </div>
              <div className="question-radios">
                <label><input type="radio" name={`cq-${key}`} checked={responses[question] === "yes"} onChange={() => setAnswer(question, "yes")} /> Yes</label>
                <label><input type="radio" name={`cq-${key}`} checked={responses[question] === "no"} onChange={() => setAnswer(question, "no")} /> No</label>
              </div>
            </div>
          ))}

          {phase2Result === "non_transactional" && (
            <div className="alert alert-info tier-selection-appear">
              <div className="alert-title">Classified as Non-marketing (not transactional)</div>
              Does not meet all transactional criteria. Subscription categories will still apply.
            </div>
          )}
          {phase2Result === "forced_marketing" && (
            <div className="alert alert-warning tier-selection-appear">
              <div className="alert-title">Reclassified as Marketing (hybrid content)</div>
              This message contains promotional content alongside informational content. Remove the promotional content to qualify as transactional.
            </div>
          )}
        </div>
      )}

      {/* Decision tree visualization */}
      {decision && (
        <div className="divider" style={{ margin: "16px 0 12px" }} />
      )}
      {decision && (
        <div className="classification-summary tier-selection-appear">
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-gray-500)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Classification Path
          </div>
          <div className="classification-path">
            {Object.values(PHASE1_QUESTIONS).slice(0, phase1.resolvedAtQuestion || 0).map((q, i) => (
              <span key={i} className="classification-path-step">
                Q{i + 1}: {responses[q] === "yes" ? "Yes" : "No"}
              </span>
            ))}
            {phase1.showPhase2 && phase2Result && (
              Object.values(PHASE2_QUESTIONS).slice(0, visibleP2Count).map((q, i) => (
                responses[q] !== undefined && (
                  <span key={`p2-${i}`} className="classification-path-step classification-path-step--p2">
                    Q{i + 5}: {responses[q] === "yes" ? "Yes" : "No"}
                  </span>
                )
              ))
            )}
            <span className="classification-path-arrow">&rarr;</span>
            <span className={`badge ${
              decision.subPurpose === "transactional" ? "badge-constructive" :
              decision.purpose === "marketing" ? "badge-marketing" : "badge-outline"
            }`} style={{ fontSize: 13, padding: "4px 12px" }}>
              {decision.subPurpose === "transactional" ? "Transactional" :
               decision.purpose === "marketing" ? "Marketing" : "Non-marketing"}
            </span>
          </div>
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
