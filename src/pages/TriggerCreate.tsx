import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RULE_ATTRIBUTES,
  INPUT_TOPICS,
  type EligibilityRule,
  type RuleOperator,
  type RuleConnector,
  type TopicCategory,
} from "../types";

type TriggerType = "GENERAL" | "SESSION";

const TOPIC_OPTIONS = Object.entries(INPUT_TOPICS).map(([key, cfg]) => ({
  key,
  label: cfg.label,
  category: cfg.category,
  description: cfg.description,
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
  const [inputTopic, setInputTopic] = useState("");
  const [additionalTopics, setAdditionalTopics] = useState<string[]>([]);
  const [consentCheck, setConsentCheck] = useState(true);
  const [joiningWindow, setJoiningWindow] = useState("300");
  const [delayMinutes, setDelayMinutes] = useState("0");

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

  // Topics
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
          <h2 style={{ marginBottom: 8 }}>Trigger Created</h2>
          <p className="text-muted mb-16">
            "{triggerName}" has been saved as a {triggerType} trigger on topic{" "}
            <code style={{ background: "rgba(0,0,0,0.05)", padding: "1px 6px", borderRadius: 3 }}>
              {selectedTopicConfig?.label || inputTopic}
            </code>.
          </p>
          <p className="text-muted mb-16" style={{ fontSize: 13 }}>
            {outputFields.length} output field{outputFields.length !== 1 ? "s" : ""} configured.
            Channel routing will be determined when a campaign links to this trigger.
          </p>
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
          <h1 className="page-title">New Trigger</h1>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <span className="badge badge-outline">{triggerType}</span>
            {inputTopic && <span className="badge badge-media">{selectedTopicConfig?.label || inputTopic}</span>}
            <span className="badge badge-draft">Draft</span>
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate("/triggers")}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!triggerName || !inputTopic}
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
          Triggers are channel-agnostic event processors. Define the event source, rules, and output fields.
          The system automatically resolves identities from the event payload &mdash; channel routing is handled at campaign creation time.
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
        <p className="text-muted mb-16">Configure the event source and timing for this trigger.</p>

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
              Category: {topicCategory === "state_change" ? "State Change" : "Behavioral"}
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
            When enabled, consent will be validated at delivery time via Janet subscription API per channel.
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

      {/* Output Configuration */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Output Configuration</div>
        <p className="text-muted mb-16">
          Map fields from the input event to the trigger output. These fields are passed to linked campaigns.
          Identity fields (e.g., user_id, email) are automatically detected and resolved to all reachable channels.
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
                placeholder="Source expression (e.g., event.booking_id)"
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

      {/* Trigger Flow */}
      <div className="bui-box">
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-gray-500)", marginBottom: 8 }}>
          TRIGGER PROCESSING FLOW
        </div>
        <div className="trigger-flow">
          <span className="trigger-flow-node trigger-flow-node--event">
            &#9889; {selectedTopicConfig?.label || "Event"}
          </span>
          <span className="trigger-flow-arrow">&rarr;</span>
          <span className="trigger-flow-node trigger-flow-node--rules">Rules Engine</span>
          <span className="trigger-flow-arrow">&rarr;</span>
          <span className="trigger-flow-node" style={{ background: "var(--color-blue-100)", border: "1px solid var(--color-blue-300)", color: "var(--color-blue-700)" }}>
            Extract {outputFields.length} field{outputFields.length !== 1 ? "s" : ""}
          </span>
          <span className="trigger-flow-arrow">&rarr;</span>
          <span className="trigger-flow-node trigger-flow-node--router">Linked Campaigns</span>
        </div>
        <div className="text-muted" style={{ marginTop: 8, fontSize: 12 }}>
          Identities in the output are automatically resolved via the identity graph.
          Campaigns decide which channels to use.
        </div>
      </div>

      {/* Bottom Save */}
      <div className="btn-group">
        <button className="btn btn-secondary" onClick={() => navigate("/triggers")}>Cancel</button>
        <button
          className="btn btn-primary"
          disabled={!triggerName || !inputTopic}
          onClick={handleSave}
        >
          Save Trigger
        </button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
