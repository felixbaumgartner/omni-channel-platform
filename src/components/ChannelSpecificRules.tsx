import { useState } from "react";
import { CHANNEL_SPECIFIC_RULES, CHANNEL_LABELS, type MessageChannel, type ChannelRulesState, type ChannelSpecificRuleConfig, type ChannelSpecificRuleValue, type RuleOperator } from "../types";

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
                There may be <strong>{channelName.toLowerCase()}-specific rules</strong> to configure for this channel.
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
