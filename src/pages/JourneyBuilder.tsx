import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CHANNEL_LABELS, CHANNEL_ICONS, type MessageChannel, type JourneyStepType } from "../types";

interface Step {
  id: string;
  type: JourneyStepType;
  label: string;
  channel?: MessageChannel;
  config?: Record<string, string>;
}

const STEP_OPTIONS: { type: JourneyStepType; label: string; icon: string; description: string }[] = [
  { type: "email", label: "Send Email", icon: "\u2709", description: "Send an email message" },
  { type: "push", label: "Send Push", icon: "\uD83D\uDD14", description: "Send a push notification" },
  { type: "sms", label: "Send SMS", icon: "\uD83D\uDCF1", description: "Send an SMS message" },
  { type: "whatsapp", label: "WhatsApp Message", icon: "\uD83D\uDCE8", description: "Show an WhatsApp card" },
  { type: "best_channel", label: "Best Channel Send", icon: "\u2728", description: "AI-routed: picks optimal channel per subscriber" },
  { type: "cross_channel_eligibility", label: "Cross-Channel Eligibility", icon: "\uD83D\uDD00", description: "Branch by subscriber channel eligibility" },
  { type: "delay", label: "Wait / Delay", icon: "\u23F3", description: "Wait before next step" },
  { type: "condition", label: "Condition Split", icon: "\u2753", description: "Branch based on behavior" },
  { type: "split", label: "Channel Split", icon: "\u2194\uFE0F", description: "Split by channel eligibility" },
];

let nextId = 1;
function makeId() { return "step_" + nextId++; }

export default function JourneyBuilder() {
  const navigate = useNavigate();
  const [journeyName, setJourneyName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<Step[]>([
    { id: makeId(), type: "trigger", label: "Entry Trigger" },
  ]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [dedupEnabled, setDedupEnabled] = useState(true);
  const [freqCapEnabled, setFreqCapEnabled] = useState(true);

  function addStep(type: JourneyStepType) {
    const opt = STEP_OPTIONS.find(s => s.type === type)!;
    setSteps(prev => [...prev, { id: makeId(), type, label: opt.label }]);
    setShowAddMenu(false);
  }

  function removeStep(id: string) {
    setSteps(prev => prev.filter(s => s.id !== id));
    if (selectedStep === id) setSelectedStep(null);
  }

  function handleSave() {
    setSaved(true);
    setToast("Journey saved!");
    setTimeout(() => setToast(null), 3000);
  }

  if (saved) {
    return (
      <div className="app-page">
        <div className="bui-box" style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#10003;</div>
          <h2>Journey Created</h2>
          <p className="text-muted mb-16">"{journeyName}" saved with {steps.length} steps.</p>
          <div className="btn-group" style={{ justifyContent: "center" }}>
            <button className="btn btn-secondary" onClick={() => navigate("/journeys")}>View Journeys</button>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Create Another</button>
          </div>
        </div>
      </div>
    );
  }

  const getStepIcon = (type: JourneyStepType) => {
    switch (type) {
      case "trigger": return "\u26A1";
      case "email": return "\u2709";
      case "push": return "\uD83D\uDD14";
      case "sms": return "\uD83D\uDCF1";
      case "whatsapp": return "\uD83D\uDCE8";
      case "delay": return "\u23F3";
      case "condition": return "\u2753";
      case "split": return "\u2194\uFE0F";
      case "best_channel": return "\u2728";
      case "cross_channel_eligibility": return "\uD83D\uDD00";
      default: return "\u26A1";
    }
  };

  return (
    <div className="app-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1 className="page-title">Journey Builder</h1>
          <p className="page-subtitle">Design cross-channel messaging sequences</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate("/journeys")}>Cancel</button>
          <button className="btn btn-primary" disabled={!journeyName || steps.length < 2} onClick={handleSave}>Save Journey</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
        {/* Canvas */}
        <div>
          <div className="bui-box" style={{ marginBottom: 24 }}>
            <div className="form-group">
              <label className="form-label">Journey Name</label>
              <input className="form-input" placeholder="e.g., Post-Booking Welcome Journey" value={journeyName} onChange={e => setJourneyName(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description</label>
              <textarea className="form-textarea" placeholder="Describe this journey..." value={description} onChange={e => setDescription(e.target.value)} style={{ minHeight: 60 }} />
            </div>
          </div>

          {/* Journey-Level Settings */}
          <div className="journey-settings-panel">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Journey-Level Omni-Channel Settings</div>
            <div className="journey-settings-row">
              <span className="journey-settings-label">Cross-Channel Deduplication</span>
              <label className="toggle-switch toggle-switch--sm">
                <input type="checkbox" checked={dedupEnabled} onChange={e => setDedupEnabled(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="journey-settings-row">
              <span className="journey-settings-label">Respect Frequency Caps</span>
              <label className="toggle-switch toggle-switch--sm">
                <input type="checkbox" checked={freqCapEnabled} onChange={e => setFreqCapEnabled(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="journey-settings-row">
              <span className="journey-settings-label">Channel Priority</span>
              <span className="text-muted" style={{ fontSize: 12 }}>Email &gt; Push &gt; SMS &gt; WhatsApp</span>
            </div>
          </div>

          {/* Journey Flow */}
          <div className="bui-box">
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Journey Flow</div>
            <div className="journey-canvas">
              {steps.map((step, i) => (
                <div key={step.id}>
                  <div
                    className={`journey-step journey-step--${step.type} ${selectedStep === step.id ? "journey-step--selected" : ""}`}
                    onClick={() => setSelectedStep(step.id)}
                  >
                    <span className="journey-step-icon">{getStepIcon(step.type)}</span>
                    <div className="journey-step-info">
                      <div className="journey-step-label">{step.label}</div>
                      <div className="journey-step-type">{step.type}</div>
                    </div>
                    {step.type !== "trigger" && (
                      <button className="journey-step-remove" onClick={e => { e.stopPropagation(); removeStep(step.id); }}>&times;</button>
                    )}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="journey-connector">
                      <div className="journey-connector-line" />
                      <div className="journey-connector-arrow">\u25BC</div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Step Button */}
              <div className="journey-connector">
                <div className="journey-connector-line" />
                <div className="journey-connector-arrow">\u25BC</div>
              </div>
              <div style={{ position: "relative" }}>
                <button className="journey-add-btn" onClick={() => setShowAddMenu(!showAddMenu)}>+ Add Step</button>
                {showAddMenu && (
                  <div className="journey-add-menu tier-selection-appear">
                    {STEP_OPTIONS.map(opt => (
                      <div key={opt.type} className="journey-add-option" onClick={() => addStep(opt.type)}>
                        <span className="journey-add-option-icon">{opt.icon}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{opt.label}</div>
                          <div className="text-muted" style={{ fontSize: 12 }}>{opt.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step Config Panel */}
        <div>
          <div className="bui-box" style={{ position: "sticky", top: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Step Configuration</div>
            {!selectedStep ? (
              <p className="text-muted">Select a step to configure it.</p>
            ) : (
              (() => {
                const step = steps.find(s => s.id === selectedStep);
                if (!step) return <p className="text-muted">Step not found.</p>;
                return (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Step Label</label>
                      <input className="form-input" value={step.label} onChange={e => setSteps(prev => prev.map(s => s.id === step.id ? { ...s, label: e.target.value } : s))} />
                    </div>
                    {(step.type === "email" || step.type === "push" || step.type === "sms" || step.type === "whatsapp") && (
                      <>
                        <div className="form-group">
                          <label className="form-label">Content Template</label>
                          <select className="form-select">
                            <option value="">Select template...</option>
                            <option>Welcome Template</option>
                            <option>Reminder Template</option>
                            <option>Promotional Template</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Tracking Label</label>
                          <input className="form-input" placeholder="e.g., journey_step_1" />
                        </div>
                      </>
                    )}
                    {step.type === "delay" && (
                      <div className="form-group">
                        <label className="form-label">Wait Duration</label>
                        <div style={{ display: "flex", gap: 8 }}>
                          <input className="form-input" type="number" placeholder="4" style={{ width: 80 }} />
                          <select className="form-select" style={{ width: 120 }}>
                            <option value="hours">Hours</option>
                            <option value="days">Days</option>
                            <option value="minutes">Minutes</option>
                          </select>
                        </div>
                      </div>
                    )}
                    {step.type === "condition" && (
                      <>
                        <div className="form-group">
                          <label className="form-label">Condition Type</label>
                          <select className="form-select">
                            <option>Email Opened</option>
                            <option>Push Clicked</option>
                            <option>Link Clicked</option>
                            <option>Page Visited</option>
                            <option>Custom Event</option>
                          </select>
                        </div>
                        <div className="alert alert-info" style={{ fontSize: 12 }}>
                          <strong>Yes branch:</strong> condition met<br />
                          <strong>No branch:</strong> condition not met within timeout
                        </div>
                      </>
                    )}
                    {step.type === "trigger" && (
                      <div className="form-group">
                        <label className="form-label">Trigger Event</label>
                        <select className="form-select">
                          <option>Booking Confirmed</option>
                          <option>Cart Abandoned</option>
                          <option>Trip Date Approaching</option>
                          <option>Genius Level Changed</option>
                          <option>Post-Stay Review Due</option>
                          <option>Price Drop Alert</option>
                        </select>
                      </div>
                    )}
                    {step.type === "best_channel" && (
                      <>
                        <div className="alert alert-info" style={{ fontSize: 12, marginBottom: 12 }}>
                          <strong>AI-Routed:</strong> Picks the optimal channel per subscriber at journey execution time using CDP signals and the Channel Preference Engine.
                        </div>
                        <div className="form-group">
                          <label className="form-label">Eligible Channels</label>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {(["email", "push", "sms", "whatsapp"] as MessageChannel[]).map(ch => (
                              <span key={ch} className="badge badge-outline">{CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}</span>
                            ))}
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Fallback Timeout (hours)</label>
                          <input className="form-input" type="number" defaultValue="4" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Routing Model</label>
                          <select className="form-select">
                            <option>ML + Heuristics (recommended)</option>
                            <option>Heuristics Only</option>
                          </select>
                        </div>
                      </>
                    )}
                    {step.type === "cross_channel_eligibility" && (
                      <>
                        <div className="alert alert-info" style={{ fontSize: 12, marginBottom: 12 }}>
                          <strong>Branching:</strong> Routes subscribers to different paths based on their channel eligibility (opt-in status, device type, app installed).
                        </div>
                        <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ padding: 8, background: "#dbeafe", borderRadius: 4 }}>
                            <strong>Path A:</strong> Email eligible &rarr; continue to email steps
                          </div>
                          <div style={{ padding: 8, background: "#fef3c7", borderRadius: 4 }}>
                            <strong>Path B:</strong> Push only &rarr; continue to push steps
                          </div>
                          <div style={{ padding: 8, background: "#d1fae5", borderRadius: 4 }}>
                            <strong>Path C:</strong> SMS only &rarr; continue to SMS steps
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
