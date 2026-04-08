import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CHANNEL_LABELS, CHANNEL_ICONS, type MessageChannel } from "../types";

export default function TransactionalCreate() {
  const navigate = useNavigate();
  const [campaignName, setCampaignName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<MessageChannel[]>(["email"]);
  const [activeContentTab, setActiveContentTab] = useState<MessageChannel>("email");
  const [contentVariants, setContentVariants] = useState<Record<string, { subject: string; body: string }>>({});
  const [contentTrackingLabel, setContentTrackingLabel] = useState("");
  const [experimentEnabled, setExperimentEnabled] = useState(false);
  const [experimentTag, setExperimentTag] = useState("");
  const [affiliateId, setAffiliateId] = useState("");
  const [parentAffiliateId, setParentAffiliateId] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function toggleChannel(ch: MessageChannel) {
    setSelectedChannels(prev => {
      const next = prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch];
      if (next.length > 0 && !next.includes(activeContentTab)) setActiveContentTab(next[0]);
      return next;
    });
  }

  function handleSave() {
    setSaved(true);
    setToast("Transactional campaign saved!");
    setTimeout(() => setToast(null), 3000);
  }

  if (saved) {
    return (
      <div className="app-page">
        <div className="page-header"><div className="page-header-main"><h1 className="page-title">Transactional Campaign Created</h1></div></div>
        <div className="bui-box" style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#10003;</div>
          <h2 style={{ marginBottom: 8 }}>Omni-Channel Transactional Campaign Created</h2>
          <p className="text-muted mb-16">
            "{campaignName}" saved as a Transactional campaign targeting {selectedChannels.map(ch => CHANNEL_LABELS[ch]).join(", ")}.
          </p>
          <p className="text-muted mb-16">
            Delivery Mode: <strong>Multi-Channel</strong> &middot; Priority Pipeline &middot; Bypasses Janeway
          </p>
          <div className="btn-group" style={{ justifyContent: "center", marginTop: 24 }}>
            <button className="btn btn-secondary" onClick={() => navigate("/campaigns")}>View All Campaigns</button>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Create Another</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-main">
          <h1 className="page-title">New Transactional Campaign</h1>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            {selectedChannels.map(ch => (
              <span key={ch} className="badge badge-outline">{CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}</span>
            ))}
            <span className="badge badge-constructive">Transactional</span>
            <span className="badge badge-draft">Draft</span>
            {selectedChannels.length > 1 && (
              <span className="badge badge-brand">Multi-Channel</span>
            )}
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate("/campaigns")}>Cancel</button>
          <button className="btn btn-primary" disabled={!campaignName || selectedChannels.length === 0} onClick={handleSave}>Save</button>
        </div>
      </div>

      {/* Transactional banner */}
      <div className="alert" style={{ background: "var(--color-green-100)", borderLeft: "4px solid var(--color-green-600)", color: "var(--color-green-600)", marginBottom: 0 }}>
        <div className="alert-title">Validated as Transactional</div>
        Routed through the priority transactional pipeline, bypassing Janeway. SLA: 99.9% delivery within 30 seconds.
      </div>

      {/* Campaign Information */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Campaign Information</div>
        <div className="form-group">
          <label className="form-label">Campaign Name</label>
          <input className="form-input" placeholder="e.g., booking_confirmation_omni" value={campaignName} onChange={e => setCampaignName(e.target.value)} maxLength={50} />
          <div className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>{campaignName.length}/50 chars</div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Description</label>
          <textarea className="form-textarea" placeholder="Describe the purpose of this transactional campaign..." value={description} onChange={e => setDescription(e.target.value)} />
        </div>
      </div>

      {/* Channel Selection — multi-select */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Channel Selection</div>
        <p className="text-muted mb-16">Select one or more channels for this transactional campaign. Critical messages can be delivered across multiple channels for maximum reliability.</p>
        <div className="channel-selector-grid">
          {(["email", "push", "sms", "in_app"] as MessageChannel[]).map(ch => (
            <div key={ch} className={`channel-selector-card ${selectedChannels.includes(ch) ? "selected" : ""}`} onClick={() => toggleChannel(ch)}>
              <div className="channel-selector-check">{selectedChannels.includes(ch) ? "\u2713" : ""}</div>
              <div className="channel-selector-icon">{CHANNEL_ICONS[ch]}</div>
              <div className="channel-selector-label">{CHANNEL_LABELS[ch]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-Channel Delivery — shown when multiple channels selected */}
      {selectedChannels.length > 1 && (
        <div className="bui-box tier-selection-appear">
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Multi-Channel Delivery</div>
          <p className="text-muted mb-16">Transactional messages are delivered across all selected channels simultaneously for maximum reliability.</p>

          <div className="alert alert-info" style={{ marginBottom: 0 }}>
            <div className="alert-title">Multi-Channel Delivery Active</div>
            <ul style={{ margin: "8px 0 0 16px", padding: 0 }}>
              <li>Transactional messages bypass marketing consent — delivered regardless of subscription preferences</li>
              <li>All selected channels fire simultaneously for maximum reliability</li>
              <li>Duplicate content de-duplication is handled per subscriber per campaign</li>
              <li>Priority pipeline SLA applies to all channels independently</li>
            </ul>
          </div>
        </div>
      )}

      {/* Per-Channel Content Variants */}
      {selectedChannels.length > 0 && (
        <div className="bui-box">
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Channel Content Variants</div>
          <p className="text-muted mb-16">Each channel requires its own content variant. Transactional content must not contain promotional material.</p>

          <div className="content-tabs">
            {selectedChannels.map(ch => (
              <button key={ch} className={`content-tab ${activeContentTab === ch ? "active" : ""}`} onClick={() => setActiveContentTab(ch)}>
                {CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}
              </button>
            ))}
          </div>

          <div className="content-tab-panel">
            {activeContentTab === "email" && selectedChannels.includes("email") && (
              <>
                <div className="form-group">
                  <label className="form-label">Subject Line</label>
                  <input className="form-input" placeholder="e.g., Your booking confirmation #{{booking_id}}" value={contentVariants.email?.subject || ""} onChange={e => setContentVariants(v => ({ ...v, email: { subject: e.target.value, body: v.email?.body || "" } }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Content (HTML)</label>
                  <textarea className="form-textarea" placeholder="Enter transactional email HTML or select a template..." style={{ minHeight: 120 }} value={contentVariants.email?.body || ""} onChange={e => setContentVariants(v => ({ ...v, email: { body: e.target.value, subject: v.email?.subject || "" } }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Content ID</label>
                  <input className="form-input" placeholder="Select existing content template..." />
                </div>
              </>
            )}
            {activeContentTab === "push" && selectedChannels.includes("push") && (
              <>
                <div className="form-group">
                  <label className="form-label">Push Title</label>
                  <input className="form-input" placeholder="e.g., Booking Confirmed" maxLength={50} />
                </div>
                <div className="form-group">
                  <label className="form-label">Push Body</label>
                  <input className="form-input" placeholder="e.g., Your booking #{{booking_id}} is confirmed. Check-in: {{date}}" maxLength={150} />
                </div>
                <div className="form-group">
                  <label className="form-label">Deep Link URL</label>
                  <input className="form-input" placeholder="e.g., booking://reservation/{{booking_id}}" />
                </div>
              </>
            )}
            {activeContentTab === "sms" && selectedChannels.includes("sms") && (
              <>
                <div className="form-group">
                  <label className="form-label">SMS Text</label>
                  <textarea className="form-textarea" placeholder="e.g., Booking.com: Your booking #{{booking_id}} is confirmed. Details: {{link}}" maxLength={320} style={{ minHeight: 80 }} />
                  <div className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>Keep under 160 chars for single-segment delivery</div>
                </div>
              </>
            )}
            {activeContentTab === "in_app" && selectedChannels.includes("in_app") && (
              <>
                <div className="form-group">
                  <label className="form-label">In-App Card Title</label>
                  <input className="form-input" placeholder="e.g., Booking Confirmed" />
                </div>
                <div className="form-group">
                  <label className="form-label">In-App Card Body</label>
                  <textarea className="form-textarea" placeholder="e.g., Your reservation at {{property_name}} is confirmed." style={{ minHeight: 80 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">CTA Button Text</label>
                  <input className="form-input" placeholder="e.g., View Booking" />
                </div>
              </>
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Content Tracking Label</label>
              <input className="form-input" placeholder="e.g., booking_conf_v1" value={contentTrackingLabel} onChange={e => setContentTrackingLabel(e.target.value)} style={{ maxWidth: 400 }} />
            </div>
          </div>
        </div>
      )}

      {/* Experiment */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Experiment</div>
        {!experimentEnabled ? (
          <div style={{ padding: 24, border: "1px dashed var(--border-color)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
            <p className="text-muted" style={{ marginBottom: 12 }}>No experiment configured. Set up an A/B test to compare content or channel routing variants.</p>
            <button className="btn btn-secondary" onClick={() => setExperimentEnabled(true)}>Setup Experiment</button>
          </div>
        ) : (
          <div className="tier-selection-appear">
            <div className="form-group">
              <label className="form-label">Experiment Tag</label>
              <input className="form-input" placeholder="e.g., emk_booking_conf_experiment" value={experimentTag} onChange={e => setExperimentTag(e.target.value)} />
            </div>
            <button className="btn btn-secondary btn-destructive" onClick={() => { setExperimentEnabled(false); setExperimentTag(""); }}>Remove Experiment</button>
          </div>
        )}
      </div>

      {/* Reporting */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Reporting Settings</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Affiliate ID</label>
            <input className="form-input" type="number" placeholder="e.g., 123456" value={affiliateId} onChange={e => setAffiliateId(e.target.value)} />
            <div className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>Required to publish. Used for reporting attribution.</div>
          </div>
          <div className="form-group">
            <label className="form-label">Parent Affiliate ID</label>
            <input className="form-input" type="number" placeholder="e.g., 654321" value={parentAffiliateId} onChange={e => setParentAffiliateId(e.target.value)} />
            <div className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>Required to publish.</div>
          </div>
        </div>
      </div>

      {/* Bottom Save */}
      <div className="btn-group">
        <button className="btn btn-secondary" onClick={() => navigate("/campaigns")}>Cancel</button>
        <button className="btn btn-primary" disabled={!campaignName || selectedChannels.length === 0} onClick={handleSave}>Save Campaign</button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
