import { useState } from "react";
import { CHANNEL_ICONS, CHANNEL_LABELS, type MessageChannel } from "../types";
import { omniChannelKPIs } from "../data/mockData";

interface PreferenceRule {
  id: number;
  name: string;
  description: string;
  logic: string;
  priority: number;
  active: boolean;
}

const defaultRules: PreferenceRule[] = [
  { id: 1, name: "Last Engaged Channel", description: "Route to the channel the subscriber last engaged with (opened/clicked) within the last 30 days", logic: "last_engagement_channel(30d)", priority: 1, active: true },
  { id: 2, name: "Highest Open Rate Channel", description: "Route to the channel with the highest open rate for this subscriber over 60-day window", logic: "max(open_rate_per_channel, 60d)", priority: 2, active: true },
  { id: 3, name: "Device Type Preference", description: "Mobile-primary users default to Push; desktop-primary users default to Email", logic: "if(device_primary == 'mobile', 'push', 'email')", priority: 3, active: true },
  { id: 4, name: "Time-of-Day Engagement", description: "Route based on subscriber's engagement patterns by time of day", logic: "best_channel_by_time(current_hour, engagement_history)", priority: 4, active: false },
  { id: 5, name: "Market/Locale Default", description: "Use market-specific default channel (e.g., SMS-heavy markets route to SMS first)", logic: "market_default_channel(subscriber.locale)", priority: 5, active: true },
];

const DEFAULT_CHANNEL_ORDER: MessageChannel[] = ["email", "push", "sms", "in_app"];

export default function ChannelPreferences() {
  const [rules, setRules] = useState(defaultRules);
  const [mlEnabled, setMlEnabled] = useState(false);
  const [channelOrder, setChannelOrder] = useState<MessageChannel[]>(DEFAULT_CHANNEL_ORDER);
  const [priorityDirty, setPriorityDirty] = useState(false);

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

      {/* Engine Status — Enhanced with omni KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
        <div className="kpi-card">
          <div className="kpi-label">Routing Mode</div>
          <div className="kpi-value" style={{ fontSize: 16 }}>{mlEnabled ? "ML + Heuristics" : "Heuristics Only"}</div>
          <div className="kpi-sub">{mlEnabled ? "ML active" : "Phase 1"}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">CDP Coverage</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>89.2%</div>
          <div className="kpi-sub">signal coverage</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Routing Accuracy</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>73.8%</div>
          <div className="kpi-sub">to best channel</div>
        </div>
        <div className="kpi-card" style={{ background: "linear-gradient(135deg, #003580, #006ce4)", color: "#fff" }}>
          <div className="kpi-label" style={{ color: "rgba(255,255,255,0.8)" }}>Dedup Rate</div>
          <div className="kpi-value" style={{ fontSize: 22, color: "#fff" }}>{omniChannelKPIs.dedupRate}%</div>
          <div className="kpi-sub" style={{ color: "rgba(255,255,255,0.7)" }}>sends prevented</div>
        </div>
        <div className="kpi-card" style={{ background: "linear-gradient(135deg, #003580, #006ce4)", color: "#fff" }}>
          <div className="kpi-label" style={{ color: "rgba(255,255,255,0.8)" }}>Freq Cap Blocked</div>
          <div className="kpi-value" style={{ fontSize: 22, color: "#fff" }}>3.2M</div>
          <div className="kpi-sub" style={{ color: "rgba(255,255,255,0.7)" }}>violations prevented</div>
        </div>
        <div className="kpi-card" style={{ background: "linear-gradient(135deg, #003580, #006ce4)", color: "#fff" }}>
          <div className="kpi-label" style={{ color: "rgba(255,255,255,0.8)" }}>Fatigue Score</div>
          <div className="kpi-value" style={{ fontSize: 22, color: "#fff" }}>{omniChannelKPIs.channelFatigueScore}</div>
          <div className="kpi-sub" style={{ color: "rgba(255,255,255,0.7)" }}>avg across subscribers</div>
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
              ML routing runs in parallel with heuristic routing. Predictions are logged but do not affect delivery. Compare predicted vs actual engagement before full cutover.
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
                <div style={{ fontWeight: 600 }}>Heuristic Fallback</div>
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 13 }}>
              <strong>Input features:</strong> last channel engaged, days since last engagement per channel, open rate per channel (30/60/90d windows), device type, market/locale, message category, time-of-day engagement patterns
            </div>
          </div>
        )}
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
                <li>All heuristic rules evaluate to no result</li>
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
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Heuristic Routing Rules</div>
        <p className="text-muted mb-16">Rules are evaluated in priority order. The first matching rule determines the primary channel. {mlEnabled ? "Heuristics serve as fallback when no ML score is available." : ""}</p>
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

      {/* Deduplication Engine */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Deduplication Engine</div>
        <p className="text-muted mb-16">Prevent subscribers from receiving the same or similar message across multiple channels</p>
        <div className="dedup-metrics-grid">
          <div className="dedup-metric-card">
            <div className="dedup-metric-value">{omniChannelKPIs.dedupRate}%</div>
            <div className="dedup-metric-label">Overall Dedup Rate</div>
          </div>
          <div className="dedup-metric-card">
            <div className="dedup-metric-value">3.2M</div>
            <div className="dedup-metric-label">Messages Prevented (7d)</div>
          </div>
          <div className="dedup-metric-card">
            <div className="dedup-metric-value">$48K</div>
            <div className="dedup-metric-label">Estimated Cost Savings</div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Dedup Rules</div>
          <div className="rules-list">
            <div className="rule-card">
              <div className="rule-card-header">
                <div className="rule-card-priority">1</div>
                <div className="rule-card-info">
                  <div style={{ fontWeight: 600 }}>Same Campaign Window</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>Same campaign to same subscriber within dedup window = deduplicated</div>
                </div>
                <label className="toggle-switch toggle-switch--sm">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
            <div className="rule-card">
              <div className="rule-card-header">
                <div className="rule-card-priority">2</div>
                <div className="rule-card-info">
                  <div style={{ fontWeight: 600 }}>Cross-Campaign Content Similarity</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>Different campaigns with &gt;80% similar content within 24h = deduplicated</div>
                </div>
                <label className="toggle-switch toggle-switch--sm">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
            <div className="rule-card">
              <div className="rule-card-header">
                <div className="rule-card-priority">3</div>
                <div className="rule-card-info">
                  <div style={{ fontWeight: 600 }}>Journey Topic Dedup</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>If subscriber is in an active journey for same topic, suppress standalone campaign</div>
                </div>
                <label className="toggle-switch toggle-switch--sm">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </div>
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
              { ch: "in_app" as MessageChannel, daily: 8, weekly: 25, monthly: 60, blocked: "210K" },
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
