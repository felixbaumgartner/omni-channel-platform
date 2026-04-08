import { useState } from "react";
import { CHANNEL_ICONS } from "../types";

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

const cdpSignals = [
  { signal: "Last Email Open", coverage: 94.2, freshness: "< 1 day" },
  { signal: "Last Push Click", coverage: 78.5, freshness: "< 1 day" },
  { signal: "Last SMS Delivery", coverage: 62.1, freshness: "< 2 days" },
  { signal: "Device Type", coverage: 99.1, freshness: "Real-time" },
  { signal: "Preferred Language", coverage: 97.8, freshness: "< 1 day" },
  { signal: "Channel Opt-in Status", coverage: 100.0, freshness: "Real-time" },
  { signal: "Engagement Score (30d)", coverage: 88.3, freshness: "Daily batch" },
  { signal: "Booking Recency", coverage: 91.6, freshness: "< 1 hour" },
];

export default function ChannelPreferences() {
  const [rules, setRules] = useState(defaultRules);
  const [mlEnabled, setMlEnabled] = useState(false);

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

      {/* Engine Status */}
      <div className="kpi-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div className="kpi-card">
          <div className="kpi-label">Routing Mode</div>
          <div className="kpi-value" style={{ fontSize: 20 }}>{mlEnabled ? "ML + Heuristics" : "Heuristics Only"}</div>
          <div className="kpi-sub">{mlEnabled ? "ML model active, heuristics as fallback" : "Phase 1: Rule-based routing"}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">CDP Signal Coverage</div>
          <div className="kpi-value">89.2%</div>
          <div className="kpi-sub">of subscribers have resolvable preference signal</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Routing Accuracy</div>
          <div className="kpi-value">73.8%</div>
          <div className="kpi-sub">subscribers routed to highest-engagement channel</div>
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

      {/* CDP Signal Availability */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>CDP Signal Availability</div>
        <p className="text-muted mb-16">Subscriber preference signals pulled from the Customer Data Platform</p>
        <table className="data-table">
          <thead>
            <tr>
              <th>Signal</th>
              <th style={{ textAlign: "right" }}>Coverage</th>
              <th style={{ textAlign: "right" }}>Freshness</th>
              <th style={{ textAlign: "center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {cdpSignals.map(s => (
              <tr key={s.signal}>
                <td><strong>{s.signal}</strong></td>
                <td style={{ textAlign: "right" }}>{s.coverage}%</td>
                <td style={{ textAlign: "right" }}>{s.freshness}</td>
                <td style={{ textAlign: "center" }}>
                  <span className={`badge ${s.coverage > 90 ? "badge-constructive" : s.coverage > 70 ? "badge-callout" : "badge-destructive"}`}>
                    {s.coverage > 90 ? "Healthy" : s.coverage > 70 ? "Partial" : "Low"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Channel Distribution Preview */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Current Channel Distribution</div>
        <p className="text-muted mb-16">How subscribers are currently distributed across preferred channels</p>
        <div className="distribution-bars">
          {[
            { channel: "Email", pct: 42, icon: CHANNEL_ICONS.email },
            { channel: "Push", pct: 31, icon: CHANNEL_ICONS.push },
            { channel: "SMS", pct: 18, icon: CHANNEL_ICONS.sms },
            { channel: "In-App", pct: 9, icon: CHANNEL_ICONS.in_app },
          ].map(d => (
            <div key={d.channel} className="distribution-row">
              <div className="distribution-label">{d.icon} {d.channel}</div>
              <div className="distribution-bar-track">
                <div className="distribution-bar-fill" style={{ width: `${d.pct}%` }} />
              </div>
              <div className="distribution-pct">{d.pct}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
