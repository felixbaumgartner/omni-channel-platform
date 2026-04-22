import { useState } from "react";
import { CHANNEL_ICONS, CHANNEL_LABELS, type MessageChannel } from "../types";
import { mockHoldouts, type MockHoldout } from "../data/mockData";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

const HASH_COLORS: Record<string, string> = {
  email: "var(--color-email)", push: "var(--color-push)", sms: "var(--color-sms)", whatsapp: "var(--color-whatsapp)",
};

const ALL_CHANNELS: MessageChannel[] = ["email", "push", "sms", "whatsapp"];
const ALL_FUNNELS = ["pre_book", "post_book", "post_trip", "reactivation"] as const;
const ALL_VERTICALS = ["accommodation", "flights", "attractions", "car_rental"] as const;

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
  const [purpose, setPurpose] = useState<"marketing" | "test">("marketing");
  const [channels, setChannels] = useState<MessageChannel[]>([]);
  const [funnels, setFunnels] = useState<string[]>([]);
  const [verticals, setVerticals] = useState<string[]>([]);
  const [hashStart, setHashStart] = useState("0");
  const [hashEnd, setHashEnd] = useState("5");
  const [salt, setSalt] = useState("");
  const [isReward, setIsReward] = useState(false);
  const [crossChannelCoordinated, setCrossChannelCoordinated] = useState(true);
  const [perChannelRanges, setPerChannelRanges] = useState<Record<string, { start: string; end: string }>>({});

  const hashPct = Math.max(0, Math.min(100, Number(hashEnd) - Number(hashStart)));
  const nameValid = /^[a-zA-Z0-9_-]{4,64}$/.test(name);
  const descValid = description.length >= 10 && description.length <= 255;
  const canSave = nameValid && descValid && channels.length > 0 && funnels.length > 0 && verticals.length > 0 && hashPct > 0;

  function toggleChannel(ch: MessageChannel) {
    setChannels(prev => {
      const next = prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch];
      // Auto-populate per-channel ranges when adding
      if (!prev.includes(ch)) {
        setPerChannelRanges(r => ({ ...r, [ch]: { start: hashStart, end: hashEnd } }));
      }
      return next;
    });
  }

  function toggleItem<T extends string>(list: T[], item: T, setter: (v: T[]) => void) {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  }

  function handleSave() {
    const pcrObj: Record<string, { start: number; end: number }> = {};
    if (crossChannelCoordinated) {
      channels.forEach(ch => { pcrObj[ch] = { start: Number(hashStart), end: Number(hashEnd) }; });
    } else {
      channels.forEach(ch => {
        const r = perChannelRanges[ch];
        pcrObj[ch] = r ? { start: Number(r.start), end: Number(r.end) } : { start: Number(hashStart), end: Number(hashEnd) };
      });
    }

    const holdout: MockHoldout = {
      id: 4000 + Date.now() % 1000,
      name,
      description,
      purpose,
      status: "Draft",
      channels,
      funnels,
      verticals,
      hashRange: { start: Number(hashStart), end: Number(hashEnd) },
      salt: salt || `${name}_${Date.now()}`,
      matchedCampaigns: 0,
      subscribersHeldOut: 0,
      crossChannelCoordinated,
      perChannelRanges: crossChannelCoordinated ? pcrObj : pcrObj,
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
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Purpose <span style={{ color: "var(--color-red-600)" }}>*</span></label>
          <div className="radio-card-group">
            <div className={`radio-card ${purpose === "marketing" ? "selected" : ""}`} onClick={() => setPurpose("marketing")} style={{ padding: 12 }}>
              <div className="radio-card-header" style={{ marginBottom: 4 }}>
                <div className="radio-card-radio" />
                <div className="radio-card-title">Marketing</div>
              </div>
              <div className="radio-card-description">Holdout for incrementality measurement of marketing campaigns</div>
            </div>
            <div className={`radio-card ${purpose === "test" ? "selected" : ""}`} onClick={() => setPurpose("test")} style={{ padding: 12 }}>
              <div className="radio-card-header" style={{ marginBottom: 4 }}>
                <div className="radio-card-radio" />
                <div className="radio-card-title">Test</div>
              </div>
              <div className="radio-card-description">Holdout for A/B testing or experimentation purposes</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Channel Selection ── */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Channel Selection <span style={{ color: "var(--color-red-600)" }}>*</span></div>
        <p className="text-muted mb-16">Select which channels this holdout group applies to.</p>
        <div className="channel-selector-grid">
          {ALL_CHANNELS.map(ch => (
            <div key={ch} className={`channel-selector-card ${channels.includes(ch) ? "selected" : ""}`} onClick={() => toggleChannel(ch)}>
              <div className="channel-selector-check">{channels.includes(ch) ? "\u2713" : ""}</div>
              <div className="channel-selector-icon">{CHANNEL_ICONS[ch]}</div>
              <div className="channel-selector-label">{CHANNEL_LABELS[ch]}</div>
            </div>
          ))}
        </div>
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

        {/* Live preview bar */}
        <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, color: "var(--color-gray-500)" }}>HASH RANGE PREVIEW</div>
        <div className="holdout-hash-bar" style={{ height: 32 }}>
          <div className="holdout-hash-fill" style={{
            left: `${Number(hashStart)}%`,
            width: `${hashPct}%`,
            background: channels.length > 1 && crossChannelCoordinated
              ? "linear-gradient(90deg, var(--color-email), var(--color-push), var(--color-sms), var(--color-whatsapp))"
              : "var(--color-blue-500)",
          }}>
            <span className="holdout-hash-label" style={{ fontSize: 12 }}>{hashPct}%</span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--color-gray-300)", marginTop: 2 }}>
          <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
        </div>
      </div>

      {/* ── 5. Omni-Channel Coordination ── */}
      {channels.length > 1 && (
        <div className="bui-box tier-selection-appear">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Cross-Channel Holdout Coordination</div>
              <p className="text-muted" style={{ marginTop: 4 }}>When enabled, the same hash range applies to all selected channels. A subscriber held out on email is also held out on push/SMS/WhatsApp.</p>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={crossChannelCoordinated} onChange={e => setCrossChannelCoordinated(e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>

          {crossChannelCoordinated ? (
            <div className="alert alert-info">
              <div className="alert-title">Coordinated Mode Active</div>
              All {channels.length} channels use the same hash range ({hashStart}% – {hashEnd}%). This ensures clean incrementality measurement across the unified campaign group.
            </div>
          ) : (
            <div className="tier-selection-appear">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Per-Channel Hash Ranges</div>
              <p className="text-muted mb-8" style={{ fontSize: 12 }}>Configure different holdout percentages per channel.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {channels.map(ch => {
                  const r = perChannelRanges[ch] || { start: hashStart, end: hashEnd };
                  return (
                    <div key={ch} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ width: 100, fontSize: 13, fontWeight: 600 }}>{CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}</span>
                      <input className="form-input" type="number" min="0" max="100" style={{ width: 70 }} value={r.start}
                        onChange={e => setPerChannelRanges(prev => ({ ...prev, [ch]: { ...r, start: e.target.value } }))} />
                      <span className="text-muted">to</span>
                      <input className="form-input" type="number" min="0" max="100" style={{ width: 70 }} value={r.end}
                        onChange={e => setPerChannelRanges(prev => ({ ...prev, [ch]: { ...r, end: e.target.value } }))} />
                      <div className="holdout-hash-bar" style={{ flex: 1, height: 14 }}>
                        <div className="holdout-hash-fill" style={{
                          left: `${Number(r.start)}%`,
                          width: `${Math.max(0, Number(r.end) - Number(r.start))}%`,
                          background: HASH_COLORS[ch] || "var(--color-blue-500)",
                        }} />
                      </div>
                      <span style={{ width: 40, textAlign: "right", fontWeight: 700, fontSize: 13 }}>{Math.max(0, Number(r.end) - Number(r.start))}%</span>
                    </div>
                  );
                })}
              </div>
              <div className="alert alert-warning" style={{ marginTop: 12 }}>
                <div className="alert-title">Independent Ranges</div>
                Each channel has an independent holdout range. A subscriber may be held out on email but not on push. This is suitable for channel-specific incrementality tests.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 6. Advanced Settings ── */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Advanced Settings</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Salt</label>
            <input className="form-input" placeholder="Auto-generated if empty" value={salt} onChange={e => setSalt(e.target.value)} />
            <div className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>Randomization seed for consistent hashing. Same salt = same subscriber assignment.</div>
          </div>
        </div>
      </div>

      {/* ── Summary & Save ── */}
      <div className="bui-box" style={{ background: "var(--color-gray-50)" }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Summary</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
          <div>
            <div className="text-muted" style={{ fontSize: 11 }}>Purpose</div>
            <div style={{ fontWeight: 600 }}>{purpose}</div>
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: 11 }}>Channels</div>
            <div style={{ fontWeight: 600 }}>{channels.length > 0 ? channels.map(ch => CHANNEL_ICONS[ch]).join(" ") : "—"}</div>
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: 11 }}>Holdout Size</div>
            <div style={{ fontWeight: 600 }}>{hashPct}%</div>
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: 11 }}>Coordination</div>
            <div style={{ fontWeight: 600 }}>{channels.length > 1 ? (crossChannelCoordinated ? "Cross-Channel" : "Independent") : "Single Channel"}</div>
          </div>
        </div>
        {!canSave && (
          <div className="alert alert-warning" style={{ marginBottom: 12 }}>
            Please complete all required fields: name (4-64 chars), description (10-255 chars), at least 1 channel, 1 funnel, 1 vertical, and a hash range &gt; 0%.
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

  const liveCount = holdouts.filter(h => h.status === "Live").length;
  const crossChannelCount = holdouts.filter(h => h.crossChannelCoordinated).length;
  const totalHeldOut = holdouts.filter(h => h.status === "Live").reduce((s, h) => s + h.subscribersHeldOut, 0);

  function handleCreate(holdout: MockHoldout) {
    setHoldouts(prev => [holdout, ...prev]);
    setCreating(false);
    setToast(`Holdout group "${holdout.name}" created successfully!`);
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className="app-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1 className="page-title">{creating ? "Create Holdout Group" : "Holdout Management"}</h1>
          <p className="page-subtitle">
            {creating
              ? "Configure a new holdout group for incrementality measurement"
              : "Channel-specific and cross-channel holdout groups for incrementality measurement"}
          </p>
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
        <>
          {/* KPIs */}
          <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            <div className="kpi-card">
              <div className="kpi-label">Live Holdouts</div>
              <div className="kpi-value">{liveCount}</div>
              <div className="kpi-sub">{holdouts.length} total</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Subscribers Held Out</div>
              <div className="kpi-value">{formatNum(totalHeldOut)}</div>
              <div className="kpi-sub">across all live holdouts</div>
            </div>
            <div className="omni-kpi-card">
              <div className="kpi-label">Cross-Channel Coordinated</div>
              <div className="kpi-value">{crossChannelCount}</div>
              <div className="kpi-sub">unified holdout across channels</div>
            </div>
            <div className="omni-kpi-card">
              <div className="kpi-label">Matched Campaigns</div>
              <div className="kpi-value">{holdouts.reduce((s, h) => s + h.matchedCampaigns, 0)}</div>
              <div className="kpi-sub">campaigns affected by holdouts</div>
            </div>
          </div>

          {/* Omni-channel info */}
          <div className="info-banner">
            <span className="info-banner-icon">&#128279;</span>
            <span>
              <strong>Cross-Channel Holdout Coordination:</strong> In PROD, holdouts are per-channel. With omni-channel, a subscriber in an email holdout is automatically held out from push/SMS for the same UCG, ensuring clean incrementality measurement.
            </span>
          </div>

          {/* Holdout List */}
          <div className="results-card">
            <div className="results-header">
              <div className="results-count">{holdouts.length} Holdout Groups</div>
            </div>
            <div className="results-list">
              {holdouts.map(h => (
                <div key={h.id} className="list-card" style={{ flexDirection: "column" }}>
                  <div className="list-card-content">
                    <div className="list-card-title">
                      <span>{h.name}</span>
                      <span className={`badge ${h.status === "Live" ? "badge-constructive" : h.status === "Draft" ? "badge-draft" : "badge-archived"}`}>{h.status}</span>
                      <span className="badge badge-outline">{h.purpose}</span>
                      {h.crossChannelCoordinated && (
                        <span className="badge-orchestration badge-orchestration--multi_channel">Cross-Channel Coordinated</span>
                      )}
                    </div>
                    <div className="list-card-subtitle">{h.description}</div>
                    <div className="list-card-meta" style={{ marginTop: 4 }}>
                      {h.channels.map(ch => (
                        <span key={ch} className="badge badge-outline">{CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}</span>
                      ))}
                      <span className="badge badge-media">Funnels: {h.funnels.join(", ")}</span>
                      <span className="badge badge-media">Verticals: {h.verticals.join(", ")}</span>
                      <span className="badge badge-media">{h.matchedCampaigns} campaigns</span>
                      {h.subscribersHeldOut > 0 && <span className="badge badge-media">{formatNum(h.subscribersHeldOut)} held out</span>}
                    </div>

                    {/* Hash Range Visualization */}
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-gray-500)", marginBottom: 6 }}>
                        HASH RANGE: {h.hashRange.start}% – {h.hashRange.end}% ({h.hashRange.end - h.hashRange.start}% of traffic)
                      </div>
                      <div className="holdout-hash-bar">
                        <div className="holdout-hash-fill" style={{
                          left: `${h.hashRange.start}%`,
                          width: `${h.hashRange.end - h.hashRange.start}%`,
                          background: h.crossChannelCoordinated ? "linear-gradient(90deg, var(--color-email), var(--color-push), var(--color-sms))" : "var(--color-blue-500)",
                        }}>
                          <span className="holdout-hash-label">{h.hashRange.end - h.hashRange.start}%</span>
                        </div>
                      </div>

                      {/* Per-channel ranges for cross-channel holdouts */}
                      {h.crossChannelCoordinated && h.perChannelRanges && (
                        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-gray-500)" }}>PER-CHANNEL HASH RANGES (COORDINATED)</div>
                          {Object.entries(h.perChannelRanges).map(([ch, range]) => (
                            <div key={ch} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                              <span style={{ width: 60 }}>{CHANNEL_ICONS[ch as MessageChannel]} {ch}</span>
                              <div className="holdout-hash-bar" style={{ flex: 1, height: 14 }}>
                                <div className="holdout-hash-fill" style={{
                                  left: `${range.start}%`,
                                  width: `${range.end - range.start}%`,
                                  background: HASH_COLORS[ch] || "var(--color-blue-500)",
                                }} />
                              </div>
                              <span style={{ width: 50, textAlign: "right", fontWeight: 600 }}>{range.start}-{range.end}%</span>
                            </div>
                          ))}
                          <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>
                            Same hash range across all channels ensures a subscriber held out on email is also held out on push/SMS/WhatsApp.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
