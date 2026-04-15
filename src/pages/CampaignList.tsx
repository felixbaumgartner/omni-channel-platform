import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockCampaigns, mockUnifiedGroups } from "../data/mockData";
import { CHANNEL_ICONS, TYPE_LABELS, ORCHESTRATION_LABELS, type MessageType, type MessageChannel } from "../types";

function StatusBadge({ status }: { status: string }) {
  const cls = status === "Published" || status === "Live" ? "badge badge-published" : status === "Stopped" ? "badge badge-stopped" : status === "Archived" ? "badge badge-archived" : "badge badge-draft";
  return <span className={cls}>{status}</span>;
}

function TypeBadge({ type }: { type: MessageType }) {
  const cls = type === "transactional" ? "badge badge-constructive" : type === "marketing" ? "badge badge-marketing" : "badge badge-outline";
  return <span className={cls}>{TYPE_LABELS[type]}</span>;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

const channelClass = (ch: MessageChannel) => ch === "whatsapp" ? "whatsapp" : ch;

export default function CampaignList() {
  const navigate = useNavigate();
  const [filterText, setFilterText] = useState("");
  const [filterChannel, setFilterChannel] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortField, setSortField] = useState("updated_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"channel" | "unified">("unified");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const filtered = mockCampaigns
    .filter(m => {
      if (filterText && !m.name.toLowerCase().includes(filterText.toLowerCase()) && !m.description.toLowerCase().includes(filterText.toLowerCase())) return false;
      if (filterChannel !== "all" && !m.channels.includes(filterChannel as MessageChannel)) return false;
      if (filterType !== "all" && m.type !== filterType) return false;
      if (filterStatus !== "all" && m.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "name") return a.name.localeCompare(b.name) * dir;
      return a.id > b.id ? dir : -dir;
    });

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Campaigns not in any unified group
  const ungroupedCampaigns = filtered.filter(c => !c.unifiedGroupId);

  return (
    <div className="app-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1 className="page-title">Campaigns</h1>
          <p className="page-subtitle">Manage omni-channel campaigns across Email, Push, SMS, and WhatsApp</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => navigate("/campaign/new")}>+ New Campaign</button>
        </div>
      </div>

      {/* View Toggle + Filters */}
      <div className="filter-card">
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: "var(--color-gray-500)" }}>View:</span>
          <div className="view-toggle">
            <button className={`view-toggle-btn ${viewMode === "unified" ? "active" : ""}`} onClick={() => setViewMode("unified")}>
              Unified View
            </button>
            <button className={`view-toggle-btn ${viewMode === "channel" ? "active" : ""}`} onClick={() => setViewMode("channel")}>
              Per-Channel View
            </button>
          </div>
          {viewMode === "unified" && (
            <span style={{ fontSize: 12, color: "var(--color-gray-500)" }}>
              Campaigns grouped by Unified Campaign Group
            </span>
          )}
          {viewMode === "channel" && (
            <span style={{ fontSize: 12, color: "var(--color-gray-500)" }}>
              Legacy: individual channel campaigns (PROD view)
            </span>
          )}
        </div>
        <div className="filter-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search</label>
            <input className="form-input" placeholder="Filter by name or description..." value={filterText} onChange={e => setFilterText(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Message Type</label>
            <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="marketing">Marketing</option>
              <option value="non_marketing">Non-marketing</option>
              <option value="transactional">Transactional</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Channel</label>
            <select className="form-select" value={filterChannel} onChange={e => setFilterChannel(e.target.value)}>
              <option value="all">All Channels</option>
              <option value="email">Email</option>
              <option value="push">Push</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Status</label>
            <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
              <option value="Live">Live</option>
              <option value="Stopped">Stopped</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="results-card">
        <div className="results-header">
          <div className="results-count">
            {viewMode === "unified"
              ? `${mockUnifiedGroups.length} Groups + ${ungroupedCampaigns.length} Standalone`
              : `${filtered.length} ${filtered.length === 1 ? "Campaign" : "Campaigns"}`}
          </div>
          <div className="results-sort">
            <span className="results-sort-label">Sort by</span>
            <select className="form-select" style={{ width: "auto" }} value={sortField} onChange={e => setSortField(e.target.value)}>
              <option value="updated_at">Updated Date</option>
              <option value="created_at">Created Date</option>
              <option value="name">Name</option>
            </select>
            <button className="btn btn-secondary" style={{ padding: "6px 10px" }} onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}>
              {sortDir === "asc" ? "\u2191" : "\u2193"}
            </button>
          </div>
        </div>

        {viewMode === "unified" ? (
          /* ── Unified View ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mockUnifiedGroups.map(g => {
              const isExpanded = expandedGroups.has(g.id);
              const groupCampaigns = filtered.filter(c => c.unifiedGroupId === g.id);
              if (groupCampaigns.length === 0 && filterText) return null;
              return (
                <div key={g.id} className="ucg-card">
                  <div className="ucg-card-header">
                    <span className="badge badge-brand" style={{ fontSize: 11 }}>{g.id}</span>
                    <span className="ucg-card-title">{g.name}</span>
                    <TypeBadge type={g.type} />
                    <StatusBadge status={g.status} />
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
                      <div className="ucg-card-metric-label">Unique (Deduped)</div>
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
                  <div className="ucg-card-expand" onClick={() => toggleGroup(g.id)}>
                    {isExpanded ? "\u25BC" : "\u25B6"} {g.channelDeliveries.length} channel deliveries &mdash; {g.description}
                  </div>
                  {isExpanded && (
                    <div className="ucg-card-children" style={{ paddingTop: 12 }}>
                      {g.channelDeliveries.map(cd => (
                        <div key={cd.channel} className="ucg-child-row">
                          <span className={`ucg-card-channel ucg-card-channel--${channelClass(cd.channel)}`}>
                            {CHANNEL_ICONS[cd.channel]}
                          </span>
                          <strong>{cd.channel === "whatsapp" ? "WhatsApp" : cd.channel.charAt(0).toUpperCase() + cd.channel.slice(1)}</strong>
                          <span className="badge badge-outline" style={{ fontSize: 11 }}>{cd.messageCategory}</span>
                          <span className={`badge ${cd.status === "active" ? "badge-constructive" : "badge-stopped"}`} style={{ fontSize: 11 }}>
                            {cd.status}
                          </span>
                          <span className="text-muted" style={{ marginLeft: "auto" }}>Campaign #{cd.campaignId}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Ungrouped campaigns */}
            {ungroupedCampaigns.length > 0 && (
              <>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--color-gray-500)", padding: "8px 0", marginTop: 8 }}>
                  Standalone Campaigns (not in a unified group)
                </div>
                {ungroupedCampaigns.map(m => (
                  <div key={m.id} className="list-card">
                    <div className="list-card-content">
                      <div className="list-card-title">
                        <span>{m.name}</span>
                        <TypeBadge type={m.type} />
                        <StatusBadge status={m.status} />
                      </div>
                      <div className="list-card-subtitle">{m.description}</div>
                      <div className="list-card-meta">
                        {m.channels.map(ch => (
                          <span key={ch} className="badge badge-outline">{CHANNEL_ICONS[ch]} {ch === "whatsapp" ? "WhatsApp" : ch === "push" ? "Push" : ch.charAt(0).toUpperCase() + ch.slice(1)}</span>
                        ))}
                        <span className="badge badge-media">{m.pipeline}</span>
                        {m.deliveryCount && <span className="badge badge-media">{formatNum(m.deliveryCount)} sent</span>}
                      </div>
                    </div>
                    <div className="list-card-actions">
                      <button className="btn btn-tertiary" style={{ fontSize: 12 }}>Clone</button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
          /* ── Per-Channel (Legacy) View ── */
          <div className="results-list">
            {filtered.length === 0 && (
              <div style={{ padding: 32, textAlign: "center", color: "var(--color-gray-500)" }}>
                No campaigns found matching the current filters.
              </div>
            )}
            {filtered.map(m => (
              <div key={m.id} className="list-card">
                <div className="list-card-content">
                  <div className="list-card-title">
                    <span>{m.name}</span>
                    <TypeBadge type={m.type} />
                    <StatusBadge status={m.status} />
                    {m.unifiedGroupId && (
                      <span className="badge badge-brand" style={{ fontSize: 10 }}>{m.unifiedGroupId}</span>
                    )}
                    {m.orchestrationMode && (
                      <span className={`badge-orchestration badge-orchestration--${m.orchestrationMode}`} style={{ fontSize: 10 }}>
                        {ORCHESTRATION_LABELS[m.orchestrationMode]}
                      </span>
                    )}
                  </div>
                  <div className="list-card-subtitle">{m.description}</div>
                  <div className="list-card-meta">
                    {m.channels.map(ch => (
                      <span key={ch} className="badge badge-outline">{CHANNEL_ICONS[ch]} {ch === "whatsapp" ? "WhatsApp" : ch === "push" ? "Push" : ch.charAt(0).toUpperCase() + ch.slice(1)}</span>
                    ))}
                    <span className="badge badge-media">{m.pipeline}</span>
                    {m.deliveryCount && <span className="badge badge-media">{formatNum(m.deliveryCount)} sent</span>}
                    {m.openRate && <span className="badge badge-media">{m.openRate}% open</span>}
                    <span className="badge badge-media">Updated {m.updatedAt} by {m.updatedBy}</span>
                  </div>
                </div>
                <div className="list-card-actions">
                  <button className="btn btn-tertiary" style={{ fontSize: 12 }}>Clone</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
