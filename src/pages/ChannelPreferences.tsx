import { useState } from "react";
import { CHANNEL_ICONS, CHANNEL_LABELS, type MessageChannel } from "../types";
import { defaultHeuristicRules, DEFAULT_CHANNEL_ORDER, defaultScoringWeights, type PreferenceRule, type ScoringWeight } from "../data/mockData";

export default function ChannelPreferences() {
  const [rules, setRules] = useState<PreferenceRule[]>(defaultHeuristicRules);
  const [mlEnabled, setMlEnabled] = useState(false);
  const [channelOrder, setChannelOrder] = useState<MessageChannel[]>(DEFAULT_CHANNEL_ORDER);
  const [priorityDirty, setPriorityDirty] = useState(false);
  const [weights, setWeights] = useState<ScoringWeight[]>(defaultScoringWeights);
  const [weightsDirty, setWeightsDirty] = useState(false);

  function updateWeight(id: string, newVal: number) {
    setWeights(prev => {
      const idx = prev.findIndex(w => w.id === id);
      if (idx === -1) return prev;
      const clamped = Math.max(prev[idx].minWeight, Math.min(prev[idx].maxWeight, newVal));
      const others = prev.filter((_, i) => i !== idx);
      const remaining = +(1 - clamped).toFixed(2);
      const othersTotal = others.reduce((s, w) => s + w.weight, 0);
      const scaled = othersTotal > 0
        ? others.map(w => ({ ...w, weight: +((w.weight / othersTotal) * remaining).toFixed(2) }))
        : others.map(w => ({ ...w, weight: +(remaining / others.length).toFixed(2) }));
      const result = [...scaled];
      result.splice(idx, 0, { ...prev[idx], weight: clamped });
      return result;
    });
    setWeightsDirty(true);
  }

  function resetWeights() {
    setWeights(defaultScoringWeights);
    setWeightsDirty(false);
  }

  function moveChannel(index: number, direction: "up" | "down") {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= channelOrder.length) return;
    const next = [...channelOrder];
    [next[index], next[target]] = [next[target], next[index]];
    setChannelOrder(next);
    setPriorityDirty(true);
  }

  function resetPriority() {
    setChannelOrder(DEFAULT_CHANNEL_ORDER);
    setPriorityDirty(false);
  }

  function toggleRule(id: number) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  }

  return (
    <div className="app-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1 className="page-title">Channel Preference Engine</h1>
          <p className="page-subtitle">Configure how the platform routes messages to each subscriber's optimal channel</p>
        </div>
      </div>

      {/* ML Toggle */}
      <div className="bui-box">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>ML-Based Channel Scoring</div>
            <p className="text-muted" style={{ margin: "4px 0 0" }}>Multi-class classifier trained on engagement data. Outputs probability score per channel per subscriber.</p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={mlEnabled} onChange={() => setMlEnabled(!mlEnabled)} />
            <span className="toggle-slider" />
          </label>
        </div>
        {mlEnabled && (
          <div className="tier-selection-appear" style={{ marginTop: 16 }}>
            <div className="alert alert-info">
              <div className="alert-title">ML Model Active (Shadow Mode)</div>
              ML routing runs in parallel with rule-based routing. Predictions are logged but do not affect delivery. Compare predicted vs actual engagement before full cutover.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 12 }}>
              <div>
                <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>Model Type</div>
                <div style={{ fontWeight: 600 }}>Multi-class Classifier (XGBoost)</div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>Refresh Cadence</div>
                <div style={{ fontWeight: 600 }}>Daily Batch</div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>Cold-Start Coverage</div>
                <div style={{ fontWeight: 600 }}>Rule-Based Fallback</div>
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 13 }}>
              <strong>Input features:</strong> last channel engaged, days since last engagement per channel, open rate per channel (30/60/90d windows), device type, market/locale, message category, time-of-day engagement patterns
            </div>
          </div>
        )}
      </div>

      {/* Channel Scoring Weights */}
      <div className="bui-box">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Channel Scoring Weights</div>
            <p className="text-muted mb-16">For each subscriber, every eligible channel receives a composite score from these weighted factors. The highest-scoring channel wins. Adjust weights to tune routing behaviour — weights always sum to 100%.</p>
          </div>
          {weightsDirty && (
            <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 16 }}>
              <button className="btn btn-secondary" style={{ fontSize: 13, padding: "6px 12px" }} onClick={resetWeights}>Reset</button>
              <button className="btn btn-primary" style={{ fontSize: 13, padding: "6px 12px" }} onClick={() => setWeightsDirty(false)}>Save Weights</button>
            </div>
          )}
        </div>

        {/* Weight bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
          {weights.map(w => (
            <div key={w.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{w.label}</span>
                  <span className="text-muted" style={{ marginLeft: 8, fontSize: 12 }}>{w.description}</span>
                </div>
                <span style={{ fontWeight: 700, fontSize: 14, minWidth: 44, textAlign: "right" }}>{Math.round(w.weight * 100)}%</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  type="range"
                  min={w.minWeight * 100}
                  max={w.maxWeight * 100}
                  value={Math.round(w.weight * 100)}
                  onChange={e => updateWeight(w.id, Number(e.target.value) / 100)}
                  style={{ flex: 1, accentColor: "var(--color-blue-500)" }}
                />
                <span className="text-muted" style={{ fontSize: 11, minWidth: 80, textAlign: "right" }}>
                  {Math.round(w.minWeight * 100)}–{Math.round(w.maxWeight * 100)}% range
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Visual bar chart of current distribution */}
        <div style={{ marginTop: 20, padding: "16px 0 0", borderTop: "1px solid var(--border-color)" }}>
          <div className="text-muted" style={{ fontSize: 12, marginBottom: 8 }}>Current weight distribution</div>
          <div style={{ display: "flex", height: 28, borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
            {weights.map((w, i) => {
              const colors = ["#003580", "#006ce4", "#0896ff", "#38bdf8", "#b3d4fc"];
              return (
                <div
                  key={w.id}
                  style={{ width: `${w.weight * 100}%`, background: colors[i % colors.length], display: "flex", alignItems: "center", justifyContent: "center", color: i < 3 ? "#fff" : "#003580", fontSize: 11, fontWeight: 600, transition: "width 0.3s" }}
                  title={`${w.label}: ${Math.round(w.weight * 100)}%`}
                >
                  {w.weight >= 0.1 ? `${Math.round(w.weight * 100)}%` : ""}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
            {weights.map((w, i) => {
              const colors = ["#003580", "#006ce4", "#0896ff", "#38bdf8", "#b3d4fc"];
              return (
                <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: colors[i % colors.length], display: "inline-block" }} />
                  {w.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scoring example */}
        <div style={{ marginTop: 20, padding: 16, background: "var(--color-gray-50)", borderRadius: "var(--radius-md)", fontSize: 13, lineHeight: 1.7 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Example: how scoring picks a channel</div>
          <div className="text-muted">
            Subscriber has Email open rate 30% (90d) and Push tap rate 8% (90d), with 1 push tap yesterday.<br />
            <strong>Engagement:</strong> Email {Math.round(weights[0].weight * 100)}% × 0.34 = {(weights[0].weight * 0.34).toFixed(3)} &nbsp;|&nbsp; Push {Math.round(weights[0].weight * 100)}% × 0.11 = {(weights[0].weight * 0.11).toFixed(3)}<br />
            <strong>Cap headroom:</strong> Email {Math.round(weights[1].weight * 100)}% × 0.67 = {(weights[1].weight * 0.67).toFixed(3)} &nbsp;|&nbsp; Push {Math.round(weights[1].weight * 100)}% × 1.00 = {(weights[1].weight * 1.0).toFixed(3)}<br />
            <strong>Fatigue freshness:</strong> Email {Math.round(weights[2].weight * 100)}% × 0.80 = {(weights[2].weight * 0.80).toFixed(3)} &nbsp;|&nbsp; Push {Math.round(weights[2].weight * 100)}% × 0.50 = {(weights[2].weight * 0.50).toFixed(3)}<br />
            <strong>Message fit:</strong> Email {Math.round(weights[3].weight * 100)}% × 0.90 = {(weights[3].weight * 0.90).toFixed(3)} (rich content) &nbsp;|&nbsp; Push {Math.round(weights[3].weight * 100)}% × 0.40 = {(weights[3].weight * 0.40).toFixed(3)}<br />
            <strong>Cost:</strong> Email {Math.round(weights[4].weight * 100)}% × 1.00 = {(weights[4].weight * 1.0).toFixed(3)} &nbsp;|&nbsp; Push {Math.round(weights[4].weight * 100)}% × 1.00 = {(weights[4].weight * 1.0).toFixed(3)}<br />
            <strong style={{ color: "var(--color-blue-600)" }}>
              Total: Email = {(weights[0].weight * 0.34 + weights[1].weight * 0.67 + weights[2].weight * 0.80 + weights[3].weight * 0.90 + weights[4].weight * 1.0).toFixed(3)}
              &nbsp;|&nbsp; Push = {(weights[0].weight * 0.11 + weights[1].weight * 1.0 + weights[2].weight * 0.50 + weights[3].weight * 0.40 + weights[4].weight * 1.0).toFixed(3)}
              &nbsp; → Email wins
            </strong>
          </div>
        </div>
      </div>

      {/* Default Channel Priority */}
      <div className="bui-box">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Default Channel Priority</div>
            <p className="text-muted mb-16">Platform-level fallback order when no CDP signal or marketer-specified channel pool is available. Configured by Operations — applies globally across all campaigns and journeys.</p>
          </div>
          {priorityDirty && (
            <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 16 }}>
              <button className="btn btn-secondary" style={{ fontSize: 13, padding: "6px 12px" }} onClick={resetPriority}>Reset</button>
              <button className="btn btn-primary" style={{ fontSize: 13, padding: "6px 12px" }} onClick={() => setPriorityDirty(false)}>Save Order</button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
          {/* Priority list */}
          <div style={{ flex: 1 }}>
            {channelOrder.map((ch, i) => (
              <div key={ch} className="rule-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", marginBottom: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  background: i === 0 ? "#003580" : i === 1 ? "#006ce4" : i === 2 ? "#0896ff" : "#b3d4fc",
                  color: i < 3 ? "#fff" : "#003580", fontWeight: 700, fontSize: 13,
                }}>{i + 1}</div>
                <span style={{ fontSize: 20 }}>{CHANNEL_ICONS[ch]}</span>
                <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{CHANNEL_LABELS[ch]}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: "4px 8px", fontSize: 12, lineHeight: 1, opacity: i === 0 ? 0.3 : 1 }}
                    disabled={i === 0}
                    onClick={() => moveChannel(i, "up")}
                    title="Move up"
                  >&#9650;</button>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: "4px 8px", fontSize: 12, lineHeight: 1, opacity: i === channelOrder.length - 1 ? 0.3 : 1 }}
                    disabled={i === channelOrder.length - 1}
                    onClick={() => moveChannel(i, "down")}
                    title="Move down"
                  >&#9660;</button>
                </div>
              </div>
            ))}
          </div>

          {/* Explanation sidebar */}
          <div style={{ flex: "0 0 320px" }}>
            <div className="alert alert-info" style={{ margin: 0 }}>
              <div className="alert-title">When does this apply?</div>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
                <li>Marketer did not specify a channel pool</li>
                <li>CDP has no engagement signal for a subscriber</li>
                <li>All routing rules evaluate to no result</li>
                <li>ML model returns no confident prediction</li>
              </ul>
            </div>
            <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
              The system walks this priority list top-to-bottom and selects the <strong>first channel the subscriber is opted in to</strong>. If no channel has consent, the message is suppressed.
            </div>
            <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--neutral-100, #f5f5f5)", borderRadius: 8, fontSize: 12, lineHeight: 1.5 }}>
              <strong>Current fallback path:</strong><br />
              {channelOrder.map((ch, i) => (
                <span key={ch}>
                  {CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}{i < channelOrder.length - 1 ? " → " : ""}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Heuristic Rules */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Rule-Based Routing</div>
        <p className="text-muted mb-16">Rules are evaluated in priority order. The first matching rule determines the primary channel. {mlEnabled ? "Rules serve as fallback when no ML score is available." : ""}</p>
        <div className="rules-list">
          {rules.sort((a, b) => a.priority - b.priority).map(rule => (
            <div key={rule.id} className={`rule-card ${rule.active ? "" : "rule-card--disabled"}`}>
              <div className="rule-card-header">
                <div className="rule-card-priority">P{rule.priority}</div>
                <div className="rule-card-info">
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{rule.name}</div>
                  <div className="text-muted" style={{ fontSize: 13 }}>{rule.description}</div>
                </div>
                <label className="toggle-switch toggle-switch--sm">
                  <input type="checkbox" checked={rule.active} onChange={() => toggleRule(rule.id)} />
                  <span className="toggle-slider" />
                </label>
              </div>
              <div className="rule-card-logic">
                <code>{rule.logic}</code>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frequency Capping */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Frequency Capping</div>
        <p className="text-muted mb-16">Global per-channel message limits to prevent channel fatigue</p>
        <table className="data-table">
          <thead>
            <tr>
              <th>Channel</th>
              <th style={{ textAlign: "center" }}>Daily Cap</th>
              <th style={{ textAlign: "center" }}>Weekly Cap</th>
              <th style={{ textAlign: "center" }}>Monthly Cap</th>
              <th style={{ textAlign: "right" }}>Violations Blocked (7d)</th>
            </tr>
          </thead>
          <tbody>
            {([
              { ch: "email" as MessageChannel, daily: 3, weekly: 10, monthly: 30, blocked: "1.2M" },
              { ch: "push" as MessageChannel, daily: 5, weekly: 15, monthly: 40, blocked: "890K" },
              { ch: "sms" as MessageChannel, daily: 2, weekly: 5, monthly: 12, blocked: "340K" },
              { ch: "whatsapp" as MessageChannel, daily: 8, weekly: 25, monthly: 60, blocked: "210K" },
            ]).map(row => (
              <tr key={row.ch}>
                <td><strong>{CHANNEL_ICONS[row.ch]} {CHANNEL_LABELS[row.ch]}</strong></td>
                <td style={{ textAlign: "center" }}>{row.daily}/day</td>
                <td style={{ textAlign: "center" }}>{row.weekly}/week</td>
                <td style={{ textAlign: "center" }}>{row.monthly}/month</td>
                <td style={{ textAlign: "right" }}><span className="badge badge-dedup">{row.blocked}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="alert alert-info" style={{ marginTop: 12 }}>
          <strong>Cross-Channel Fatigue Rule:</strong> If subscriber received 5+ messages across all channels in the last 24 hours, all non-transactional sends are suppressed until the window resets.
        </div>
      </div>
    </div>
  );
}
