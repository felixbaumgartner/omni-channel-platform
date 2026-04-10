import { CHANNEL_ICONS, CHANNEL_LABELS, type MessageChannel } from "../types";
import { mockHoldouts } from "../data/mockData";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

const HASH_COLORS: Record<string, string> = {
  email: "var(--color-email)", push: "var(--color-push)", sms: "var(--color-sms)", in_app: "var(--color-inapp)",
};

export default function HoldoutManagement() {
  const liveCount = mockHoldouts.filter(h => h.status === "Live").length;
  const crossChannelCount = mockHoldouts.filter(h => h.crossChannelCoordinated).length;
  const totalHeldOut = mockHoldouts.filter(h => h.status === "Live").reduce((s, h) => s + h.subscribersHeldOut, 0);

  return (
    <div className="app-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1 className="page-title">Holdout Management</h1>
          <p className="page-subtitle">Channel-specific and cross-channel holdout groups for incrementality measurement</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary">+ New Holdout Group</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="kpi-card">
          <div className="kpi-label">Live Holdouts</div>
          <div className="kpi-value">{liveCount}</div>
          <div className="kpi-sub">{mockHoldouts.length} total</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Subscribers Held Out</div>
          <div className="kpi-value">{formatNum(totalHeldOut)}</div>
          <div className="kpi-sub">across all live holdouts</div>
        </div>
        <div className="omni-kpi-card">
          <div className="kpi-label">Cross-Channel Coordinated</div>
          <div className="kpi-value">{crossChannelCount}</div>
          <div className="kpi-sub">unified holdout across channels</div>
        </div>
        <div className="omni-kpi-card">
          <div className="kpi-label">Matched Campaigns</div>
          <div className="kpi-value">{mockHoldouts.reduce((s, h) => s + h.matchedCampaigns, 0)}</div>
          <div className="kpi-sub">campaigns affected by holdouts</div>
        </div>
      </div>

      {/* Omni-channel info */}
      <div className="info-banner">
        <span className="info-banner-icon">&#128279;</span>
        <span>
          <strong>Cross-Channel Holdout Coordination:</strong> In PROD, holdouts are per-channel. With omni-channel, a subscriber in an email holdout is automatically held out from push/SMS for the same UCG, ensuring clean incrementality measurement.
        </span>
      </div>

      {/* Holdout List */}
      <div className="results-card">
        <div className="results-header">
          <div className="results-count">{mockHoldouts.length} Holdout Groups</div>
        </div>
        <div className="results-list">
          {mockHoldouts.map(h => (
            <div key={h.id} className="list-card" style={{ flexDirection: "column" }}>
              <div className="list-card-content">
                <div className="list-card-title">
                  <span>{h.name}</span>
                  <span className={`badge ${h.status === "Live" ? "badge-constructive" : h.status === "Draft" ? "badge-draft" : "badge-archived"}`}>{h.status}</span>
                  <span className="badge badge-outline">{h.purpose}</span>
                  {h.crossChannelCoordinated && (
                    <span className="badge-orchestration badge-orchestration--multi_channel">Cross-Channel Coordinated</span>
                  )}
                </div>
                <div className="list-card-subtitle">{h.description}</div>
                <div className="list-card-meta" style={{ marginTop: 4 }}>
                  {h.channels.map(ch => (
                    <span key={ch} className="badge badge-outline">{CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}</span>
                  ))}
                  <span className="badge badge-media">Funnels: {h.funnels.join(", ")}</span>
                  <span className="badge badge-media">Verticals: {h.verticals.join(", ")}</span>
                  <span className="badge badge-media">{h.matchedCampaigns} campaigns</span>
                  {h.subscribersHeldOut > 0 && <span className="badge badge-media">{formatNum(h.subscribersHeldOut)} held out</span>}
                </div>

                {/* Hash Range Visualization */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-gray-500)", marginBottom: 6 }}>
                    HASH RANGE: {h.hashRange.start}% – {h.hashRange.end}% ({h.hashRange.end - h.hashRange.start}% of traffic)
                  </div>
                  <div className="holdout-hash-bar">
                    <div className="holdout-hash-fill" style={{
                      left: `${h.hashRange.start}%`,
                      width: `${h.hashRange.end - h.hashRange.start}%`,
                      background: h.crossChannelCoordinated ? "linear-gradient(90deg, var(--color-email), var(--color-push), var(--color-sms))" : "var(--color-blue-500)",
                    }}>
                      <span className="holdout-hash-label">{h.hashRange.end - h.hashRange.start}%</span>
                    </div>
                  </div>

                  {/* Per-channel ranges for cross-channel holdouts */}
                  {h.crossChannelCoordinated && h.perChannelRanges && (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-gray-500)" }}>PER-CHANNEL HASH RANGES (COORDINATED)</div>
                      {Object.entries(h.perChannelRanges).map(([ch, range]) => (
                        <div key={ch} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                          <span style={{ width: 60 }}>{CHANNEL_ICONS[ch as MessageChannel]} {ch}</span>
                          <div className="holdout-hash-bar" style={{ flex: 1, height: 14 }}>
                            <div className="holdout-hash-fill" style={{
                              left: `${range.start}%`,
                              width: `${range.end - range.start}%`,
                              background: HASH_COLORS[ch] || "var(--color-blue-500)",
                            }} />
                          </div>
                          <span style={{ width: 50, textAlign: "right", fontWeight: 600 }}>{range.start}-{range.end}%</span>
                        </div>
                      ))}
                      <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>
                        Same hash range across all channels ensures a subscriber held out on email is also held out on push/SMS/in-app.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
