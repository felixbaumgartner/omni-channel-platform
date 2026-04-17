import { useState } from "react";
import { CHANNEL_ICONS, CHANNEL_LABELS, CHANNEL_CATEGORIES, type MessageChannel } from "../types";

/* ── Mock content items per channel ── */

interface ContentItem {
  id: number;
  name: string;
  creator: string;
  type: string;
}

const MOCK_CONTENT: Record<string, ContentItem[]> = {
  email: [
    { id: 520, name: "Genius Plus Surprise Voucher Drop Email", creator: "rwang2", type: "Content Builder V1" },
    { id: 521, name: "Booking Confirmation Email", creator: "trip-comms", type: "Content Builder V1" },
    { id: 522, name: "Payment Receipt Email", creator: "payments", type: "Content Builder V1" },
    { id: 523, name: "Summer Deals Promotional Email", creator: "engage-team", type: "Content Builder V2" },
  ],
  push: [
    { id: 601, name: "Check-in Reminder Push", creator: "trip-enrichment", type: "Push Template" },
    { id: 602, name: "Price Drop Alert Push", creator: "pricing-team", type: "Push Template" },
    { id: 603, name: "Genius Upgrade Celebration Push", creator: "loyalty-team", type: "Push Template" },
  ],
  sms: [
    { id: 701, name: "OTP Verification SMS", creator: "identity-team", type: "SMS Template" },
    { id: 702, name: "Booking Modification Alert SMS", creator: "trip-comms", type: "SMS Template" },
    { id: 703, name: "Security Alert SMS", creator: "security-team", type: "SMS Template" },
  ],
  whatsapp: [
    { id: 801, name: "Trip Checklist WhatsApp Card", creator: "trip-enrichment", type: "WhatsApp Card" },
    { id: 802, name: "Genius Badge Unlocked Banner", creator: "loyalty-team", type: "WhatsApp Banner" },
    { id: 803, name: "Rate Your Stay Card", creator: "ugc-team", type: "WhatsApp Card" },
  ],
};

/* ── Placeholder thumbnail colors per channel ── */
const CHANNEL_COLORS: Record<string, string> = {
  email: "#003580",
  push: "#f89249",
  sms: "#008009",
  whatsapp: "#7c3aed",
};

/* ── Per-channel content section matching the Targeting (PROD) UI ── */

interface ChannelContentSectionProps {
  channel: MessageChannel;
  selectedContentId: number | null;
  onSelectContent: (id: number | null) => void;
  messageCategory: string;
  onMessageCategoryChange: (v: string) => void;
  trackingLabel: string;
  onTrackingLabelChange: (v: string) => void;
  voucherEnabled: boolean;
  onVoucherToggle: (v: boolean) => void;
  experimentEnabled: boolean;
  onExperimentToggle: (v: boolean) => void;
  experimentTag: string;
  onExperimentTagChange: (v: string) => void;
}

function ChannelContentPanel({
  channel,
  selectedContentId,
  onSelectContent,
  messageCategory,
  onMessageCategoryChange,
  trackingLabel,
  onTrackingLabelChange,
  voucherEnabled,
  onVoucherToggle,
  experimentEnabled,
  onExperimentToggle,
  experimentTag,
  onExperimentTagChange,
}: ChannelContentSectionProps) {
  const [showPicker, setShowPicker] = useState(false);
  const items = MOCK_CONTENT[channel] || [];
  const selected = items.find(i => i.id === selectedContentId) || null;

  return (
    <div>
      {/* Content * */}
      <div className="form-group">
        <label className="form-label">Content <span style={{ color: "var(--color-red-600)" }}>*</span></label>

        {selected ? (
          <div className="content-preview-card">
            {/* Thumbnail */}
            <div className="content-preview-thumb" style={{ background: CHANNEL_COLORS[channel] }}>
              <span className="content-preview-badge">{selected.type}</span>
              <div className="content-preview-thumb-inner">
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 11, opacity: 0.9 }}>Booking.com</div>
                <div style={{ color: "#fff", fontSize: 10, marginTop: 4, opacity: 0.7, lineHeight: 1.3 }}>
                  {channel === "email" ? "Email content preview" :
                   channel === "push" ? "Push notification preview" :
                   channel === "sms" ? "SMS message preview" :
                   "In-app card preview"}
                </div>
                <div style={{ marginTop: 8 }}>
                  <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 10 }}>
                    {CHANNEL_ICONS[channel]} {CHANNEL_LABELS[channel]}
                  </span>
                </div>
              </div>
            </div>

            {/* Content info */}
            <div className="content-preview-info">
              <div className="content-preview-name">{selected.name}</div>
              <div className="content-preview-meta">ID: {selected.id} - created by {selected.creator}</div>
              <div style={{ marginTop: 8 }}>
                <button className="btn btn-secondary" style={{ padding: "4px 12px", fontSize: 12 }}>
                  Open in Builder <span style={{ fontSize: 10 }}>&#x2197;</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="content-preview-actions">
              <button className="btn btn-secondary" style={{ fontSize: 13 }} onClick={() => setShowPicker(true)}>
                &#x21BB; Change Content
              </button>
              <button className="btn btn-tertiary btn-destructive" style={{ fontSize: 13 }} onClick={() => onSelectContent(null)}>
                No Send
              </button>
            </div>
          </div>
        ) : (
          <div className="content-empty-state">
            <div className="content-empty-icon">{CHANNEL_ICONS[channel]}</div>
            <p className="text-muted" style={{ margin: "8px 0" }}>No content selected for {CHANNEL_LABELS[channel]}</p>
            <button className="btn btn-secondary" onClick={() => setShowPicker(true)}>
              Select Content
            </button>
          </div>
        )}
      </div>

      {/* Content picker modal */}
      {showPicker && (
        <div className="modal-overlay" onClick={() => setShowPicker(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 480 }}>
            <div className="modal-title">Select {CHANNEL_LABELS[channel]} Content</div>
            <div className="modal-subtitle">Choose a content template for this channel</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map(item => (
                <div
                  key={item.id}
                  className={`content-picker-item ${selectedContentId === item.id ? "content-picker-item--selected" : ""}`}
                  onClick={() => { onSelectContent(item.id); setShowPicker(false); }}
                >
                  <div className="content-picker-thumb" style={{ background: CHANNEL_COLORS[channel] }}>
                    <span style={{ color: "#fff", fontSize: 18 }}>{CHANNEL_ICONS[channel]}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>ID: {item.id} &middot; {item.creator} &middot; {item.type}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPicker(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Message Category (Janet) — channel-specific categories from PROD */}
      <div className="form-group">
        <label className="form-label">Message Category (Janet) <span style={{ color: "var(--color-red-600)" }}>*</span></label>
        <select className="form-select" value={messageCategory} onChange={e => onMessageCategoryChange(e.target.value)}>
          <option value="">Select category for {CHANNEL_LABELS[channel]}...</option>
          {CHANNEL_CATEGORIES[channel].map(cat => (
            <option key={cat} value={cat}>{cat.replace(/_/g, " ")}</option>
          ))}
        </select>
        <div className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>
          Categories are channel-specific (PROD alignment). {CHANNEL_CATEGORIES[channel].length} categories available for {CHANNEL_LABELS[channel]}.
        </div>
      </div>

      {/* Tracking Label (Tableau) * */}
      <div className="form-group">
        <label className="form-label">Tracking Label (Tableau) <span style={{ color: "var(--color-red-600)" }}>*</span></label>
        <input
          className="form-input"
          placeholder="e.g., gvip_us_surprise_voucher_2026"
          value={trackingLabel}
          onChange={e => onTrackingLabelChange(e.target.value)}
        />
      </div>

      {/* Voucher toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <label className="toggle-switch toggle-switch--sm">
          <input type="checkbox" checked={voucherEnabled} onChange={() => onVoucherToggle(!voucherEnabled)} />
          <span className="toggle-slider" />
        </label>
        <span style={{ fontSize: 14 }}>Add Voucher or Coupons</span>
        <a href="#" style={{ color: "var(--color-blue-500)", fontSize: 13, textDecoration: "none" }} onClick={e => e.preventDefault()}>
          More info &#x2197;
        </a>
      </div>

      {/* Experiment */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Experiment</div>
        {!experimentEnabled ? (
          <div className="content-empty-state">
            <p className="text-muted" style={{ margin: "8px 0" }}>No experiment configured. Set up an A/B test to compare content variants.</p>
            <button className="btn btn-secondary" onClick={() => onExperimentToggle(true)}>Setup Experiment</button>
          </div>
        ) : (
          <div className="tier-selection-appear">
            <div className="form-group">
              <label className="form-label">Experiment Tag</label>
              <input className="form-input" placeholder={`e.g., emk_${channel}_experiment`} value={experimentTag} onChange={e => onExperimentTagChange(e.target.value)} />
              <div className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>Used for automatic stage tracking. Prefix: emk, mm_email, attr_mm_email.</div>
            </div>
            <div className="form-group">
              <label className="form-label">Variant Content</label>
              <div className="content-empty-state" style={{ padding: 16 }}>
                <div className="content-empty-icon" style={{ fontSize: 24 }}>{CHANNEL_ICONS[channel]}</div>
                <p className="text-muted" style={{ margin: "4px 0", fontSize: 12 }}>No variant content selected</p>
                <button className="btn btn-secondary" style={{ fontSize: 12, padding: "4px 12px" }}>Select Variant Content</button>
              </div>
            </div>
            <button className="btn btn-tertiary btn-destructive" style={{ fontSize: 13 }} onClick={() => { onExperimentToggle(false); onExperimentTagChange(""); }}>Remove Experiment</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main exported component: tabbed Base Content section ── */

interface BaseContentSectionProps {
  selectedChannels: MessageChannel[];
}

interface ChannelState {
  contentId: number | null;
  messageCategory: string;
  trackingLabel: string;
  voucherEnabled: boolean;
  experimentEnabled: boolean;
  experimentTag: string;
}

export default function BaseContentSection({ selectedChannels }: BaseContentSectionProps) {
  const [activeTab, setActiveTab] = useState<MessageChannel>(selectedChannels[0] || "email");
  const [channelStates, setChannelStates] = useState<Record<string, ChannelState>>({});

  function getState(ch: string): ChannelState {
    return channelStates[ch] || { contentId: null, messageCategory: "", trackingLabel: "", voucherEnabled: false, experimentEnabled: false, experimentTag: "" };
  }

  function updateState(ch: string, patch: Partial<ChannelState>) {
    setChannelStates(prev => ({ ...prev, [ch]: { ...getState(ch), ...patch } }));
  }

  // Keep active tab in sync with selected channels
  if (selectedChannels.length > 0 && !selectedChannels.includes(activeTab)) {
    setActiveTab(selectedChannels[0]);
  }

  if (selectedChannels.length === 0) return null;

  return (
    <div className="bui-box">
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Base Content</div>
      <p className="text-muted mb-16">Configure content for each channel. Each channel requires its own content variant.</p>

      {/* Channel tabs */}
      {selectedChannels.length > 1 && (
        <div className="content-tabs">
          {selectedChannels.map(ch => {
            const state = getState(ch);
            const hasContent = state.contentId !== null;
            return (
              <button
                key={ch}
                className={`content-tab ${activeTab === ch ? "active" : ""}`}
                onClick={() => setActiveTab(ch)}
              >
                {CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}
                {hasContent && <span className="content-tab-dot" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Active channel panel */}
      <div className="content-tab-panel">
        {selectedChannels.map(ch => (
          <div key={ch} style={{ display: activeTab === ch ? "block" : "none" }}>
            <ChannelContentPanel
              channel={ch}
              selectedContentId={getState(ch).contentId}
              onSelectContent={id => updateState(ch, { contentId: id })}
              messageCategory={getState(ch).messageCategory}
              onMessageCategoryChange={v => updateState(ch, { messageCategory: v })}
              trackingLabel={getState(ch).trackingLabel}
              onTrackingLabelChange={v => updateState(ch, { trackingLabel: v })}
              voucherEnabled={getState(ch).voucherEnabled}
              onVoucherToggle={v => updateState(ch, { voucherEnabled: v })}
              experimentEnabled={getState(ch).experimentEnabled}
              onExperimentToggle={v => updateState(ch, { experimentEnabled: v })}
              experimentTag={getState(ch).experimentTag}
              onExperimentTagChange={v => updateState(ch, { experimentTag: v })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
