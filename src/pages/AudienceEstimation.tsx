import { useState } from "react";
import { audienceEstimationData, mockEligibilityRules, channelOverlap } from "../data/mockData";
import { CHANNEL_ICONS, type MessageChannel, type OrchestrationMode } from "../types";

type DedupWindow = "12h" | "24h" | "48h" | "disabled";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

const MODE_LABELS: Record<string, string> = {
  best_channel: "Best Channel",
  multi_channel: "Multi-Channel",
  sequential: "Sequential Fallback",
};

const MODE_DESCRIPTIONS: Record<string, string> = {
  best_channel: "System picks one optimal channel per subscriber based on engagement scores. One message per person.",
  multi_channel: "All eligible channels fire simultaneously. Multiple messages per person, with dedup window to prevent fatigue.",
  sequential: "Primary channel fires first, fallback channels activate if no engagement within wait period.",
};

const CHANNEL_COLORS: Record<MessageChannel, string> = {
  email: "var(--color-email, #0071c2)",
  push: "var(--color-push, #7c3aed)",
  sms: "var(--color-sms, #059669)",
  whatsapp: "var(--color-whatsapp, #25d366)",
};

export default function AudienceEstimation() {
  const [mode, setMode] = useState<"best_channel" | "multi_channel" | "sequential">("best_channel");
  const [dedupWindow, setDedupWindow] = useState<DedupWindow>("24h");

  const data = audienceEstimationData;
  const modeData = data.orchestrationModes[mode];
  const dedupSavings = modeData.dedupImpact[dedupWindow];
  const effectiveSends = modeData.totalSends - dedupSavings;

  return (
    <div className="app-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1 className="page-title">Audience Estimation</h1>
          <p className="page-subtitle">Project reach across channels based on targeting rules, orchestration mode, and deduplication settings</p>
        </div>
      </div>

      {/* Orchestration Mode Selector */}
      <div className="estimation-mode-selector">
        {(["best_channel", "multi_channel", "sequential"] as const).map(m => (
          <button
            key={m}
            className={`estimation-mode-tab ${mode === m ? "estimation-mode-tab--active" : ""}`}
            onClick={() => setMode(m)}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>
      <div className="estimation-mode-description">
        {MODE_DESCRIPTIONS[mode]}
      </div>

      {/* KPI Summary */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Eligible Subscribers</div>
          <div className="kpi-value">{formatNum(data.baseEligible)}</div>
          <div className="kpi-sub">{data.targetingRulesApplied} targeting rules applied</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Unique Reach</div>
          <div className="kpi-value">{formatNum(modeData.uniqueReach)}</div>
          <div className="kpi-sub">{((modeData.uniqueReach / data.baseEligible) * 100).toFixed(1)}% of eligible</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Messages</div>
          <div className="kpi-value">{formatNum(effectiveSends)}</div>
          <div className="kpi-sub">across all channels</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Dedup Savings</div>
          <div className="kpi-value">{dedupSavings > 0 ? formatNum(dedupSavings) : "N/A"}</div>
          <div className="kpi-sub">{dedupSavings > 0 ? "duplicates prevented" : mode === "best_channel" ? "not applicable (1 msg/person)" : "dedup disabled"}</div>
        </div>
      </div>

      {/* Channel Reach Breakdown */}
      <div className="bui-box">
        <div className="section-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Predicted Channel Distribution</div>
            <div className="text-muted">How messages will be distributed across channels in {MODE_LABELS[mode]} mode</div>
          </div>
        </div>

        <div className="estimation-bar-container">
          <div className="estimation-stacked-bar">
            {(Object.entries(modeData.channelSplit) as [MessageChannel, number][]).map(([ch, pct]) => (
              <div
                key={ch}
                className="estimation-bar-segment"
                style={{ width: `${pct}%`, background: CHANNEL_COLORS[ch] }}
                title={`${ch}: ${pct}%`}
              />
            ))}
          </div>
          <div className="estimation-bar-legend">
            {(Object.entries(modeData.channelSplit) as [MessageChannel, number][]).map(([ch, pct]) => (
              <div key={ch} className="estimation-bar-legend-item">
                <span className="estimation-bar-legend-dot" style={{ background: CHANNEL_COLORS[ch] }} />
                <span>{CHANNEL_ICONS[ch]} {ch}</span>
                <strong>{pct}%</strong>
                <span className="text-muted">({formatNum(Math.round(effectiveSends * pct / 100))})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="estimation-channel-reach-grid">
          {(Object.entries(data.channelReachability) as [MessageChannel, { reachable: number; pct: number }][]).map(([ch, info]) => (
            <div key={ch} className="estimation-channel-reach-card">
              <div className="estimation-channel-reach-icon">{CHANNEL_ICONS[ch]}</div>
              <div className="estimation-channel-reach-name">{ch}</div>
              <div className="estimation-channel-reach-value">{formatNum(info.reachable)}</div>
              <div className="estimation-channel-reach-pct">{info.pct}% reachable</div>
            </div>
          ))}
        </div>
      </div>

      {/* Dedup Window Control */}
      {mode !== "best_channel" && (
        <div className="bui-box">
          <div className="section-header">
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Deduplication Window</div>
              <div className="text-muted">Prevent the same subscriber from receiving the same message on multiple channels within the window</div>
            </div>
          </div>
          <div className="estimation-dedup-selector">
            {data.dedupWindowOptions.map(opt => (
              <button
                key={opt.hours}
                className={`estimation-dedup-option ${dedupWindow === (opt.hours === 0 ? "disabled" : opt.hours + "h") ? "estimation-dedup-option--active" : ""}`}
                onClick={() => setDedupWindow(opt.hours === 0 ? "disabled" : (opt.hours + "h") as DedupWindow)}
              >
                <div className="estimation-dedup-option-label">{opt.label}</div>
                <div className="estimation-dedup-option-value">
                  {opt.savedSends > 0 ? `-${formatNum(opt.savedSends)} sends` : "No limit"}
                </div>
                {opt.savingsPct > 0 && (
                  <div className="estimation-dedup-option-pct">-{opt.savingsPct}%</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Targeting Rules */}
      <div className="bui-box">
        <div className="section-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Targeting Rules</div>
            <div className="text-muted">Eligibility criteria determining the base audience of {formatNum(data.baseEligible)} subscribers</div>
          </div>
        </div>
        <div className="estimation-rules-list">
          {mockEligibilityRules.map((rule, i) => (
            <div key={rule.id} className="estimation-rule-chip">
              <span className="estimation-rule-attr">{rule.attribute}</span>
              <span className="estimation-rule-op">{rule.operator.replace(/_/g, " ")}</span>
              <span className="estimation-rule-val">{Array.isArray(rule.value) ? rule.value.join(", ") : String(rule.value)}</span>
              {i < mockEligibilityRules.length - 1 && (
                <span className="estimation-rule-connector">{rule.connector}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Comparison: Old vs New */}
      <div className="bui-box">
        <div className="section-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Single-Channel vs Omni-Channel Estimation</div>
            <div className="text-muted">How the same audience estimate changes with omni-channel orchestration</div>
          </div>
        </div>
        <div className="estimation-comparison-grid">
          <div className="estimation-comparison-card estimation-comparison-card--old">
            <div className="estimation-comparison-badge">Single-Channel (Legacy)</div>
            <div className="estimation-comparison-value">{formatNum(data.singleChannelComparison.emailOnly.audience)}</div>
            <div className="estimation-comparison-label">will receive this email</div>
            <div className="estimation-comparison-details">
              <div>1 channel (email only)</div>
              <div>No cross-channel reach</div>
              <div>No deduplication needed</div>
              <div>No routing optimization</div>
            </div>
          </div>
          <div className="estimation-comparison-arrow">vs</div>
          <div className="estimation-comparison-card estimation-comparison-card--new">
            <div className="estimation-comparison-badge">Omni-Channel</div>
            <div className="estimation-comparison-value">{formatNum(data.singleChannelComparison.omniChannel.uniqueReach)}</div>
            <div className="estimation-comparison-label">unique reach across {data.singleChannelComparison.omniChannel.channels} channels</div>
            <div className="estimation-comparison-details">
              <div>{formatNum(data.singleChannelComparison.omniChannel.totalSends)} total messages</div>
              <div>{formatNum(data.singleChannelComparison.omniChannel.dedupSavings)} dedup savings</div>
              <div>+{data.singleChannelComparison.omniChannel.reachIncrease}% reach increase</div>
              <div>Intelligent channel routing</div>
            </div>
          </div>
        </div>
      </div>

      {/* Reachability Tiers */}
      <div className="bui-box">
        <div className="section-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Reachability Tier Breakdown</div>
            <div className="text-muted">How the audience distributes across channel reachability tiers</div>
          </div>
        </div>
        <div className="reachability-grid">
          {channelOverlap.reachabilityTiers.map(t => (
            <div key={t.channels} className="reachability-card">
              <div className="reachability-channels">{t.channels}</div>
              <div className="reachability-label">channel{t.channels > 1 ? "s" : ""}</div>
              <div className="reachability-pct">{t.pct}%</div>
              <div className="reachability-engagement">{formatNum(t.subscribers)}</div>
              <div style={{ marginTop: 8 }}>
                <div style={{ height: 4, background: "var(--color-gray-100)", borderRadius: 2 }}>
                  <div style={{ height: 4, width: `${t.avgEngagement}%`, background: t.channels >= 3 ? "var(--color-green-600)" : "var(--color-blue-500)", borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 10, color: "var(--color-gray-500)", marginTop: 2 }}>{t.avgEngagement}% avg engagement</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
