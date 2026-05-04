import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { audienceEstimationData } from "../data/mockData";
import { CHANNEL_ICONS, CHANNEL_LABELS, ORCHESTRATION_LABELS, RULE_ATTRIBUTES, type MessageChannel, type OrchestrationMode } from "../types";

type Step = "form" | "saved" | "scheduling" | "estimated";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

const OPERATORS = ["equals", "not_equals", "greater_than", "less_than", "in"] as const;

const CHANNEL_COLORS: Record<MessageChannel, string> = {
  email: "var(--color-email, #0071c2)",
  push: "var(--color-push, #7c3aed)",
  sms: "var(--color-sms, #059669)",
  whatsapp: "var(--color-whatsapp, #25d366)",
};

interface RuleRow {
  id: number;
  attribute: string;
  operator: string;
  value: string;
  connector: "AND" | "OR";
}

export default function AudienceEstimationCreate() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [channels, setChannels] = useState<MessageChannel[]>([]);
  const [orchestrationMode, setOrchestrationMode] = useState<OrchestrationMode>("best_channel");
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [showRuleMenu, setShowRuleMenu] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduling, setScheduling] = useState(false);

  const toggleChannel = (ch: MessageChannel) => {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const addRule = (attribute: string) => {
    setRules(prev => [...prev, { id: Date.now(), attribute, operator: "equals", value: "", connector: "AND" }]);
  };

  const removeRule = (id: number) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const updateRule = (id: number, field: keyof RuleRow, value: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const canSave = name.trim() && channels.length > 0 && rules.length > 0 && rules.every(r => r.value);

  const handleSave = () => {
    setStep("saved");
  };

  const handleSchedule = () => {
    setScheduling(true);
    setTimeout(() => {
      setScheduling(false);
      setStep("estimated");
    }, 2000);
  };

  const modeData = audienceEstimationData.orchestrationModes[orchestrationMode];
  const effectiveSends = modeData.totalSends;
  const today = new Date().toISOString().split("T")[0];

  // ─── STEP: Saved Confirmation ───
  if (step === "saved") {
    return (
      <div className="app-page">
        <div className="page-header">
          <div className="page-header-main">
            <h1 className="page-title">Segment Saved</h1>
          </div>
        </div>
        <div className="bui-box" style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16, color: "var(--color-green-600)" }}>&#10003;</div>
          <h2 style={{ marginBottom: 8 }}>Segment Created Successfully</h2>
          <p className="text-muted mb-16">
            "{name}" has been saved as a {channels.length}-channel segment
            using <strong>{ORCHESTRATION_LABELS[orchestrationMode]}</strong> delivery mode.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16, flexWrap: "wrap" }}>
            {channels.map(ch => (
              <span key={ch} className="badge badge-outline">{CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}</span>
            ))}
            <span className="badge badge-draft">Draft</span>
          </div>
          <div className="text-muted mb-16" style={{ fontSize: 13 }}>
            {rules.length} eligibility rule{rules.length > 1 ? "s" : ""} configured
          </div>
          <div className="btn-group" style={{ justifyContent: "center", marginTop: 24 }}>
            <button className="btn btn-secondary" onClick={() => navigate("/audience-estimation")}>Back to Segments</button>
            <button className="btn btn-primary" onClick={() => setStep("scheduling")}>Schedule Estimation</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP: Schedule Estimation ───
  if (step === "scheduling") {
    return (
      <div className="app-page">
        <div className="page-header">
          <div className="page-header-main">
            <h1 className="page-title">Schedule Estimation</h1>
            <p className="page-subtitle">"{name}"</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-secondary" onClick={() => setStep("saved")}>Back</button>
          </div>
        </div>
        <div className="bui-box">
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Estimation Window</div>
          <p className="text-muted mb-16">
            The estimation will collect audience metrics over a 24-hour window starting from the selected date.
            Results will be available once the estimation completes.
          </p>

          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              style={{ width: 220 }}
              min={today}
              value={scheduleDate}
              onChange={e => setScheduleDate(e.target.value)}
            />
          </div>

          {scheduleDate && (
            <div className="tier-selection-appear" style={{ marginTop: 16 }}>
              <div className="info-banner">
                <span className="info-banner-icon">&#128197;</span>
                <span>
                  <strong>Estimation window:</strong> {scheduleDate} 00:00 UTC to {scheduleDate} 23:59 UTC (24 hours).
                  The segment status will change to <strong>Scheduled</strong> and results will be available after completion.
                </span>
              </div>
            </div>
          )}

          <div className="schedule-summary" style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Segment Summary</div>
            <table className="data-table" style={{ fontSize: 13 }}>
              <tbody>
                <tr><td style={{ fontWeight: 600, width: 140 }}>Channels</td><td>{channels.map(ch => `${CHANNEL_ICONS[ch]} ${CHANNEL_LABELS[ch]}`).join(", ")}</td></tr>
                <tr><td style={{ fontWeight: 600 }}>Delivery Mode</td><td>{ORCHESTRATION_LABELS[orchestrationMode]}</td></tr>
                <tr><td style={{ fontWeight: 600 }}>Rules</td><td>{rules.map((r, i) => `${i > 0 ? ` ${r.connector} ` : ""}${r.attribute.replace(/_/g, " ")} ${r.operator.replace(/_/g, " ")} ${r.value}`).join("")}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="btn-group" style={{ marginTop: 24 }}>
            <button
              className="btn btn-primary btn-lg"
              disabled={!scheduleDate || scheduling}
              onClick={handleSchedule}
            >
              {scheduling ? "Scheduling..." : "Schedule Estimation"}
            </button>
          </div>

          {scheduling && (
            <div className="tier-selection-appear" style={{ marginTop: 16, textAlign: "center" }}>
              <div className="text-muted">Running estimation against Graphite metrics...</div>
              <div style={{ marginTop: 8, height: 4, background: "var(--color-gray-100)", borderRadius: 2, overflow: "hidden" }}>
                <div className="estimation-progress-bar" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── STEP: Estimation Results ───
  if (step === "estimated") {
    const msgsPerSub = (effectiveSends / modeData.uniqueReach).toFixed(1);

    return (
      <div className="app-page">
        <div className="page-header">
          <div className="page-header-main">
            <h1 className="page-title">{name}</h1>
            <p className="page-subtitle">Audience estimation completed</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-secondary" onClick={() => navigate("/audience-estimation")}>Back to Segments</button>
          </div>
        </div>

        {/* Result Summary Card */}
        <div className="bui-box">
          <table className="data-table" style={{ fontSize: 14 }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, width: 200 }}>Status</td>
                <td><span className="badge badge-constructive">Done</span></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Delivery Mode</td>
                <td>
                  <span className={`badge-orchestration badge-orchestration--${orchestrationMode}`}>
                    {ORCHESTRATION_LABELS[orchestrationMode]}
                  </span>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Channels</td>
                <td>{channels.map(ch => `${CHANNEL_ICONS[ch]} ${CHANNEL_LABELS[ch]}`).join("  ")}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Eligibility Rules</td>
                <td style={{ fontSize: 13 }}>{rules.map((r, i) => `${i > 0 ? ` ${r.connector} ` : ""}${r.attribute.replace(/_/g, " ")} ${r.operator.replace(/_/g, " ")} ${r.value}`).join("")}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Estimated Audience</td>
                <td style={{ fontSize: 20, fontWeight: 700 }}>{formatNum(modeData.uniqueReach)} subscribers</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Per-Channel Breakdown */}
        <div className="bui-box">
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>
            {orchestrationMode === "best_channel" ? "Channel Routing Breakdown" : "Per-Channel Send Volume"}
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Channel</th>
                <th style={{ textAlign: "right" }}>
                  {orchestrationMode === "best_channel" ? "Subscribers Routed" : "Messages Sent"}
                </th>
              </tr>
            </thead>
            <tbody>
              {channels.map(ch => {
                const pct = modeData.channelSplit[ch as keyof typeof modeData.channelSplit] || 0;
                const count = orchestrationMode === "best_channel"
                  ? Math.round(modeData.uniqueReach * pct / 100)
                  : Math.round(effectiveSends * pct / 100);
                return (
                  <tr key={ch}>
                    <td>{CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}</td>
                    <td style={{ textAlign: "right" }}>{formatNum(count)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="text-muted" style={{ marginTop: 12, fontSize: 12 }}>
            {orchestrationMode === "best_channel"
              ? "Each subscriber receives exactly 1 message. The routing engine selects the channel with the highest engagement score per subscriber."
              : "Each subscriber receives a message on every channel they are reachable on. Total messages exceed unique reach because subscribers are contacted on multiple channels."
            }
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP: Form (default) ───
  return (
    <div className="app-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1 className="page-title">New Segment</h1>
          <p className="page-subtitle">Define targeting rules and estimate cross-channel audience reach</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate("/audience-estimation")}>Back</button>
        </div>
      </div>

      {/* Section 1: Segment Information */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Segment Information</div>
        <div className="form-group">
          <label className="form-label">Name *</label>
          <input
            className="form-input"
            placeholder="e.g., summer_deals_high_value"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            placeholder="What is this segment for?"
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
      </div>

      {/* Section 2: Channel Selection */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Channel Selection</div>
        <p className="text-muted mb-16">Select which channels to include in the audience estimation.</p>
        <div className="channel-selector-grid">
          {(["email", "push", "sms", "whatsapp"] as MessageChannel[]).map(ch => (
            <div
              key={ch}
              className={`channel-selector-card ${channels.includes(ch) ? "selected" : ""}`}
              onClick={() => toggleChannel(ch)}
            >
              <div className="channel-selector-check">{channels.includes(ch) ? "✓" : ""}</div>
              <div className="channel-selector-icon">{CHANNEL_ICONS[ch]}</div>
              <div className="channel-selector-label">{CHANNEL_LABELS[ch]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Delivery Mode */}
      {channels.length > 1 && (
        <div className="bui-box tier-selection-appear">
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Delivery Mode</div>
          <p className="text-muted mb-16">Choose how messages are routed across the selected channels.</p>
          <div className="radio-card-group">
            <div className={`radio-card ${orchestrationMode === "best_channel" ? "selected" : ""}`} onClick={() => setOrchestrationMode("best_channel")}>
              <div className="radio-card-header">
                <div className="radio-card-radio" />
                <div className="radio-card-title">Best Channel</div>
              </div>
              <div className="radio-card-description">
                Estimates reach assuming the system picks one optimal channel per subscriber based on engagement scores. One message per person.
              </div>
            </div>
            <div className={`radio-card ${orchestrationMode === "multi_channel" ? "selected" : ""}`} onClick={() => setOrchestrationMode("multi_channel")}>
              <div className="radio-card-header">
                <div className="radio-card-radio" />
                <div className="radio-card-title">Multi-Channel</div>
              </div>
              <div className="radio-card-description">
                Estimates reach assuming all selected channels fire for each eligible subscriber. Projects total volume across every available channel.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Eligibility Rules */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Eligibility Rules</div>
        <p className="text-muted mb-16">Define audience targeting rules. Rules from PROD eligibility engine (AND/OR logic).</p>
        <div className="rule-builder">
          {rules.map((rule, idx) => (
            <div key={rule.id} className="rule-row">
              {idx > 0 && (
                <select className="form-select" style={{ width: 70, flex: "none" }} value={rule.connector} onChange={e => updateRule(rule.id, "connector", e.target.value)}>
                  <option value="AND">AND</option>
                  <option value="OR">OR</option>
                </select>
              )}
              <select className="form-select" value={rule.attribute} onChange={e => updateRule(rule.id, "attribute", e.target.value)}>
                {RULE_ATTRIBUTES.map(a => (
                  <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
                ))}
              </select>
              <select className="form-select" style={{ width: 140, flex: "none" }} value={rule.operator} onChange={e => updateRule(rule.id, "operator", e.target.value)}>
                {OPERATORS.map(op => <option key={op} value={op}>{op.replace(/_/g, " ")}</option>)}
              </select>
              <input className="form-input" style={{ width: 120, flex: "none" }} value={rule.value} onChange={e => updateRule(rule.id, "value", e.target.value)} placeholder="Value" />
              <button className="rule-remove-btn" onClick={() => removeRule(rule.id)}>&times;</button>
            </div>
          ))}
        </div>
        <div style={{ position: "relative", marginTop: 12 }}>
          <button className="btn btn-secondary" onClick={() => setShowRuleMenu(!showRuleMenu)}>+ Add Rule</button>
          {showRuleMenu && (
            <div className="channel-rules-menu tier-selection-appear">
              {RULE_ATTRIBUTES.map(a => (
                <div key={a} className="channel-rules-menu-item" onClick={() => { addRule(a); setShowRuleMenu(false); }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{a.replace(/_/g, " ")}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        {rules.length > 0 && (
          <div className="text-muted" style={{ marginTop: 8, fontSize: 12 }}>
            Preview: {rules.map((r, i) => `${i > 0 ? ` ${r.connector} ` : ""}${r.attribute.replace(/_/g, " ")} ${r.operator.replace(/_/g, " ")} ${r.value}`).join("")}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="btn-group">
        <button
          className="btn btn-primary btn-lg"
          disabled={!canSave}
          onClick={handleSave}
        >
          Save Segment
        </button>
      </div>
    </div>
  );
}
