import { useNavigate } from "react-router-dom";
import { mockJourneys } from "../data/mockData";
import { CHANNEL_ICONS, type MessageChannel } from "../types";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

const ORCH_LABELS = {
  single_channel: "Single Channel",
  cross_channel: "Cross-Channel",
  omni_channel: "Omni-Channel",
} as const;

export default function JourneyList() {
  const navigate = useNavigate();

  const totalAudience = mockJourneys.reduce((s, j) => s + (j.audienceSize || 0), 0);
  const activeJourneys = mockJourneys.filter(j => j.status === "Active");
  const avgConversion = activeJourneys.length > 0
    ? activeJourneys.reduce((s, j) => s + (j.conversionRate || 0), 0) / activeJourneys.length
    : 0;
  const totalHandoffs = mockJourneys.reduce((s, j) => s + (j.crossChannelHandoffs || 0), 0);

  return (
    <div className="app-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1 className="page-title">Cross-Channel Journeys</h1>
          <p className="page-subtitle">Orchestrate multi-step, multi-channel messaging sequences</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => navigate("/journey/new")}>+ New Journey</button>
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="metrics-summary-bar">
        <div className="metrics-summary-item">
          <div className="metrics-summary-value">{activeJourneys.length}</div>
          <div className="metrics-summary-label">Active Journeys</div>
        </div>
        <div className="metrics-summary-item">
          <div className="metrics-summary-value">{formatNum(totalAudience)}</div>
          <div className="metrics-summary-label">Total Audience</div>
        </div>
        <div className="metrics-summary-item">
          <div className="metrics-summary-value">{avgConversion.toFixed(1)}%</div>
          <div className="metrics-summary-label">Avg Conversion</div>
        </div>
        <div className="metrics-summary-item">
          <div className="metrics-summary-value">{formatNum(totalHandoffs)}</div>
          <div className="metrics-summary-label">Cross-Channel Handoffs</div>
        </div>
      </div>

      <div className="results-card">
        <div className="results-header">
          <div className="results-count">{mockJourneys.length} Journeys</div>
        </div>
        <div className="results-list">
          {mockJourneys.map(j => (
            <div key={j.id} className="list-card">
              <div className="list-card-content">
                <div className="list-card-title">
                  <span>{j.name}</span>
                  <span className={`badge ${j.status === "Active" ? "badge-constructive" : j.status === "Draft" ? "badge-draft" : j.status === "Paused" ? "badge-callout" : "badge-archived"}`}>
                    {j.status}
                  </span>
                  {j.orchestrationType && (
                    <span className={`badge-journey-type badge-journey-type--${j.orchestrationType}`}>
                      {ORCH_LABELS[j.orchestrationType]}
                    </span>
                  )}
                </div>
                <div className="list-card-subtitle">{j.description}</div>
                <div className="list-card-meta">
                  {j.channels.map(ch => (
                    <span key={ch} className="badge badge-outline">{CHANNEL_ICONS[ch]} {ch}</span>
                  ))}
                  <span className="badge badge-media">{j.steps.length} steps</span>
                  {j.audienceSize ? <span className="badge badge-media">{formatNum(j.audienceSize)} audience</span> : null}
                  {j.conversionRate ? <span className="badge badge-media">{j.conversionRate}% conversion</span> : null}
                  {j.crossChannelHandoffs ? <span className="badge badge-dedup">{formatNum(j.crossChannelHandoffs)} handoffs</span> : null}
                  <span className="badge badge-media">Updated {j.updatedAt}</span>
                </div>

                {/* Channel Effectiveness */}
                {j.channelEffectiveness && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <span className="text-muted" style={{ fontSize: 11, flexShrink: 0 }}>Effectiveness:</span>
                    <div className="effectiveness-bars" style={{ flex: 1 }}>
                      {(Object.entries(j.channelEffectiveness) as [MessageChannel, number][])
                        .filter(([, v]) => v > 0)
                        .map(([ch, v]) => (
                          <div key={ch} className={`effectiveness-bar effectiveness-bar--${ch}`} style={{ width: `${v}%` }} title={`${CHANNEL_ICONS[ch]} ${ch}: ${v}%`} />
                        ))}
                    </div>
                    <div style={{ display: "flex", gap: 4, fontSize: 10, color: "var(--color-gray-500)" }}>
                      {(Object.entries(j.channelEffectiveness) as [MessageChannel, number][])
                        .filter(([, v]) => v > 0)
                        .map(([ch, v]) => (
                          <span key={ch}>{CHANNEL_ICONS[ch]}{v}%</span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Mini Journey visualization */}
                <div className="journey-mini-viz">
                  {j.steps.map((step, i) => (
                    <span key={step.id} className="journey-mini-step-wrapper">
                      <span className={`journey-mini-step journey-mini-step--${step.type}`} title={step.label}>
                        {step.type === "trigger" ? "\u26A1" :
                         step.type === "email" ? "\u2709" :
                         step.type === "push" ? "\uD83D\uDD14" :
                         step.type === "sms" ? "\uD83D\uDCF1" :
                         step.type === "whatsapp" ? "\uD83D\uDCE8" :
                         step.type === "delay" ? "\u23F3" :
                         step.type === "condition" ? "\u2753" :
                         step.type === "best_channel" ? "\u2728" :
                         step.type === "cross_channel_eligibility" ? "\uD83D\uDD00" :
                         "\u2194"}
                      </span>
                      {i < j.steps.length - 1 && <span className="journey-mini-arrow">&rarr;</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
