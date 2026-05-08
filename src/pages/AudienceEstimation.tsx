import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockSegments } from "../data/mockData";
import { CHANNEL_ICONS, CHANNEL_LABELS, ORCHESTRATION_LABELS, type MessageChannel } from "../types";

function formatNum(n: number): string {
  if (n >= 1_000_000) return "~" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "~" + (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

const STATUS_BADGE: Record<string, string> = {
  done: "badge-constructive",
  scheduled: "badge-callout",
  draft: "badge-outline",
};

export default function AudienceEstimation() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedSegment, setExpandedSegment] = useState<number | null>(null);

  const filtered = mockSegments.filter(s => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="app-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1 className="page-title">Audience Estimation</h1>
          <p className="page-subtitle">Define targeting segments and estimate cross-channel reach with overlap analysis</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => navigate("/audience-estimation/new")}>
            + New Segment
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="segment-filter-bar">
        <div className="segment-status-tabs">
          {[
            { key: "all", label: "All" },
            { key: "done", label: "Done" },
            { key: "scheduled", label: "Scheduled" },
            { key: "draft", label: "Draft" },
          ].map(tab => (
            <button
              key={tab.key}
              className={`segment-status-tab ${statusFilter === tab.key ? "segment-status-tab--active" : ""}`}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label}
              <span className="segment-status-tab-count">
                {tab.key === "all" ? mockSegments.length : mockSegments.filter(s => s.status === tab.key).length}
              </span>
            </button>
          ))}
        </div>
        <input
          type="text"
          className="form-input"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 220 }}
        />
      </div>

      {/* Segments Table */}
      <div className="bui-box">
        <table className="data-table">
          <thead>
            <tr>
              <th>Segment</th>
              <th>Channels</th>
              <th>Orchestration</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Unique Audience</th>
              <th style={{ textAlign: "right" }}>Overlap</th>
              <th style={{ textAlign: "right" }}>Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(seg => (
              <>
                <tr key={seg.id} style={{ cursor: seg.channelReach ? "pointer" : "default" }} onClick={() => setExpandedSegment(expandedSegment === seg.id ? null : seg.id)}>
                  <td>
                    <strong>{seg.name}</strong>
                    <div style={{ fontSize: 11, color: "var(--color-gray-500)", marginTop: 2 }}>{seg.description}</div>
                  </td>
                  <td>
                    {seg.channels.map((ch: MessageChannel) => (
                      <span key={ch} className={`ucg-card-channel ucg-card-channel--${ch === "whatsapp" ? "whatsapp" : ch}`} style={{ display: "inline-flex", width: 24, height: 24, fontSize: 12 }}>
                        {CHANNEL_ICONS[ch]}
                      </span>
                    ))}
                  </td>
                  <td>
                    <span className={`badge-orchestration badge-orchestration--${seg.orchestrationMode}`}>
                      {ORCHESTRATION_LABELS[seg.orchestrationMode]}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[seg.status]}`}>{seg.status}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {seg.estimatedAudience ? (
                      <div>
                        <strong>{formatNum(seg.estimatedAudience)}</strong>
                        {seg.totalSends && seg.totalSends !== seg.estimatedAudience && (
                          <div style={{ fontSize: 10, color: "var(--color-gray-500)" }}>
                            {formatNum(seg.totalSends)} total sends
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted">Not estimated</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {seg.overlapCount ? (
                      <div>
                        <strong>{formatNum(seg.overlapCount)}</strong>
                        <div style={{ fontSize: 10, color: "var(--color-gray-500)" }}>
                          {seg.estimatedAudience ? Math.round((seg.overlapCount / seg.estimatedAudience) * 100) : 0}% multi-channel
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right", fontSize: 12, color: "var(--color-gray-500)" }}>{seg.lastUpdated}</td>
                </tr>
                {/* Expanded row: per-channel reach breakdown */}
                {expandedSegment === seg.id && seg.channelReach && (
                  <tr key={`${seg.id}-expand`}>
                    <td colSpan={7} style={{ padding: 0 }}>
                      <div className="tier-selection-appear" style={{ padding: "16px 24px", background: "var(--color-gray-50)", borderTop: "1px solid var(--color-gray-100)" }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Channel Reach Breakdown</div>
                        <div className="audience-overlap-grid">
                          {seg.channels.map(ch => (
                            <div key={ch} className={`audience-overlap-card audience-overlap-card--${ch}`}>
                              <div className="audience-overlap-card-value">
                                {seg.channelReach![ch] ? formatNum(seg.channelReach![ch]!) : "-"}
                              </div>
                              <div className="audience-overlap-card-label">
                                {CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}
                              </div>
                            </div>
                          ))}
                          <div className="audience-overlap-card audience-overlap-card--total">
                            <div className="audience-overlap-card-value">{formatNum(seg.estimatedAudience || 0)}</div>
                            <div className="audience-overlap-card-label">Total Unique</div>
                          </div>
                        </div>
                        {seg.overlapCount && seg.estimatedAudience && (
                          <div style={{ fontSize: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span className="text-muted">Users reachable via 2+ channels</span>
                              <strong>{formatNum(seg.overlapCount)} ({Math.round((seg.overlapCount / seg.estimatedAudience) * 100)}%)</strong>
                            </div>
                            <div className="audience-overlap-bar">
                              <div className="audience-overlap-bar-fill" style={{ width: `${Math.round((seg.overlapCount / seg.estimatedAudience) * 100)}%`, background: "var(--color-blue-500)" }} />
                            </div>
                            <div className="text-muted" style={{ fontSize: 11, marginTop: 6 }}>
                              Sum of per-channel audiences ({Object.values(seg.channelReach!).reduce((a, b) => (a || 0) + (b || 0), 0) ? formatNum(Object.values(seg.channelReach!).reduce((a, b) => (a || 0) + (b || 0), 0)!) : "0"}) exceeds unique audience ({formatNum(seg.estimatedAudience)}) because {formatNum(seg.overlapCount)} users are reachable on multiple channels.
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: "var(--color-gray-400)" }}>
            No segments match your filters
          </div>
        )}
      </div>
    </div>
  );
}
