# Omni-Channel Messaging Platform

A targeting UI prototype demonstrating the evolution from Booking.com's channel-specific messaging system to a unified omni-channel platform. Built with React, TypeScript, and Vite.

**Live demo:** Deployed via Vercel on every push to `main`.

---

## What This Is

The PROD targeting UI ([marketingmessaging-tools](https://gitlab.com/booking-com/marketing/messaging/marketingmessaging-tools)) manages campaigns, journeys, triggers, holdouts, and subscriptions on a **per-channel** basis (one campaign = one channel). This prototype shows what changes when the platform becomes truly **omni-channel** — where a single campaign spans all channels, delivery is intelligently routed, and deduplication/attribution happen cross-channel.

Each page shows both the PROD-aligned baseline and the omni-channel enhancements layered on top.

---

## Pages (13 total)

### Overview
| Page | Route | Description |
|------|-------|-------------|
| **Dashboard** | `/dashboard` | Omni-channel intelligence KPIs, multi-channel campaigns, channel performance, daily send volume |

### Messaging
| Page | Route | Description |
|------|-------|-------------|
| **Campaigns** | `/campaigns` | One list of campaigns with channel chips, orchestration mode badges and expandable per-channel deliveries |
| **Campaign Create** | `/campaign/new` | Classification questionnaire, campaign metadata (funnel/vertical), eligibility rules builder, 3 delivery modes (Best Channel / Multi-Channel / Sequential Fallback), cross-channel dedup, compliance |
| **Transactional Create** | `/campaign/new/transactional` | SLA priority tiers (P0/P1/P2), transactional fallback chain with per-channel SLA, idempotency dedup |
| **Journeys** | `/journeys` | Orchestration type badges (Single/Cross-Channel/Omni), channel effectiveness bars, cross-channel handoff metrics |
| **Journey Builder** | `/journey/new` | Per-channel Send steps, Multi-Channel step (fan-out or Sequential Fallback, with follow-up rotation across steps), Decision Split, Wait; channel eligibility rules scoped to the channels in use. Entry Channel routing pool and Best Channel Send appear in Phase 2+ |
| **Message Triggers** | `/triggers` | Event-driven triggers with omni-channel routing flow visualization (Event → Rules → Channel Router → Channels) |

### Controls
| Page | Route | Description |
|------|-------|-------------|
| **Campaign Priority** | `/campaign-priority` | Communication-class priority bands (one priority per campaign, applied on every channel), cross-channel conflict resolution |
| **Holdout Management** | `/holdouts` | Cross-channel coordinated holdouts with synchronized hash ranges across channels |
| **No-Send Reasons** | `/no-send` | Suppression rules with omni-channel behavior: suppress-all, suppress-channel, or fallback-to-other |
| **Subscriptions** | `/subscriptions` | Janet consent matrix, consent gap analysis with opportunities, subscriber lookup, real-time API sync status |

### Intelligence
| Page | Route | Description |
|------|-------|-------------|
| **Channel Preferences** | `/channel-preferences` | ML/heuristic routing engine, subscriber profiles, dedup engine, frequency capping |
| **Analytics** | `/analytics` | Routing lift, channel overlap Venn diagram, multi-channel campaign performance, subscriber reachability tiers, cross-channel attribution |

---

## Key Omni-Channel Concepts

### One campaign, many channels
In PROD, "summer_deals" is 3 separate campaigns (email, push, SMS). With omni-channel it is one campaign that owns 3 channel deliveries, one priority, shared dedup, and aggregate metrics. There is no separate grouping object; the campaign is the unit.

### Delivery Modes
- **Best Channel** — System picks one optimal channel per subscriber using CDP signals + ML
- **Multi-Channel** — All channels fire simultaneously (consent enforced per-channel)
- **Sequential Fallback** — Channels are walked in priority order; the first channel the subscriber consents to and is reachable on receives the message. Exactly one message per subscriber, so nothing needs deduplicating. Configurable wait periods between hops are a Phase 2 follow-up, gated behind the tracking and no-send contract.

### Cross-Channel Deduplication
Prevents the same subscriber from receiving the same message on multiple channels. Configurable window (hours), strategy (content similarity, exact match, category match).

### Orchestration Types (Journeys)
- **Single Channel** — PROD current state
- **Cross-Channel** — Uses CrossChannelEligibility nodes for branching
- **Omni-Channel** — Uses Best Channel Send nodes for AI-routed delivery

### No-Send Behavior
Each suppression rule specifies what happens across the campaign when triggered:
- **Suppress All** — Block the entire campaign (GDPR, cross-channel fatigue)
- **Suppress Channel** — Block one channel only (unsubscribed category)
- **Fallback** — Redirect to next channel in priority (frequency cap, market restriction)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Router | React Router DOM 6 |
| Build | Vite 5 |
| Styling | Custom CSS (BUI-aligned design system) |
| State | React useState (no external state library) |
| Data | Mock data (no backend) |
| Deploy | Vercel (auto-deploy on push to `main`) |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (port 5182)
npm run dev

# Type check
npx tsc --noEmit

# Production build
npm run build

# Preview production build
npm run preview
```

---

## Project Structure

```
src/
├── App.tsx                              # Routes + sidebar navigation
├── types.ts                             # All TypeScript types & constants
├── styles.css                           # Global BUI-aligned stylesheet
├── main.tsx                             # Entry point
├── data/
│   └── mockData.ts                      # All mock data (campaigns, journeys, triggers, holdouts, etc.)
├── components/
│   ├── ClassificationQuestionnaire.tsx  # Message type classifier (marketing/non-marketing/transactional)
│   └── BaseContentSection.tsx           # Per-channel content management with channel-specific categories
└── pages/
    ├── Dashboard.tsx                    # Overview with omni-channel KPIs
    ├── CampaignList.tsx                 # Campaign list with per-channel deliveries
    ├── CampaignCreate.tsx               # Full campaign creation with metadata, rules, delivery modes
    ├── TransactionalCreate.tsx          # Transactional with SLA tiers + fallback chain
    ├── JourneyList.tsx                  # Journey list with orchestration badges
    ├── JourneyBuilder.tsx               # Visual builder with omni-channel step types
    ├── MessageTriggers.tsx              # Event-driven triggers with routing flow
    ├── CampaignPriority.tsx             # Priority ordering by communication class
    ├── HoldoutManagement.tsx            # Holdout groups with cross-channel coordination
    ├── NoSendReasons.tsx                # Suppression rules with omni-channel behavior
    ├── Subscriptions.tsx                # Consent matrix + gap analysis + subscriber lookup
    ├── ChannelPreferences.tsx           # Routing engine + subscriber profiles + dedup + freq caps
    └── Analytics.tsx                    # Analytics with channel overlap + attribution
```

---

## PROD System Reference

This prototype is informed by the production [marketingmessaging-tools](https://gitlab.com/booking-com/marketing/messaging/marketingmessaging-tools) targeting UI, which includes:

- **cm-content-builder** — Visual content editor (React, MobX, TailwindCSS)
- **Janeway** — Message decision engine (eligibility rules, subscription checks)
- **Janet** — Subscription management API (per-channel opt-in/opt-out)
- **mm-message-triggers** — Kafka Streams event-driven trigger service
- **cm-holdout-management** — Holdout group validation via Kafka
- **msgscheduler** — Core channel activation (BMessage + MM-Events)

The key architectural shift from PROD to omni-channel:
- PROD: 1 campaign = 1 channel, multi-channel at journey level only
- Omni: 1 campaign = N channel deliveries, intelligent routing at campaign level
