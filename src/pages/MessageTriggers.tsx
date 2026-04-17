import { useNavigate } from "react-router-dom";
import { CHANNEL_ICONS, CHANNEL_LABELS, type MessageChannel } from "../types";
import { mockTriggers } from "../data/mockData";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

export default function MessageTriggers() {
  const navigate = useNavigate();
  const liveCount = mockTriggers.filter(t => t.status === "Live").length;
  const omniCount = mockTriggers.filter(t => t.omniChannelRouting).length;
  const totalVolume = mockTriggers.filter(t => t.status === "Live").reduce((s, t) => s + t.dailyVolume, 0);

  return (
    <div className="app-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1 className="page-title">Message Triggers</h1>
          <p className="page-subtitle">Event-driven trigger configuration with omni-channel routing</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => navigate("/trigger/new")}>+ New Trigger</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="kpi-card">
          <div className="kpi-label">Live Triggers</div>
          <div className="kpi-value">{liveCount}</div>
          <div className="kpi-sub">{mockTriggers.length} total</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Daily Volume</div>
          <div className="kpi-value">{formatNum(totalVolume)}</div>
          <div className="kpi-sub">events processed</div>
        </div>
        <div className="omni-kpi-card">
          <div className="kpi-label">Omni-Channel Triggers</div>
          <div className="kpi-value">{omniCount}</div>
          <div className="kpi-sub">with multi-channel routing</div>
        </div>
        <div className="omni-kpi-card">
          <div className="kpi-label">Channel Routing Active</div>
          <div className="kpi-value">{Math.round((omniCount / mockTriggers.length) * 100)}%</div>
          <div className="kpi-sub">of triggers use intelligent routing</div>
        </div>
      </div>

      {/* Omni-channel info */}
      <div className="info-banner">
        <span className="info-banner-icon">&#9889;</span>
        <span>
          <strong>Omni-Channel Triggers:</strong> In PROD, each trigger routes to a single channel. With omni-channel, a single trigger event can route to multiple channels with per-channel conditions and deduplication.
        </span>
      </div>

      {/* Trigger List */}
      <div className="results-card">
        <div className="results-header">
          <div className="results-count">{mockTriggers.length} Triggers</div>
        </div>
        <div className="results-list">
          {mockTriggers.map(t => (
            <div key={t.id} className="list-card" style={{ flexDirection: "column" }}>
              <div className="list-card-content">
                <div className="list-card-title">
                  <span>{t.name}</span>
                  <span className={`badge ${t.status === "Live" ? "badge-constructive" : t.status === "Draft" ? "badge-draft" : "badge-callout"}`}>{t.status}</span>
                  <span className="badge badge-outline">{t.triggerType}</span>
                </div>
                <div className="list-card-meta" style={{ marginTop: 4 }}>
                  {t.channels.map(ch => (
                    <span key={ch} className="badge badge-outline">{CHANNEL_ICONS[ch]} {ch === "whatsapp" ? "WhatsApp" : ch.charAt(0).toUpperCase() + ch.slice(1)}</span>
                  ))}
                  <span className="badge badge-media">Topic: {t.inputTopic}</span>
                  <span className="badge badge-media">Window: {t.joiningWindowSec}s</span>
                  {t.delayMinutes > 0 && <span className="badge badge-media">Delay: {t.delayMinutes}m</span>}
                  <span className="badge badge-media">{t.linkedCampaigns} campaigns</span>
                  <span className="badge badge-media">{formatNum(t.dailyVolume)}/day</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
