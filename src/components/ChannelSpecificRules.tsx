import { useState, useRef, useEffect } from "react";
import { CHANNEL_SPECIFIC_RULES, CHANNEL_ELIGIBILITY_RULES, CHANNEL_LABELS, type MessageChannel, type ChannelRulesState, type ChannelSpecificRuleConfig, type ChannelSpecificRuleValue, type RuleOperator } from "../types";

interface ChannelSpecificRulesProps {
  selectedChannels: MessageChannel[];
  channelRulesState: ChannelRulesState;
  onChannelRulesChange: (state: ChannelRulesState) => void;
}

function getRuleValue(state: ChannelRulesState, channel: MessageChannel, ruleId: string): ChannelSpecificRuleValue | undefined {
  return state[channel]?.find(r => r.ruleId === ruleId);
}

function updateRuleValue(state: ChannelRulesState, channel: MessageChannel, ruleId: string, update: Partial<ChannelSpecificRuleValue>): ChannelRulesState {
  const existing = state[channel] || [];
  const idx = existing.findIndex(r => r.ruleId === ruleId);
  if (idx >= 0) {
    const updated = [...existing];
    updated[idx] = { ...updated[idx], ...update };
    return { ...state, [channel]: updated };
  }
  return { ...state, [channel]: [...existing, { ruleId, value: "", ...update }] };
}

function removeRuleValue(state: ChannelRulesState, channel: MessageChannel, ruleId: string): ChannelRulesState {
  const existing = state[channel] || [];
  const filtered = existing.filter(r => r.ruleId !== ruleId);
  if (filtered.length === 0) {
    const { [channel]: _, ...rest } = state;
    return rest;
  }
  return { ...state, [channel]: filtered };
}

function VersionInput({ config, ruleValue, onChange }: { config: ChannelSpecificRuleConfig; ruleValue?: ChannelSpecificRuleValue; onChange: (val: Record<string, string>) => void }) {
  const current = (ruleValue?.value as Record<string, string>) || {};
  return (
    <div className="channel-rule-version-inputs">
      {config.platforms?.map(platform => (
        <div key={platform}>
          <div className="channel-rule-version-platform">{platform}:</div>
          <input
            className="form-input"
            placeholder="e.g., 27.5"
            value={current[platform] || ""}
            onChange={e => onChange({ ...current, [platform]: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
}

function DropdownField({ config, ruleValue, onChange }: { config: ChannelSpecificRuleConfig; ruleValue?: ChannelSpecificRuleValue; onChange: (val: string, op: RuleOperator) => void }) {
  const currentVal = (ruleValue?.value as string) || "";
  const currentOp = ruleValue?.operator || "equals";
  return (
    <div style={{ display: "flex", gap: 8, flex: 1, alignItems: "center" }}>
      <select className="form-select" style={{ width: 130, flex: "none" }} value={currentOp} onChange={e => onChange(currentVal, e.target.value as RuleOperator)}>
        <option value="equals">Equals</option>
        <option value="not_equals">Not Equals</option>
        <option value="in">In List</option>
      </select>
      <select className="form-select" value={currentVal} onChange={e => onChange(e.target.value, currentOp)}>
        <option value="">Select...</option>
        {config.options?.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function ToggleField({ ruleValue, onChange }: { config: ChannelSpecificRuleConfig; ruleValue?: ChannelSpecificRuleValue; onChange: (val: boolean) => void }) {
  const current = (ruleValue?.value as boolean) || false;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <label className="toggle-switch toggle-switch--sm">
        <input type="checkbox" checked={current} onChange={() => onChange(!current)} />
        <span className="toggle-slider" />
      </label>
      <span style={{ fontSize: 13 }}>{current ? "Yes" : "No"}</span>
    </div>
  );
}

function MultiSelectField({ config, ruleValue, onChange }: { config: ChannelSpecificRuleConfig; ruleValue?: ChannelSpecificRuleValue; onChange: (val: string[]) => void }) {
  const current = (ruleValue?.value as string[]) || [];
  const selectedCount = current.length;
  const totalCount = config.options?.length || 0;

  return (
    <div style={{ display: "flex", gap: 8, flex: 1, alignItems: "center" }}>
      <span className="channel-rule-operator-badge">In List</span>
      <select
        className="form-select"
        multiple
        value={current}
        onChange={e => {
          const selected = Array.from(e.target.selectedOptions, o => o.value);
          onChange(selected);
        }}
        style={{ minHeight: 32, maxHeight: 80 }}
      >
        {config.options?.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <span className="text-muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>{selectedCount} of {totalCount}</span>
    </div>
  );
}

function RuleField({ config, channel, state, onUpdate, onRemove }: { config: ChannelSpecificRuleConfig; channel: MessageChannel; state: ChannelRulesState; onUpdate: (s: ChannelRulesState) => void; onRemove: () => void }) {
  const ruleValue = getRuleValue(state, channel, config.id);

  return (
    <div className="channel-rule-field tier-selection-appear">
      <span className="channel-rule-label">{config.label}</span>
      {config.fieldType === "version_input" && (
        <VersionInput config={config} ruleValue={ruleValue} onChange={val => onUpdate(updateRuleValue(state, channel, config.id, { value: val }))} />
      )}
      {config.fieldType === "dropdown" && (
        <DropdownField config={config} ruleValue={ruleValue} onChange={(val, op) => onUpdate(updateRuleValue(state, channel, config.id, { value: val, operator: op }))} />
      )}
      {config.fieldType === "toggle" && (
        <ToggleField config={config} ruleValue={ruleValue} onChange={val => onUpdate(updateRuleValue(state, channel, config.id, { value: val }))} />
      )}
      {config.fieldType === "multi_select" && (
        <MultiSelectField config={config} ruleValue={ruleValue} onChange={val => onUpdate(updateRuleValue(state, channel, config.id, { value: val }))} />
      )}
      <button className="rule-remove-btn" onClick={onRemove} title="Remove rule">&times;</button>
    </div>
  );
}

/* ── Channel Eligibility Rules (new Appendix A model) ── */

const ADDITIONAL_CHANNEL_RULES: Record<MessageChannel, { id: string; label: string; description: string }[]> = {
  email: [
    { id: "email_subscribed", label: "Subscribed to marketing email", description: "User has an active marketing email subscription" },
    { id: "email_not_bounced", label: "Email has not bounced in 90 days", description: "No hard/soft bounce on the email address in the last 90 days" },
    { id: "email_has_address", label: "Has valid email address", description: "A deliverable email address exists for the user" },
    { id: "email_engagement_min", label: "Minimum email engagement score", description: "User has opened or clicked at least one email in the last N days" },
    { id: "email_domain_filter", label: "Email domain filter", description: "Only send to specific email domains (e.g., gmail.com, outlook.com)" },
    { id: "email_frequency_cap", label: "Email frequency cap", description: "Skip if user received N+ emails in the last X days" },
    { id: "email_quiet_hours", label: "Email quiet hours", description: "Only deliver outside the user's local quiet hours" },
    { id: "email_region_filter", label: "Region filter", description: "Restrict to users in specific regions/countries" },
  ],
  push: [
    { id: "push_has_app", label: "Has active app install", description: "User has the Booking.com app installed with push permissions granted" },
    { id: "push_recent_activity", label: "App activity in last 30 days", description: "User has opened the app at least once in the last 30 days" },
    { id: "push_subscribed", label: "Subscribed to push notifications", description: "User has not disabled push at OS or app level" },
    { id: "push_min_app_version", label: "Minimum app version", description: "User's app version meets minimum requirement for this content" },
    { id: "push_os_filter", label: "OS version filter", description: "Only send to specific OS versions (iOS/Android)" },
    { id: "push_frequency_cap", label: "Push frequency cap", description: "Skip if user received N+ push messages in the last X days" },
    { id: "push_quiet_hours", label: "Push quiet hours", description: "Only deliver outside the user's local quiet hours" },
    { id: "push_region_filter", label: "Region filter", description: "Restrict to users in specific regions/countries" },
  ],
  sms: [
    { id: "sms_has_phone", label: "Has phone number on file", description: "A verified phone number exists for the user" },
    { id: "sms_subscribed", label: "Subscribed to SMS", description: "User has opted in to receive SMS marketing messages" },
    { id: "sms_country_supported", label: "Country supports SMS delivery", description: "User's phone number is in a country where SMS delivery is available" },
    { id: "sms_quiet_hours", label: "Outside quiet hours", description: "Message will only be sent outside the user's local quiet hours" },
    { id: "sms_frequency_cap", label: "SMS frequency cap", description: "Skip if user received N+ SMS messages in the last X days" },
    { id: "sms_cost_cap", label: "Cost cap per user", description: "Skip if user's monthly SMS spend exceeds threshold" },
    { id: "sms_region_filter", label: "Region filter", description: "Restrict to users in specific regions/countries" },
  ],
  whatsapp: [
    { id: "wa_has_number", label: "Has WhatsApp-enabled number", description: "User has a phone number registered on WhatsApp" },
    { id: "wa_subscribed", label: "Subscribed to WhatsApp messages", description: "User has opted in to receive WhatsApp marketing messages" },
    { id: "wa_24h_window", label: "Within 24h messaging window", description: "User has interacted within the WhatsApp 24-hour session window, or a template message is used" },
    { id: "wa_quiet_hours", label: "Outside quiet hours", description: "Message will only be sent outside the user's local quiet hours" },
    { id: "wa_frequency_cap", label: "WhatsApp frequency cap", description: "Skip if user received N+ WhatsApp messages in the last X days" },
    { id: "wa_cost_cap", label: "Cost cap per user", description: "Skip if user's monthly WhatsApp spend exceeds threshold" },
    { id: "wa_region_filter", label: "Region filter", description: "Restrict to users in specific regions/countries" },
  ],
};

interface ChannelEligibilityRulesProps {
  selectedChannels: MessageChannel[];
  enabledRules: Record<string, boolean>;
  onToggleRule: (ruleId: string) => void;
  experimentValues: Record<string, string>;
  onExperimentChange: (ruleId: string, value: string) => void;
  addedCustomRules: Record<string, { id: string; label: string; description: string }[]>;
  onAddCustomRule: (channel: MessageChannel, rule: { id: string; label: string; description: string }) => void;
  onRemoveCustomRule: (channel: MessageChannel, ruleId: string) => void;
}

export function ChannelEligibilityRules({ selectedChannels, enabledRules, onToggleRule, experimentValues, onExperimentChange, addedCustomRules, onAddCustomRule, onRemoveCustomRule }: ChannelEligibilityRulesProps) {
  const [expandedChannel, setExpandedChannel] = useState<MessageChannel | null>(selectedChannels[0] || null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showAddMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddMenu]);

  const activeGroups = CHANNEL_ELIGIBILITY_RULES.filter(g => selectedChannels.includes(g.channel));

  if (activeGroups.length === 0) {
    return (
      <div className="text-muted" style={{ padding: 16, textAlign: "center", fontSize: 13 }}>
        Select at least one channel above to configure channel eligibility rules.
      </div>
    );
  }

  return (
    <div className="channel-eligibility-container">
      {/* Channel tabs */}
      <div className="channel-eligibility-tabs">
        {activeGroups.map(group => (
          <button
            key={group.channel}
            className={`channel-eligibility-tab ${expandedChannel === group.channel ? "channel-eligibility-tab--active" : ""}`}
            onClick={() => setExpandedChannel(group.channel)}
          >
            <span>{group.icon}</span>
            <span>{group.label}</span>
            <span className="channel-eligibility-tab-count">
              {(addedCustomRules[group.channel]?.length || 0)}/{(ADDITIONAL_CHANNEL_RULES[group.channel]?.length || 0)}
            </span>
          </button>
        ))}
      </div>

      {/* Active channel rules */}
      {expandedChannel && (() => {
        const group = activeGroups.find(g => g.channel === expandedChannel);
        if (!group) return null;

        const addedRules = addedCustomRules[expandedChannel] || [];
        const addedRuleIds = addedRules.map(r => r.id);
        const availableRules = (ADDITIONAL_CHANNEL_RULES[expandedChannel] || []).filter(r => !addedRuleIds.includes(r.id));

        return (
          <div className="channel-eligibility-panel tier-selection-appear">
            {/* User-added rules */}
            {addedRules.length > 0 && (
              <div className="channel-eligibility-section">
                <div className="channel-eligibility-section-header">
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Custom Rules</span>
                </div>
                <div className="channel-eligibility-rules-list">
                  {addedRules.map(rule => (
                    <div key={rule.id} className="channel-eligibility-rule-item tier-selection-appear">
                      <label className="toggle-switch toggle-switch--sm">
                        <input type="checkbox" checked={true} readOnly />
                        <span className="toggle-slider" />
                      </label>
                      <div className="channel-eligibility-rule-content">
                        <div className="channel-eligibility-rule-label">{rule.label}</div>
                        <div className="channel-eligibility-rule-desc">{rule.description}</div>
                      </div>
                      <button className="rule-remove-btn" onClick={() => onRemoveCustomRule(expandedChannel, rule.id)} title="Remove rule">&times;</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* + Add Rule button */}
            <div ref={menuRef} style={{ position: "relative", marginTop: 12 }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddMenu(!showAddMenu)}
                disabled={availableRules.length === 0}
              >
                + Add Rule
              </button>
              {availableRules.length === 0 && addedRules.length > 0 && (
                <span className="text-muted" style={{ fontSize: 12, marginLeft: 8 }}>All rules added</span>
              )}
              {showAddMenu && availableRules.length > 0 && (
                <div className="channel-rules-menu tier-selection-appear">
                  {availableRules.map(rule => (
                    <div key={rule.id} className="channel-rules-menu-item" onClick={() => { onAddCustomRule(expandedChannel, rule); setShowAddMenu(false); }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{rule.label}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{rule.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* ── Legacy Channel-Specific Rules (retained for backward compat) ── */

export default function ChannelSpecificRules({ selectedChannels, channelRulesState, onChannelRulesChange }: ChannelSpecificRulesProps) {
  const [openMenuChannel, setOpenMenuChannel] = useState<MessageChannel | null>(null);
  const activeGroups = CHANNEL_SPECIFIC_RULES.filter(g => selectedChannels.includes(g.channel));

  if (activeGroups.length === 0) return null;

  function getAddedRuleIds(channel: MessageChannel): string[] {
    return (channelRulesState[channel] || []).map(r => r.ruleId);
  }

  function addRule(channel: MessageChannel, ruleId: string) {
    const updated = updateRuleValue(channelRulesState, channel, ruleId, { value: "" });
    onChannelRulesChange(updated);
    setOpenMenuChannel(null);
  }

  function removeRule(channel: MessageChannel, ruleId: string) {
    onChannelRulesChange(removeRuleValue(channelRulesState, channel, ruleId));
  }

  return (
    <div className="channel-rules-container">
      {activeGroups.map(group => {
        const addedIds = getAddedRuleIds(group.channel);
        const addedRules = group.rules.filter(r => addedIds.includes(r.id));
        const availableRules = group.rules.filter(r => !addedIds.includes(r.id));
        const channelName = CHANNEL_LABELS[group.channel];

        return (
          <div key={group.channel} className={`channel-rules-group channel-rules-group--${group.channel} tier-selection-appear`}>
            <div className="channel-rules-header">
              <span className="channel-rules-icon">{group.icon}</span>
              <span className="channel-rules-hint">
                There may be <strong>{channelName.toLowerCase()}-specific rules</strong> to configure.
              </span>
            </div>

            {addedRules.length > 0 && (
              <div className="channel-rules-body">
                {addedRules.map(rule => (
                  <RuleField
                    key={rule.id}
                    config={rule}
                    channel={group.channel}
                    state={channelRulesState}
                    onUpdate={onChannelRulesChange}
                    onRemove={() => removeRule(group.channel, rule.id)}
                  />
                ))}
              </div>
            )}

            <div style={{ position: "relative", marginTop: addedRules.length > 0 ? 10 : 0 }}>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 13 }}
                onClick={() => setOpenMenuChannel(openMenuChannel === group.channel ? null : group.channel)}
                disabled={availableRules.length === 0}
              >
                + Add {channelName} Rule
              </button>
              {availableRules.length === 0 && (
                <span className="text-muted" style={{ fontSize: 12, marginLeft: 8 }}>All rules added</span>
              )}
              {openMenuChannel === group.channel && availableRules.length > 0 && (
                <div className="channel-rules-menu tier-selection-appear">
                  {availableRules.map(rule => (
                    <div key={rule.id} className="channel-rules-menu-item" onClick={() => addRule(group.channel, rule.id)}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{rule.label}</div>
                      {rule.description && <div className="text-muted" style={{ fontSize: 12 }}>{rule.description}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
