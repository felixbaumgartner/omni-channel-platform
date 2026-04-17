import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CHANNEL_LABELS, CHANNEL_ICONS, type MessageChannel, type JourneyStepType } from "../types";
import { defaultHeuristicRules, type PreferenceRule } from "../data/mockData";

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
  { type: "delay", label: "Wait / Delay", icon: "\u23F3", description: "Wait before next step" },
  { type: "condition", label: "Decision Split", icon: "\u2753", description: "Branch based on behavior" },
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
  const [entryChannel, setEntryChannel] = useState("email");
  const [canReenter, setCanReenter] = useState(false);
  const [exclusive, setExclusive] = useState(false);
  const [journeyPriority, setJourneyPriority] = useState("1");
  const [reportingLabel, setReportingLabel] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [resetMode, setResetMode] = useState("none");
  const [exitRule, setExitRule] = useState("");
  const [heuristicRules] = useState<PreferenceRule[]>(defaultHeuristicRules.filter(r => r.active));
  const [bestChannelPool, setBestChannelPool] = useState<MessageChannel[]>(["email", "push", "sms", "whatsapp"]);

  function addStep(type: JourneyStepType) {
    const opt = STEP_OPTIONS.find(s => s.type === type)!;
    setSteps(prev => [...prev, { id: makeId(), type, label: opt.label }]);
    setShowAddMenu(false);
  }

  function removeStep(id: string) {
    setSteps(prev => prev.filter(s => s.id !== id));
    if (selectedStep === id) setSelectedStep(null);
  }

  function toggleBestChannelPool(ch: MessageChannel) {
    setBestChannelPool(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  }

  function moveBestChannel(index: number, direction: "up" | "down") {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= bestChannelPool.length) return;
    const next = [...bestChannelPool];
    [next[index], next[target]] = [next[target], next[index]];
    setBestChannelPool(next);
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
      case "best_channel": return "\u2728";
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
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Journey Settings</div>

            {/* Entry & Scheduling */}
            <div style={{ fontWeight: 600, fontSize: 12, color: "var(--color-gray-500)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Entry & Scheduling</div>

            <div className="journey-settings-row">
              <span className="journey-settings-label">Entry Channel</span>
              <select className="form-select" style={{ width: 140, fontSize: 12 }} value={entryChannel} onChange={e => setEntryChannel(e.target.value)}>
                <option value="email">Email</option>
                <option value="push">Push</option>
              </select>
            </div>
            <div className="journey-settings-row">
              <span className="journey-settings-label">Entry Window Start</span>
              <input className="form-input" type="date" style={{ width: 150, fontSize: 12 }} value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="journey-settings-row">
              <span className="journey-settings-label">Entry Window End</span>
              <input className="form-input" type="date" style={{ width: 150, fontSize: 12 }} value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div className="journey-settings-row">
              <span className="journey-settings-label">Allow Re-entry</span>
              <label className="toggle-switch toggle-switch--sm">
                <input type="checkbox" checked={canReenter} onChange={e => setCanReenter(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="journey-settings-row">
              <span className="journey-settings-label">Exit Rule</span>
              <select className="form-select" style={{ width: 150, fontSize: 12 }} value={exitRule} onChange={e => setExitRule(e.target.value)}>
                <option value="">None</option>
                <option value="booked">Booking Confirmed</option>
                <option value="unsubscribed">Unsubscribed</option>
                <option value="converted">Goal Converted</option>
              </select>
            </div>

            <div style={{ borderTop: "1px solid var(--border-color)", margin: "10px 0" }} />

            {/* Priority & Behavior */}
            <div style={{ fontWeight: 600, fontSize: 12, color: "var(--color-gray-500)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Priority & Behavior</div>

            <div className="journey-settings-row">
              <span className="journey-settings-label">Journey Priority</span>
              <input className="form-input" type="number" min="1" max="100" style={{ width: 60, fontSize: 12, textAlign: "center" }} value={journeyPriority} onChange={e => setJourneyPriority(e.target.value)} />
            </div>
            <div className="journey-settings-row">
              <span className="journey-settings-label">Exclusive</span>
              <label className="toggle-switch toggle-switch--sm">
                <input type="checkbox" checked={exclusive} onChange={e => setExclusive(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="journey-settings-row">
              <span className="journey-settings-label">Reset Mode</span>
              <select className="form-select" style={{ width: 140, fontSize: 12 }} value={resetMode} onChange={e => setResetMode(e.target.value)}>
                <option value="none">None</option>
                <option value="always">Always</option>
                <option value="condition">Conditional</option>
              </select>
            </div>
            <div className="journey-settings-row">
              <span className="journey-settings-label">Reporting Label</span>
              <input className="form-input" style={{ width: 150, fontSize: 12 }} placeholder="e.g., post_booking_q2" value={reportingLabel} onChange={e => setReportingLabel(e.target.value)} />
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
                        {/* Campaign Name */}
                        <div className="form-group">
                          <label className="form-label">Campaign Name</label>
                          <input className="form-input" placeholder={`j1_${step.label.toLowerCase().replace(/\s+/g, "_")}`} />
                          <div className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>Auto-prefixed with journey ID. Max 44 chars, alphanumeric + underscore/dash.</div>
                        </div>

                        {/* Campaign Purpose */}
                        <div className="form-group">
                          <label className="form-label">Campaign Purpose</label>
                          <select className="form-select">
                            <option value="marketing">Marketing</option>
                            <option value="non_marketing">Non-Marketing</option>
                          </select>
                        </div>

                        {/* Send Configuration — Email only */}
                        {step.type === "email" && (
                          <div className="form-group">
                            <label className="form-label">Sender Profile</label>
                            <select className="form-select">
                              <option value="">Select sender profile...</option>
                              <option>Booking.com (noreply@booking.com)</option>
                              <option>Booking.com Campaigns (email.campaign@sg.booking.com)</option>
                            </select>
                          </div>
                        )}

                        {/* Content Template */}
                        <div className="form-group">
                          <label className="form-label">Content Template</label>
                          <select className="form-select">
                            <option value="">Select template...</option>
                            <option>Welcome Template</option>
                            <option>Reminder Template</option>
                            <option>Promotional Template</option>
                          </select>
                        </div>

                        {/* Message Category */}
                        <div className="form-group">
                          <label className="form-label">Message Category</label>
                          <select className="form-select">
                            <option value="">Select category...</option>
                            <option>Accommodations</option>
                            <option>Flights</option>
                            <option>Car Rental</option>
                            <option>Attractions</option>
                            <option>General</option>
                          </select>
                        </div>

                        {/* Tracking Label */}
                        <div className="form-group">
                          <label className="form-label">Tracking Label</label>
                          <input className="form-input" placeholder="e.g., journey_step_1" />
                          <div className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>4-32 chars, alphanumeric with underscore/dash. Used for Tableau reporting.</div>
                        </div>

                        {/* Experiment */}
                        <div className="form-group">
                          <label className="form-label">Experiment Tag</label>
                          <input className="form-input" placeholder="e.g., emk_welcome_experiment" />
                          <div className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>Optional. Enables A/B variant testing for this step.</div>
                        </div>

                        {/* Reporting */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div className="form-group">
                            <label className="form-label">Affiliate ID</label>
                            <input className="form-input" type="number" placeholder="e.g., 123456" />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Parent Affiliate ID</label>
                            <input className="form-input" type="number" placeholder="e.g., 654321" />
                          </div>
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
                        {/* Channel Pool Selection */}
                        <div className="form-group">
                          <label className="form-label">Channel Pool</label>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {(["email", "push", "sms", "whatsapp"] as MessageChannel[]).map(ch => (
                              <span
                                key={ch}
                                className={`badge ${bestChannelPool.includes(ch) ? "badge-brand" : "badge-outline"}`}
                                style={{ cursor: "pointer" }}
                                onClick={() => toggleBestChannelPool(ch)}
                              >
                                {CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}
                              </span>
                            ))}
                          </div>
                          <div className="text-muted" style={{ marginTop: 4, fontSize: 11 }}>Click to toggle channels in the routing pool.</div>
                        </div>

                        {/* Active Heuristic */}
                        <div className="form-group">
                          <label className="form-label">Active Heuristic</label>
                          {heuristicRules.map(rule => (
                            <div key={rule.id} className="rule-card" style={{ marginBottom: 6 }}>
                              <div className="rule-card-header">
                                <div className="rule-card-priority">P{rule.priority}</div>
                                <div className="rule-card-info">
                                  <div style={{ fontWeight: 600, fontSize: 13 }}>{rule.name}</div>
                                  <div className="text-muted" style={{ fontSize: 11 }}>{rule.description}</div>
                                </div>
                              </div>
                              <div className="rule-card-logic">
                                <code>{rule.logic}</code>
                              </div>
                            </div>
                          ))}
                          <div className="text-muted" style={{ fontSize: 11 }}>If no match, the fallback order below is used.</div>
                        </div>

                        {/* Fallback Channel Order */}
                        <div className="form-group">
                          <label className="form-label">Fallback Channel Order</label>
                          <div className="fallback-sequence">
                            {bestChannelPool.map((ch, i) => (
                              <div key={ch} className="fallback-item" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span className="fallback-number">{i + 1}</span>
                                <span style={{ fontSize: 13 }}>{CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}</span>
                                {i === 0 && <span className="badge badge-brand" style={{ fontSize: 9 }}>Primary</span>}
                                {i > 0 && <span className="badge badge-outline" style={{ fontSize: 9 }}>Fallback</span>}
                                <div style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
                                  <button
                                    className="btn btn-secondary"
                                    style={{ padding: "2px 6px", fontSize: 10, lineHeight: 1, opacity: i === 0 ? 0.3 : 1 }}
                                    disabled={i === 0}
                                    onClick={() => moveBestChannel(i, "up")}
                                  >&#9650;</button>
                                  <button
                                    className="btn btn-secondary"
                                    style={{ padding: "2px 6px", fontSize: 10, lineHeight: 1, opacity: i === bestChannelPool.length - 1 ? 0.3 : 1 }}
                                    disabled={i === bestChannelPool.length - 1}
                                    onClick={() => moveBestChannel(i, "down")}
                                  >&#9660;</button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>Only used when delivery retry for the chosen channel fails.</div>
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
