import { useNavigate } from "react-router-dom";
import { mockJourneys } from "../data/mockData";
import { CHANNEL_ICONS, type MessageChannel } from "../types";
import { usePhase } from "../context/PhaseContext";

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
  const { showBestChannel } = usePhase();

  return (
    <div className="app-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1 className="page-title">Journeys</h1>
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
                  {j.orchestrationType && (showBestChannel || j.orchestrationType !== "omni_channel") && (
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
