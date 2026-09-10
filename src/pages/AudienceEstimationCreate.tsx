import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { audienceEstimationData, DEFAULT_CHANNEL_ORDER } from "../data/mockData";
import { CHANNEL_ICONS, CHANNEL_LABELS, ORCHESTRATION_LABELS, RULE_ATTRIBUTES, type MessageChannel, type OrchestrationMode } from "../types";
import { usePhase } from "../context/PhaseContext";
import { ChannelEligibilityRules } from "../components/ChannelSpecificRules";

type Step = "form" | "saved" | "scheduling" | "estimated";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

const OPERATORS = ["equals", "not_equals", "greater_than", "less_than", "in"] as const;

const CHANNEL_COLORS: Record<MessageChannel, string> = {
  email: "var(--color-email, #0071c2)",
  push: "var(--color-push, #7c3aed)",
  sms: "var(--color-sms, #059669)",
  whatsapp: "var(--color-whatsapp, #25d366)",
};

interface RuleRow {
  id: number;
  attribute: string;
  operator: string;
  value: string;
  connector: "AND" | "OR";
}

export default function AudienceEstimationCreate() {
  const navigate = useNavigate();
  const { showBestChannel } = usePhase();

  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [channels, setChannels] = useState<MessageChannel[]>([]);
  const [orchestrationMode, setOrchestrationMode] = useState<OrchestrationMode>(showBestChannel ? "best_channel" : "multi_channel");
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [priorityOverride, setPriorityOverride] = useState<MessageChannel[]>([]);
  const [showRuleMenu, setShowRuleMenu] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduling, setScheduling] = useState(false);

  // Mirrors CampaignCreate: keep a visible mode selected when the phase toggle hides
  // Best Channel after mount.
  useEffect(() => {
    if (!showBestChannel && orchestrationMode === "best_channel") setOrchestrationMode("sequential");
  }, [showBestChannel, orchestrationMode]);

  // Channel Eligibility Rules state (mirrors CampaignCreate / Appendix A model)
  const [eligibilityRulesEnabled, setEligibilityRulesEnabled] = useState<Record<string, boolean>>({});
  const [experimentValues, setExperimentValues] = useState<Record<string, string>>({});
  const [addedCustomRules, setAddedCustomRules] = useState<Record<string, { id: string; label: string; description: string }[]>>({});

  const handleToggleEligibilityRule = (ruleId: string) => {
    setEligibilityRulesEnabled(prev => ({ ...prev, [ruleId]: !prev[ruleId] }));
  };

  const handleExperimentChange = (ruleId: string, value: string) => {
    setExperimentValues(prev => ({ ...prev, [ruleId]: value }));
  };

  const handleAddCustomRule = (channel: MessageChannel, rule: { id: string; label: string; description: string }) => {
    setAddedCustomRules(prev => ({
      ...prev,
      [channel]: [...(prev[channel] || []), rule],
    }));
  };

  const handleRemoveCustomRule = (channel: MessageChannel, ruleId: string) => {
    setAddedCustomRules(prev => ({
      ...prev,
      [channel]: (prev[channel] || []).filter(r => r.id !== ruleId),
    }));
  };

  const toggleChannel = (ch: MessageChannel) => {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  // The fallback ladder is the selected channels, ordered. Explicit reorders are kept;
  // newly selected channels join at the bottom in the platform default order.
  const priority: MessageChannel[] = [
    ...priorityOverride.filter(c => channels.includes(c)),
    ...DEFAULT_CHANNEL_ORDER.filter(c => channels.includes(c) && !priorityOverride.includes(c)),
  ];
  const movePriority = (index: number, dir: "up" | "down") => {
    const target = dir === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= priority.length) return;
    const next = [...priority];
    [next[index], next[target]] = [next[target], next[index]];
    setPriorityOverride(next);
  };
  const isSequential = orchestrationMode === "sequential";
  const priorityLabel = priority.map(c => CHANNEL_LABELS[c]).join(" > ");

  // Sequential waterfall: each rung only reaches subscribers no earlier rung could.
  // Channel reachability is treated as independent, which is the simplest honest
  // assumption without an overlap matrix.
  const waterfall = (() => {
    const base = audienceEstimationData.baseEligible;
    let remaining = base;
    const rungs = priority.map((ch, i) => {
      const pct = audienceEstimationData.channelReachability[ch].pct / 100;
      const delivered = Math.round(remaining * pct);
      remaining -= delivered;
      return { channel: ch, rank: i + 1, reachable: audienceEstimationData.channelReachability[ch].reachable, delivered, cumulative: base - remaining };
    });
    return { rungs, reached: base - remaining, suppressed: remaining, base };
  })();

  const addRule = (attribute: string) => {
    setRules(prev => [...prev, { id: Date.now(), attribute, operator: "equals", value: "", connector: "AND" }]);
  };

  const removeRule = (id: number) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const updateRule = (id: number, field: keyof RuleRow, value: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const canSave = name.trim() && channels.length > 0 && rules.length > 0 && rules.every(r => r.value);

  const handleSave = () => {
    setStep("saved");
  };

  const handleSchedule = () => {
    setScheduling(true);
    setTimeout(() => {
      setScheduling(false);
      setStep("estimated");
    }, 2000);
  };

  const modeData = audienceEstimationData.orchestrationModes[orchestrationMode];
  const effectiveSends = modeData.totalSends;
  const today = new Date().toISOString().split("T")[0];

  // ─── STEP: Saved Confirmation ───
  if (step === "saved") {
    return (
      <div className="app-page">
        <div className="page-header">
          <div className="page-header-main">
            <h1 className="page-title">Segment Saved</h1>
          </div>
        </div>
        <div className="bui-box" style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16, color: "var(--color-green-600)" }}>&#10003;</div>
          <h2 style={{ marginBottom: 8 }}>Segment Created Successfully</h2>
          <p className="text-muted mb-16">
            "{name}" has been saved as a {channels.length}-channel segment
            using <strong>{ORCHESTRATION_LABELS[orchestrationMode]}</strong> delivery mode{isSequential ? <> in the order <strong>{priorityLabel}</strong></> : null}.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16, flexWrap: "wrap" }}>
            {channels.map(ch => (
              <span key={ch} className="badge badge-outline">{CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}</span>
            ))}
            <span className="badge badge-draft">Draft</span>
          </div>
          <div className="text-muted mb-16" style={{ fontSize: 13 }}>
            {rules.length} eligibility rule{rules.length > 1 ? "s" : ""} configured
          </div>
          <div className="btn-group" style={{ justifyContent: "center", marginTop: 24 }}>
            <button className="btn btn-secondary" onClick={() => navigate("/audience-estimation")}>Back to Segments</button>
            <button className="btn btn-primary" onClick={() => setStep("scheduling")}>Schedule Estimation</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP: Schedule Estimation ───
  if (step === "scheduling") {
    return (
      <div className="app-page">
        <div className="page-header">
          <div className="page-header-main">
            <h1 className="page-title">Schedule Estimation</h1>
            <p className="page-subtitle">"{name}"</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-secondary" onClick={() => setStep("saved")}>Back</button>
          </div>
        </div>
        <div className="bui-box">
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Estimation Window</div>
          <p className="text-muted mb-16">
            The estimation will collect audience metrics over a 24-hour window starting from the selected date.
            Results will be available once the estimation completes.
          </p>

          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              style={{ width: 220 }}
              min={today}
              value={scheduleDate}
              onChange={e => setScheduleDate(e.target.value)}
            />
          </div>

          {scheduleDate && (
            <div className="tier-selection-appear" style={{ marginTop: 16 }}>
              <div className="info-banner">
                <span className="info-banner-icon">&#128197;</span>
                <span>
                  <strong>Estimation window:</strong> {scheduleDate} 00:00 UTC to {scheduleDate} 23:59 UTC (24 hours).
                  The segment status will change to <strong>Scheduled</strong> and results will be available after completion.
                </span>
              </div>
            </div>
          )}

          <div className="schedule-summary" style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Segment Summary</div>
            <table className="data-table" style={{ fontSize: 13 }}>
              <tbody>
                <tr><td style={{ fontWeight: 600, width: 140 }}>Channels</td><td>{channels.map(ch => `${CHANNEL_ICONS[ch]} ${CHANNEL_LABELS[ch]}`).join(", ")}</td></tr>
                <tr><td style={{ fontWeight: 600 }}>Delivery Mode</td><td>{ORCHESTRATION_LABELS[orchestrationMode]}</td></tr>
                {isSequential && <tr><td style={{ fontWeight: 600 }}>Priority Order</td><td>{priorityLabel}</td></tr>}
                <tr><td style={{ fontWeight: 600 }}>Rules</td><td>{rules.map((r, i) => `${i > 0 ? ` ${r.connector} ` : ""}${r.attribute.replace(/_/g, " ")} ${r.operator.replace(/_/g, " ")} ${r.value}`).join("")}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="btn-group" style={{ marginTop: 24 }}>
            <button
              className="btn btn-primary btn-lg"
              disabled={!scheduleDate || scheduling}
              onClick={handleSchedule}
            >
              {scheduling ? "Scheduling..." : "Schedule Estimation"}
            </button>
          </div>

          {scheduling && (
            <div className="tier-selection-appear" style={{ marginTop: 16, textAlign: "center" }}>
              <div className="text-muted">Running estimation against Graphite metrics...</div>
              <div style={{ marginTop: 8, height: 4, background: "var(--color-gray-100)", borderRadius: 2, overflow: "hidden" }}>
                <div className="estimation-progress-bar" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── STEP: Estimation Results ───
  if (step === "estimated") {
    const msgsPerSub = (effectiveSends / modeData.uniqueReach).toFixed(1);

    return (
      <div className="app-page">
        <div className="page-header">
          <div className="page-header-main">
            <h1 className="page-title">{name}</h1>
            <p className="page-subtitle">Audience estimation completed</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-secondary" onClick={() => navigate("/audience-estimation")}>Back to Segments</button>
          </div>
        </div>

        {/* Result Summary Card */}
        <div className="bui-box">
          <table className="data-table" style={{ fontSize: 14 }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, width: 200 }}>Status</td>
                <td><span className="badge badge-constructive">Done</span></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Delivery Mode</td>
                <td>
                  <span className={`badge-orchestration badge-orchestration--${orchestrationMode}`}>
                    {ORCHESTRATION_LABELS[orchestrationMode]}
                  </span>
                </td>
              </tr>
              {isSequential ? (
                <tr>
                  <td style={{ fontWeight: 600 }}>Priority Order</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {priority.map((ch, i) => (
                        <span key={ch} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <span className="fallback-number">{i + 1}</span>
                          <span>{CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}</span>
                          {i === 0 && <span className="badge badge-brand" style={{ fontSize: 9 }}>Primary</span>}
                          {i < priority.length - 1 && <span className="text-muted">&#8250;</span>}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td style={{ fontWeight: 600 }}>Channels</td>
                  <td>{channels.map(ch => `${CHANNEL_ICONS[ch]} ${CHANNEL_LABELS[ch]}`).join("  ")}</td>
                </tr>
              )}
              <tr>
                <td style={{ fontWeight: 600 }}>Eligibility Rules</td>
                <td style={{ fontSize: 13 }}>{rules.map((r, i) => `${i > 0 ? ` ${r.connector} ` : ""}${r.attribute.replace(/_/g, " ")} ${r.operator.replace(/_/g, " ")} ${r.value}`).join("")}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Estimated Audience</td>
                <td style={{ fontSize: 20, fontWeight: 700 }}>
                  {formatNum(isSequential ? waterfall.reached : modeData.uniqueReach)} subscribers
                  {isSequential && <span className="text-muted" style={{ fontSize: 12, fontWeight: 400, marginLeft: 8 }}>one message each, {formatNum(waterfall.suppressed)} unreachable on every rung</span>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Per-Channel Breakdown */}
        {isSequential ? (
          <div className="bui-box">
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Fallback Waterfall</div>
            <p className="text-muted" style={{ fontSize: 12, marginBottom: 12 }}>
              Subscribers are walked down the ladder in your priority order. Each rung only delivers to subscribers that no rung above it could reach, so volume concentrates on the primary channel and the order changes the split.
            </p>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Rung</th>
                  <th>Channel</th>
                  <th style={{ textAlign: "right" }}>Reachable</th>
                  <th style={{ textAlign: "right" }}>Delivered here</th>
                  <th style={{ textAlign: "right" }}>Cumulative</th>
                  <th style={{ width: 200 }}>Share of sends</th>
                </tr>
              </thead>
              <tbody>
                {waterfall.rungs.map(r => {
                  const share = waterfall.reached ? Math.round(r.delivered / waterfall.reached * 100) : 0;
                  return (
                    <tr key={r.channel}>
                      <td><span className="fallback-number">{r.rank}</span></td>
                      <td>
                        {CHANNEL_ICONS[r.channel]} {CHANNEL_LABELS[r.channel]}{" "}
                        {r.rank === 1 ? <span className="badge badge-brand" style={{ fontSize: 9 }}>Primary</span> : <span className="badge badge-outline" style={{ fontSize: 9 }}>Fallback</span>}
                      </td>
                      <td style={{ textAlign: "right" }} className="text-muted">{formatNum(r.reachable)}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{formatNum(r.delivered)}</td>
                      <td style={{ textAlign: "right" }}>{formatNum(r.cumulative)}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="priority-bar"><div className="priority-bar-fill" style={{ width: `${share}%`, background: CHANNEL_COLORS[r.channel] }} /></div>
                          <span style={{ fontSize: 12, width: 36, textAlign: "right" }}>{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td></td>
                  <td className="text-muted">Not reachable on any rung</td>
                  <td></td>
                  <td style={{ textAlign: "right" }} className="text-muted">{formatNum(waterfall.suppressed)}</td>
                  <td style={{ textAlign: "right" }} className="text-muted">{formatNum(waterfall.base)} eligible</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            <div className="info-banner" style={{ marginTop: 12, fontSize: 12 }}>
              <span className="info-banner-icon">&#9993;</span>
              <span>
                <strong>Total sends equal unique reach.</strong> {formatNum(waterfall.reached)} messages for {formatNum(waterfall.reached)} subscribers. Moving {CHANNEL_LABELS[priority[priority.length - 1]]} to the top of the ladder would shift volume onto it; reorder the priority on the segment to compare.
              </span>
            </div>
          </div>
        ) : (
        <div className="bui-box">
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>
            {orchestrationMode === "best_channel" ? "Channel Routing Breakdown" : "Per-Channel Send Volume"}
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Channel</th>
                <th style={{ textAlign: "right" }}>Audience Size</th>
              </tr>
            </thead>
            <tbody>
              {channels.map(ch => {
                const pct = modeData.channelSplit[ch as keyof typeof modeData.channelSplit] || 0;
                const count = orchestrationMode === "best_channel"
                  ? Math.round(modeData.uniqueReach * pct / 100)
                  : Math.round(effectiveSends * pct / 100);
                return (
                  <tr key={ch}>
                    <td>{CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}</td>
                    <td style={{ textAlign: "right" }}>{formatNum(count)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>
    );
  }

  // ─── STEP: Form (default) ───
  return (
    <div className="app-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1 className="page-title">New Segment</h1>
          <p className="page-subtitle">Define targeting rules and estimate cross-channel audience reach</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate("/audience-estimation")}>Back</button>
        </div>
      </div>

      {/* Section 1: Segment Information */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Segment Information</div>
        <div className="form-group">
          <label className="form-label">Name *</label>
          <input
            className="form-input"
            placeholder="e.g., summer_deals_high_value"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            placeholder="What is this segment for?"
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
      </div>

      {/* Section 2: Channel Selection */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Channel Selection</div>
        <p className="text-muted mb-16">Select which channels to include in the audience estimation.</p>
        <div className="channel-selector-grid">
          {(["email", "push", "sms", "whatsapp"] as MessageChannel[]).map(ch => (
            <div
              key={ch}
              className={`channel-selector-card ${channels.includes(ch) ? "selected" : ""}`}
              onClick={() => toggleChannel(ch)}
            >
              <div className="channel-selector-check">{channels.includes(ch) ? "✓" : ""}</div>
              <div className="channel-selector-icon">{CHANNEL_ICONS[ch]}</div>
              <div className="channel-selector-label">{CHANNEL_LABELS[ch]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Delivery Mode */}
      {channels.length > 1 && (
        <div className="bui-box tier-selection-appear">
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Delivery Mode</div>
          <p className="text-muted mb-16">Choose how messages are routed across the selected channels.</p>
          <div className="radio-card-group">
            {showBestChannel && (
            <div className={`radio-card ${orchestrationMode === "best_channel" ? "selected" : ""}`} onClick={() => setOrchestrationMode("best_channel")}>
              <div className="radio-card-header">
                <div className="radio-card-radio" />
                <div className="radio-card-title">Best Channel</div>
              </div>
              <div className="radio-card-description">
                Estimates reach assuming the system picks one optimal channel per subscriber based on engagement scores. One message per person.
              </div>
            </div>
            )}
            <div className={`radio-card ${orchestrationMode === "multi_channel" ? "selected" : ""}`} onClick={() => setOrchestrationMode("multi_channel")}>
              <div className="radio-card-header">
                <div className="radio-card-radio" />
                <div className="radio-card-title">Multi-Channel</div>
              </div>
              <div className="radio-card-description">
                Estimates reach assuming all selected channels fire for each eligible subscriber. Projects total volume across every available channel.
              </div>
            </div>
            <div className={`radio-card ${orchestrationMode === "sequential" ? "selected" : ""}`} onClick={() => setOrchestrationMode("sequential")}>
              <div className="radio-card-header">
                <div className="radio-card-radio" />
                <div className="radio-card-title">Sequential Fallback</div>
              </div>
              <div className="radio-card-description">
                Estimates reach assuming channels are walked in the priority order you set below and each subscriber receives exactly one message on the first channel they are opted in to and reachable on.
              </div>
            </div>
          </div>

          {isSequential && (
            <div className="tier-selection-appear" style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Channel Priority Order</div>
              <p className="text-muted" style={{ fontSize: 12, marginBottom: 8 }}>
                The list is walked top-down. The estimation shows how much volume each rung takes, so the order changes the result.
              </p>
              <div className="fallback-sequence">
                {priority.map((ch, i) => (
                  <div key={ch} className="fallback-item" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="fallback-number">{i + 1}</span>
                    <span style={{ fontSize: 13 }}>{CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}</span>
                    {i === 0 && <span className="badge badge-brand" style={{ fontSize: 9 }}>Primary</span>}
                    {i > 0 && <span className="badge badge-outline" style={{ fontSize: 9 }}>Fallback</span>}
                    <div style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
                      <button className="btn btn-secondary" style={{ padding: "2px 6px", fontSize: 10, lineHeight: 1, opacity: i === 0 ? 0.3 : 1 }} disabled={i === 0} onClick={() => movePriority(i, "up")} title="Move up">&#9650;</button>
                      <button className="btn btn-secondary" style={{ padding: "2px 6px", fontSize: 10, lineHeight: 1, opacity: i === priority.length - 1 ? 0.3 : 1 }} disabled={i === priority.length - 1} onClick={() => movePriority(i, "down")} title="Move down">&#9660;</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section 4: Eligibility Pipeline (Campaign + Channel) */}
      {channels.length > 0 && (
        <div className="bui-box tier-selection-appear">

          {/* ── Campaign Eligibility Rules ── */}
          <div className="eligibility-stage" style={{ marginTop: 8 }}>
            <div className="eligibility-stage-header">
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Campaign Eligibility Rules</div>
                <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>Users who fail these rules are excluded from the estimation entirely.</div>
              </div>
            </div>

            <div className="rule-builder" style={{ marginTop: 12 }}>
              {rules.map((rule, idx) => (
                <div key={rule.id} className="rule-row">
                  {idx > 0 && (
                    <select className="form-select" style={{ width: 70, flex: "none" }} value={rule.connector} onChange={e => updateRule(rule.id, "connector", e.target.value)}>
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                    </select>
                  )}
                  <select className="form-select" value={rule.attribute} onChange={e => updateRule(rule.id, "attribute", e.target.value)}>
                    {RULE_ATTRIBUTES.map(a => (
                      <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                  <select className="form-select" style={{ width: 140, flex: "none" }} value={rule.operator} onChange={e => updateRule(rule.id, "operator", e.target.value)}>
                    {OPERATORS.map(op => <option key={op} value={op}>{op.replace(/_/g, " ")}</option>)}
                  </select>
                  <input className="form-input" style={{ width: 120, flex: "none" }} value={rule.value} onChange={e => updateRule(rule.id, "value", e.target.value)} placeholder="Value" />
                  <button className="rule-remove-btn" onClick={() => removeRule(rule.id)}>&times;</button>
                </div>
              ))}
            </div>
            <div style={{ position: "relative", marginTop: 12 }}>
              <button className="btn btn-secondary" onClick={() => setShowRuleMenu(!showRuleMenu)}>+ Add Rule</button>
              {showRuleMenu && (
                <div className="channel-rules-menu tier-selection-appear">
                  {RULE_ATTRIBUTES.map(a => (
                    <div key={a} className="channel-rules-menu-item" onClick={() => { addRule(a); setShowRuleMenu(false); }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{a.replace(/_/g, " ")}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {rules.length > 0 && (
              <div className="text-muted" style={{ marginTop: 8, fontSize: 12 }}>
                Preview: {rules.map((r, i) => `${i > 0 ? ` ${r.connector} ` : ""}${r.attribute.replace(/_/g, " ")} ${r.operator.replace(/_/g, " ")} ${r.value}`).join("")}
              </div>
            )}
          </div>

          {/* ── Channel Eligibility Rules ── */}
          <div className="eligibility-stage" style={{ marginTop: 16 }}>
            <div className="eligibility-stage-header">
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Channel Eligibility Rules</div>
                <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>Per-channel rules that determine which channels a qualified user can receive.</div>
              </div>
            </div>

            <ChannelEligibilityRules
              selectedChannels={channels}
              enabledRules={eligibilityRulesEnabled}
              onToggleRule={handleToggleEligibilityRule}
              experimentValues={experimentValues}
              onExperimentChange={handleExperimentChange}
              addedCustomRules={addedCustomRules}
              onAddCustomRule={handleAddCustomRule}
              onRemoveCustomRule={handleRemoveCustomRule}
            />
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="btn-group">
        <button
          className="btn btn-primary btn-lg"
          disabled={!canSave}
          onClick={handleSave}
        >
          Save Segment
        </button>
      </div>
    </div>
  );
}
