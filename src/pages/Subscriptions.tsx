import { CHANNEL_ICONS, CHANNEL_LABELS, type MessageChannel } from "../types";
import { mockSubscriptionCategories, consentGapAnalysis, mockSubscriberProfiles } from "../data/mockData";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

const ALL_CHANNELS: MessageChannel[] = ["email", "push", "sms", "whatsapp"];

export default function Subscriptions() {
  const totalSubs = mockSubscriptionCategories.reduce((s, c) => s + c.totalSubscribers, 0);
  const avgOptIn = mockSubscriptionCategories.reduce((s, c) => s + c.optInRate, 0) / mockSubscriptionCategories.length;

  return (
    <div className="app-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1 className="page-title">Subscriptions & Consent</h1>
          <p className="page-subtitle">Janet subscription categories, cross-channel consent, and subscriber management</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="kpi-card">
          <div className="kpi-label">Categories</div>
          <div className="kpi-value">{mockSubscriptionCategories.length}</div>
          <div className="kpi-sub">subscription categories</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Avg Opt-In Rate</div>
          <div className="kpi-value">{avgOptIn.toFixed(1)}%</div>
          <div className="kpi-sub">across all categories</div>
        </div>
        <div className="omni-kpi-card">
          <div className="kpi-label">Full Consent (All Channels)</div>
          <div className="kpi-value">{consentGapAnalysis.allChannels.pct}%</div>
          <div className="kpi-sub">{formatNum(consentGapAnalysis.allChannels.subscribers)} subscribers</div>
        </div>
        <div className="omni-kpi-card">
          <div className="kpi-label">No Consent</div>
          <div className="kpi-value">{consentGapAnalysis.noConsent.pct}%</div>
          <div className="kpi-sub">{formatNum(consentGapAnalysis.noConsent.subscribers)} subscribers</div>
        </div>
      </div>

      {/* Cross-Channel Consent Matrix */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Cross-Channel Consent Matrix</div>
        <p className="text-muted mb-16">Which subscription categories are available on which channels (Janet API)</p>
        <table className="consent-matrix">
          <thead>
            <tr>
              <th>Category</th>
              {ALL_CHANNELS.map(ch => (
                <th key={ch}>{CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}</th>
              ))}
              <th>Opt-In %</th>
              <th>Subscribers</th>
            </tr>
          </thead>
          <tbody>
            {mockSubscriptionCategories.map(cat => (
              <tr key={cat.id}>
                <td>
                  <div>{cat.name}</div>
                  <div className="text-muted" style={{ fontSize: 11 }}>{cat.description}</div>
                </td>
                {ALL_CHANNELS.map(ch => (
                  <td key={ch}>
                    <span className={`consent-cell consent-cell--${cat.channels.includes(ch) ? "yes" : "no"}`}>
                      {cat.channels.includes(ch) ? "\u2713" : "\u2715"}
                    </span>
                  </td>
                ))}
                <td style={{ fontWeight: 700 }}>{cat.optInRate}%</td>
                <td>{formatNum(cat.totalSubscribers)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Consent Gap Analysis */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Consent Gap Analysis</div>
        <p className="text-muted mb-16">Where subscribers have consented on some channels but not others — reachability opportunity</p>

        {/* Visual bar */}
        <div style={{ marginBottom: 16 }}>
          <div className="consent-gap-bar">
            <div className="consent-gap-segment" style={{ width: `${consentGapAnalysis.emailOnly.pct}%`, background: "var(--color-email)" }}>
              {consentGapAnalysis.emailOnly.pct}%
            </div>
            <div className="consent-gap-segment" style={{ width: `${consentGapAnalysis.pushOnly.pct}%`, background: "var(--color-push)" }}>
              {consentGapAnalysis.pushOnly.pct}%
            </div>
            <div className="consent-gap-segment" style={{ width: `${consentGapAnalysis.emailAndPush.pct}%`, background: "var(--color-blue-500)" }}>
              {consentGapAnalysis.emailAndPush.pct}%
            </div>
            <div className="consent-gap-segment" style={{ width: `${consentGapAnalysis.allChannels.pct}%`, background: "var(--color-green-600)" }}>
              {consentGapAnalysis.allChannels.pct}%
            </div>
            <div className="consent-gap-segment" style={{ width: `${consentGapAnalysis.noConsent.pct}%`, background: "var(--color-gray-300)" }}>
              {consentGapAnalysis.noConsent.pct}%
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11, color: "var(--color-gray-500)" }}>
            <span><span className="dot dot--email" /> Email only</span>
            <span><span className="dot dot--push" /> Push only</span>
            <span><span className="dot" style={{ background: "var(--color-blue-500)" }} /> Email + Push</span>
            <span><span className="dot" style={{ background: "var(--color-green-600)" }} /> All channels</span>
            <span><span className="dot" style={{ background: "var(--color-gray-300)" }} /> No consent</span>
          </div>
        </div>

        {/* Gap detail table */}
        <table className="data-table">
          <thead>
            <tr>
              <th>Consent Tier</th>
              <th style={{ textAlign: "right" }}>Subscribers</th>
              <th style={{ textAlign: "right" }}>% of Total</th>
              <th>Missing Channels</th>
              <th>Opportunity</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>{CHANNEL_ICONS.email} Email Only</strong></td>
              <td style={{ textAlign: "right" }}>{formatNum(consentGapAnalysis.emailOnly.subscribers)}</td>
              <td style={{ textAlign: "right" }}>{consentGapAnalysis.emailOnly.pct}%</td>
              <td>
                <span className="badge badge-callout" style={{ fontSize: 10 }}>{consentGapAnalysis.emailOnly.missingPush}% missing Push</span>
                <span className="badge badge-callout" style={{ fontSize: 10, marginLeft: 4 }}>{consentGapAnalysis.emailOnly.missingSms}% missing SMS</span>
              </td>
              <td><span className="badge badge-brand" style={{ fontSize: 10 }}>In-app push opt-in prompt</span></td>
            </tr>
            <tr>
              <td><strong>{CHANNEL_ICONS.push} Push Only</strong></td>
              <td style={{ textAlign: "right" }}>{formatNum(consentGapAnalysis.pushOnly.subscribers)}</td>
              <td style={{ textAlign: "right" }}>{consentGapAnalysis.pushOnly.pct}%</td>
              <td>
                <span className="badge badge-callout" style={{ fontSize: 10 }}>{consentGapAnalysis.pushOnly.missingEmail}% missing Email</span>
                <span className="badge badge-callout" style={{ fontSize: 10, marginLeft: 4 }}>{consentGapAnalysis.pushOnly.missingSms}% missing SMS</span>
              </td>
              <td><span className="badge badge-brand" style={{ fontSize: 10 }}>Email preference center CTA</span></td>
            </tr>
            <tr>
              <td><strong>{CHANNEL_ICONS.email} Email + {CHANNEL_ICONS.push} Push</strong></td>
              <td style={{ textAlign: "right" }}>{formatNum(consentGapAnalysis.emailAndPush.subscribers)}</td>
              <td style={{ textAlign: "right" }}>{consentGapAnalysis.emailAndPush.pct}%</td>
              <td>
                <span className="badge badge-callout" style={{ fontSize: 10 }}>{consentGapAnalysis.emailAndPush.missingSms}% missing SMS</span>
                <span className="badge badge-callout" style={{ fontSize: 10, marginLeft: 4 }}>{consentGapAnalysis.emailAndPush.missingInApp}% missing WhatsApp</span>
              </td>
              <td><span className="badge badge-brand" style={{ fontSize: 10 }}>SMS opt-in during booking</span></td>
            </tr>
            <tr style={{ background: "var(--color-green-100)" }}>
              <td><strong>All 4 Channels</strong></td>
              <td style={{ textAlign: "right" }}>{formatNum(consentGapAnalysis.allChannels.subscribers)}</td>
              <td style={{ textAlign: "right" }}>{consentGapAnalysis.allChannels.pct}%</td>
              <td><span className="badge badge-constructive" style={{ fontSize: 10 }}>No gaps</span></td>
              <td><span className="badge badge-constructive" style={{ fontSize: 10 }}>Full omni-channel reach</span></td>
            </tr>
            <tr style={{ background: "var(--color-red-100)" }}>
              <td><strong>No Consent</strong></td>
              <td style={{ textAlign: "right" }}>{formatNum(consentGapAnalysis.noConsent.subscribers)}</td>
              <td style={{ textAlign: "right" }}>{consentGapAnalysis.noConsent.pct}%</td>
              <td><span className="badge badge-destructive" style={{ fontSize: 10 }}>All channels missing</span></td>
              <td><span className="badge badge-destructive" style={{ fontSize: 10 }}>Re-consent campaign needed</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Subscriber Lookup */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Subscriber Profile Lookup</div>
        <p className="text-muted mb-16">View a subscriber's omni-channel consent status, engagement, and deduplication history</p>
        <div className="subscriber-grid">
          {mockSubscriberProfiles.map(sub => (
            <div key={sub.id} className="subscriber-card">
              <div className="subscriber-card-header">
                <div className="subscriber-avatar">{sub.name.charAt(0)}</div>
                <div>
                  <div className="subscriber-name">{sub.name}</div>
                  <div className="subscriber-preferred">
                    {sub.reachableChannels} channels &middot; Preferred: {CHANNEL_ICONS[sub.preferredChannel]} {CHANNEL_LABELS[sub.preferredChannel]}
                  </div>
                </div>
              </div>
              <div className="subscriber-channels">
                {sub.channels.map(ch => (
                  <div key={ch.channel} className="subscriber-channel-row">
                    <span className="subscriber-channel-icon">{CHANNEL_ICONS[ch.channel]}</span>
                    <span className="subscriber-channel-name">{ch.channel === "whatsapp" ? "WhatsApp" : ch.channel.charAt(0).toUpperCase() + ch.channel.slice(1)}</span>
                    {ch.optedIn ? (
                      <>
                        <span className="badge badge-constructive" style={{ fontSize: 9, padding: "0 4px" }}>Opted In</span>
                        <div className="subscriber-engagement-bar">
                          <div className="subscriber-engagement-fill" style={{
                            width: `${ch.engagementScore}%`,
                            background: ch.engagementScore > 80 ? "var(--color-green-600)" : ch.engagementScore > 50 ? "var(--color-blue-500)" : "var(--callout-300)",
                          }} />
                        </div>
                        <span className="subscriber-engagement-score">{ch.engagementScore}</span>
                      </>
                    ) : (
                      <span className="badge badge-stopped" style={{ fontSize: 9, padding: "0 4px" }}>Opted Out</span>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: "var(--color-gray-500)" }}>
                {sub.deduplicatedCount} messages deduplicated in last 7 days
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-Time Consent Sync */}
      <div className="bui-box">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Real-Time Consent Sync Status</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Janet API Endpoint</th>
              <th style={{ textAlign: "center" }}>Sync Status</th>
              <th style={{ textAlign: "right" }}>Latency</th>
              <th style={{ textAlign: "right" }}>Last Sync</th>
            </tr>
          </thead>
          <tbody>
            {([
              { ch: "email" as MessageChannel, endpoint: "b-janet-subscription-api/email", status: "healthy", latency: "12ms", lastSync: "< 1 min" },
              { ch: "push" as MessageChannel, endpoint: "b-janet-subscription-api/device", status: "healthy", latency: "8ms", lastSync: "< 1 min" },
              { ch: "sms" as MessageChannel, endpoint: "b-janet-subscription-api/phone", status: "healthy", latency: "15ms", lastSync: "< 1 min" },
              { ch: "whatsapp" as MessageChannel, endpoint: "neeti-opt-in-service/preferences", status: "degraded", latency: "245ms", lastSync: "5 min" },
            ]).map(row => (
              <tr key={row.ch}>
                <td><strong>{CHANNEL_ICONS[row.ch]} {CHANNEL_LABELS[row.ch]}</strong></td>
                <td><code style={{ fontSize: 12, background: "var(--color-gray-50)", padding: "1px 4px", borderRadius: 3 }}>{row.endpoint}</code></td>
                <td style={{ textAlign: "center" }}>
                  <span className={`badge ${row.status === "healthy" ? "badge-constructive" : "badge-callout"}`}>{row.status}</span>
                </td>
                <td style={{ textAlign: "right" }}>{row.latency}</td>
                <td style={{ textAlign: "right" }}>{row.lastSync}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
