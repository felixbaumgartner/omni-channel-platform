import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CHANNEL_LABELS, CHANNEL_ICONS, type MessageChannel } from "../types";
import BaseContentSection from "../components/BaseContentSection";

export default function TransactionalCreate() {
  const navigate = useNavigate();
  const [campaignName, setCampaignName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<MessageChannel[]>([]);
  const [experimentEnabled, setExperimentEnabled] = useState(false);
  const [experimentTag, setExperimentTag] = useState("");
  const [affiliateId, setAffiliateId] = useState("");
  const [parentAffiliateId, setParentAffiliateId] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function toggleChannel(ch: MessageChannel) {
    setSelectedChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
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

      {/* SLA & Priority Tiers */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>SLA & Priority Tier</div>
        <p className="text-muted mb-16">Transactional messages are routed by priority tier with guaranteed delivery SLAs.</p>
        <div className="sla-tiers">
          <div className="sla-tier selected">
            <div className="sla-tier-label">P0 &mdash; Critical</div>
            <div className="sla-tier-time">&lt; 5s</div>
            <div className="sla-tier-desc">OTP, security alerts, verification codes</div>
          </div>
          <div className="sla-tier">
            <div className="sla-tier-label">P1 &mdash; High</div>
            <div className="sla-tier-time">&lt; 30s</div>
            <div className="sla-tier-desc">Booking confirmations, modifications</div>
          </div>
          <div className="sla-tier">
            <div className="sla-tier-label">P2 &mdash; Standard</div>
            <div className="sla-tier-time">&lt; 60s</div>
            <div className="sla-tier-desc">Payment receipts, invoices</div>
          </div>
        </div>
        <div className="text-muted" style={{ marginTop: 12, fontSize: 12 }}>
          Priority is auto-assigned based on the input topic. Retry policy: 3 automatic retries with exponential backoff.
        </div>
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
          {(["email", "push", "sms", "whatsapp"] as MessageChannel[]).map(ch => (
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
          <p className="text-muted mb-16">All selected channels fire within a single send event for maximum reliability.</p>

          {/* Channel Send Spacing */}
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Channel Send Spacing</div>
          <p className="text-muted mb-8" style={{ fontSize: 13 }}>A platform-level minimum spacing of <strong>5 minutes</strong> is enforced between successive channel dispatches to the same subscriber.</p>
          <div className="fallback-chain">
            {selectedChannels.map((ch, i) => (
              <div key={ch}>
                <div className="fallback-chain-item">
                  <span className="fallback-chain-number">{i + 1}</span>
                  <span style={{ fontSize: 18 }}>{CHANNEL_ICONS[ch]}</span>
                  <strong>{CHANNEL_LABELS[ch]}</strong>
                </div>
                {i < selectedChannels.length - 1 && (
                  <div className="fallback-chain-arrow">&#8595; 5 min spacing</div>
                )}
              </div>
            ))}
          </div>
          <p className="text-muted" style={{ fontSize: 12, marginTop: 8 }}>Channels dispatch in the order shown above. This spacing is a delivery hygiene guardrail — it is not configurable, does not introduce conditional logic, and all selected channels will always fire.</p>
        </div>
      )}

      {/* Base Content */}
      <BaseContentSection selectedChannels={selectedChannels} />

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
