import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { audienceEstimationData } from "../data/mockData";
import { CHANNEL_ICONS, CHANNEL_LABELS, RULE_ATTRIBUTES, type MessageChannel, type OrchestrationMode } from "../types";

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

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [channels, setChannels] = useState<MessageChannel[]>([]);
  const [orchestrationMode, setOrchestrationMode] = useState<OrchestrationMode>("best_channel");
  const [rules, setRules] = useState<RuleRow[]>([
    { id: 1, attribute: "genius_level", operator: "greater_than", value: "1", connector: "AND" },
  ]);
  const [showResults, setShowResults] = useState(false);
  const [estimating, setEstimating] = useState(false);

  const toggleChannel = (ch: MessageChannel) => {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
    setShowResults(false);
  };

  const addRule = () => {
    setRules(prev => [...prev, { id: Date.now(), attribute: "", operator: "equals", value: "", connector: "AND" }]);
    setShowResults(false);
  };

  const removeRule = (id: number) => {
    setRules(prev => prev.filter(r => r.id !== id));
    setShowResults(false);
  };

  const updateRule = (id: number, field: keyof RuleRow, value: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    setShowResults(false);
  };

  const canEstimate = name.trim() && channels.length > 0 && rules.length > 0 && rules.every(r => r.attribute && r.value);

  const handleEstimate = () => {
    setEstimating(true);
    setTimeout(() => {
      setEstimating(false);
      setShowResults(true);
    }, 1200);
  };

  const modeData = audienceEstimationData.orchestrationModes[orchestrationMode];
  const effectiveSends = modeData.totalSends;

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
        <div className="form-field">
          <label className="form-label">Name *</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g., summer_deals_high_value"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="form-field" style={{ marginTop: 12 }}>
          <label className="form-label">Description</label>
          <textarea
            className="form-input"
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
            <div className={`radio-card ${orchestrationMode === "best_channel" ? "selected" : ""}`} onClick={() => { setOrchestrationMode("best_channel"); setShowResults(false); }}>
              <div className="radio-card-header">
                <div className="radio-card-radio" />
                <div className="radio-card-title">Best Channel</div>
              </div>
              <div className="radio-card-description">
                System picks one optimal channel per subscriber based on engagement scores. One message per person.
              </div>
            </div>
            <div className={`radio-card ${orchestrationMode === "multi_channel" ? "selected" : ""}`} onClick={() => { setOrchestrationMode("multi_channel"); setShowResults(false); }}>
              <div className="radio-card-header">
                <div className="radio-card-radio" />
                <div className="radio-card-title">Multi-Channel</div>
              </div>
              <div className="radio-card-description">
                All selected channels fire for each eligible subscriber. Reaches users on every available channel.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Targeting Rules */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Targeting Rules</div>
        <div className="rules-builder">
          {rules.map((rule, idx) => (
            <div key={rule.id} className="rule-row">
              {idx > 0 && (
                <select
                  className="rule-connector-select"
                  value={rule.connector}
                  onChange={e => updateRule(rule.id, "connector", e.target.value)}
                >
                  <option value="AND">AND</option>
                  <option value="OR">OR</option>
                </select>
              )}
              <select
                className="form-select rule-field"
                value={rule.attribute}
                onChange={e => updateRule(rule.id, "attribute", e.target.value)}
              >
                <option value="">Select attribute...</option>
                {RULE_ATTRIBUTES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select
                className="form-select rule-op"
                value={rule.operator}
                onChange={e => updateRule(rule.id, "operator", e.target.value)}
              >
                {OPERATORS.map(op => <option key={op} value={op}>{op.replace(/_/g, " ")}</option>)}
              </select>
              <input
                type="text"
                className="form-input rule-value"
                placeholder="Value"
                value={rule.value}
                onChange={e => updateRule(rule.id, "value", e.target.value)}
              />
              {rules.length > 1 && (
                <button className="btn btn-icon-danger" onClick={() => removeRule(rule.id)} title="Remove rule">
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
        <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={addRule}>
          + Add Rule
        </button>
      </div>

      {/* Estimate Button */}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          className="btn btn-primary btn-lg"
          disabled={!canEstimate || estimating}
          onClick={handleEstimate}
        >
          {estimating ? "Estimating..." : "Calculate Estimate"}
        </button>
        <button
          className="btn btn-secondary btn-lg"
          disabled={!showResults}
          onClick={() => navigate("/audience-estimation")}
        >
          Save Segment
        </button>
      </div>

      {/* Section 4: Estimation Results */}
      {showResults && (
        <div className="estimation-results-panel">
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Estimation Results</div>

          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Unique Reach</div>
              <div className="kpi-value">{formatNum(modeData.uniqueReach)}</div>
              <div className="kpi-sub">distinct subscribers</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Total Messages</div>
              <div className="kpi-value">{formatNum(effectiveSends)}</div>
              <div className="kpi-sub">across {channels.length} channel{channels.length > 1 ? "s" : ""}</div>
            </div>
          </div>

          {/* Channel Distribution */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Channel Distribution</div>
            <div className="estimation-stacked-bar">
              {channels.map(ch => {
                const pct = modeData.channelSplit[ch as keyof typeof modeData.channelSplit] || 0;
                return (
                  <div
                    key={ch}
                    className="estimation-bar-segment"
                    style={{ width: `${pct}%`, background: CHANNEL_COLORS[ch] }}
                    title={`${ch}: ${pct}%`}
                  />
                );
              })}
            </div>
            <div className="estimation-bar-legend" style={{ marginTop: 8 }}>
              {channels.map(ch => {
                const pct = modeData.channelSplit[ch as keyof typeof modeData.channelSplit] || 0;
                return (
                  <div key={ch} className="estimation-bar-legend-item">
                    <span className="estimation-bar-legend-dot" style={{ background: CHANNEL_COLORS[ch] }} />
                    <span>{CHANNEL_ICONS[ch]} {ch}</span>
                    <strong>{pct}%</strong>
                    <span className="text-muted">({formatNum(Math.round(effectiveSends * pct / 100))})</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
