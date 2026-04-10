import { useState } from "react";
import { CHANNEL_ICONS, CHANNEL_LABELS, type MessageChannel } from "../types";
import { mockSubscriberProfiles, omniChannelKPIs } from "../data/mockData";

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

      {/* Subscriber Channel Profiles */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Subscriber Channel Profiles</div>
        <p className="text-muted mb-16">Unified subscriber profiles showing channel preferences, engagement scores, and opt-in status</p>
        <div className="subscriber-grid">
          {mockSubscriberProfiles.map(sub => (
            <div key={sub.id} className="subscriber-card">
              <div className="subscriber-card-header">
                <div className="subscriber-avatar">{sub.name.charAt(0)}</div>
                <div>
                  <div className="subscriber-name">{sub.name}</div>
                  <div className="subscriber-preferred">
                    Preferred: {CHANNEL_ICONS[sub.preferredChannel]} {CHANNEL_LABELS[sub.preferredChannel]}
                    &nbsp;&middot;&nbsp;{sub.reachableChannels} channels &middot; {sub.deduplicatedCount} deduped
                  </div>
                </div>
              </div>
              <div className="subscriber-channels">
                {sub.channels.map(ch => (
                  <div key={ch.channel} className="subscriber-channel-row">
                    <span className="subscriber-channel-icon">{CHANNEL_ICONS[ch.channel]}</span>
                    <span className="subscriber-channel-name">{ch.channel === "in_app" ? "In-App" : ch.channel.charAt(0).toUpperCase() + ch.channel.slice(1)}</span>
                    {ch.optedIn ? (
                      <>
                        <div className="subscriber-engagement-bar">
                          <div className="subscriber-engagement-fill" style={{
                            width: `${ch.engagementScore}%`,
                            background: ch.engagementScore > 80 ? "var(--color-green-600)" : ch.engagementScore > 50 ? "var(--color-blue-500)" : "var(--callout-300)",
                          }} />
                        </div>
                        <span className="subscriber-engagement-score">{ch.engagementScore}</span>
                      </>
                    ) : (
                      <span className="subscriber-opted-out">opted out</span>
                    )}
                  </div>
                ))}
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
