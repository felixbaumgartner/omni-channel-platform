import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CHANNEL_LABELS, CHANNEL_ICONS, type MessageChannel } from "../types";
import ClassificationQuestionnaire, { type Classification } from "../components/ClassificationQuestionnaire";
import BaseContentSection from "../components/BaseContentSection";

type DeliveryMode = "best_channel" | "multi_channel";

export default function CampaignCreate() {
  const navigate = useNavigate();
  const [classification, setClassification] = useState<Classification | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<MessageChannel[]>(["email"]);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("best_channel");
  const [fallbackOrder, setFallbackOrder] = useState<MessageChannel[]>([]);
  const [fallbackTimeout, setFallbackTimeout] = useState("4");
  const [experimentEnabled, setExperimentEnabled] = useState(false);
  const [experimentTag, setExperimentTag] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const isMarketingOrNonMarketing = classification && (classification.purpose === "marketing" || (classification.purpose === "non_marketing" && !classification.subPurpose));
  const isTransactional = classification?.subPurpose === "transactional";
  const purposeLabel = classification?.purpose === "marketing" ? "Marketing" : isTransactional ? "Transactional" : "Non-marketing";

  function toggleChannel(ch: MessageChannel) {
    setSelectedChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  }

  function handleSave() {
    setSaved(true);
    setToast("Campaign saved successfully!");
    setTimeout(() => setToast(null), 3000);
  }

  if (saved) {
    return (
      <div className="app-page">
        <div className="page-header"><div className="page-header-main"><h1 className="page-title">Campaign Created</h1></div></div>
        <div className="bui-box" style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#10003;</div>
          <h2 style={{ marginBottom: 8 }}>Omni-Channel Campaign Created</h2>
          <p className="text-muted mb-16">"{campaignName}" has been saved as a {purposeLabel} campaign targeting {selectedChannels.map(ch => CHANNEL_LABELS[ch]).join(", ")}.</p>
          <p className="text-muted mb-16">Delivery Mode: <strong>{deliveryMode === "best_channel" ? "Best Channel" : "Multi-Channel"}</strong></p>
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
          <h1 className="page-title">New Omni-Channel Campaign</h1>
          {classification && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {selectedChannels.map(ch => (
                <span key={ch} className="badge badge-outline">{CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}</span>
              ))}
              {classification.purpose === "marketing" && <span className="badge badge-marketing">Marketing</span>}
              {classification.purpose === "non_marketing" && !isTransactional && <span className="badge badge-outline">Non-marketing</span>}
              {isTransactional && <span className="badge badge-constructive">Transactional</span>}
              <span className="badge badge-draft">Draft</span>
            </div>
          )}
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate("/campaigns")}>Cancel</button>
          {isMarketingOrNonMarketing && <button className="btn btn-primary" disabled={!campaignName || selectedChannels.length === 0} onClick={handleSave}>Save Campaign</button>}
        </div>
      </div>

      {/* Classification */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Message Classification</div>
        <p className="text-muted mb-16">Determines routing priority, delivery SLOs, and retry policies.</p>
        <ClassificationQuestionnaire mode="inline" onChange={c => setClassification(c)} />
        {isMarketingOrNonMarketing && (
          <div className="alert alert-info tier-selection-appear" style={{ marginTop: 16 }}>
            <div className="alert-title">Classified as {purposeLabel}</div>
            {classification.purpose === "marketing" ? "Standard marketing delivery pipeline." : "Subscription categories apply. Marketing holdout does not apply."} Fill out the campaign details below.
          </div>
        )}
        {isTransactional && (
          <div className="tier-selection-appear" style={{ marginTop: 16, padding: 16, background: "var(--color-green-100)", borderLeft: "4px solid var(--color-green-600)", borderRadius: "var(--radius-md)", color: "var(--color-green-600)" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Validated as Transactional</div>
            <p style={{ marginBottom: 12, fontSize: 14 }}>This message will be routed through the priority transactional pipeline, bypassing Janeway.</p>
            <button className="btn btn-primary" onClick={() => navigate("/campaign/new/transactional")}>Continue to Transactional Setup &rarr;</button>
          </div>
        )}
      </div>

      {/* Campaign form — marketing / non-marketing */}
      {isMarketingOrNonMarketing && (
        <div className="tier-selection-appear">
          {/* Basic Info */}
          <div className="bui-box">
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Basic Information</div>
            <div className="form-group">
              <label className="form-label">Campaign Name</label>
              <input className="form-input" placeholder="e.g., summer_deals_omnichannel" value={campaignName} onChange={e => setCampaignName(e.target.value)} maxLength={50} />
              <div className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>{campaignName.length}/50 chars</div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" placeholder="Describe the purpose of this campaign..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>

          {/* Channel Selection (P0: Unified Campaign Object) */}
          <div className="bui-box">
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Channel Selection</div>
            <p className="text-muted mb-16">Select channels for this campaign. A single campaign can target all channels.</p>
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

          {/* Delivery Mode (P0: Campaign Delivery Mode) */}
          {selectedChannels.length > 1 && (
            <div className="bui-box tier-selection-appear">
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Delivery Mode</div>
              <p className="text-muted mb-16">Choose how messages are routed across the selected channels.</p>
              <div className="radio-card-group">
                <div className={`radio-card ${deliveryMode === "best_channel" ? "selected" : ""}`} onClick={() => setDeliveryMode("best_channel")}>
                  <div className="radio-card-header">
                    <div className="radio-card-radio" />
                    <div className="radio-card-title">Best Channel</div>
                  </div>
                  <div className="radio-card-description">
                    System selects one optimal channel per subscriber based on CDP behavioral signals and heuristic rules. Fallback to secondary channel if primary fails or goes unopened. Optimized for reducing channel fatigue.
                  </div>
                </div>
                <div className={`radio-card ${deliveryMode === "multi_channel" ? "selected" : ""}`} onClick={() => setDeliveryMode("multi_channel")}>
                  <div className="radio-card-header">
                    <div className="radio-card-radio" />
                    <div className="radio-card-title">Multi-Channel</div>
                  </div>
                  <div className="radio-card-description">
                    Deliver across all selected channels simultaneously. Suited for high-priority campaigns, time-sensitive promotions, and re-engagement. Consent and frequency caps enforced per channel.
                  </div>
                </div>
              </div>

              {/* Multi-channel guardrails warning */}
              {deliveryMode === "multi_channel" && (
                <div className="alert alert-warning tier-selection-appear" style={{ marginTop: 16 }}>
                  <div className="alert-title">Multi-Channel Guardrails Active</div>
                  <ul style={{ margin: "8px 0 0 16px", padding: 0 }}>
                    <li>Subscriber must have valid consent for every selected channel</li>
                    <li>Campaign-level frequency caps are respected across all channels</li>
                    <li>Subscribers lacking consent for one or more channels will be flagged</li>
                  </ul>
                </div>
              )}

              {/* Fallback Logic — Best Channel Mode Only (P0) */}
              {deliveryMode === "best_channel" && (
                <div className="tier-selection-appear" style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Fallback Configuration</div>
                  <p className="text-muted mb-8" style={{ fontSize: 13 }}>Define the fallback sequence when the primary channel fails delivery or goes unopened.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Fallback Channel Order</label>
                      <div className="fallback-sequence">
                        {selectedChannels.map((ch, i) => (
                          <div key={ch} className="fallback-item">
                            <span className="fallback-number">{i + 1}</span>
                            <span>{CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}</span>
                            {i === 0 && <span className="badge badge-brand" style={{ fontSize: 10 }}>Primary</span>}
                            {i > 0 && <span className="badge badge-outline" style={{ fontSize: 10 }}>Fallback</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Fallback Timeout (hours)</label>
                      <input className="form-input" type="number" min="1" max="72" value={fallbackTimeout} onChange={e => setFallbackTimeout(e.target.value)} />
                      <div className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>Hours to wait before triggering fallback</div>
                    </div>
                  </div>
                  <div className="text-muted" style={{ fontSize: 12, marginTop: 8 }}>
                    Fallback triggers: non-delivery, unopened within {fallbackTimeout}h, channel opt-out. Duplicate delivery prevention is enforced.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Base Content */}
          <BaseContentSection selectedChannels={selectedChannels} />

          {/* Experiment */}
          <div className="bui-box">
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Experiment</div>
            {!experimentEnabled ? (
              <div style={{ padding: 24, border: "1px dashed var(--border-color)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                <p className="text-muted" style={{ marginBottom: 12 }}>No experiment configured. Set up an A/B test to compare content variants.</p>
                <button className="btn btn-secondary" onClick={() => setExperimentEnabled(true)}>Setup Experiment</button>
              </div>
            ) : (
              <div className="tier-selection-appear">
                <div className="form-group">
                  <label className="form-label">Experiment Tag</label>
                  <input className="form-input" placeholder="e.g., emk_summer_deals_experiment" value={experimentTag} onChange={e => setExperimentTag(e.target.value)} />
                </div>
                <button className="btn btn-secondary btn-destructive" onClick={() => { setExperimentEnabled(false); setExperimentTag(""); }}>Remove Experiment</button>
              </div>
            )}
          </div>

          {/* Bottom Save */}
          <div className="btn-group">
            <button className="btn btn-secondary" onClick={() => navigate("/campaigns")}>Cancel</button>
            <button className="btn btn-primary" disabled={!campaignName || selectedChannels.length === 0} onClick={handleSave}>Save Campaign</button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
