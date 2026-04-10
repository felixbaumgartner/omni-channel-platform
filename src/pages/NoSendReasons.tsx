import { CHANNEL_ICONS, type MessageChannel } from "../types";
import { mockNoSendReasons } from "../data/mockData";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

const BEHAVIOR_LABELS = {
  suppress_all: "Suppress All Channels",
  suppress_channel: "Suppress This Channel Only",
  fallback_to_other: "Fallback to Other Channel",
} as const;

export default function NoSendReasons() {
  const enabledCount = mockNoSendReasons.filter(r => r.status === "ENABLED").length;
  const totalSuppressed = mockNoSendReasons.reduce((s, r) => s + r.suppressedLast7d, 0);
  const fallbackCount = mockNoSendReasons.filter(r => r.omniChannelBehavior === "fallback_to_other").length;

  return (
    <div className="app-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1 className="page-title">No-Send Reasons</h1>
          <p className="page-subtitle">Suppression rules with channel-scoped applicability and omni-channel behavior</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary">+ New No-Send Reason</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="kpi-card">
          <div className="kpi-label">Enabled Rules</div>
          <div className="kpi-value">{enabledCount}</div>
          <div className="kpi-sub">{mockNoSendReasons.length} total</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Suppressed (7d)</div>
          <div className="kpi-value">{formatNum(totalSuppressed)}</div>
          <div className="kpi-sub">messages prevented</div>
        </div>
        <div className="omni-kpi-card">
          <div className="kpi-label">Channel Fallback</div>
          <div className="kpi-value">{fallbackCount}</div>
          <div className="kpi-sub">rules that redirect to other channels</div>
        </div>
        <div className="omni-kpi-card">
          <div className="kpi-label">Cross-Channel Suppress</div>
          <div className="kpi-value">{mockNoSendReasons.filter(r => r.omniChannelBehavior === "suppress_all").length}</div>
          <div className="kpi-sub">rules suppressing all channels in UCG</div>
        </div>
      </div>

      {/* Omni-channel info */}
      <div className="info-banner">
        <span className="info-banner-icon">&#128683;</span>
        <span>
          <strong>Omni-Channel No-Send Behavior:</strong> In PROD, no-send reasons suppress a single channel. With omni-channel, each reason specifies behavior across the UCG: <em>Suppress All</em> (block entire group), <em>Suppress Channel</em> (block one channel only), or <em>Fallback</em> (redirect to another channel).
        </span>
      </div>

      {/* Suppression Report */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Omni-Channel Suppression Report (Last 7 Days)</div>
        <div className="suppression-grid">
          {mockNoSendReasons.filter(r => r.status === "ENABLED").slice(0, 6).map(r => (
            <div key={r.id} className="suppression-card">
              <div className="suppression-value" style={{ color: r.suppressedLast7d > 2000000 ? "var(--color-red-600)" : r.suppressedLast7d > 500000 ? "var(--callout-500)" : "var(--color-gray-800)" }}>
                {formatNum(r.suppressedLast7d)}
              </div>
              <div className="suppression-label">{r.label.replace(/_/g, " ")}</div>
              <div style={{ marginTop: 6 }}>
                <span className={`badge-nosend-behavior badge-nosend-behavior--${r.omniChannelBehavior}`}>
                  {r.omniChannelBehavior === "suppress_all" ? "All Channels" : r.omniChannelBehavior === "suppress_channel" ? "This Channel" : "Fallback"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* No-Send Reason List */}
      <div className="results-card">
        <div className="results-header">
          <div className="results-count">{mockNoSendReasons.length} No-Send Reasons</div>
        </div>
        <div className="results-list">
          {mockNoSendReasons.map(r => (
            <div key={r.id} className="list-card" style={{ flexDirection: "column" }}>
              <div className="list-card-content">
                <div className="list-card-title">
                  <span>{r.label}</span>
                  <span className={`badge ${r.status === "ENABLED" ? "badge-constructive" : r.status === "DISABLED" ? "badge-stopped" : "badge-archived"}`}>{r.status}</span>
                  <span className={`badge-nosend-behavior badge-nosend-behavior--${r.omniChannelBehavior}`}>
                    {BEHAVIOR_LABELS[r.omniChannelBehavior]}
                  </span>
                  {r.defaultApply && <span className="badge badge-outline" style={{ fontSize: 10 }}>Auto-apply</span>}
                  {r.overridable && <span className="badge badge-callout" style={{ fontSize: 10 }}>Overridable</span>}
                </div>
                <div className="list-card-subtitle">{r.description}</div>
                <div className="list-card-meta" style={{ marginTop: 4 }}>
                  {r.channels.map(ch => (
                    <span key={ch} className="badge badge-outline">
                      {ch === "all" ? "All Channels" : `${CHANNEL_ICONS[ch as MessageChannel]} ${ch}`}
                    </span>
                  ))}
                  <span className="badge badge-outline">{r.purpose === "all" ? "All purposes" : r.purpose}</span>
                  <span className="badge badge-media">{r.matchedCampaigns} campaigns</span>
                  <span className="badge badge-media">{formatNum(r.suppressedLast7d)} suppressed (7d)</span>
                </div>

                {/* Rule expression */}
                {r.rules && (
                  <div style={{ marginTop: 8, padding: "6px 10px", background: "var(--color-gray-50)", borderRadius: 4 }}>
                    <code style={{ fontSize: 12, color: "var(--color-gray-500)" }}>{r.rules}</code>
                  </div>
                )}

                {/* Omni-channel behavior explanation */}
                <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 4, fontSize: 12 }} className={
                  r.omniChannelBehavior === "suppress_all" ? "alert alert-warning" :
                  r.omniChannelBehavior === "fallback_to_other" ? "alert alert-info" : ""
                }>
                  {r.omniChannelBehavior === "suppress_all" && (
                    <span><strong>UCG Impact:</strong> When triggered, all channels in the unified campaign group are suppressed for this subscriber.</span>
                  )}
                  {r.omniChannelBehavior === "suppress_channel" && (
                    <span style={{ color: "var(--color-gray-500)" }}><strong>Channel Only:</strong> Only the specific channel is suppressed. Other channels in the UCG continue delivery.</span>
                  )}
                  {r.omniChannelBehavior === "fallback_to_other" && (
                    <span><strong>Fallback:</strong> If this channel is suppressed, the system routes to the next available channel in the UCG priority order.</span>
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
