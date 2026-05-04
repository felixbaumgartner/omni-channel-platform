import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { audienceEstimationData } from "../data/mockData";
import { CHANNEL_ICONS, ORCHESTRATION_LABELS, RULE_ATTRIBUTES, type MessageChannel, type OrchestrationMode } from "../types";

type DedupWindow = "12h" | "24h" | "48h" | "disabled";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

const OPERATORS = ["equals", "not_equals", "greater_than", "less_than", "in"] as const;

const PIPELINES = [
  "Scheduled: Daily EMK",
  "Scheduled: Daily Notifications",
  "Scheduled: Weekly Reactivation",
  "Trigger: cart_abandon",
  "Trigger: booking_confirmed",
  "Trigger: price_change",
  "Trigger: genius_level_change",
  "Trigger: user_signup",
];

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
  const [pipeline, setPipeline] = useState("");
  const [channels, setChannels] = useState<MessageChannel[]>([]);
  const [orchestrationMode, setOrchestrationMode] = useState<OrchestrationMode>("best_channel");
  const [dedupWindow, setDedupWindow] = useState<DedupWindow>("24h");
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

  const canEstimate = name.trim() && pipeline && channels.length > 0 && rules.length > 0 && rules.every(r => r.attribute && r.value);

  const handleEstimate = () => {
    setEstimating(true);
    setTimeout(() => {
      setEstimating(false);
      setShowResults(true);
    }, 1200);
  };

  const modeData = audienceEstimationData.orchestrationModes[orchestrationMode];
  const dedupSavings = modeData.dedupImpact[dedupWindow];
  const effectiveSends = modeData.totalSends - dedupSavings;

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
        <div className="form-grid">
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
          <div className="form-field">
            <label className="form-label">Pipeline *</label>
            <select className="form-select" value={pipeline} onChange={e => setPipeline(e.target.value)}>
              <option value="">Select pipeline...</option>
              {PIPELINES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
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

      {/* Section 2: Channel & Orchestration */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Channel & Orchestration</div>

        <div className="form-field">
          <label className="form-label">Channels *</label>
          <div className="channel-checkbox-group">
            {(["email", "push", "sms", "whatsapp"] as MessageChannel[]).map(ch => (
              <label key={ch} className={`channel-checkbox ${channels.includes(ch) ? "channel-checkbox--active" : ""}`}>
                <input type="checkbox" checked={channels.includes(ch)} onChange={() => toggleChannel(ch)} />
                <span className="channel-checkbox-icon">{CHANNEL_ICONS[ch]}</span>
                <span className="channel-checkbox-label">{ch}</span>
              </label>
            ))}
          </div>
        </div>

        {channels.length > 1 && (
          <>
            <div className="form-field" style={{ marginTop: 16 }}>
              <label className="form-label">Orchestration Mode</label>
              <div className="estimation-mode-selector">
                {(["best_channel", "multi_channel", "sequential"] as OrchestrationMode[]).map(m => (
                  <button
                    key={m}
                    className={`estimation-mode-tab ${orchestrationMode === m ? "estimation-mode-tab--active" : ""}`}
                    onClick={() => { setOrchestrationMode(m); setShowResults(false); }}
                  >
                    {ORCHESTRATION_LABELS[m]}
                  </button>
                ))}
              </div>
              <div className="estimation-mode-description">
                {orchestrationMode === "best_channel" && "System picks one optimal channel per subscriber based on engagement scores."}
                {orchestrationMode === "multi_channel" && "All selected channels fire for each subscriber, with deduplication to prevent fatigue."}
                {orchestrationMode === "sequential" && "Primary channel fires first; fallback channels activate if no engagement within wait period."}
              </div>
            </div>

            {orchestrationMode !== "best_channel" && (
              <div className="form-field" style={{ marginTop: 12 }}>
                <label className="form-label">Deduplication Window</label>
                <div className="dedup-inline-options">
                  {(["12h", "24h", "48h", "disabled"] as DedupWindow[]).map(w => (
                    <button
                      key={w}
                      className={`dedup-inline-btn ${dedupWindow === w ? "dedup-inline-btn--active" : ""}`}
                      onClick={() => { setDedupWindow(w); setShowResults(false); }}
                    >
                      {w === "disabled" ? "Disabled" : w}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

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
            {dedupSavings > 0 && (
              <div className="kpi-card">
                <div className="kpi-label">Dedup Savings</div>
                <div className="kpi-value">{formatNum(dedupSavings)}</div>
                <div className="kpi-sub">duplicates prevented</div>
              </div>
            )}
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
