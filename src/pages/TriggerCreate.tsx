import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CHANNEL_LABELS,
  CHANNEL_ICONS,
  RULE_ATTRIBUTES,
  INPUT_TOPICS,
  type MessageChannel,
  type EligibilityRule,
  type RuleOperator,
  type RuleConnector,
  type TopicCategory,
} from "../types";
import BaseContentSection from "../components/BaseContentSection";

type TriggerType = "GENERAL" | "SESSION";
type DeliveryMode = "best_channel" | "multi_channel" | "sequential";

interface ChannelRoutingRule {
  channel: MessageChannel;
  condition: string;
  priority: number;
}

const TOPIC_OPTIONS = Object.entries(INPUT_TOPICS).map(([key, cfg]) => ({
  key,
  label: cfg.label,
  category: cfg.category,
  description: cfg.description,
  channels: cfg.channels,
}));

export default function TriggerCreate() {
  const navigate = useNavigate();

  // Basic info
  const [triggerName, setTriggerName] = useState("");
  const [reportingLabel, setReportingLabel] = useState("");
  const [autoLabel, setAutoLabel] = useState(true);
  const [description, setDescription] = useState("");

  // Input configuration
  const [triggerType, setTriggerType] = useState<TriggerType>("GENERAL");
  const [selectedChannels, setSelectedChannels] = useState<MessageChannel[]>(["email"]);
  const [inputTopic, setInputTopic] = useState("");
  const [additionalTopics, setAdditionalTopics] = useState<string[]>([]);
  const [consentCheck, setConsentCheck] = useState(true);
  const [joiningWindow, setJoiningWindow] = useState("300");
  const [delayMinutes, setDelayMinutes] = useState("0");

  // Omni-channel routing
  const [omniChannelRouting, setOmniChannelRouting] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("best_channel");
  const [channelRoutingRules, setChannelRoutingRules] = useState<ChannelRoutingRule[]>([]);
  const [dedupEnabled, setDedupEnabled] = useState(true);
  const [dedupWindow, setDedupWindow] = useState("24");

  // Rules
  const [advancedRuleMode, setAdvancedRuleMode] = useState(false);
  const [handcraftedRule, setHandcraftedRule] = useState("");
  const [rules, setRules] = useState<EligibilityRule[]>([]);

  // Output configuration
  const [outputFields, setOutputFields] = useState<{ name: string; source: string }[]>([
    { name: "subscriber_id", source: "event.user_id" },
  ]);

  // State
  const [toast, setToast] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Derived
  const selectedTopicConfig = INPUT_TOPICS[inputTopic];
  const topicCategory: TopicCategory | null = selectedTopicConfig?.category ?? null;

  // Auto-generate reporting label
  function handleNameChange(name: string) {
    setTriggerName(name);
    if (autoLabel) {
      setReportingLabel(name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""));
    }
  }

  function toggleChannel(ch: MessageChannel) {
    const next = selectedChannels.includes(ch)
      ? selectedChannels.filter(c => c !== ch)
      : [...selectedChannels, ch];
    setSelectedChannels(next);

    // Update routing rules when channels change
    if (omniChannelRouting) {
      setChannelRoutingRules(prev => {
        const existing = prev.filter(r => next.includes(r.channel));
        const newChannels = next.filter(ch => !existing.some(r => r.channel === ch));
        return [
          ...existing,
          ...newChannels.map((ch, i) => ({ channel: ch, condition: "", priority: existing.length + i + 1 })),
        ];
      });
    }
  }

  function addTopic() {
    setAdditionalTopics(prev => [...prev, ""]);
  }

  function removeTopic(index: number) {
    setAdditionalTopics(prev => prev.filter((_, i) => i !== index));
  }

  function updateTopic(index: number, value: string) {
    setAdditionalTopics(prev => prev.map((t, i) => (i === index ? value : t)));
  }

  // Rules
  function addRule() {
    setRules(prev => [
      ...prev,
      { id: `r${Date.now()}`, attribute: "genius_level", operator: "greater_than" as RuleOperator, value: 1, connector: "AND" as RuleConnector },
    ]);
  }

  function removeRule(id: string) {
    setRules(prev => prev.filter(r => r.id !== id));
  }

  function updateRule(id: string, field: keyof EligibilityRule, value: string | number) {
    setRules(prev => prev.map(r => (r.id === id ? { ...r, [field]: value } : r)));
  }

  // Output fields
  function addOutputField() {
    setOutputFields(prev => [...prev, { name: "", source: "" }]);
  }

  function removeOutputField(index: number) {
    setOutputFields(prev => prev.filter((_, i) => i !== index));
  }

  function updateOutputField(index: number, field: "name" | "source", value: string) {
    setOutputFields(prev => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
  }

  // Channel routing rules
  function updateRoutingRule(channel: MessageChannel, condition: string) {
    setChannelRoutingRules(prev =>
      prev.map(r => (r.channel === channel ? { ...r, condition } : r))
    );
  }

  function enableOmniRouting(enabled: boolean) {
    setOmniChannelRouting(enabled);
    if (enabled && channelRoutingRules.length === 0) {
      setChannelRoutingRules(
        selectedChannels.map((ch, i) => ({ channel: ch, condition: "", priority: i + 1 }))
      );
    }
  }

  // Save
  function handleSave() {
    setSaved(true);
    setToast("Trigger saved successfully!");
    setTimeout(() => setToast(null), 3000);
  }

  // Rule expression preview
  const rulePreview = advancedRuleMode
    ? handcraftedRule
    : rules
        .map((r, i) => `${i > 0 ? ` ${r.connector} ` : ""}${r.attribute} ${r.operator.replace("_", " ")} ${r.value}`)
        .join("");

  // Success state
  if (saved) {
    return (
      <div className="app-page">
        <div className="page-header">
          <div className="page-header-main">
            <h1 className="page-title">Trigger Created</h1>
          </div>
        </div>
        <div className="bui-box" style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#10003;</div>
          <h2 style={{ marginBottom: 8 }}>Omni-Channel Trigger Created</h2>
          <p className="text-muted mb-16">
            "{triggerName}" has been saved as a {triggerType} trigger on topic{" "}
            <code style={{ background: "rgba(0,0,0,0.05)", padding: "1px 6px", borderRadius: 3 }}>
              {selectedTopicConfig?.label || inputTopic}
            </code>{" "}
            targeting {selectedChannels.map(ch => CHANNEL_LABELS[ch]).join(", ")}.
          </p>
          {omniChannelRouting && (
            <p className="text-muted mb-16">
              Omni-Channel Routing: <strong>Enabled</strong> &middot; Mode:{" "}
              <strong>{deliveryMode === "best_channel" ? "Best Channel" : deliveryMode === "multi_channel" ? "Multi-Channel" : "Sequential"}</strong>
            </p>
          )}
          <div style={{ marginTop: 16 }}>
            <span className="badge badge-draft" style={{ fontSize: 13, padding: "6px 14px" }}>Status: Draft</span>
          </div>
          <div className="btn-group" style={{ justifyContent: "center", marginTop: 24 }}>
            <button className="btn btn-secondary" onClick={() => navigate("/triggers")}>View All Triggers</button>
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
          <h1 className="page-title">New Omni-Channel Trigger</h1>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <span className="badge badge-outline">{triggerType}</span>
            {selectedChannels.map(ch => (
              <span key={ch} className="badge badge-outline">
                {CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}
              </span>
            ))}
            {omniChannelRouting && (
              <span className="badge-orchestration badge-orchestration--best_channel">Omni-Channel Routing</span>
            )}
            <span className="badge badge-draft">Draft</span>
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate("/triggers")}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!triggerName || !inputTopic || selectedChannels.length === 0}
            onClick={handleSave}
          >
            Save Trigger
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="info-banner">
        <span className="info-banner-icon">&#9889;</span>
        <span>
          <strong>Omni-Channel Triggers:</strong> In PROD, each trigger routes to a single channel.
          Here, a single trigger event can route to multiple channels with per-channel conditions,
          deduplication, and intelligent routing.
        </span>
      </div>

      {/* Basic Information */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Basic Information</div>
        <div className="form-group">
          <label className="form-label">Trigger Name</label>
          <input
            className="form-input"
            placeholder="e.g., cart_abandon_trigger"
            value={triggerName}
            onChange={e => handleNameChange(e.target.value)}
            maxLength={255}
          />
          <div className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>{triggerName.length}/255 chars</div>
        </div>
        <div className="form-group">
          <label className="form-label">
            Reporting Label
            <label style={{ marginLeft: 12, fontWeight: 400, fontSize: 12, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={autoLabel}
                onChange={e => setAutoLabel(e.target.checked)}
                style={{ marginRight: 4 }}
              />
              Auto-generate from name
            </label>
          </label>
          <input
            className="form-input"
            placeholder="e.g., cart_abandon_omni"
            value={reportingLabel}
            onChange={e => setReportingLabel(e.target.value)}
            disabled={autoLabel}
          />
          <div className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>
            Used for analytics reporting. Cannot be changed after creation.
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            placeholder="Describe what this trigger does..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
      </div>

      {/* Input Configuration */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Input Configuration</div>
        <p className="text-muted mb-16">Configure the event source, channels, and timing for this trigger.</p>

        {/* Trigger Type */}
        <div className="form-group">
          <label className="form-label">Trigger Type</label>
          <div className="radio-card-group" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div
              className={`radio-card ${triggerType === "GENERAL" ? "selected" : ""}`}
              onClick={() => setTriggerType("GENERAL")}
            >
              <div className="radio-card-header">
                <div className="radio-card-radio" />
                <div className="radio-card-title">General</div>
              </div>
              <div className="radio-card-description">
                Evaluates each event independently. No session tracking or event joining. Best for state-change events
                (booking confirmed, payment processed).
              </div>
            </div>
            <div
              className={`radio-card ${triggerType === "SESSION" ? "selected" : ""}`}
              onClick={() => setTriggerType("SESSION")}
            >
              <div className="radio-card-header">
                <div className="radio-card-radio" />
                <div className="radio-card-title">Session</div>
              </div>
              <div className="radio-card-description">
                Groups events within a joining window before evaluating. Uses session tracking for behavioral patterns
                (cart abandonment, browse-then-leave).
              </div>
            </div>
          </div>
        </div>

        {/* Channel Selection */}
        <div className="form-group">
          <label className="form-label">Channel Selection</label>
          <p className="text-muted" style={{ marginBottom: 8, fontSize: 13 }}>
            In PROD, triggers route to a single channel. With omni-channel, select multiple channels for intelligent routing.
          </p>
          <div className="channel-selector-grid">
            {(["email", "push", "sms", "in_app"] as MessageChannel[]).map(ch => (
              <div
                key={ch}
                className={`channel-selector-card ${selectedChannels.includes(ch) ? "selected" : ""}`}
                onClick={() => toggleChannel(ch)}
              >
                <div className="channel-selector-check">{selectedChannels.includes(ch) ? "\u2713" : ""}</div>
                <div className="channel-selector-icon">{CHANNEL_ICONS[ch]}</div>
                <div className="channel-selector-label">{CHANNEL_LABELS[ch]}</div>
              </div>
            ))}
          </div>
          {selectedChannels.length > 1 && (
            <div className="info-banner tier-selection-appear" style={{ marginTop: 12 }}>
              <span className="info-banner-icon">&#128279;</span>
              <span>
                <strong>Multi-Channel Trigger</strong> &mdash; This trigger will route events to {selectedChannels.length} channels.
                Enable Omni-Channel Routing below to configure per-channel conditions.
              </span>
            </div>
          )}
        </div>

        {/* Input Topic */}
        <div className="form-group">
          <label className="form-label">Input Topic</label>
          <select
            className="form-select"
            value={inputTopic}
            onChange={e => setInputTopic(e.target.value)}
          >
            <option value="">Select a topic...</option>
            <optgroup label="State Change Events">
              {TOPIC_OPTIONS.filter(t => t.category === "state_change").map(t => (
                <option key={t.key} value={t.key}>{t.label} &mdash; {t.description}</option>
              ))}
            </optgroup>
            <optgroup label="Behavioral Events">
              {TOPIC_OPTIONS.filter(t => t.category === "behavioral").map(t => (
                <option key={t.key} value={t.key}>{t.label} &mdash; {t.description}</option>
              ))}
            </optgroup>
          </select>
          {selectedTopicConfig && (
            <div className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>
              Category: {topicCategory === "state_change" ? "State Change" : "Behavioral"} &middot;
              Available channels: {selectedTopicConfig.channels.map(ch => CHANNEL_LABELS[ch]).join(", ")}
            </div>
          )}
        </div>

        {/* Additional Topics */}
        {additionalTopics.map((topic, i) => (
          <div key={i} className="form-group" style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Additional Topic {i + 2}</label>
              <select className="form-select" value={topic} onChange={e => updateTopic(i, e.target.value)}>
                <option value="">Select a topic...</option>
                {TOPIC_OPTIONS.map(t => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-secondary btn-destructive"
              style={{ height: 36, marginBottom: 16 }}
              onClick={() => removeTopic(i)}
            >
              &times;
            </button>
          </div>
        ))}
        <button className="btn btn-secondary" style={{ marginBottom: 16 }} onClick={addTopic}>
          + Add Topic
        </button>

        {/* Consent Check */}
        <div className="form-group">
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
            <input
              type="checkbox"
              checked={consentCheck}
              onChange={e => setConsentCheck(e.target.checked)}
            />
            Enable direct marketing consent check
          </label>
          <div className="text-muted" style={{ marginTop: 4, fontSize: 12, marginLeft: 24 }}>
            When enabled, the trigger will validate subscriber consent via Janet subscription API before routing.
          </div>
        </div>

        {/* Timing Configuration */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="form-group">
            <label className="form-label">
              {triggerType === "SESSION" ? "Joining Window (seconds)" : "Event Window (seconds)"}
            </label>
            <input
              className="form-input"
              type="number"
              min="0"
              max="86400"
              value={joiningWindow}
              onChange={e => setJoiningWindow(e.target.value)}
            />
            <div className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>
              {triggerType === "SESSION"
                ? "Time window to group related events into a single session before evaluation."
                : "Tracking window for event correlation. 0 = evaluate immediately."}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Event Evaluation Delay (minutes)</label>
            <input
              className="form-input"
              type="number"
              min="0"
              max="360"
              value={delayMinutes}
              onChange={e => setDelayMinutes(e.target.value)}
            />
            <div className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>
              Delay before evaluating the trigger. 0 = no delay. Max 360 minutes (6 hours).
            </div>
          </div>
        </div>
      </div>

      {/* Trigger Rules */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Trigger Rules</div>
        <p className="text-muted mb-16">
          Define conditions that must be met for the trigger to fire. Use the visual builder or write a custom rule expression.
        </p>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            className={`btn ${!advancedRuleMode ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: 13 }}
            onClick={() => setAdvancedRuleMode(false)}
          >
            Visual Rule Builder
          </button>
          <button
            className={`btn ${advancedRuleMode ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: 13 }}
            onClick={() => setAdvancedRuleMode(true)}
          >
            Advanced (Hand-crafted)
          </button>
        </div>

        {advancedRuleMode ? (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Rule Expression</label>
            <textarea
              className="form-textarea"
              style={{ fontFamily: "monospace", minHeight: 100 }}
              placeholder="e.g., event.type == 'CONFIRMED' AND event.status == 'NEW'"
              value={handcraftedRule}
              onChange={e => setHandcraftedRule(e.target.value)}
            />
            <div className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>
              Write a custom rule expression. Supports AND, OR, ==, !=, &gt;, &lt;, &gt;=, &lt;=, IN operators.
            </div>
          </div>
        ) : (
          <>
            <div className="rule-builder">
              {rules.map((r, i) => (
                <div key={r.id} className="rule-row">
                  {i > 0 && (
                    <select
                      className="form-select"
                      style={{ width: 70, flex: "none" }}
                      value={r.connector}
                      onChange={e => updateRule(r.id, "connector", e.target.value)}
                    >
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                    </select>
                  )}
                  <select
                    className="form-select"
                    value={r.attribute}
                    onChange={e => updateRule(r.id, "attribute", e.target.value)}
                  >
                    {RULE_ATTRIBUTES.map(a => (
                      <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                  <select
                    className="form-select"
                    style={{ width: 140, flex: "none" }}
                    value={r.operator}
                    onChange={e => updateRule(r.id, "operator", e.target.value)}
                  >
                    <option value="equals">equals</option>
                    <option value="not_equals">not equals</option>
                    <option value="greater_than">greater than</option>
                    <option value="less_than">less than</option>
                    <option value="in">in</option>
                    <option value="not_in">not in</option>
                    <option value="between">between</option>
                  </select>
                  <input
                    className="form-input"
                    style={{ width: 120, flex: "none" }}
                    value={String(r.value)}
                    onChange={e => updateRule(r.id, "value", e.target.value)}
                  />
                  <button className="rule-remove-btn" onClick={() => removeRule(r.id)}>&times;</button>
                </div>
              ))}
            </div>
            <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={addRule}>
              + Add Rule
            </button>
          </>
        )}

        {/* Rule preview */}
        {rulePreview && (
          <div style={{ marginTop: 12, padding: "8px 12px", background: "var(--color-gray-50)", borderRadius: 4 }}>
            <div className="text-muted" style={{ fontSize: 11, marginBottom: 4 }}>RULE PREVIEW</div>
            <code style={{ fontSize: 12, color: "var(--color-gray-600)" }}>{rulePreview}</code>
          </div>
        )}
      </div>

      {/* Omni-Channel Routing */}
      {selectedChannels.length > 1 && (
        <div className="bui-box tier-selection-appear">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Omni-Channel Routing</div>
              <p className="text-muted" style={{ marginTop: 4 }}>
                Configure how events are routed across the {selectedChannels.length} selected channels.
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={omniChannelRouting}
                onChange={e => enableOmniRouting(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          {omniChannelRouting && (
            <div className="tier-selection-appear">
              {/* Delivery Mode */}
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Delivery Mode</div>
              <div className="radio-card-group" style={{ marginBottom: 20 }}>
                <div
                  className={`radio-card ${deliveryMode === "best_channel" ? "selected" : ""}`}
                  onClick={() => setDeliveryMode("best_channel")}
                >
                  <div className="radio-card-header">
                    <div className="radio-card-radio" />
                    <div className="radio-card-title">Best Channel</div>
                  </div>
                  <div className="radio-card-description">
                    Route each event to the single best channel per subscriber based on engagement history, app
                    install status, and channel preferences. Fallback if primary fails.
                  </div>
                </div>
                <div
                  className={`radio-card ${deliveryMode === "multi_channel" ? "selected" : ""}`}
                  onClick={() => setDeliveryMode("multi_channel")}
                >
                  <div className="radio-card-header">
                    <div className="radio-card-radio" />
                    <div className="radio-card-title">Multi-Channel</div>
                  </div>
                  <div className="radio-card-description">
                    Route events to all eligible channels simultaneously. Per-channel conditions determine
                    which channels activate. Deduplication prevents redundant messages.
                  </div>
                </div>
                <div
                  className={`radio-card ${deliveryMode === "sequential" ? "selected" : ""}`}
                  onClick={() => setDeliveryMode("sequential")}
                >
                  <div className="radio-card-header">
                    <div className="radio-card-radio" />
                    <div className="radio-card-title">Sequential</div>
                  </div>
                  <div className="radio-card-description">
                    Route events through channels in priority order with configurable wait periods.
                    Move to next channel if previous fails or goes unopened.
                  </div>
                </div>
              </div>

              {/* Per-Channel Routing Rules */}
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Per-Channel Routing Conditions</div>
              <p className="text-muted" style={{ marginBottom: 12, fontSize: 13 }}>
                Define conditions for when each channel should receive the event. Leave empty for "always route".
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {channelRoutingRules.map(rule => (
                  <div
                    key={rule.channel}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "160px 1fr",
                      gap: 12,
                      alignItems: "center",
                      padding: "10px 14px",
                      background: "var(--color-gray-50)",
                      borderRadius: "var(--radius-md)",
                      borderLeft: `3px solid var(--color-${rule.channel === "in_app" ? "inapp" : rule.channel})`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{CHANNEL_ICONS[rule.channel]}</span>
                      <strong style={{ fontSize: 13 }}>{CHANNEL_LABELS[rule.channel]}</strong>
                      <span className="badge badge-outline" style={{ fontSize: 10 }}>P{rule.priority}</span>
                    </div>
                    <input
                      className="form-input"
                      style={{ margin: 0 }}
                      placeholder={`e.g., subscriber.has_app == true`}
                      value={rule.condition}
                      onChange={e => updateRoutingRule(rule.channel, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              {/* Routing Flow Preview */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-gray-500)", marginBottom: 6 }}>
                  ROUTING FLOW PREVIEW
                </div>
                <div className="trigger-flow">
                  <span className="trigger-flow-node trigger-flow-node--event">
                    &#9889; {selectedTopicConfig?.label || "Event"}
                  </span>
                  <span className="trigger-flow-arrow">&rarr;</span>
                  <span className="trigger-flow-node trigger-flow-node--rules">Rules Engine</span>
                  <span className="trigger-flow-arrow">&rarr;</span>
                  <span className="trigger-flow-node trigger-flow-node--router">Channel Router</span>
                  <span className="trigger-flow-arrow">&rarr;</span>
                  {channelRoutingRules.map((cr, i) => (
                    <span key={cr.channel}>
                      {i > 0 && <span style={{ color: "var(--color-gray-300)", margin: "0 2px" }}>|</span>}
                      <span
                        className="trigger-flow-node trigger-flow-node--channel"
                        style={{
                          background: `var(--color-${cr.channel === "in_app" ? "inapp" : cr.channel})`,
                          color: "#fff",
                          border: "none",
                        }}
                      >
                        {CHANNEL_ICONS[cr.channel]} {cr.condition || "always"}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Multi-channel warning */}
              {deliveryMode === "multi_channel" && (
                <div className="alert alert-warning tier-selection-appear" style={{ marginTop: 16 }}>
                  <div className="alert-title">Multi-Channel Guardrails Active</div>
                  <ul style={{ margin: "8px 0 0 16px", padding: 0 }}>
                    <li>Subscriber consent validated per-channel before delivery</li>
                    <li>Frequency caps respected across all channels</li>
                    <li>Deduplication active to prevent redundant messages</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cross-Channel Deduplication */}
      {selectedChannels.length > 1 && omniChannelRouting && (
        <div className="bui-box tier-selection-appear">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Cross-Channel Deduplication</div>
              <p className="text-muted" style={{ marginTop: 4 }}>
                Prevent the same subscriber from receiving duplicate trigger-fired messages across channels.
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={dedupEnabled}
                onChange={e => setDedupEnabled(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
          {dedupEnabled && (
            <div className="tier-selection-appear" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Deduplication Window (hours)</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  max="168"
                  value={dedupWindow}
                  onChange={e => setDedupWindow(e.target.value)}
                />
                <div className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>
                  Same trigger event to same subscriber within {dedupWindow}h = deduplicated
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Dedup Strategy</label>
                <select className="form-select">
                  <option>Event ID match (recommended)</option>
                  <option>Subscriber + topic match</option>
                  <option>Content similarity</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Output Configuration */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Output Configuration</div>
        <p className="text-muted mb-16">
          Map fields from the input event to the trigger output. These fields are passed to linked campaigns.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {outputFields.map((field, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "center" }}>
              <input
                className="form-input"
                placeholder="Output field name"
                value={field.name}
                onChange={e => updateOutputField(i, "name", e.target.value)}
                style={{ margin: 0 }}
              />
              <input
                className="form-input"
                placeholder="Source expression (e.g., event.user_id)"
                value={field.source}
                onChange={e => updateOutputField(i, "source", e.target.value)}
                style={{ margin: 0 }}
              />
              <button
                className="rule-remove-btn"
                onClick={() => removeOutputField(i)}
                disabled={outputFields.length <= 1}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={addOutputField}>
          + Add Output Field
        </button>
      </div>

      {/* Base Content per channel */}
      <BaseContentSection selectedChannels={selectedChannels} />

      {/* Bottom Save */}
      <div className="btn-group">
        <button className="btn btn-secondary" onClick={() => navigate("/triggers")}>Cancel</button>
        <button
          className="btn btn-primary"
          disabled={!triggerName || !inputTopic || selectedChannels.length === 0}
          onClick={handleSave}
        >
          Save Trigger
        </button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
