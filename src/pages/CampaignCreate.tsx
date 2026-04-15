import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CHANNEL_LABELS, CHANNEL_ICONS, FUNNEL_LABELS, VERTICAL_LABELS, RULE_ATTRIBUTES, type MessageChannel, type Funnel, type Vertical, type EligibilityRule, type RuleOperator } from "../types";
import ClassificationQuestionnaire, { type Classification } from "../components/ClassificationQuestionnaire";
import BaseContentSection from "../components/BaseContentSection";
import { defaultHeuristicRules, DEFAULT_CHANNEL_ORDER } from "../data/mockData";

type DeliveryMode = "best_channel" | "multi_channel";

export default function CampaignCreate() {
  const navigate = useNavigate();
  const [classification, setClassification] = useState<Classification | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<MessageChannel[]>([]);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("best_channel");
  const [fallbackTimeout, setFallbackTimeout] = useState("4");
  const [experimentEnabled, setExperimentEnabled] = useState(false);
  const [experimentTag, setExperimentTag] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  // New omni-channel state
  const [funnel, setFunnel] = useState<Funnel | "">("");
  const [vertical, setVertical] = useState<Vertical | "">("");
  const [purposeTag, setPurposeTag] = useState("");
  const [rules, setRules] = useState<EligibilityRule[]>([]);
  const [affiliateId, setAffiliateId] = useState("");
  const [parentAffiliateId, setParentAffiliateId] = useState("");

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

  function addRule() {
    setRules(prev => [...prev, { id: `r${Date.now()}`, attribute: "genius_level", operator: "greater_than" as RuleOperator, value: 1, connector: "AND" }]);
  }

  function removeRule(id: string) {
    setRules(prev => prev.filter(r => r.id !== id));
  }

  function updateRule(id: string, field: keyof EligibilityRule, value: string | number) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }

  if (saved) {
    return (
      <div className="app-page">
        <div className="page-header"><div className="page-header-main"><h1 className="page-title">Campaign Created</h1></div></div>
        <div className="bui-box" style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#10003;</div>
          <h2 style={{ marginBottom: 8 }}>Omni-Channel Campaign Created</h2>
          <p className="text-muted mb-16">"{campaignName}" has been saved as a {purposeLabel} campaign{selectedChannels.length > 0 ? ` targeting ${selectedChannels.map(ch => CHANNEL_LABELS[ch]).join(", ")}` : " with system-decided channel routing"}.</p>
          <p className="text-muted mb-16">Delivery Mode: <strong>{selectedChannels.length === 0 ? "Best Channel (System Decides)" : selectedChannels.length === 1 ? "Fixed Channel" : deliveryMode === "best_channel" ? "Best Channel" : "Multi-Channel"}</strong></p>
          {selectedChannels.length > 1 && (
            <p className="text-muted mb-16">Unified Campaign Group: <span className="badge badge-brand">UCG-2026-{String(Math.floor(Math.random() * 900) + 100)}</span></p>
          )}
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
          {isMarketingOrNonMarketing && <button className="btn btn-primary" disabled={!campaignName} onClick={handleSave}>Save Campaign</button>}
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

          {/* Campaign Metadata (PROD-aligned) */}
          <div className="bui-box">
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Campaign Metadata</div>
            <p className="text-muted mb-16">PROD-aligned campaign classification for targeting and analytics.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Funnel</label>
                <select className="form-select" value={funnel} onChange={e => setFunnel(e.target.value as Funnel)}>
                  <option value="">Select funnel...</option>
                  {(Object.keys(FUNNEL_LABELS) as Funnel[]).map(f => (
                    <option key={f} value={f}>{FUNNEL_LABELS[f]}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Vertical</label>
                <select className="form-select" value={vertical} onChange={e => setVertical(e.target.value as Vertical)}>
                  <option value="">Select vertical...</option>
                  {(Object.keys(VERTICAL_LABELS) as Vertical[]).map(v => (
                    <option key={v} value={v}>{VERTICAL_LABELS[v]}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Purpose Tag</label>
                <input className="form-input" placeholder="e.g., deal_discovery" value={purposeTag} onChange={e => setPurposeTag(e.target.value)} />
              </div>
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
            {selectedChannels.length === 0 && (
              <div className="info-banner tier-selection-appear" style={{ marginTop: 16, flexDirection: "column", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="info-banner-icon">&#9889;</span>
                  <strong>The system will automatically select the best channel per subscriber</strong>
                </div>
                <div style={{ paddingLeft: 32 }}>
                  <div style={{ fontSize: 13, marginTop: 8, marginBottom: 4 }}>Heuristic routing rules (evaluated in order):</div>
                  <ol style={{ margin: "4px 0 4px 18px", padding: 0, fontSize: 13, lineHeight: 1.7 }}>
                    {defaultHeuristicRules.filter(r => r.active).map(r => (
                      <li key={r.id}><strong>{r.name}</strong> &mdash; {r.description}</li>
                    ))}
                  </ol>
                  <div style={{ fontSize: 13, marginTop: 10, padding: "8px 12px", background: "rgba(0,53,128,0.06)", borderRadius: 6 }}>
                    If no heuristic matches, the platform default priority order is used: <strong>{DEFAULT_CHANNEL_ORDER.map(ch => CHANNEL_LABELS[ch]).join(" \u2192 ")}</strong>. If delivery fails, the system retries the next channel in order. All channels exhausted = suppressed.
                  </div>
                  <div style={{ fontSize: 12, marginTop: 8 }}>
                    <a href="/channel-preferences" style={{ color: "var(--color-blue-600)", textDecoration: "underline" }}>Customize rules and fallback order in Channel Preferences</a>
                  </div>
                </div>
              </div>
            )}
            {selectedChannels.length === 1 && (
              <div className="info-banner tier-selection-appear" style={{ marginTop: 16 }}>
                <span className="info-banner-icon">&#128274;</span>
                <span>
                  <strong>Fixed Channel &mdash; {CHANNEL_LABELS[selectedChannels[0]]} only.</strong> The message will be sent exclusively on {CHANNEL_LABELS[selectedChannels[0]]}. No routing or fallback. Subscribers who are unreachable or have not consented to {CHANNEL_LABELS[selectedChannels[0]]} will be suppressed.
                </span>
              </div>
            )}
            {selectedChannels.length > 1 && (
              <div className="info-banner tier-selection-appear" style={{ marginTop: 16 }}>
                <span className="info-banner-icon">&#128279;</span>
                <span>
                  <strong>Unified Campaign Group</strong> &mdash; In PROD, each channel is a separate campaign. Omni-Channel creates a unified campaign group spanning all {selectedChannels.length} selected channels with a single UCG ID.
                </span>
              </div>
            )}
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
                    Heuristics select the optimal channel per subscriber from your selected pool. If no heuristic matches, the campaign's channel priority order is used. If delivery fails or goes unopened, the system retries the next channel in order.
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

              {/* Channel Priority & Retry — Best Channel Mode Only (P0) */}
              {deliveryMode === "best_channel" && (
                <div className="tier-selection-appear" style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Channel Priority & Retry</div>
                  <p className="text-muted mb-8" style={{ fontSize: 13 }}>Set the priority order for initial channel selection (when heuristics have no answer) and delivery retry (when the chosen channel fails or goes unopened).</p>
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
                    Retry triggers: non-delivery, unopened within {fallbackTimeout}h, channel opt-out. All channels exhausted = suppressed.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Eligibility Rules */}
          <div className="bui-box">
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Eligibility Rules</div>
            <p className="text-muted mb-16">Define audience targeting rules. Rules from PROD eligibility engine (AND/OR logic).</p>
            <div className="rule-builder">
              {rules.map((r, i) => (
                <div key={r.id} className="rule-row">
                  {i > 0 && (
                    <select className="form-select" style={{ width: 70, flex: "none" }} value={r.connector} onChange={e => updateRule(r.id, "connector", e.target.value)}>
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                    </select>
                  )}
                  <select className="form-select" value={r.attribute} onChange={e => updateRule(r.id, "attribute", e.target.value)}>
                    {RULE_ATTRIBUTES.map(a => (
                      <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                  <select className="form-select" style={{ width: 140, flex: "none" }} value={r.operator} onChange={e => updateRule(r.id, "operator", e.target.value)}>
                    <option value="equals">equals</option>
                    <option value="not_equals">not equals</option>
                    <option value="greater_than">greater than</option>
                    <option value="less_than">less than</option>
                    <option value="in">in</option>
                  </select>
                  <input className="form-input" style={{ width: 120, flex: "none" }} value={String(r.value)} onChange={e => updateRule(r.id, "value", e.target.value)} />
                  <button className="rule-remove-btn" onClick={() => removeRule(r.id)}>&times;</button>
                </div>
              ))}
            </div>
            <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={addRule}>+ Add Rule</button>
            {rules.length > 0 && (
              <div className="text-muted" style={{ marginTop: 8, fontSize: 12 }}>
                Preview: {rules.map((r, i) => `${i > 0 ? ` ${r.connector} ` : ""}${r.attribute} ${r.operator.replace("_", " ")} ${r.value}`).join("")}
              </div>
            )}
          </div>

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

          {/* Compliance & Reporting */}
          <div className="bui-box">
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Compliance & Reporting</div>
            <p className="text-muted mb-16">Required for campaign publishing (PROD validation).</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Affiliate ID</label>
                <input className="form-input" type="number" placeholder="Required for publish" value={affiliateId} onChange={e => setAffiliateId(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Parent Affiliate ID</label>
                <input className="form-input" type="number" placeholder="Required for publish" value={parentAffiliateId} onChange={e => setParentAffiliateId(e.target.value)} />
              </div>
            </div>
            <div className="alert alert-info" style={{ marginTop: 8 }}>
              <strong>Consent Summary:</strong> {selectedChannels.length} channel(s) selected. Subscriber consent will be validated per-channel at send time via Janet subscription API.
            </div>
          </div>

          {/* Bottom Save */}
          <div className="btn-group">
            <button className="btn btn-secondary" onClick={() => navigate("/campaigns")}>Cancel</button>
            <button className="btn btn-primary" disabled={!campaignName} onClick={handleSave}>Save Campaign</button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
