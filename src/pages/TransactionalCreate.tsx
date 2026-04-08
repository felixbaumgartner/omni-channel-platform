import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CHANNEL_LABELS, CHANNEL_ICONS, type MessageChannel } from "../types";

export default function TransactionalCreate() {
  const navigate = useNavigate();
  const [campaignName, setCampaignName] = useState("");
  const [description, setDescription] = useState("");
  const [channel, setChannel] = useState<MessageChannel>("email");
  const [contentTrackingLabel, setContentTrackingLabel] = useState("");
  const [affiliateId, setAffiliateId] = useState("");
  const [parentAffiliateId, setParentAffiliateId] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
          <h2 style={{ marginBottom: 8 }}>Campaign Created</h2>
          <p className="text-muted mb-16">"{campaignName}" saved as Transactional via priority pipeline.</p>
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
      <div className="page-header">
        <div className="page-header-main">
          <h1 className="page-title">New Transactional Campaign</h1>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <span className="badge badge-outline">{CHANNEL_ICONS[channel]} {CHANNEL_LABELS[channel]}</span>
            <span className="badge badge-constructive">Transactional</span>
            <span className="badge badge-draft">Draft</span>
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate("/campaigns")}>Cancel</button>
          <button className="btn btn-primary" disabled={!campaignName} onClick={handleSave}>Save</button>
        </div>
      </div>
      <div className="alert" style={{ background: "var(--color-green-100)", borderLeft: "4px solid var(--color-green-600)", color: "var(--color-green-600)", marginBottom: 0 }}>
        Validated as transactional. Routed through priority pipeline, bypassing Janeway.
      </div>
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Campaign Information</div>
        <div className="form-group">
          <label className="form-label">Campaign Name</label>
          <input className="form-input" placeholder="e.g., booking_confirmation_email" value={campaignName} onChange={e => setCampaignName(e.target.value)} maxLength={50} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" placeholder="Describe the purpose..." value={description} onChange={e => setDescription(e.target.value)} />
        </div>
      </div>
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Channel</div>
        <div className="radio-card-group">
          {(["email", "push", "sms"] as MessageChannel[]).map(ch => (
            <div key={ch} className={`radio-card ${channel === ch ? "selected" : ""}`} onClick={() => setChannel(ch)} style={{ padding: "12px 16px" }}>
              <div className="radio-card-header">
                <div className="radio-card-radio" />
                <div className="radio-card-title">{CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Content</div>
        <div className="form-group">
          <label className="form-label">Content Tracking Label</label>
          <input className="form-input" placeholder="e.g., booking_conf_v1" value={contentTrackingLabel} onChange={e => setContentTrackingLabel(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Content ID</label>
          <input className="form-input" placeholder="Select content..." />
        </div>
      </div>
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Reporting</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Affiliate ID</label>
            <input className="form-input" type="number" placeholder="e.g., 123456" value={affiliateId} onChange={e => setAffiliateId(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Parent Affiliate ID</label>
            <input className="form-input" type="number" placeholder="e.g., 654321" value={parentAffiliateId} onChange={e => setParentAffiliateId(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="btn-group">
        <button className="btn btn-secondary" onClick={() => navigate("/campaigns")}>Cancel</button>
        <button className="btn btn-primary" disabled={!campaignName} onClick={handleSave}>Save</button>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
