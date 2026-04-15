import { useNavigate } from "react-router-dom";
import { mockCampaigns, mockJourneys, channelMetrics, dailySends, mockUnifiedGroups, omniChannelKPIs } from "../data/mockData";
import { CHANNEL_ICONS, ORCHESTRATION_LABELS, type MessageChannel } from "../types";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

const maxSend = Math.max(...dailySends.flatMap(d => [d.email, d.push, d.sms, d.whatsapp]));

const channelClass = (ch: MessageChannel) =>
  ch === "whatsapp" ? "whatsapp" : ch;

export default function Dashboard() {
  const navigate = useNavigate();
  const liveCampaigns = mockCampaigns.filter(c => c.status === "Live");
  const activeJourneys = mockJourneys.filter(j => j.status === "Active");
  const totalSent = channelMetrics.reduce((s, m) => s + m.sent, 0);
  const totalDelivered = channelMetrics.reduce((s, m) => s + m.delivered, 0);
  const avgOpenRate = channelMetrics.reduce((s, m) => s + m.openRate, 0) / channelMetrics.length;
  const avgClickRate = channelMetrics.filter(m => m.clickRate > 0).reduce((s, m) => s + m.clickRate, 0) / channelMetrics.filter(m => m.clickRate > 0).length;

  return (
    <div className="app-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Omni-channel messaging overview &middot; Last 7 days</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => navigate("/campaign/new")}>+ New Campaign</button>
          <button className="btn btn-secondary" onClick={() => navigate("/journey/new")}>+ New Journey</button>
        </div>
      </div>

      {/* Omni-Channel Intelligence Banner */}
      <div className="info-banner">
        <span className="info-banner-icon">&#9889;</span>
        <span>
          <strong>Omni-Channel Intelligence Active</strong> &mdash; {omniChannelKPIs.bestChannelRouting}% of sends use intelligent channel routing
        </span>
      </div>

      {/* Omni-Channel KPIs */}
      <div className="omni-kpi-grid">
        <div className="omni-kpi-card">
          <div className="kpi-label">Unified Campaign Groups</div>
          <div className="kpi-value">{omniChannelKPIs.unifiedGroupCount}</div>
          <div className="kpi-sub">spanning {mockCampaigns.filter(c => c.unifiedGroupId).length} channel campaigns</div>
        </div>
        <div className="omni-kpi-card">
          <div className="kpi-label">Best Channel Routing</div>
          <div className="kpi-value">{omniChannelKPIs.bestChannelRouting}%</div>
          <div className="kpi-sub">of sends via intelligent routing</div>
        </div>
        <div className="omni-kpi-card">
          <div className="kpi-label">Multi-Channel Reach</div>
          <div className="kpi-value">{omniChannelKPIs.multiChannelReachability}%</div>
          <div className="kpi-sub">subscribers on 2+ channels</div>
        </div>
      </div>

      {/* Standard KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Sent</div>
          <div className="kpi-value">{formatNum(totalSent)}</div>
          <div className="kpi-sub">across all channels</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Delivery Rate</div>
          <div className="kpi-value">{((totalDelivered / totalSent) * 100).toFixed(1)}%</div>
          <div className="kpi-sub">{formatNum(totalDelivered)} delivered</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Avg Open Rate</div>
          <div className="kpi-value">{avgOpenRate.toFixed(1)}%</div>
          <div className="kpi-sub">across channels</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Avg Click Rate</div>
          <div className="kpi-value">{avgClickRate.toFixed(1)}%</div>
          <div className="kpi-sub">excl. SMS</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Live Campaigns</div>
          <div className="kpi-value">{liveCampaigns.length}</div>
          <div className="kpi-sub">{mockCampaigns.length} total</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Active Journeys</div>
          <div className="kpi-value">{activeJourneys.length}</div>
          <div className="kpi-sub">{mockJourneys.length} total</div>
        </div>
      </div>

      {/* Unified Campaign Groups */}
      <div className="bui-box">
        <div className="section-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Unified Campaign Groups</div>
            <div className="text-muted">Campaigns linked across channels with orchestration</div>
          </div>
          <button className="btn btn-secondary" style={{ fontSize: 13 }} onClick={() => navigate("/campaigns")}>View All</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mockUnifiedGroups.map(g => (
            <div key={g.id} className="ucg-card">
              <div className="ucg-card-header">
                <span className="badge badge-brand" style={{ fontSize: 11 }}>{g.id}</span>
                <span className="ucg-card-title">{g.name}</span>
                <span className={`badge-orchestration badge-orchestration--${g.orchestrationMode}`}>
                  {ORCHESTRATION_LABELS[g.orchestrationMode]}
                </span>
                <div className="ucg-card-channels">
                  {g.channels.map(ch => (
                    <span key={ch} className={`ucg-card-channel ucg-card-channel--${channelClass(ch)}`}>
                      {CHANNEL_ICONS[ch]}
                    </span>
                  ))}
                </div>
                {g.deduplicationEnabled && <span className="badge badge-dedup">Dedup</span>}
              </div>
              <div className="ucg-card-metrics">
                <div className="ucg-card-metric">
                  <div className="ucg-card-metric-value">{formatNum(g.totalReach)}</div>
                  <div className="ucg-card-metric-label">Total Reach</div>
                </div>
                <div className="ucg-card-metric">
                  <div className="ucg-card-metric-value">{formatNum(g.uniqueReach)}</div>
                  <div className="ucg-card-metric-label">Unique Reach</div>
                </div>
                <div className="ucg-card-metric">
                  <div className="ucg-card-metric-value">{g.aggregateOpenRate}%</div>
                  <div className="ucg-card-metric-label">Open Rate</div>
                </div>
                <div className="ucg-card-metric">
                  <div className="ucg-card-metric-value">{g.aggregateClickRate}%</div>
                  <div className="ucg-card-metric-label">Click Rate</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Channel Performance */}
      <div className="bui-box">
        <div className="section-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Channel Performance</div>
            <div className="text-muted">Delivery and engagement metrics by channel</div>
          </div>
        </div>

        <div className="channel-metrics-grid">
          {channelMetrics.map(m => (
            <div key={m.channel} className="channel-metric-card">
              <div className="channel-metric-header">
                <span className="channel-metric-icon">
                  {CHANNEL_ICONS[m.channel.toLowerCase() === "push" ? "push" : m.channel.toLowerCase() === "in-app" ? "whatsapp" : m.channel.toLowerCase() as "email" | "sms"]}
                </span>
                <span className="channel-metric-name">{m.channel}</span>
              </div>
              <div className="channel-metric-stats">
                <div className="channel-stat">
                  <span className="channel-stat-value">{formatNum(m.sent)}</span>
                  <span className="channel-stat-label">Sent</span>
                </div>
                <div className="channel-stat">
                  <span className="channel-stat-value">{m.deliveryRate}%</span>
                  <span className="channel-stat-label">Delivered</span>
                </div>
                <div className="channel-stat">
                  <span className="channel-stat-value">{m.openRate}%</span>
                  <span className="channel-stat-label">Opened</span>
                </div>
                <div className="channel-stat">
                  <span className="channel-stat-value">{m.clickRate > 0 ? m.clickRate + "%" : "N/A"}</span>
                  <span className="channel-stat-label">Clicked</span>
                </div>
              </div>
              <div className="channel-bar-container">
                <div className="channel-bar channel-bar--delivered" style={{ width: `${m.deliveryRate}%` }} />
                <div className="channel-bar channel-bar--opened" style={{ width: `${m.openRate}%` }} />
                <div className="channel-bar channel-bar--clicked" style={{ width: `${m.clickRate}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Send Volume Chart */}
      <div className="bui-box">
        <div className="section-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Daily Send Volume</div>
            <div className="text-muted">Messages sent per channel per day</div>
          </div>
        </div>
        <div className="chart-container">
          <div className="chart-legend">
            <span className="chart-legend-item"><span className="dot dot--email" /> Email</span>
            <span className="chart-legend-item"><span className="dot dot--push" /> Push</span>
            <span className="chart-legend-item"><span className="dot dot--sms" /> SMS</span>
            <span className="chart-legend-item"><span className="dot dot--whatsapp" /> WhatsApp</span>
          </div>
          <div className="bar-chart">
            {dailySends.map(d => (
              <div key={d.date} className="bar-chart-group">
                <div className="bar-chart-bars">
                  <div className="bar bar--email" style={{ height: `${(d.email / maxSend) * 100}%` }} title={`Email: ${formatNum(d.email)}`} />
                  <div className="bar bar--push" style={{ height: `${(d.push / maxSend) * 100}%` }} title={`Push: ${formatNum(d.push)}`} />
                  <div className="bar bar--sms" style={{ height: `${(d.sms / maxSend) * 100}%` }} title={`SMS: ${formatNum(d.sms)}`} />
                  <div className="bar bar--whatsapp" style={{ height: `${(d.whatsapp / maxSend) * 100}%` }} title={`WhatsApp: ${formatNum(d.whatsapp)}`} />
                </div>
                <div className="bar-chart-label">{d.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div className="bui-box">
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Live Campaigns</div>
          <div className="results-list">
            {liveCampaigns.slice(0, 5).map(c => (
              <div key={c.id} className="mini-card">
                <div className="mini-card-title">
                  {c.name}
                  <span className="badge badge-constructive" style={{ fontSize: 10, padding: "1px 6px" }}>Live</span>
                  {c.unifiedGroupId && <span className="badge badge-brand" style={{ fontSize: 10, padding: "1px 6px" }}>{c.unifiedGroupId}</span>}
                </div>
                <div className="mini-card-meta">
                  {c.channels.map(ch => (
                    <span key={ch} className="badge badge-outline" style={{ fontSize: 10, padding: "1px 6px" }}>
                      {CHANNEL_ICONS[ch]} {ch}
                    </span>
                  ))}
                  {c.deliveryCount && <span className="text-muted">{formatNum(c.deliveryCount)} sent</span>}
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-tertiary" style={{ marginTop: 12, width: "100%" }} onClick={() => navigate("/campaigns")}>
            View all campaigns
          </button>
        </div>

        <div className="bui-box">
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Active Journeys</div>
          <div className="results-list">
            {activeJourneys.map(j => (
              <div key={j.id} className="mini-card">
                <div className="mini-card-title">
                  {j.name}
                  <span className="badge badge-constructive" style={{ fontSize: 10, padding: "1px 6px" }}>Active</span>
                  {j.orchestrationType && (
                    <span className={`badge-journey-type badge-journey-type--${j.orchestrationType}`}>
                      {j.orchestrationType === "single_channel" ? "Single" : j.orchestrationType === "cross_channel" ? "Cross-Channel" : "Omni"}
                    </span>
                  )}
                </div>
                <div className="mini-card-meta">
                  {j.channels.map(ch => (
                    <span key={ch} className="badge badge-outline" style={{ fontSize: 10, padding: "1px 6px" }}>
                      {CHANNEL_ICONS[ch]} {ch}
                    </span>
                  ))}
                  {j.audienceSize ? <span className="text-muted">{formatNum(j.audienceSize)} audience</span> : null}
                  {j.conversionRate ? <span className="text-muted">{j.conversionRate}% conv.</span> : null}
                  {j.crossChannelHandoffs ? <span className="text-muted">{formatNum(j.crossChannelHandoffs)} handoffs</span> : null}
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-tertiary" style={{ marginTop: 12, width: "100%" }} onClick={() => navigate("/journeys")}>
            View all journeys
          </button>
        </div>
      </div>
    </div>
  );
}
