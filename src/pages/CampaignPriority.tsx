import { useState } from "react";
import { CHANNEL_ICONS, CHANNEL_LABELS } from "../types";
import { COMMUNICATION_CLASS_META, COMMUNICATION_CLASS_ORDER, mockCampaignPriorities, type CommunicationClass } from "../data/mockData";

const barColor = (cls: CommunicationClass) =>
  cls === "service" ? "var(--callout-300)" : "var(--color-blue-500)";
const rankClass = (cls: CommunicationClass) =>
  cls === "transactional" ? "critical" : cls === "service" ? "high" : "medium";

export default function CampaignPriority() {
  const [showLegacy, setShowLegacy] = useState(false);

  return (
    <div className="app-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1 className="page-title">Campaign Priority</h1>
          <p className="page-subtitle">When two communications target the same subscriber, the higher class wins, then the higher priority inside the class.</p>
        </div>
      </div>

      {/* Class bands */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {COMMUNICATION_CLASS_ORDER.map((cls, bandIndex) => {
          const meta = COMMUNICATION_CLASS_META[cls];
          const items = mockCampaignPriorities
            .filter(p => p.communicationClass === cls)
            .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
          return (
            <div key={cls} className="bui-box">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span className={`priority-rank priority-rank--${rankClass(cls)}`}>{bandIndex + 1}</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{meta.label}</span>
                {meta.locked && <span className="badge badge-constructive" style={{ fontSize: 10 }}>{"\uD83D\uDD12 Always sends"}</span>}
              </div>
              <p className="text-muted" style={{ fontSize: 12, marginBottom: 12 }}>{meta.description}</p>
              <div className="priority-stack">
                {items.map(p => (
                  <div key={p.campaignId} className="priority-row">
                    <div className={`priority-rank priority-rank--${rankClass(cls)}`}>{p.priority ?? "\u221E"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.campaignName}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{p.source}</div>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {p.channels.map(ch => (
                        <span key={ch} className="badge badge-outline" style={{ fontSize: 10 }} title={CHANNEL_LABELS[ch]}>
                          {CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}
                        </span>
                      ))}
                    </div>
                    <div className="priority-bar" style={{ width: 80 }}>
                      <div className="priority-bar-fill" style={{
                        width: `${p.priority ?? 100}%`,
                        background: meta.locked ? "var(--color-green-600, #1a7f37)" : barColor(cls),
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legacy comparison */}
      <div className="bui-box" style={{ marginTop: 24 }}>
        <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={() => setShowLegacy(v => !v)}>
          {showLegacy ? "Hide" : "Show"} how PROD orders this today
        </button>
        {showLegacy && (
          <div className="text-muted" style={{ marginTop: 12, fontSize: 12 }}>
            In PROD each channel pipeline keeps its own priority list, so the same campaign can hold a different number on email, push and SMS and two pipelines can resolve the same subscriber conflict differently. The class bands above replace those per-pipeline lists with one decision per communication.
          </div>
        )}
      </div>
    </div>
  );
}
