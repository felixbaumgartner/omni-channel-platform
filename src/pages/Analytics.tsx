import { useState } from "react";
import { channelMetrics, dailySends, mockCampaigns, mockUnifiedGroups, omniChannelKPIs, channelOverlap } from "../data/mockData";
import { CHANNEL_ICONS, ORCHESTRATION_LABELS, type MessageChannel } from "../types";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

const maxSend = Math.max(...dailySends.flatMap(d => [d.email, d.push, d.sms, d.whatsapp]));
const channelClass = (ch: MessageChannel) => ch === "whatsapp" ? "whatsapp" : ch;

export default function Analytics() {
  const [period, setPeriod] = useState("7d");

  const totalSent = channelMetrics.reduce((s, m) => s + m.sent, 0);
  const totalDelivered = channelMetrics.reduce((s, m) => s + m.delivered, 0);
  const totalOpened = channelMetrics.reduce((s, m) => s + m.opened, 0);
  const totalClicked = channelMetrics.reduce((s, m) => s + m.clicked, 0);

  const topCampaigns = mockCampaigns
    .filter(c => c.deliveryCount)
    .sort((a, b) => (b.deliveryCount || 0) - (a.deliveryCount || 0))
    .slice(0, 5);

  return (
    <div className="app-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Unified campaign performance across all channels</p>
        </div>
        <div className="page-header-actions">
          <select className="form-select" style={{ width: "auto" }} value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Omni-Channel Intelligence Metrics */}
      <div className="omni-kpi-grid">
        <div className="omni-kpi-card">
          <div className="kpi-label">Routing Lift</div>
          <div className="kpi-value">+{omniChannelKPIs.routingLift}%</div>
          <div className="kpi-sub">open rate vs. random channel</div>
        </div>
        <div className="omni-kpi-card">
          <div className="kpi-label">Cross-Channel Lift</div>
          <div className="kpi-value">+{omniChannelKPIs.crossChannelConversionLift}%</div>
          <div className="kpi-sub">conversion vs single-channel</div>
        </div>
        <div className="omni-kpi-card">
          <div className="kpi-label">Cannibalization</div>
          <div className="kpi-value">{omniChannelKPIs.channelCannibalizationRate}%</div>
          <div className="kpi-sub">channels competing for same conversion</div>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Sent</div>
          <div className="kpi-value">{formatNum(totalSent)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Delivered</div>
          <div className="kpi-value">{formatNum(totalDelivered)}</div>
          <div className="kpi-sub">{((totalDelivered / totalSent) * 100).toFixed(1)}% rate</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Opened</div>
          <div className="kpi-value">{formatNum(totalOpened)}</div>
          <div className="kpi-sub">{((totalOpened / totalDelivered) * 100).toFixed(1)}% rate</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Clicked</div>
          <div className="kpi-value">{formatNum(totalClicked)}</div>
          <div className="kpi-sub">{((totalClicked / totalDelivered) * 100).toFixed(1)}% rate</div>
        </div>
      </div>

      {/* Unified Campaign Group Performance */}
      <div className="bui-box">
        <div className="section-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Unified Campaign Group Performance</div>
            <div className="text-muted">Aggregate metrics across linked channel campaigns</div>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Group</th>
              <th>Channels</th>
              <th>Orchestration</th>
              <th style={{ textAlign: "right" }}>Total Reach</th>
              <th style={{ textAlign: "right" }}>Unique Reach</th>
              <th style={{ textAlign: "right" }}>Open %</th>
              <th style={{ textAlign: "right" }}>Click %</th>
            </tr>
          </thead>
          <tbody>
            {mockUnifiedGroups.map(g => (
              <tr key={g.id}>
                <td>
                  <strong>{g.name}</strong>
                  <div style={{ fontSize: 11, color: "var(--color-gray-500)" }}>{g.id}</div>
                </td>
                <td>
                  {g.channels.map(ch => (
                    <span key={ch} className={`ucg-card-channel ucg-card-channel--${channelClass(ch)}`} style={{ display: "inline-flex", width: 24, height: 24, fontSize: 12 }}>
                      {CHANNEL_ICONS[ch]}
                    </span>
                  ))}
                </td>
                <td>
                  <span className={`badge-orchestration badge-orchestration--${g.orchestrationMode}`}>
                    {ORCHESTRATION_LABELS[g.orchestrationMode]}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>{formatNum(g.totalReach)}</td>
                <td style={{ textAlign: "right" }}>{formatNum(g.uniqueReach)}</td>
                <td style={{ textAlign: "right" }}>{g.aggregateOpenRate}%</td>
                <td style={{ textAlign: "right" }}>{g.aggregateClickRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Channel Overlap Analysis */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div className="bui-box">
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Channel Overlap</div>
          <p className="text-muted mb-16">Subscriber reachability across channels</p>
          <div className="channel-overlap-container">
            <div className="overlap-circle overlap-circle--email" />
            <div className="overlap-circle overlap-circle--push" />
            <div className="overlap-circle overlap-circle--sms" />
            <div className="overlap-circle overlap-circle--whatsapp" />
            <div className="overlap-center-label">
              {channelOverlap.allFour}%
              <div className="overlap-center-sub">all 4 channels</div>
            </div>
          </div>
          <div className="overlap-stats">
            <div className="overlap-stat">
              <div className="overlap-stat-value" style={{ color: "var(--color-email)" }}>{channelOverlap.emailAndPush}%</div>
              <div className="overlap-stat-label">Email + Push</div>
            </div>
            <div className="overlap-stat">
              <div className="overlap-stat-value" style={{ color: "var(--color-whatsapp)" }}>{channelOverlap.pushAndInApp}%</div>
              <div className="overlap-stat-label">Push + WhatsApp</div>
            </div>
            <div className="overlap-stat">
              <div className="overlap-stat-value" style={{ color: "var(--color-sms)" }}>{channelOverlap.emailAndSms}%</div>
              <div className="overlap-stat-label">Email + SMS</div>
            </div>
            <div className="overlap-stat">
              <div className="overlap-stat-value">{channelOverlap.allFour}%</div>
              <div className="overlap-stat-label">All 4 Channels</div>
            </div>
          </div>
        </div>

        {/* Subscriber Reachability */}
        <div className="bui-box">
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Subscriber Reachability</div>
          <p className="text-muted mb-16">Distribution by number of reachable channels</p>
          <div className="reachability-grid">
            {channelOverlap.reachabilityTiers.map(t => (
              <div key={t.channels} className="reachability-card">
                <div className="reachability-channels">{t.channels}</div>
                <div className="reachability-label">channel{t.channels > 1 ? "s" : ""}</div>
                <div className="reachability-pct">{t.pct}%</div>
                <div className="reachability-engagement">{formatNum(t.subscribers)}</div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 4, background: "var(--color-gray-100)", borderRadius: 2 }}>
                    <div style={{ height: 4, width: `${t.avgEngagement}%`, background: t.channels >= 3 ? "var(--color-green-600)" : "var(--color-blue-500)", borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: 10, color: "var(--color-gray-500)", marginTop: 2 }}>{t.avgEngagement}% engagement</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-Channel Breakdown Table */}
      <div className="bui-box">
        <div className="section-header">
          <div style={{ fontWeight: 700, fontSize: 16 }}>Per-Channel Performance</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Channel</th>
              <th style={{ textAlign: "right" }}>Sent</th>
              <th style={{ textAlign: "right" }}>Delivered</th>
              <th style={{ textAlign: "right" }}>Delivery %</th>
              <th style={{ textAlign: "right" }}>Opened</th>
              <th style={{ textAlign: "right" }}>Open %</th>
              <th style={{ textAlign: "right" }}>Clicked</th>
              <th style={{ textAlign: "right" }}>Click %</th>
              <th style={{ textAlign: "right" }}>Bounce %</th>
            </tr>
          </thead>
          <tbody>
            {channelMetrics.map(m => (
              <tr key={m.channel}>
                <td><strong>{m.channel}</strong></td>
                <td style={{ textAlign: "right" }}>{formatNum(m.sent)}</td>
                <td style={{ textAlign: "right" }}>{formatNum(m.delivered)}</td>
                <td style={{ textAlign: "right" }}><span className={`badge ${m.deliveryRate > 96 ? "badge-constructive" : "badge-callout"}`}>{m.deliveryRate}%</span></td>
                <td style={{ textAlign: "right" }}>{formatNum(m.opened)}</td>
                <td style={{ textAlign: "right" }}>{m.openRate}%</td>
                <td style={{ textAlign: "right" }}>{m.clicked > 0 ? formatNum(m.clicked) : "N/A"}</td>
                <td style={{ textAlign: "right" }}>{m.clickRate > 0 ? m.clickRate + "%" : "N/A"}</td>
                <td style={{ textAlign: "right" }}><span className={`badge ${m.bounceRate < 3 ? "badge-constructive" : m.bounceRate < 5 ? "badge-callout" : "badge-destructive"}`}>{m.bounceRate}%</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Daily Send Volume */}
      <div className="bui-box">
        <div className="section-header">
          <div style={{ fontWeight: 700, fontSize: 16 }}>Daily Send Volume</div>
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

      {/* Top Campaigns */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Top Performing Campaigns</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Channels</th>
              <th>Type</th>
              <th>Group</th>
              <th style={{ textAlign: "right" }}>Sent</th>
              <th style={{ textAlign: "right" }}>Open Rate</th>
              <th style={{ textAlign: "right" }}>Click Rate</th>
            </tr>
          </thead>
          <tbody>
            {topCampaigns.map(c => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td>{c.channels.map(ch => <span key={ch} style={{ marginRight: 4 }}>{CHANNEL_ICONS[ch]}</span>)}</td>
                <td><span className={`badge ${c.type === "transactional" ? "badge-constructive" : c.type === "marketing" ? "badge-marketing" : "badge-outline"}`}>{c.type}</span></td>
                <td>{c.unifiedGroupId ? <span className="badge badge-brand" style={{ fontSize: 10 }}>{c.unifiedGroupId}</span> : <span className="text-muted">-</span>}</td>
                <td style={{ textAlign: "right" }}>{formatNum(c.deliveryCount || 0)}</td>
                <td style={{ textAlign: "right" }}>{c.openRate}%</td>
                <td style={{ textAlign: "right" }}>{c.clickRate ? c.clickRate + "%" : "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cross-Channel Attribution */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Cross-Channel Attribution</div>
        <p className="text-muted mb-16">Understand how subscribers interact across channels before converting</p>
        <div className="attribution-grid">
          <div className="attribution-card">
            <div className="attribution-path">
              <span className="attribution-node">{CHANNEL_ICONS.push} Push</span>
              <span className="attribution-arrow">&rarr;</span>
              <span className="attribution-node">{CHANNEL_ICONS.email} Email</span>
              <span className="attribution-arrow">&rarr;</span>
              <span className="attribution-node attribution-node--convert">Booking</span>
            </div>
            <div className="attribution-stats">
              <span>18.4% of multi-channel conversions</span>
              <span className="badge badge-constructive">+12% vs single-channel</span>
            </div>
          </div>
          <div className="attribution-card">
            <div className="attribution-path">
              <span className="attribution-node">{CHANNEL_ICONS.email} Email</span>
              <span className="attribution-arrow">&rarr;</span>
              <span className="attribution-node">{CHANNEL_ICONS.whatsapp} WhatsApp</span>
              <span className="attribution-arrow">&rarr;</span>
              <span className="attribution-node attribution-node--convert">Booking</span>
            </div>
            <div className="attribution-stats">
              <span>14.2% of multi-channel conversions</span>
              <span className="badge badge-constructive">+8% vs single-channel</span>
            </div>
          </div>
          <div className="attribution-card">
            <div className="attribution-path">
              <span className="attribution-node">{CHANNEL_ICONS.sms} SMS</span>
              <span className="attribution-arrow">&rarr;</span>
              <span className="attribution-node">{CHANNEL_ICONS.push} Push</span>
              <span className="attribution-arrow">&rarr;</span>
              <span className="attribution-node attribution-node--convert">Booking</span>
            </div>
            <div className="attribution-stats">
              <span>9.1% of multi-channel conversions</span>
              <span className="badge badge-constructive">+15% vs single-channel</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
