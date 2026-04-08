import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockCampaigns } from "../data/mockData";
import { CHANNEL_ICONS, TYPE_LABELS, type MessageType, type MessageChannel } from "../types";

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

export default function CampaignList() {
  const navigate = useNavigate();
  const [filterText, setFilterText] = useState("");
  const [filterChannel, setFilterChannel] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortField, setSortField] = useState("updated_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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

  return (
    <div className="app-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1 className="page-title">Campaigns</h1>
          <p className="page-subtitle">Manage omni-channel campaigns across Email, Push, SMS, and In-App</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => navigate("/campaign/new")}>+ New Campaign</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-card">
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
              <option value="in_app">In-App</option>
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
          <div className="results-count">{filtered.length} {filtered.length === 1 ? "Campaign" : "Campaigns"}</div>
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
                </div>
                <div className="list-card-subtitle">{m.description}</div>
                <div className="list-card-meta">
                  {m.channels.map(ch => (
                    <span key={ch} className="badge badge-outline">{CHANNEL_ICONS[ch]} {ch === "in_app" ? "In-App" : ch === "push" ? "Push" : ch.charAt(0).toUpperCase() + ch.slice(1)}</span>
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
      </div>
    </div>
  );
}
