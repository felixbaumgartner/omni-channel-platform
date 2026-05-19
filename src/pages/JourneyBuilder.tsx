import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CHANNEL_LABELS, CHANNEL_ICONS, RULE_ATTRIBUTES, type MessageChannel, type JourneyStepType, type EligibilityRule, type RuleOperator } from "../types";
import { defaultHeuristicRules, DEFAULT_CHANNEL_ORDER, mockTriggers, type PreferenceRule } from "../data/mockData";
import { ChannelEligibilityRules } from "../components/ChannelSpecificRules";
import { usePhase } from "../context/PhaseContext";

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
  { type: "best_channel", label: "Best Channel Send", icon: "\u2728", description: "Auto-select best channel" },
  { type: "delay", label: "Wait / Delay", icon: "\u23F3", description: "Wait before next step" },
  { type: "condition", label: "Decision Split", icon: "\u2753", description: "Branch based on behavior" },
];

let nextId = 1;
function makeId() { return "step_" + nextId++; }

export default function JourneyBuilder() {
  const navigate = useNavigate();
  const { showBestChannel } = usePhase();
  const [journeyName, setJourneyName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<Step[]>([
    { id: makeId(), type: "trigger", label: "Entry Source" },
  ]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [entryChannel, setEntryChannel] = useState<MessageChannel[]>([]);
  const [entryContentEnabled, setEntryContentEnabled] = useState(false);
  const [canReenter, setCanReenter] = useState(false);
  const [exclusive, setExclusive] = useState(false);

  const [reportingLabel, setReportingLabel] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [resetMode, setResetMode] = useState("none");
  const [exitRule, setExitRule] = useState("");
  const [heuristicRules] = useState<PreferenceRule[]>(defaultHeuristicRules.filter(r => r.active));
  const [bestChannelPool, setBestChannelPool] = useState<MessageChannel[]>([]);
  const [bestChannelContentEnabled, setBestChannelContentEnabled] = useState(false);
  const [channelExperiments, setChannelExperiments] = useState<Record<string, { enabled: boolean; tag: string; variants: string[] }>>({});
  const [journeyRules, setJourneyRules] = useState<EligibilityRule[]>([]);
  const [showJourneyRuleMenu, setShowJourneyRuleMenu] = useState(false);

  // Activation Method (mirrors campaign page)
  const [activationMethod, setActivationMethod] = useState<"scheduled" | "trigger">("scheduled");
  const [selectedTriggerId, setSelectedTriggerId] = useState<number | null>(null);

  // Channel Eligibility Rules state (Appendix A model)
  const [eligibilityRulesEnabled, setEligibilityRulesEnabled] = useState<Record<string, boolean>>({});
  const [experimentValues, setExperimentValues] = useState<Record<string, string>>({});
  const [addedCustomRules, setAddedCustomRules] = useState<Record<string, { id: string; label: string; description: string }[]>>({});

  // Decision Split per-step state (multi-branch, with applied snapshot for canvas)
  interface DecisionBranch {
    id: string;
    label: string;
    rules: EligibilityRule[];
    showRules: boolean;
    showRuleMenu: boolean;
  }
  interface AppliedDecisionSplit {
    branches: { id: string; label: string }[];
    remainderLabel: string;
  }
  interface DecisionSplitState {
    branches: DecisionBranch[];
    remainderLabel: string;
    remainderWaitDays: number;
    applied?: AppliedDecisionSplit;
  }
  const makeBranch = (n: number): DecisionBranch => ({
    id: `b_${Date.now()}_${n}`,
    label: "",
    rules: [],
    showRules: false,
    showRuleMenu: false,
  });
  const defaultDecisionState = (): DecisionSplitState => ({
    branches: [makeBranch(1)],
    remainderLabel: "",
    remainderWaitDays: 0,
  });
  const [decisionStates, setDecisionStates] = useState<Record<string, DecisionSplitState>>({});

  function getDecisionState(stepId: string): DecisionSplitState {
    return decisionStates[stepId] || defaultDecisionState();
  }
  function updateDecisionState(stepId: string, patch: Partial<DecisionSplitState>) {
    setDecisionStates(prev => ({ ...prev, [stepId]: { ...getDecisionState(stepId), ...patch } }));
  }
  function updateBranch(stepId: string, branchId: string, patch: Partial<DecisionBranch>) {
    const current = getDecisionState(stepId);
    setDecisionStates(prev => ({
      ...prev,
      [stepId]: { ...current, branches: current.branches.map(b => b.id === branchId ? { ...b, ...patch } : b) },
    }));
  }
  function addBranch(stepId: string) {
    const current = getDecisionState(stepId);
    setDecisionStates(prev => ({
      ...prev,
      [stepId]: { ...current, branches: [...current.branches, makeBranch(current.branches.length + 1)] },
    }));
  }
  function removeBranch(stepId: string, branchId: string) {
    const current = getDecisionState(stepId);
    if (current.branches.length <= 1) return;
    setDecisionStates(prev => ({
      ...prev,
      [stepId]: { ...current, branches: current.branches.filter(b => b.id !== branchId) },
    }));
  }
  function addBranchRule(stepId: string, branchId: string, attribute: string) {
    const current = getDecisionState(stepId);
    const newRule: EligibilityRule = { id: `dr_${Date.now()}`, attribute, operator: "equals" as RuleOperator, value: "", connector: "AND" };
    setDecisionStates(prev => ({
      ...prev,
      [stepId]: {
        ...current,
        branches: current.branches.map(b => b.id === branchId ? { ...b, rules: [...b.rules, newRule], showRuleMenu: false } : b),
      },
    }));
  }
  function removeBranchRule(stepId: string, branchId: string, ruleId: string) {
    const current = getDecisionState(stepId);
    setDecisionStates(prev => ({
      ...prev,
      [stepId]: {
        ...current,
        branches: current.branches.map(b => b.id === branchId ? { ...b, rules: b.rules.filter(r => r.id !== ruleId) } : b),
      },
    }));
  }
  function updateBranchRuleField(stepId: string, branchId: string, ruleId: string, field: keyof EligibilityRule, value: string | number) {
    const current = getDecisionState(stepId);
    setDecisionStates(prev => ({
      ...prev,
      [stepId]: {
        ...current,
        branches: current.branches.map(b => b.id === branchId
          ? { ...b, rules: b.rules.map(r => r.id === ruleId ? { ...r, [field]: value } : r) }
          : b),
      },
    }));
  }
  function decisionHasErrors(s: DecisionSplitState): boolean {
    if (s.branches.some(b => !b.label.trim())) return true;
    if (!s.remainderLabel.trim()) return true;
    if (s.branches.some(b => b.rules.some(r => String(r.value).trim() === ""))) return true;
    return false;
  }
  function applyDecisionChanges(stepId: string) {
    const current = getDecisionState(stepId);
    const applied: AppliedDecisionSplit = {
      branches: current.branches
        .filter(b => b.label.trim())
        .map(b => ({ id: b.id, label: b.label.trim() })),
      remainderLabel: current.remainderLabel.trim(),
    };
    setDecisionStates(prev => ({ ...prev, [stepId]: { ...current, applied } }));
    setToast("Decision split applied");
    setTimeout(() => setToast(null), 2000);
  }
  function cancelDecisionChanges(stepId: string) {
    const current = getDecisionState(stepId);
    if (current.applied) {
      setDecisionStates(prev => ({
        ...prev,
        [stepId]: {
          ...current,
          branches: current.applied!.branches.length > 0
            ? current.applied!.branches.map(b => ({ ...makeBranch(0), id: b.id, label: b.label }))
            : [makeBranch(1)],
          remainderLabel: current.applied!.remainderLabel,
        },
      }));
    } else {
      setDecisionStates(prev => {
        const { [stepId]: _, ...rest } = prev;
        return rest;
      });
    }
    setSelectedStep(null);
  }

  // Per-branch sub-flow steps (rendered as columns under the Decision Split on the canvas)
  const REMAINDER_KEY = "__remainder__";
  const [branchSteps, setBranchSteps] = useState<Record<string, Step[]>>({});
  const [branchAddMenu, setBranchAddMenu] = useState<string | null>(null);
  function branchKey(condStepId: string, branchId: string) {
    return `${condStepId}::${branchId}`;
  }
  function addStepToBranch(condStepId: string, branchId: string, type: JourneyStepType) {
    const key = branchKey(condStepId, branchId);
    const opt = STEP_OPTIONS.find(o => o.type === type);
    const newStep: Step = { id: makeId(), type, label: opt?.label || "Step" };
    setBranchSteps(prev => ({ ...prev, [key]: [...(prev[key] || []), newStep] }));
    setBranchAddMenu(null);
  }
  function removeStepFromBranch(condStepId: string, branchId: string, stepId: string) {
    const key = branchKey(condStepId, branchId);
    setBranchSteps(prev => ({ ...prev, [key]: (prev[key] || []).filter(s => s.id !== stepId) }));
  }

  function handleToggleEligibilityRule(ruleId: string) {
    setEligibilityRulesEnabled(prev => ({ ...prev, [ruleId]: !prev[ruleId] }));
  }

  function handleExperimentChange(ruleId: string, value: string) {
    setExperimentValues(prev => ({ ...prev, [ruleId]: value }));
  }

  function handleAddCustomRule(channel: MessageChannel, rule: { id: string; label: string; description: string }) {
    setAddedCustomRules(prev => ({ ...prev, [channel]: [...(prev[channel] || []), rule] }));
  }

  function handleRemoveCustomRule(channel: MessageChannel, ruleId: string) {
    setAddedCustomRules(prev => ({ ...prev, [channel]: (prev[channel] || []).filter(r => r.id !== ruleId) }));
  }

  function toggleChannelExperiment(ch: MessageChannel) {
    setChannelExperiments(prev => {
      const current = prev[ch];
      if (current?.enabled) {
        const { [ch]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [ch]: { enabled: true, tag: "", variants: [""] } };
    });
  }

  function setChannelExpTag(ch: MessageChannel, tag: string) {
    setChannelExperiments(prev => ({ ...prev, [ch]: { ...prev[ch], tag } }));
  }

  function addChannelVariant(ch: MessageChannel) {
    setChannelExperiments(prev => ({
      ...prev,
      [ch]: { ...prev[ch], variants: [...(prev[ch]?.variants || [""]), ""] },
    }));
  }

  function removeChannelVariant(ch: MessageChannel, index: number) {
    setChannelExperiments(prev => {
      const variants = [...(prev[ch]?.variants || [])];
      variants.splice(index, 1);
      if (variants.length === 0) variants.push("");
      return { ...prev, [ch]: { ...prev[ch], variants } };
    });
  }

  function addJourneyRule(attribute: string) {
    setJourneyRules(prev => [...prev, { id: `r${Date.now()}`, attribute, operator: "equals" as RuleOperator, value: "", connector: "AND" }]);
    setShowJourneyRuleMenu(false);
  }

  function removeJourneyRule(id: string) {
    setJourneyRules(prev => prev.filter(r => r.id !== id));
  }

  function updateJourneyRule(id: string, field: keyof EligibilityRule, value: string | number) {
    setJourneyRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }

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
    setBestChannelPool(prev => {
      if (prev.includes(ch)) {
        setChannelExperiments(exps => {
          const { [ch]: _, ...rest } = exps;
          return rest;
        });
        return prev.filter(c => c !== ch);
      }
      return [...prev, ch];
    });
  }

  const AUTO_BEST_CHANNEL_ID = "auto_best_channel";

  function toggleEntryChannel(ch: MessageChannel) {
    setEntryChannel(prev => {
      const next = prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch];
      if (showBestChannel) {
        if (next.length >= 2) {
          setSteps(s => {
            if (s.some(st => st.id === AUTO_BEST_CHANNEL_ID)) return s;
            const triggerIdx = s.findIndex(st => st.type === "trigger");
            const inserted = [...s];
            inserted.splice(triggerIdx + 1, 0, { id: AUTO_BEST_CHANNEL_ID, type: "best_channel", label: "Best Channel Send" });
            return inserted;
          });
          setBestChannelPool(next);
        } else {
          setSteps(s => s.filter(st => st.id !== AUTO_BEST_CHANNEL_ID));
          setBestChannelPool([]);
        }
      }
      return next;
    });
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 24 }}>
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

            <div style={{ marginBottom: 12 }}>
              <div className="journey-settings-label" style={{ marginBottom: 6 }}>Entry Channel</div>
              {showBestChannel && (
              <div className="info-banner" style={{ marginBottom: 8, flexDirection: "column", alignItems: "flex-start", fontSize: 11 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="info-banner-icon">&#9889;</span>
                  <strong style={{ fontSize: 12 }}>The system will automatically select the best channel per subscriber</strong>
                </div>
                <div style={{ paddingLeft: 28, marginTop: 6 }}>
                  <div className="text-muted" style={{ fontSize: 11, marginBottom: 6 }}>Enable the toggle below to configure content for all channels, or skip it and select specific channels using the cards below.</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label className="toggle-switch toggle-switch--sm">
                      <input type="checkbox" checked={entryContentEnabled} onChange={() => {
                        if (!entryContentEnabled) {
                          const allChannels: MessageChannel[] = ["email", "push", "sms", "whatsapp"];
                          setEntryChannel(allChannels);
                          setSteps(s => {
                            if (s.some(st => st.id === AUTO_BEST_CHANNEL_ID)) return s;
                            const triggerIdx = s.findIndex(st => st.type === "trigger");
                            const inserted = [...s];
                            inserted.splice(triggerIdx + 1, 0, { id: AUTO_BEST_CHANNEL_ID, type: "best_channel", label: "Best Channel Send" });
                            return inserted;
                          });
                          setBestChannelPool(allChannels);
                        } else {
                          setEntryChannel([]);
                          setSteps(s => s.filter(st => st.id !== AUTO_BEST_CHANNEL_ID));
                          setBestChannelPool([]);
                        }
                        setEntryContentEnabled(prev => !prev);
                      }} />
                      <span className="toggle-slider" />
                    </label>
                    <span style={{ fontWeight: 600 }}>Configure content for all channels</span>
                  </div>
                  {entryContentEnabled && (
                    <div className="text-muted" style={{ marginTop: 4 }}>Content templates for all 4 channels will be shown below. The system picks the channel at send time.</div>
                  )}
                  <div style={{ marginTop: 6, marginBottom: 4 }}>Rule-based routing (evaluated in order):</div>
                  <ol style={{ margin: "2px 0 2px 16px", padding: 0, lineHeight: 1.7 }}>
                    {defaultHeuristicRules.filter(r => r.active).map(r => (
                      <li key={r.id}><strong>{r.name}</strong> &mdash; {r.description}</li>
                    ))}
                  </ol>
                  <div style={{ marginTop: 6, padding: "4px 8px", background: "rgba(0,53,128,0.06)", borderRadius: 4 }}>
                    Fallback order: <strong>{DEFAULT_CHANNEL_ORDER.map(ch => CHANNEL_LABELS[ch]).join(" \u2192 ")}</strong>
                  </div>
                </div>
              </div>
              )}
              {showBestChannel && (
              <div className="text-muted" style={{ textAlign: "center", margin: "4px 0 8px", fontSize: 11, fontStyle: "italic" }}>&mdash; or select specific channels below &mdash;</div>
              )}
              <div className="channel-selector-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                {(["email", "push", "sms", "whatsapp"] as MessageChannel[]).map(ch => (
                  <div
                    key={ch}
                    className={`channel-selector-card ${entryChannel.includes(ch) ? "selected" : ""}`}
                    style={{ padding: 10 }}
                    onClick={() => toggleEntryChannel(ch)}
                  >
                    <div className="channel-selector-check">{entryChannel.includes(ch) ? "\u2713" : ""}</div>
                    <div className="channel-selector-icon" style={{ fontSize: 20, marginBottom: 4 }}>{CHANNEL_ICONS[ch]}</div>
                    <div className="channel-selector-label" style={{ fontSize: 11 }}>{CHANNEL_LABELS[ch]}</div>
                  </div>
                ))}
              </div>
              {entryContentEnabled && entryChannel.length > 0 && entryChannel.length < 4 && (
                <div className="alert alert-warning tier-selection-appear" style={{ marginTop: 8, fontSize: 11 }}>
                  <strong>Channel mismatch:</strong> "Configure content for all channels" is enabled, but only {entryChannel.length} of 4 channels are selected. Either turn off the toggle above and use manual channel selection, or re-select all 4 channels.
                </div>
              )}
              {entryChannel.length === 1 && (
                <div className="info-banner tier-selection-appear" style={{ marginTop: 8, fontSize: 11 }}>
                  <span className="info-banner-icon">&#128274;</span>
                  <span><strong>Fixed Channel</strong> &mdash; only {CHANNEL_LABELS[entryChannel[0]]}. No routing or fallback needed.</span>
                </div>
              )}
              {showBestChannel && entryChannel.length >= 2 && (
                <div className="info-banner tier-selection-appear" style={{ marginTop: 8, fontSize: 11 }}>
                  <span className="info-banner-icon">&#10024;</span>
                  <span><strong>Best Channel</strong> &mdash; rule-based routing selects from {entryChannel.length} channels. Fallback order applies when no signal.</span>
                </div>
              )}
              {!showBestChannel && entryChannel.length >= 2 && (
                <div className="info-banner tier-selection-appear" style={{ marginTop: 8, fontSize: 11 }}>
                  <span className="info-banner-icon">&#9989;</span>
                  <span><strong>Multi-Channel</strong> &mdash; subscribers are eligible to receive the message on any of the {entryChannel.length} selected channels ({entryChannel.map(c => CHANNEL_LABELS[c]).join(", ")}). Add a Send step below for each channel you want to deliver on.</span>
                </div>
              )}
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
                      <div className="journey-step-type">{step.type === "trigger" ? "Eligibility Rules" : step.type}</div>
                    </div>
                    {step.type !== "trigger" && step.id !== AUTO_BEST_CHANNEL_ID && (
                      <button className="journey-step-remove" onClick={e => { e.stopPropagation(); removeStep(step.id); }}>&times;</button>
                    )}
                    {step.id === AUTO_BEST_CHANNEL_ID && (
                      <span title="Auto-added from entry channel selection" style={{ fontSize: 10, color: "var(--color-gray-400)", marginLeft: "auto", paddingRight: 8 }}>&#128274;</span>
                    )}
                  </div>
                  {step.type === "condition" && decisionStates[step.id]?.applied && (() => {
                    const applied = decisionStates[step.id].applied!;
                    const allBranches: { id: string; label: string; isRemainder: boolean }[] = [
                      ...applied.branches.map(b => ({ id: b.id, label: b.label, isRemainder: false })),
                      ...(applied.remainderLabel ? [{ id: REMAINDER_KEY, label: applied.remainderLabel, isRemainder: true }] : []),
                    ];
                    return (
                      <div style={{ marginTop: 8 }}>
                        {/* Fork connector line */}
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                          <div style={{ width: 2, height: 16, background: "var(--color-gray-300, #d1d5db)" }} />
                        </div>

                        {/* Branch columns */}
                        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", overflowX: "auto", paddingBottom: 8 }}>
                          {allBranches.map(b => {
                            const key = branchKey(step.id, b.id);
                            const subSteps = branchSteps[key] || [];
                            const menuKey = `${step.id}::${b.id}`;
                            const isMenuOpen = branchAddMenu === menuKey;
                            return (
                              <div key={b.id} style={{ flex: "1 1 220px", minWidth: 200, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                                {/* Branch label chip */}
                                <div
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "8px 12px",
                                    background: b.isRemainder ? "var(--color-gray-50, #f9fafb)" : "white",
                                    border: b.isRemainder ? "1px dashed var(--color-gray-300, #d1d5db)" : "1px solid var(--color-gray-200, #e5e7eb)",
                                    borderRadius: 6,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: b.isRemainder ? "var(--color-gray-600, #4b5563)" : "var(--color-gray-700, #374151)",
                                    width: "fit-content",
                                    maxWidth: "100%",
                                  }}
                                >
                                  <span style={{ color: b.isRemainder ? "var(--color-gray-400, #9ca3af)" : "var(--color-blue-600, #2563eb)" }}>&#x2192;</span>
                                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.label}</span>
                                  {b.isRemainder && <span style={{ fontSize: 11, fontWeight: 400, color: "var(--color-gray-500, #6b7280)" }}>(remainder)</span>}
                                </div>

                                {/* Sub-steps for this branch */}
                                {subSteps.map(subStep => (
                                  <div key={subStep.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: "100%" }}>
                                    <div style={{ width: 2, height: 12, background: "var(--color-gray-300, #d1d5db)" }} />
                                    <div
                                      className={`journey-step journey-step--${subStep.type} ${selectedStep === subStep.id ? "journey-step--selected" : ""}`}
                                      onClick={() => setSelectedStep(subStep.id)}
                                      style={{ width: "100%" }}
                                    >
                                      <span className="journey-step-icon">{getStepIcon(subStep.type)}</span>
                                      <div className="journey-step-info">
                                        <div className="journey-step-label">{subStep.label}</div>
                                        <div className="journey-step-type">{subStep.type}</div>
                                      </div>
                                      <button className="journey-step-remove" onClick={e => { e.stopPropagation(); removeStepFromBranch(step.id, b.id, subStep.id); }}>&times;</button>
                                    </div>
                                  </div>
                                ))}

                                {/* Add Step button for this branch */}
                                <div style={{ width: 2, height: 12, background: "var(--color-gray-300, #d1d5db)" }} />
                                <div style={{ position: "relative", width: "100%" }}>
                                  <button
                                    className="journey-add-btn"
                                    style={{ width: "100%" }}
                                    onClick={() => setBranchAddMenu(isMenuOpen ? null : menuKey)}
                                  >
                                    + Add Step
                                  </button>
                                  {isMenuOpen && (
                                    <div className="journey-add-menu tier-selection-appear" style={{ left: 0, right: 0 }}>
                                      {STEP_OPTIONS.filter(opt => (showBestChannel || opt.type !== "best_channel") && opt.type !== "condition").map(opt => (
                                        <div key={opt.type} className="journey-add-option" onClick={() => addStepToBranch(step.id, b.id, opt.type)}>
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
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                  {i < steps.length - 1 && (
                    <div className="journey-connector">
                      <div className="journey-connector-line" />
                      <div className="journey-connector-arrow">{"\u25BC"}</div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Step Button (hidden when journey ends in an applied Decision Split \u2014 branches own their own Add Step) */}
              {(() => {
                const lastStep = steps[steps.length - 1];
                const journeyEndsInFork = lastStep?.type === "condition" && !!decisionStates[lastStep.id]?.applied;
                if (journeyEndsInFork) return null;
                return (
                  <>
                    <div className="journey-connector">
                      <div className="journey-connector-line" />
                      <div className="journey-connector-arrow">{"\u25BC"}</div>
                    </div>
                    <div style={{ position: "relative" }}>
                      <button className="journey-add-btn" onClick={() => setShowAddMenu(!showAddMenu)}>+ Add Step</button>
                      {showAddMenu && (
                        <div className="journey-add-menu tier-selection-appear">
                          {STEP_OPTIONS.filter(opt => showBestChannel || opt.type !== "best_channel").map(opt => (
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
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Step Config Panel */}
        <div>
          <div className="bui-box" style={{ position: "sticky", top: 16 }}>
            {(() => {
              const currentStep = selectedStep ? steps.find(s => s.id === selectedStep) : null;
              const isTrigger = currentStep?.type === "trigger";
              return (
                <>
                  {!isTrigger && (
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Step Configuration</div>
                  )}
                  {!selectedStep ? (
                    <p className="text-muted">Select a step to configure it.</p>
                  ) : (
                    (() => {
                      const step = steps.find(s => s.id === selectedStep);
                      if (!step) return <p className="text-muted">Step not found.</p>;
                      return (
                        <div>
                          {step.type !== "trigger" && (
                            <div className="form-group">
                              <label className="form-label">Step Label</label>
                              <input className="form-input" value={step.label} onChange={e => setSteps(prev => prev.map(s => s.id === step.id ? { ...s, label: e.target.value } : s))} />
                            </div>
                          )}
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
                    {step.type === "condition" && (() => {
                      const ds = getDecisionState(step.id);
                      const hasErrors = decisionHasErrors(ds);
                      return (
                        <>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Branches</div>

                          {/* ── Branches list ── */}
                          {ds.branches.map((branch, branchIdx) => (
                            <div key={branch.id} style={{ border: "1px solid var(--color-gray-200, #e5e7eb)", borderRadius: 6, padding: 16, marginBottom: 12 }}>
                              <div style={{ display: "grid", gridTemplateColumns: "160px 1fr auto auto", gap: 12, alignItems: "center" }}>
                                <label className="form-label" style={{ marginBottom: 0, fontWeight: 700 }}>
                                  Branch {branchIdx + 1} Label <span style={{ color: "var(--color-red-600, #dc2626)" }}>*</span>
                                </label>
                                <input
                                  className="form-input"
                                  placeholder="Eligible for incentive"
                                  value={branch.label}
                                  onChange={e => updateBranch(step.id, branch.id, { label: e.target.value })}
                                />
                                <button
                                  className="btn btn-link"
                                  style={{ color: "var(--color-blue-600, #2563eb)", fontWeight: 600, padding: "0 8px", background: "none", border: "none", cursor: "pointer" }}
                                  onClick={() => updateBranch(step.id, branch.id, { showRules: !branch.showRules })}
                                >
                                  {branch.showRules ? "Hide Rules" : "Show Rules"}
                                </button>
                                {ds.branches.length > 1 ? (
                                  <button
                                    className="rule-remove-btn"
                                    title="Remove branch"
                                    onClick={() => removeBranch(step.id, branch.id)}
                                  >
                                    &times;
                                  </button>
                                ) : <span />}
                              </div>

                              {/* ── Rules (when expanded, Campaign Eligibility Rules pattern) ── */}
                              {branch.showRules && (
                                <div className="tier-selection-appear" style={{ marginTop: 16 }}>
                                  <div style={{ textAlign: "right", marginBottom: 12 }}>
                                    <a href="#" onClick={e => e.preventDefault()} style={{ color: "var(--color-blue-600, #2563eb)", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
                                      &#x2197; Open in Full Screen
                                    </a>
                                  </div>

                                  <div className="rule-builder" style={{ marginBottom: 12 }}>
                                    {branch.rules.map((r, i) => (
                                      <div key={r.id} className="rule-row">
                                        {i > 0 && (
                                          <select
                                            className="form-select"
                                            style={{ width: 70, flex: "none" }}
                                            value={r.connector}
                                            onChange={e => updateBranchRuleField(step.id, branch.id, r.id, "connector", e.target.value)}
                                          >
                                            <option value="AND">AND</option>
                                            <option value="OR">OR</option>
                                          </select>
                                        )}
                                        <select
                                          className="form-select"
                                          value={r.attribute}
                                          onChange={e => updateBranchRuleField(step.id, branch.id, r.id, "attribute", e.target.value)}
                                        >
                                          {RULE_ATTRIBUTES.map(a => (
                                            <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
                                          ))}
                                        </select>
                                        <select
                                          className="form-select"
                                          style={{ width: 140, flex: "none" }}
                                          value={r.operator}
                                          onChange={e => updateBranchRuleField(step.id, branch.id, r.id, "operator", e.target.value)}
                                        >
                                          <option value="equals">equals</option>
                                          <option value="not_equals">not equals</option>
                                          <option value="greater_than">greater than</option>
                                          <option value="less_than">less than</option>
                                          <option value="in">in</option>
                                        </select>
                                        <input
                                          className="form-input"
                                          style={{ width: 120, flex: "none" }}
                                          value={String(r.value)}
                                          onChange={e => updateBranchRuleField(step.id, branch.id, r.id, "value", e.target.value)}
                                          placeholder="Value"
                                        />
                                        <button className="rule-remove-btn" onClick={() => removeBranchRule(step.id, branch.id, r.id)}>&times;</button>
                                      </div>
                                    ))}
                                  </div>

                                  <div style={{ position: "relative" }}>
                                    <button
                                      className="btn btn-secondary"
                                      onClick={() => updateBranch(step.id, branch.id, { showRuleMenu: !branch.showRuleMenu })}
                                    >
                                      + Add Rule
                                    </button>
                                    {branch.showRuleMenu && (
                                      <div className="channel-rules-menu tier-selection-appear" style={{ top: "100%", left: 0 }}>
                                        {RULE_ATTRIBUTES.map(a => (
                                          <div key={a} className="channel-rules-menu-item" onClick={() => addBranchRule(step.id, branch.id, a)}>
                                            <div style={{ fontWeight: 600, fontSize: 13 }}>{a.replace(/_/g, " ")}</div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          {/* ── Add Branch button ── */}
                          <div style={{ marginBottom: 12 }}>
                            <button
                              className="btn btn-secondary"
                              style={{ color: "var(--color-blue-600, #2563eb)", borderColor: "var(--color-blue-600, #2563eb)", fontWeight: 600 }}
                              onClick={() => addBranch(step.id)}
                            >
                              + Add Branch
                            </button>
                          </div>

                          {/* ── Remainder Branch ── */}
                          <div style={{ border: "1px solid var(--color-gray-200, #e5e7eb)", borderRadius: 6, padding: 16 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12, alignItems: "center", marginBottom: 12 }}>
                              <label className="form-label" style={{ marginBottom: 0, fontWeight: 700 }}>
                                Remainder Branch <span style={{ color: "var(--color-red-600, #dc2626)" }}>*</span>
                              </label>
                              <input
                                className="form-input"
                                placeholder="Not Eligible for incentive"
                                value={ds.remainderLabel}
                                onChange={e => updateDecisionState(step.id, { remainderLabel: e.target.value })}
                              />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12, alignItems: "center" }}>
                              <label className="form-label" style={{ marginBottom: 0, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                                Remainder Wait <span title="Time to wait before sending users down the remainder branch" style={{ color: "var(--color-gray-500, #6b7280)", cursor: "help" }}>&#9432;</span>
                              </label>
                              <div style={{ display: "flex", alignItems: "stretch", border: "1px solid var(--color-gray-300, #d1d5db)", borderRadius: 6, overflow: "hidden" }}>
                                <input
                                  type="number"
                                  min={0}
                                  className="form-input"
                                  style={{ border: "none", flex: 1 }}
                                  value={ds.remainderWaitDays}
                                  onChange={e => updateDecisionState(step.id, { remainderWaitDays: Number(e.target.value) || 0 })}
                                  placeholder="0"
                                />
                                <span style={{ display: "flex", alignItems: "center", padding: "0 12px", background: "var(--color-gray-50, #f9fafb)", borderLeft: "1px solid var(--color-gray-300, #d1d5db)", fontSize: 13, color: "var(--color-gray-600, #4b5563)" }}>Days</span>
                              </div>
                            </div>
                            <div className="text-muted" style={{ marginTop: 12, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ color: "var(--color-gray-500, #6b7280)" }}>&#9432;</span>
                              Remainder branch contains all users that had not fulfilled conditions from other branches in this node
                            </div>
                          </div>

                          {/* ── Apply / Cancel ── */}
                          <div style={{ display: "flex", gap: 12, marginTop: 20, alignItems: "center" }}>
                            <button
                              className="btn btn-primary"
                              disabled={hasErrors}
                              onClick={() => applyDecisionChanges(step.id)}
                              style={hasErrors ? { background: "var(--color-gray-200, #e5e7eb)", color: "var(--color-gray-500, #6b7280)", cursor: "not-allowed" } : undefined}
                            >
                              Apply Changes
                            </button>
                            {hasErrors && (
                              <button
                                onClick={() => applyDecisionChanges(step.id)}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 8,
                                  background: "white",
                                  border: "1px solid var(--color-red-600, #dc2626)",
                                  color: "var(--color-red-600, #dc2626)",
                                  fontWeight: 600,
                                  padding: "8px 16px",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                }}
                              >
                                &#9888; Apply (with errors)
                              </button>
                            )}
                            <button
                              onClick={() => cancelDecisionChanges(step.id)}
                              style={{
                                background: "white",
                                border: "1px solid var(--color-blue-600, #2563eb)",
                                color: "var(--color-blue-600, #2563eb)",
                                fontWeight: 600,
                                padding: "8px 16px",
                                borderRadius: 6,
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      );
                    })()}
                    {step.type === "trigger" && (
                      <div className="tier-selection-appear">
                        {/* ── Activation Method ── */}
                        <div style={{ marginBottom: 16 }}>
                          <label className="form-label" style={{ marginBottom: 8 }}>Activation Method</label>
                          <div className="radio-card-group">
                            <div className={`radio-card ${activationMethod === "scheduled" ? "selected" : ""}`} onClick={() => { setActivationMethod("scheduled"); setSelectedTriggerId(null); }}>
                              <div className="radio-card-header">
                                <div className="radio-card-radio" />
                                <div className="radio-card-title">Scheduled Run</div>
                              </div>
                              <div className="radio-card-description">
                                Campaign runs on a recurring schedule (e.g., daily batch send).
                              </div>
                            </div>
                            <div className={`radio-card ${activationMethod === "trigger" ? "selected" : ""}`} onClick={() => setActivationMethod("trigger")}>
                              <div className="radio-card-header">
                                <div className="radio-card-radio" />
                                <div className="radio-card-title">Message Trigger</div>
                              </div>
                              <div className="radio-card-description">
                                Campaign fires when a trigger event occurs in real time.
                              </div>
                            </div>
                          </div>

                          {activationMethod === "trigger" && (
                            <div className="tier-selection-appear" style={{ marginTop: 12 }}>
                              <label className="form-label">Select Trigger</label>
                              <select
                                className="form-select"
                                value={selectedTriggerId ?? ""}
                                onChange={e => setSelectedTriggerId(e.target.value ? Number(e.target.value) : null)}
                              >
                                <option value="">Choose a trigger...</option>
                                {mockTriggers.filter(t => t.status === "Live").map(t => (
                                  <option key={t.id} value={t.id}>{t.name} ({t.inputTopic})</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* ── Campaign Eligibility Rules ── */}
                        <div className="eligibility-stage" style={{ marginTop: 4 }}>
                          <div className="eligibility-stage-header">
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 15 }}>Campaign Eligibility Rules</div>
                              <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>Users who fail these rules are excluded from the campaign entirely.</div>
                            </div>
                          </div>

                          <div className="rule-builder" style={{ marginTop: 12 }}>
                            {journeyRules.map((r, i) => (
                              <div key={r.id} className="rule-row" style={{ flexWrap: "wrap" }}>
                                {i > 0 && (
                                  <select className="form-select" style={{ width: 70, flex: "none" }} value={r.connector} onChange={e => updateJourneyRule(r.id, "connector", e.target.value)}>
                                    <option value="AND">AND</option>
                                    <option value="OR">OR</option>
                                  </select>
                                )}
                                <select className="form-select" style={{ minWidth: 130, flex: 1 }} value={r.attribute} onChange={e => updateJourneyRule(r.id, "attribute", e.target.value)}>
                                  {RULE_ATTRIBUTES.map(a => (
                                    <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
                                  ))}
                                </select>
                                <select className="form-select" style={{ width: 120, flex: "none" }} value={r.operator} onChange={e => updateJourneyRule(r.id, "operator", e.target.value)}>
                                  <option value="equals">equals</option>
                                  <option value="not_equals">not equals</option>
                                  <option value="greater_than">greater than</option>
                                  <option value="less_than">less than</option>
                                  <option value="in">in</option>
                                </select>
                                <input className="form-input" style={{ width: 100, flex: "none" }} value={String(r.value)} onChange={e => updateJourneyRule(r.id, "value", e.target.value)} />
                                <button className="rule-remove-btn" onClick={() => removeJourneyRule(r.id)}>&times;</button>
                              </div>
                            ))}
                          </div>
                          <div style={{ position: "relative", marginTop: 12 }}>
                            <button className="btn btn-secondary" onClick={() => setShowJourneyRuleMenu(!showJourneyRuleMenu)}>+ Add Rule</button>
                            {showJourneyRuleMenu && (
                              <div className="channel-rules-menu tier-selection-appear">
                                {RULE_ATTRIBUTES.map(a => (
                                  <div key={a} className="channel-rules-menu-item" onClick={() => addJourneyRule(a)}>
                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{a.replace(/_/g, " ")}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {journeyRules.length > 0 && (
                            <div className="text-muted" style={{ marginTop: 8, fontSize: 12 }}>
                              Preview: {journeyRules.map((r, i) => `${i > 0 ? ` ${r.connector} ` : ""}${r.attribute} ${r.operator.replace("_", " ")} ${r.value}`).join("")}
                            </div>
                          )}
                        </div>

                        {/* ── Channel Eligibility Rules ── */}
                        <div className="eligibility-stage" style={{ marginTop: 16 }}>
                          <div className="eligibility-stage-header">
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 15 }}>Channel Eligibility Rules</div>
                              <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>Per-channel rules that determine which channels a qualified user can receive.</div>
                            </div>
                          </div>

                          {entryChannel.length === 0 ? (
                            <div className="text-muted" style={{ padding: "12px 0", fontSize: 13 }}>
                              Select at least one Entry Channel above to configure channel-specific rules.
                            </div>
                          ) : (
                            <ChannelEligibilityRules
                              selectedChannels={entryChannel}
                              enabledRules={eligibilityRulesEnabled}
                              onToggleRule={handleToggleEligibilityRule}
                              experimentValues={experimentValues}
                              onExperimentChange={handleExperimentChange}
                              addedCustomRules={addedCustomRules}
                              onAddCustomRule={handleAddCustomRule}
                              onRemoveCustomRule={handleRemoveCustomRule}
                            />
                          )}
                        </div>
                      </div>
                    )}
                    {step.type === "best_channel" && (
                      <>
                        {/* Channel Pool Selection */}
                        <div className="form-group">
                          <label className="form-label">Channel Selection</label>
                          <p className="text-muted" style={{ fontSize: 11, marginBottom: 8 }}>Select which channels to include. The routing rule picks the best channel per subscriber; the fallback order is used when the rule has no signal.</p>
                          <div className="channel-selector-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                            {(["email", "push", "sms", "whatsapp"] as MessageChannel[]).map(ch => (
                              <div
                                key={ch}
                                className={`channel-selector-card ${bestChannelPool.includes(ch) ? "selected" : ""}`}
                                style={{ padding: 10 }}
                                onClick={() => toggleBestChannelPool(ch)}
                              >
                                <div className="channel-selector-check">{bestChannelPool.includes(ch) ? "\u2713" : ""}</div>
                                <div className="channel-selector-icon" style={{ fontSize: 20, marginBottom: 4 }}>{CHANNEL_ICONS[ch]}</div>
                                <div className="channel-selector-label" style={{ fontSize: 11 }}>{CHANNEL_LABELS[ch]}</div>
                              </div>
                            ))}
                          </div>
                          {bestChannelPool.length === 0 && (
                            <div className="info-banner tier-selection-appear" style={{ marginTop: 8, flexDirection: "column", alignItems: "flex-start", fontSize: 11 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span className="info-banner-icon">&#9889;</span>
                                <strong style={{ fontSize: 12 }}>The system will automatically select the best channel per subscriber</strong>
                              </div>
                              <div style={{ paddingLeft: 28, marginTop: 6 }}>
                                <div style={{ marginBottom: 4 }}>Rule-based routing (evaluated in order):</div>
                                <ol style={{ margin: "2px 0 2px 16px", padding: 0, lineHeight: 1.7 }}>
                                  {defaultHeuristicRules.filter(r => r.active).map(r => (
                                    <li key={r.id}><strong>{r.name}</strong> &mdash; {r.description}</li>
                                  ))}
                                </ol>
                                <div style={{ marginTop: 6, padding: "4px 8px", background: "rgba(0,53,128,0.06)", borderRadius: 4 }}>
                                  Fallback order: <strong>{DEFAULT_CHANNEL_ORDER.map(ch => CHANNEL_LABELS[ch]).join(" \u2192 ")}</strong>
                                </div>
                                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                                  <label className="toggle-switch toggle-switch--sm">
                                    <input type="checkbox" checked={bestChannelContentEnabled} onChange={() => setBestChannelContentEnabled(prev => !prev)} />
                                    <span className="toggle-slider" />
                                  </label>
                                  <span style={{ fontWeight: 600 }}>Configure content for all channels</span>
                                </div>
                                {bestChannelContentEnabled && (
                                  <div className="text-muted" style={{ marginTop: 4 }}>Content templates for all 4 channels will be shown below. The system picks the channel at send time.</div>
                                )}
                              </div>
                            </div>
                          )}
                          {bestChannelPool.length === 1 && (
                            <div className="info-banner tier-selection-appear" style={{ marginTop: 8, fontSize: 11 }}>
                              <span className="info-banner-icon">&#128274;</span>
                              <span><strong>Fixed Channel</strong> &mdash; only {CHANNEL_LABELS[bestChannelPool[0]]}. No routing or fallback needed.</span>
                            </div>
                          )}
                          {bestChannelPool.length >= 2 && (
                            <div className="info-banner tier-selection-appear" style={{ marginTop: 8, fontSize: 11 }}>
                              <span className="info-banner-icon">&#10024;</span>
                              <span><strong>Best Channel</strong> &mdash; rule-based routing selects from {bestChannelPool.length} channels. Fallback order applies when no signal.</span>
                            </div>
                          )}
                        </div>

                        {/* Active Routing Rule — only when 2+ channels */}
                        {bestChannelPool.length >= 2 && (
                        <div className="form-group tier-selection-appear">
                          <label className="form-label">Active Routing Rule</label>
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
                        )}

                        {/* Fallback Channel Order — only when 2+ channels */}
                        {bestChannelPool.length >= 2 && (
                        <div className="form-group tier-selection-appear">
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
                          <div className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>Campaign creator&rsquo;s preferred order. Used when the routing rule has no signal.</div>
                        </div>
                        )}

                        {/* Per-Channel Content — when channels selected OR best-channel content toggle on */}
                        {(bestChannelPool.length >= 1 || bestChannelContentEnabled) && (
                        <div className="form-group tier-selection-appear">
                          <label className="form-label">Content Per Channel</label>
                          <div className="text-muted" style={{ fontSize: 11, marginBottom: 8 }}>Assign content for each channel. Each channel can have its own independent experiment with base and variant templates.</div>

                          {(bestChannelPool.length > 0 ? bestChannelPool : (["email", "push", "sms", "whatsapp"] as MessageChannel[])).map(ch => {
                            const exp = channelExperiments[ch];
                            const isExpEnabled = exp?.enabled ?? false;
                            return (
                              <div key={ch} style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: 12, marginBottom: 10, background: isExpEnabled ? "var(--color-blue-50, #eff6ff)" : "var(--color-gray-50)" }}>
                                {/* Channel header */}
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                  <span style={{ fontSize: 16 }}>{CHANNEL_ICONS[ch]}</span>
                                  <span style={{ fontWeight: 700, fontSize: 13 }}>{CHANNEL_LABELS[ch]}</span>
                                  {isExpEnabled && <span className="badge badge-brand" style={{ fontSize: 9 }}>Experiment</span>}
                                </div>

                                {/* Base content */}
                                <div style={{ marginBottom: 6 }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-gray-500)", textTransform: "uppercase" as const }}>Base</span>
                                  <select className="form-select" style={{ width: "100%", fontSize: 11, marginTop: 2 }}>
                                    <option value="">Select base template...</option>
                                    <option>Welcome Template</option>
                                    <option>Reminder Template</option>
                                    <option>Promotional Template</option>
                                  </select>
                                </div>

                                {/* Experiment section */}
                                {!isExpEnabled ? (
                                  <button className="btn btn-secondary" style={{ fontSize: 10, padding: "2px 8px" }} onClick={() => toggleChannelExperiment(ch)}>+ Add Experiment</button>
                                ) : (
                                  <div className="tier-selection-appear">
                                    {/* Experiment tag */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                                      <input className="form-input" style={{ flex: 1, fontSize: 11 }} placeholder="Experiment tag..." value={exp.tag} onChange={e => setChannelExpTag(ch, e.target.value)} />
                                      <button className="btn btn-tertiary btn-destructive" style={{ fontSize: 10, padding: "2px 6px", whiteSpace: "nowrap" as const }} onClick={() => toggleChannelExperiment(ch)}>Remove Experiment</button>
                                    </div>

                                    {/* Variants */}
                                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-gray-500)", textTransform: "uppercase" as const }}>Variants</span>
                                    {exp.variants.map((_, vi) => (
                                      <div key={vi} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                                        <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-gray-400)", width: 16, textAlign: "center" as const }}>V{vi + 1}</span>
                                        <select className="form-select" style={{ flex: 1, fontSize: 11 }}>
                                          <option value="">Select variant template...</option>
                                          <option>Welcome Template (V2)</option>
                                          <option>Reminder Template (V2)</option>
                                          <option>Promotional Template (V2)</option>
                                        </select>
                                        {exp.variants.length > 1 && (
                                          <button className="btn btn-tertiary btn-destructive" style={{ fontSize: 10, padding: "1px 5px" }} onClick={() => removeChannelVariant(ch, vi)}>&times;</button>
                                        )}
                                      </div>
                                    ))}
                                    <button className="btn btn-secondary" style={{ fontSize: 10, padding: "2px 8px", marginTop: 6 }} onClick={() => addChannelVariant(ch)}>+ Add Variant</button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()
            )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
