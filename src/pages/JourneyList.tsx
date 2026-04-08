import { useNavigate } from "react-router-dom";
import { mockJourneys } from "../data/mockData";
import { CHANNEL_ICONS } from "../types";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

export default function JourneyList() {
  const navigate = useNavigate();

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
                </div>
                <div className="list-card-subtitle">{j.description}</div>
                <div className="list-card-meta">
                  {j.channels.map(ch => (
                    <span key={ch} className="badge badge-outline">{CHANNEL_ICONS[ch]} {ch}</span>
                  ))}
                  <span className="badge badge-media">{j.steps.length} steps</span>
                  {j.audienceSize ? <span className="badge badge-media">{formatNum(j.audienceSize)} audience</span> : null}
                  {j.conversionRate ? <span className="badge badge-media">{j.conversionRate}% conversion</span> : null}
                  <span className="badge badge-media">Updated {j.updatedAt}</span>
                </div>

                {/* Mini Journey visualization */}
                <div className="journey-mini-viz">
                  {j.steps.map((step, i) => (
                    <span key={step.id} className="journey-mini-step-wrapper">
                      <span className={`journey-mini-step journey-mini-step--${step.type}`} title={step.label}>
                        {step.type === "trigger" ? "\u26A1" :
                         step.type === "email" ? "\u2709" :
                         step.type === "push" ? "\uD83D\uDD14" :
                         step.type === "sms" ? "\uD83D\uDCF1" :
                         step.type === "in_app" ? "\uD83D\uDCE8" :
                         step.type === "delay" ? "\u23F3" :
                         step.type === "condition" ? "\u2753" :
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
