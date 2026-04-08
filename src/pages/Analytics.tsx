import { useState } from "react";
import { channelMetrics, dailySends, mockCampaigns } from "../data/mockData";
import { CHANNEL_ICONS } from "../types";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

const maxSend = Math.max(...dailySends.flatMap(d => [d.email, d.push, d.sms, d.in_app]));

export default function Analytics() {
  const [period, setPeriod] = useState("7d");
  const [channelFilter, setChannelFilter] = useState("all");

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

      {/* Send Volume Chart */}
      <div className="bui-box">
        <div className="section-header">
          <div style={{ fontWeight: 700, fontSize: 16 }}>Daily Send Volume</div>
        </div>
        <div className="chart-container">
          <div className="chart-legend">
            <span className="chart-legend-item"><span className="dot dot--email" /> Email</span>
            <span className="chart-legend-item"><span className="dot dot--push" /> Push</span>
            <span className="chart-legend-item"><span className="dot dot--sms" /> SMS</span>
            <span className="chart-legend-item"><span className="dot dot--inapp" /> In-App</span>
          </div>
          <div className="bar-chart">
            {dailySends.map(d => (
              <div key={d.date} className="bar-chart-group">
                <div className="bar-chart-bars">
                  <div className="bar bar--email" style={{ height: `${(d.email / maxSend) * 100}%` }} title={`Email: ${formatNum(d.email)}`} />
                  <div className="bar bar--push" style={{ height: `${(d.push / maxSend) * 100}%` }} title={`Push: ${formatNum(d.push)}`} />
                  <div className="bar bar--sms" style={{ height: `${(d.sms / maxSend) * 100}%` }} title={`SMS: ${formatNum(d.sms)}`} />
                  <div className="bar bar--inapp" style={{ height: `${(d.in_app / maxSend) * 100}%` }} title={`In-App: ${formatNum(d.in_app)}`} />
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
              <span className="attribution-node">{CHANNEL_ICONS.in_app} In-App</span>
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
