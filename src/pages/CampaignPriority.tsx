import { useState } from "react";
import { CHANNEL_ICONS, CHANNEL_LABELS, ORCHESTRATION_LABELS, type MessageChannel } from "../types";
import { mockCampaignPriorities } from "../data/mockData";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

const rankClass = (p: number) => p >= 95 ? "critical" : p >= 80 ? "high" : p >= 70 ? "medium" : "low";
const rankLabel = (p: number) => p >= 95 ? "Critical" : p >= 80 ? "High" : p >= 70 ? "Medium" : "Low";

export default function CampaignPriority() {
  const [groupBy, setGroupBy] = useState<"channel" | "ucg">("channel");

  const channels = [...new Set(mockCampaignPriorities.map(p => p.channel))];
  const ucgs = [...new Set(mockCampaignPriorities.filter(p => p.unifiedGroupId).map(p => p.unifiedGroupId!))];

  const sorted = [...mockCampaignPriorities].sort((a, b) => b.priority - a.priority);

  return (
    <div className="app-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1 className="page-title">Campaign Priority</h1>
          <p className="page-subtitle">Send-time conflict resolution — higher priority campaigns send first</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="kpi-card">
          <div className="kpi-label">Total Priorities</div>
          <div className="kpi-value">{mockCampaignPriorities.length}</div>
          <div className="kpi-sub">channel-campaign pairs</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Critical (95+)</div>
          <div className="kpi-value">{mockCampaignPriorities.filter(p => p.priority >= 95).length}</div>
          <div className="kpi-sub">transactional</div>
        </div>
        <div className="omni-kpi-card">
          <div className="kpi-label">UCG Priorities</div>
          <div className="kpi-value">{mockCampaignPriorities.filter(p => p.unifiedGroupId).length}</div>
          <div className="kpi-sub">across {ucgs.length} unified groups</div>
        </div>
        <div className="omni-kpi-card">
          <div className="kpi-label">Cross-Channel Conflicts</div>
          <div className="kpi-value">3</div>
          <div className="kpi-sub">resolved by omni-channel priority</div>
        </div>
      </div>

      {/* Omni-channel info */}
      <div className="info-banner">
        <span className="info-banner-icon">&#128200;</span>
        <span>
          <strong>Cross-Channel Priority:</strong> In PROD, priority is per-pipeline (channel-specific). With omni-channel, the UCG priority matrix ensures consistent priority across channels and resolves conflicts when the same subscriber is targeted by multiple campaigns on different channels.
        </span>
      </div>

      {/* View Toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: -8 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: "var(--color-gray-500)" }}>Group by:</span>
        <div className="view-toggle">
          <button className={`view-toggle-btn ${groupBy === "channel" ? "active" : ""}`} onClick={() => setGroupBy("channel")}>Channel</button>
          <button className={`view-toggle-btn ${groupBy === "ucg" ? "active" : ""}`} onClick={() => setGroupBy("ucg")}>Unified Group</button>
        </div>
      </div>

      {groupBy === "channel" ? (
        /* ── Per-Channel Priority Stack ── */
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {channels.map(ch => {
            const channelItems = sorted.filter(p => p.channel === ch);
            return (
              <div key={ch} className="bui-box">
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>
                  {CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]} Pipeline
                </div>
                <div className="priority-stack">
                  {channelItems.map(p => (
                    <div key={`${p.campaignId}-${p.channel}`} className="priority-row">
                      <div className={`priority-rank priority-rank--${rankClass(p.priority)}`}>{p.priority}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.campaignName}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>{p.pipeline}</div>
                      </div>
                      <span className={`badge ${p.type === "transactional" ? "badge-constructive" : p.type === "marketing" ? "badge-marketing" : "badge-outline"}`}>{p.type}</span>
                      {p.unifiedGroupId && <span className="badge badge-brand" style={{ fontSize: 10 }}>{p.unifiedGroupId}</span>}
                      <span className={`badge badge-outline`} style={{ fontSize: 10 }}>{rankLabel(p.priority)}</span>
                      <div className="priority-bar" style={{ width: 80 }}>
                        <div className="priority-bar-fill" style={{
                          width: `${p.priority}%`,
                          background: p.priority >= 95 ? "var(--color-red-600)" : p.priority >= 80 ? "var(--callout-300)" : "var(--color-blue-500)",
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Per-UCG Cross-Channel Matrix ── */
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {ucgs.map(ucgId => {
            const ucgItems = sorted.filter(p => p.unifiedGroupId === ucgId);
            return (
              <div key={ucgId} className="bui-box">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span className="badge badge-brand">{ucgId}</span>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{ucgItems[0]?.campaignName}</span>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Channel</th>
                      <th>Pipeline</th>
                      <th style={{ textAlign: "center" }}>Priority</th>
                      <th style={{ textAlign: "center" }}>Tier</th>
                      <th>Priority Bar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ucgItems.map(p => (
                      <tr key={`${p.campaignId}-${p.channel}`}>
                        <td><strong>{CHANNEL_ICONS[p.channel]} {CHANNEL_LABELS[p.channel]}</strong></td>
                        <td>{p.pipeline}</td>
                        <td style={{ textAlign: "center" }}><span style={{ fontWeight: 700, fontSize: 16 }}>{p.priority}</span></td>
                        <td style={{ textAlign: "center" }}>
                          <span className={`badge ${p.priority >= 80 ? "badge-callout" : "badge-outline"}`}>{rankLabel(p.priority)}</span>
                        </td>
                        <td>
                          <div className="priority-bar">
                            <div className="priority-bar-fill" style={{
                              width: `${p.priority}%`,
                              background: p.priority >= 80 ? "var(--callout-300)" : "var(--color-blue-500)",
                            }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-muted" style={{ marginTop: 8, fontSize: 12 }}>
                  Priority delta across channels: {Math.max(...ucgItems.map(p => p.priority)) - Math.min(...ucgItems.map(p => p.priority))} points.
                  {ucgItems.length > 1 && " Email typically has lower priority than push for marketing to reduce inbox fatigue."}
                </div>
              </div>
            );
          })}

          {/* Standalone campaigns */}
          <div className="bui-box">
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Standalone Campaigns (no UCG)</div>
            <div className="priority-stack">
              {sorted.filter(p => !p.unifiedGroupId).map(p => (
                <div key={`${p.campaignId}-${p.channel}`} className="priority-row">
                  <div className={`priority-rank priority-rank--${rankClass(p.priority)}`}>{p.priority}</div>
                  <span style={{ fontSize: 16 }}>{CHANNEL_ICONS[p.channel]}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p.campaignName}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>{p.pipeline}</div>
                  </div>
                  <span className={`badge ${p.type === "transactional" ? "badge-constructive" : "badge-outline"}`}>{p.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
