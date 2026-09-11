import { useState } from "react";
import { CHANNEL_ICONS, CHANNEL_LABELS, type MessageChannel } from "../types";
import { mockHoldouts, type MockHoldout } from "../data/mockData";

/* Same shape as PROD: 10 base36 characters from a random byte array. */
function generateSalt(): string {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => (b % 36).toString(36)).join("");
}

const ALL_CHANNELS: MessageChannel[] = ["email", "push", "sms", "whatsapp"];
const ALL_FUNNELS = ["pre_book", "post_book", "post_trip", "reactivation"] as const;
const ALL_VERTICALS = ["accommodation", "flights", "attractions", "car_rental"] as const;

/* Mirrors PROD: a holdout hashes UVI type + UVI value + salt, and each
   channel can only resolve certain UVI types. Priority order is fixed. */
const UVI_PRIORITY = ["BUID", "User ID", "Soylent Email ID", "Device ID"] as const;
type UviType = typeof UVI_PRIORITY[number];
const CHANNEL_UVIS: Record<MessageChannel, UviType[]> = {
  email: ["BUID", "User ID", "Soylent Email ID"],
  push: ["BUID", "User ID", "Device ID"],
  sms: ["BUID", "User ID"],
  whatsapp: ["BUID", "User ID"],
};

function randomizationUvis(channels: MessageChannel[]): UviType[] {
  const set = new Set(channels.flatMap(ch => CHANNEL_UVIS[ch]));
  return UVI_PRIORITY.filter(u => set.has(u));
}

/* ═══════════════════════════════════════════════════════
   Holdout Creation Form
   ═══════════════════════════════════════════════════════ */

interface HoldoutCreateFormProps {
  onSave: (holdout: MockHoldout) => void;
  onCancel: () => void;
}

function HoldoutCreateForm({ onSave, onCancel }: HoldoutCreateFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [channels, setChannels] = useState<MessageChannel[]>([]);
  const [funnels, setFunnels] = useState<string[]>([]);
  const [verticals, setVerticals] = useState<string[]>([]);
  const [hashStart, setHashStart] = useState("0");
  const [hashEnd, setHashEnd] = useState("5");
  const [salt] = useState(generateSalt);
  const [isReward, setIsReward] = useState(false);

  const uvis = randomizationUvis(channels);

  const hashPct = Math.max(0, Math.min(100, Number(hashEnd) - Number(hashStart)));
  const nameValid = /^[a-zA-Z0-9_-]{4,64}$/.test(name);
  const descValid = description.length >= 10 && description.length <= 255;

  const canSave = nameValid && descValid && channels.length > 0 && funnels.length > 0 && verticals.length > 0 && hashPct > 0;

  function toggleChannel(ch: MessageChannel) {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  }

  function toggleItem<T extends string>(list: T[], item: T, setter: (v: T[]) => void) {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  }

  function handleSave() {
    const holdout: MockHoldout = {
      id: 4000 + Date.now() % 1000,
      name,
      description,
      status: "Draft",
      channels,
      funnels,
      verticals,
      hashRange: { start: Number(hashStart), end: Number(hashEnd) },
      salt,
      matchedCampaigns: 0,
      subscribersHeldOut: 0,
      crossChannelCoordinated: channels.length > 1,
    };
    onSave(holdout);
  }

  return (
    <div className="tier-selection-appear" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── 1. Basic Information ── */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Basic Information</div>
        <div className="form-group">
          <label className="form-label">Holdout Group Name <span style={{ color: "var(--color-red-600)" }}>*</span></label>
          <input className="form-input" placeholder="e.g., global_marketing_holdout_5pct" value={name} onChange={e => setName(e.target.value)} maxLength={64} />
          <div className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>
            {name.length}/64 chars &middot; Alphanumeric, underscore, dash only
            {name.length > 0 && !nameValid && <span style={{ color: "var(--color-red-600)" }}> &mdash; Invalid (min 4 chars, alphanumeric/_/- only)</span>}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Description <span style={{ color: "var(--color-red-600)" }}>*</span></label>
          <textarea className="form-textarea" placeholder="Describe the purpose and scope of this holdout group..." value={description} onChange={e => setDescription(e.target.value)} maxLength={255} />
          <div className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>
            {description.length}/255 chars
            {description.length > 0 && !descValid && <span style={{ color: "var(--color-red-600)" }}> &mdash; Min 10 chars required</span>}
          </div>
        </div>
      </div>

      {/* ── 2. Channel Selection ── */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Channel Selection <span style={{ color: "var(--color-red-600)" }}>*</span></div>
        <p className="text-muted mb-16">Select which channels this holdout group applies to. PROD holdouts support Email and Push today.</p>
        <div className="channel-selector-grid">
          {ALL_CHANNELS.map(ch => (
            <div key={ch} className={`channel-selector-card ${channels.includes(ch) ? "selected" : ""}`} onClick={() => toggleChannel(ch)}>
              <div className="channel-selector-check">{channels.includes(ch) ? "\u2713" : ""}</div>
              <div className="channel-selector-icon">{CHANNEL_ICONS[ch]}</div>
              <div className="channel-selector-label">{CHANNEL_LABELS[ch]}</div>
            </div>
          ))}
        </div>
        {channels.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-gray-500)", marginBottom: 6 }}>RANDOMIZATION IDENTITY (DERIVED FROM CHANNELS, PRIORITY ORDER)</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {uvis.map((u, i) => <span key={u} className="badge badge-outline">{i + 1}. {u}</span>)}
            </div>
            <div className="text-muted" style={{ fontSize: 12, marginTop: 6 }}>
              The hash is UVI type + UVI value + salt. Cross-channel coordination only holds for subscribers who resolve to BUID or User ID on every channel. A subscriber known only by {channels.includes("email") ? "Soylent Email ID" : "a channel identifier"}{channels.includes("push") ? " or Device ID" : ""} lands in a different bucket per channel, so that fallback share is measured per channel, not per campaign.
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Scope: Funnels & Verticals ── */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Scope</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <label className="form-label">Funnels <span style={{ color: "var(--color-red-600)" }}>*</span></label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ALL_FUNNELS.map(f => (
                <label key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                  <input type="checkbox" checked={funnels.includes(f)} onChange={() => toggleItem(funnels, f, setFunnels)} style={{ accentColor: "var(--color-blue-500)" }} />
                  {f.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                </label>
              ))}
            </div>
            <button className="btn btn-tertiary" style={{ marginTop: 6, fontSize: 12, padding: "2px 8px" }} onClick={() => setFunnels([...ALL_FUNNELS])}>Select all</button>
          </div>
          <div>
            <label className="form-label">Verticals <span style={{ color: "var(--color-red-600)" }}>*</span></label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ALL_VERTICALS.map(v => (
                <label key={v} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                  <input type="checkbox" checked={verticals.includes(v)} onChange={() => toggleItem(verticals, v, setVerticals)} style={{ accentColor: "var(--color-blue-500)" }} />
                  {v.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                </label>
              ))}
            </div>
            <button className="btn btn-tertiary" style={{ marginTop: 6, fontSize: 12, padding: "2px 8px" }} onClick={() => setVerticals([...ALL_VERTICALS])}>Select all</button>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={isReward} onChange={e => setIsReward(e.target.checked)} style={{ accentColor: "var(--color-blue-500)" }} />
            Apply to reward campaigns
          </label>
        </div>
      </div>

      {/* ── 4. Hash Range Configuration ── */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Hash Range Configuration</div>
        <p className="text-muted mb-16">Define the percentage of traffic held out. Uses consistent hashing with salt for stable assignment.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Hash Start (%)</label>
            <input className="form-input" type="number" min="0" max="100" value={hashStart} onChange={e => setHashStart(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Hash End (%)</label>
            <input className="form-input" type="number" min="0" max="100" value={hashEnd} onChange={e => setHashEnd(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Holdout Size</label>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--color-blue-600)", lineHeight: "36px" }}>{hashPct}%</div>
            <div className="text-muted" style={{ fontSize: 12 }}>of traffic</div>
          </div>
        </div>

      </div>

      {/* ── 6. Advanced Settings ── */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Advanced Settings</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Salt</label>
            <input className="form-input" value={salt} readOnly />
            <div className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>Auto-generated randomization seed for consistent hashing. Same salt = same subscriber assignment.</div>
          </div>
        </div>
      </div>

      {/* ── Summary & Save ── */}
      <div className="bui-box" style={{ background: "var(--color-gray-50)" }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Summary</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 16 }}>
          <div>
            <div className="text-muted" style={{ fontSize: 11 }}>Channels</div>
            <div style={{ fontWeight: 600 }}>{channels.length > 0 ? channels.map(ch => CHANNEL_ICONS[ch]).join(" ") : "—"}</div>
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: 11 }}>Holdout Size</div>
            <div style={{ fontWeight: 600 }}>{hashPct}%</div>
          </div>
        </div>
        {!canSave && (
          <div className="alert alert-warning" style={{ marginBottom: 12 }}>
            Please complete all required fields: name (4-64 chars), description (10-255 chars), at least 1 channel, 1 funnel, 1 vertical, a hash range &gt; 0%.
          </div>
        )}
      </div>

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={!canSave} onClick={handleSave}>Create Holdout Group</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Holdout Management Page
   ═══════════════════════════════════════════════════════ */

export default function HoldoutManagement() {
  const [holdouts, setHoldouts] = useState<MockHoldout[]>(mockHoldouts);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function handleCreate(holdout: MockHoldout) {
    setHoldouts(prev => [holdout, ...prev]);
    setCreating(false);
    setToast(`Holdout group "${holdout.name}" created`);
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className="app-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1 className="page-title">{creating ? "Create Holdout Group" : "Holdout Management"}</h1>
        </div>
        <div className="page-header-actions">
          {!creating && (
            <button className="btn btn-primary" onClick={() => setCreating(true)}>+ New Holdout Group</button>
          )}
        </div>
      </div>

      {creating ? (
        <HoldoutCreateForm onSave={handleCreate} onCancel={() => setCreating(false)} />
      ) : (
        <div className="results-card">
          <div className="results-list">
            {holdouts.map(h => (
              <div key={h.id} className="list-card">
                <div className="list-card-content">
                  <div className="list-card-title">
                    <span>{h.name}</span>
                    <span className={`badge ${h.status === "Live" ? "badge-constructive" : h.status === "Draft" ? "badge-draft" : "badge-archived"}`}>{h.status}</span>
                  </div>
                  <div className="list-card-meta" style={{ marginTop: 4 }}>
                    {h.channels.map(ch => (
                      <span key={ch} className="badge badge-outline">{CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}</span>
                    ))}
                    <span className="badge badge-media">{h.hashRange.end - h.hashRange.start}% held out</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
