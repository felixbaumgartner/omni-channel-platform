import type { Campaign, Journey, UnifiedCampaignGroup, SubscriberProfile, EligibilityRule, MessageChannel } from "../types";

/* ── Rule-Based Routing Rules & Default Channel Order ── */

export interface PreferenceRule {
  id: number;
  name: string;
  description: string;
  logic: string;
  priority: number;
  active: boolean;
}

export const defaultHeuristicRules: PreferenceRule[] = [
  { id: 1, name: "Last Engaged Channel", description: "Route to the channel the subscriber last engaged with (opened/clicked) within the last 30 days", logic: "last_engagement_channel(30d)", priority: 1, active: true },
];

export const DEFAULT_CHANNEL_ORDER: MessageChannel[] = ["email", "push", "sms", "whatsapp"];

/* ── Mock Campaigns ── */

export const mockCampaigns: Campaign[] = [
  {
    id: 1001, name: "booking_confirmation_email",
    description: "Sends booking confirmation when a new reservation is created",
    channels: ["email"], status: "Live", type: "transactional",
    pipeline: "Transactional Priority",
    createdAt: "8 Mar 2026", updatedAt: "8 Mar 2026", updatedBy: "trip-comms",
    deliveryCount: 2450000, openRate: 92.3, clickRate: 45.1,
  },
  {
    id: 1002, name: "otp_verification_sms",
    description: "OTP verification code via SMS",
    channels: ["sms"], status: "Live", type: "transactional",
    pipeline: "Transactional Priority",
    createdAt: "7 Mar 2026", updatedAt: "7 Mar 2026", updatedBy: "identity-team",
    deliveryCount: 890000, openRate: 99.1, clickRate: 0,
  },
  {
    id: 1003, name: "summer_deals_omnichannel",
    description: "Summer promotional deals across email, push, and SMS",
    channels: ["email", "push", "sms"], status: "Published", type: "marketing",
    pipeline: "Scheduled: Daily EMK",
    createdAt: "5 Mar 2026", updatedAt: "5 Mar 2026", updatedBy: "engage-team",
    deliveryCount: 5200000, openRate: 34.2, clickRate: 8.7,
    unifiedGroupId: "UCG-2026-001", funnel: "upper", vertical: "accommodation", orchestrationMode: "best_channel",
  },
  {
    id: 1004, name: "payment_receipt_email",
    description: "Payment receipt after successful payment",
    channels: ["email"], status: "Draft", type: "transactional",
    pipeline: "Transactional Priority",
    createdAt: "2 Mar 2026", updatedAt: "4 Mar 2026", updatedBy: "payments-team",
  },
  {
    id: 1005, name: "genius_promo_push_email",
    description: "Genius level promotional push + email campaign",
    channels: ["push", "email"], status: "Published", type: "marketing",
    pipeline: "Scheduled: Daily Notifications",
    createdAt: "3 Mar 2026", updatedAt: "3 Mar 2026", updatedBy: "genius-team",
    deliveryCount: 1800000, openRate: 28.5, clickRate: 6.2,
    unifiedGroupId: "UCG-2026-002", funnel: "retention", vertical: "accommodation", orchestrationMode: "multi_channel",
  },
  {
    id: 1006, name: "checkin_reminder_push",
    description: "Pre-arrival check-in reminder notification",
    channels: ["push"], status: "Live", type: "non_marketing",
    pipeline: "Trigger: checkin_reminder",
    createdAt: "6 Mar 2026", updatedAt: "6 Mar 2026", updatedBy: "trip-enrichment",
    deliveryCount: 980000, openRate: 56.3, clickRate: 22.1,
  },
  {
    id: 1007, name: "review_request_email",
    description: "Post-checkout review invitation email",
    channels: ["email"], status: "Draft", type: "non_marketing",
    pipeline: "Trigger: review_invite",
    createdAt: "4 Mar 2026", updatedAt: "4 Mar 2026", updatedBy: "ugc-team",
  },
  {
    id: 1008, name: "cart_abandonment_omni",
    description: "Cross-channel cart abandonment: push then email fallback",
    channels: ["push", "email", "whatsapp"], status: "Live", type: "marketing",
    pipeline: "Trigger: cart_abandon",
    createdAt: "10 Feb 2026", updatedAt: "5 Mar 2026", updatedBy: "convert-team",
    deliveryCount: 3100000, openRate: 41.8, clickRate: 12.3,
    unifiedGroupId: "UCG-2026-003", funnel: "lower", vertical: "accommodation", orchestrationMode: "sequential",
  },
  {
    id: 1009, name: "booking_modification_sms",
    description: "SMS alert when booking is modified",
    channels: ["sms", "push"], status: "Live", type: "transactional",
    pipeline: "Transactional Priority",
    createdAt: "1 Mar 2026", updatedAt: "2 Mar 2026", updatedBy: "trip-comms",
    deliveryCount: 410000, openRate: 97.8, clickRate: 0,
  },
  {
    id: 1010, name: "loyalty_upgrade_notification",
    description: "Cross-channel notification for Genius level upgrades",
    channels: ["email", "push", "whatsapp"], status: "Live", type: "non_marketing",
    pipeline: "Trigger: loyalty_status_change",
    createdAt: "28 Feb 2026", updatedAt: "1 Mar 2026", updatedBy: "loyalty-team",
    deliveryCount: 620000, openRate: 72.1, clickRate: 35.6,
    unifiedGroupId: "UCG-2026-004", funnel: "retention", vertical: "accommodation", orchestrationMode: "multi_channel",
  },
  {
    id: 1011, name: "price_alert_push",
    description: "Real-time price drop alerts for wishlisted properties",
    channels: ["push", "whatsapp"], status: "Live", type: "marketing",
    pipeline: "Trigger: price_change",
    createdAt: "25 Feb 2026", updatedAt: "4 Mar 2026", updatedBy: "pricing-team",
    deliveryCount: 1500000, openRate: 48.9, clickRate: 18.4,
  },
  {
    id: 1012, name: "security_alert_sms_email",
    description: "Security alerts for suspicious login activity",
    channels: ["sms", "email"], status: "Live", type: "transactional",
    pipeline: "Transactional Priority",
    createdAt: "20 Feb 2026", updatedAt: "28 Feb 2026", updatedBy: "security-team",
    deliveryCount: 125000, openRate: 95.2, clickRate: 42.8,
  },
];

/* ── Mock Journeys ── */

export const mockJourneys: Journey[] = [
  {
    id: 2001,
    name: "Post-Booking Welcome Journey",
    description: "Multi-channel welcome sequence after first booking",
    status: "Active",
    entryChannel: "email",
    channels: ["email", "push", "whatsapp"],
    steps: [
      { id: "s1", type: "trigger", label: "Booking Confirmed" },
      { id: "s2", type: "email", label: "Welcome Email", children: ["s3"] },
      { id: "s3", type: "delay", label: "Wait 2 hours", config: { duration: "2h" }, children: ["s4"] },
      { id: "s4", type: "push", label: "App Download Prompt", children: ["s5"] },
      { id: "s5", type: "delay", label: "Wait 1 day", config: { duration: "1d" }, children: ["s6"] },
      { id: "s6", type: "condition", label: "Opened Email?", children: ["s7", "s8"] },
      { id: "s7", type: "whatsapp", label: "Trip Checklist Card" },
      { id: "s8", type: "email", label: "Reminder: Complete Profile" },
    ],
    createdAt: "1 Mar 2026", updatedAt: "6 Mar 2026",
    audienceSize: 340000, conversionRate: 62.4,
    orchestrationType: "cross_channel", crossChannelHandoffs: 89000,
    channelEffectiveness: { email: 45, push: 35, sms: 0, whatsapp: 20 },
  },
  {
    id: 2002,
    name: "Cart Abandonment Recovery",
    description: "Push-first strategy with email fallback for abandoned carts",
    status: "Active",
    entryChannel: "push",
    channels: ["push", "email", "sms"],
    steps: [
      { id: "s1", type: "trigger", label: "Cart Abandoned (30min)" },
      { id: "s2", type: "push", label: "Reminder Push", children: ["s3"] },
      { id: "s3", type: "delay", label: "Wait 4 hours", config: { duration: "4h" }, children: ["s4"] },
      { id: "s4", type: "condition", label: "Clicked Push?", children: ["s5", "s6"] },
      { id: "s5", type: "condition", label: "Exit: Converted" },
      { id: "s6", type: "email", label: "Fallback Email with Deals" },
    ],
    createdAt: "15 Feb 2026", updatedAt: "5 Mar 2026",
    audienceSize: 890000, conversionRate: 18.7,
    orchestrationType: "omni_channel", crossChannelHandoffs: 234000,
    channelEffectiveness: { email: 30, push: 50, sms: 10, whatsapp: 10 },
  },
  {
    id: 2003,
    name: "Pre-Trip Communication Sequence",
    description: "Countdown communications before check-in date",
    status: "Active",
    entryChannel: "push",
    channels: ["push", "email", "sms"],
    steps: [
      { id: "s1", type: "trigger", label: "7 Days Before Check-in" },
      { id: "s2", type: "email", label: "Trip Preparation Guide", children: ["s3"] },
      { id: "s3", type: "delay", label: "Wait 3 days", config: { duration: "3d" }, children: ["s4"] },
      { id: "s4", type: "push", label: "Explore Local Activities", children: ["s5"] },
      { id: "s5", type: "delay", label: "Wait 3 days", config: { duration: "3d" }, children: ["s6"] },
      { id: "s6", type: "sms", label: "Check-in Details SMS" },
    ],
    createdAt: "20 Feb 2026", updatedAt: "3 Mar 2026",
    audienceSize: 540000, conversionRate: 45.2,
    orchestrationType: "cross_channel", crossChannelHandoffs: 67000,
    channelEffectiveness: { email: 40, push: 30, sms: 30, whatsapp: 0 },
  },
  {
    id: 2004,
    name: "Genius Level Upgrade Celebration",
    description: "Cross-channel celebration when user reaches new Genius level",
    status: "Draft",
    entryChannel: "email",
    channels: ["email", "push", "whatsapp"],
    steps: [
      { id: "s1", type: "trigger", label: "Genius Level Changed" },
      { id: "s2", type: "email", label: "Congratulations Email", children: ["s3"] },
      { id: "s3", type: "push", label: "Badge Unlocked Push", children: ["s4"] },
      { id: "s4", type: "whatsapp", label: "WhatsApp Celebration Banner" },
    ],
    createdAt: "8 Mar 2026", updatedAt: "8 Mar 2026",
    audienceSize: 0, conversionRate: 0,
    orchestrationType: "single_channel",
  },
];

/* ── Channel Analytics ── */

export interface ChannelMetrics {
  channel: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export const channelMetrics: ChannelMetrics[] = [
  { channel: "Email", sent: 12400000, delivered: 11900000, opened: 4280000, clicked: 1190000, bounced: 500000, deliveryRate: 95.9, openRate: 36.0, clickRate: 10.0, bounceRate: 4.1 },
  { channel: "Push", sent: 8900000, delivered: 8500000, opened: 3740000, clicked: 1020000, bounced: 400000, deliveryRate: 95.5, openRate: 44.0, clickRate: 12.0, bounceRate: 4.5 },
  { channel: "SMS", sent: 3200000, delivered: 3100000, opened: 2976000, clicked: 0, bounced: 100000, deliveryRate: 96.9, openRate: 96.0, clickRate: 0, bounceRate: 3.1 },
  { channel: "WhatsApp", sent: 2100000, delivered: 2100000, opened: 1470000, clicked: 630000, bounced: 0, deliveryRate: 100.0, openRate: 70.0, clickRate: 30.0, bounceRate: 0 },
];

export interface DailyMetric {
  date: string;
  email: number;
  push: number;
  sms: number;
  whatsapp: number;
}

export const dailySends: DailyMetric[] = [
  { date: "Mar 1", email: 420000, push: 310000, sms: 95000, whatsapp: 78000 },
  { date: "Mar 2", email: 380000, push: 290000, sms: 102000, whatsapp: 65000 },
  { date: "Mar 3", email: 510000, push: 380000, sms: 88000, whatsapp: 92000 },
  { date: "Mar 4", email: 460000, push: 340000, sms: 110000, whatsapp: 71000 },
  { date: "Mar 5", email: 550000, push: 410000, sms: 97000, whatsapp: 85000 },
  { date: "Mar 6", email: 490000, push: 360000, sms: 105000, whatsapp: 88000 },
  { date: "Mar 7", email: 530000, push: 395000, sms: 92000, whatsapp: 79000 },
];

/* ── Unified Campaign Groups ── */

export const mockUnifiedGroups: UnifiedCampaignGroup[] = [
  {
    id: "UCG-2026-001", name: "Summer Deals Omni-Channel",
    description: "Cross-channel summer promotional campaign with intelligent routing",
    orchestrationMode: "best_channel",
    channels: ["email", "push", "sms"],
    channelDeliveries: [
      { channel: "email", contentId: 5501, messageCategory: "deal_discovery", status: "active", campaignId: 1003 },
      { channel: "push", contentId: 5502, messageCategory: "travel_ideas", status: "active", campaignId: 1003 },
      { channel: "sms", contentId: 5503, messageCategory: "genius_offers", status: "active", campaignId: 1003 },
    ],
    deduplicationEnabled: true, deduplicationWindowHours: 24,
    totalReach: 5200000, uniqueReach: 4560000,
    aggregateOpenRate: 34.2, aggregateClickRate: 8.7,
    status: "Published", type: "marketing",
  },
  {
    id: "UCG-2026-002", name: "Genius Level Promotion",
    description: "Targeted push + email for Genius members",
    orchestrationMode: "multi_channel",
    channels: ["push", "email"],
    channelDeliveries: [
      { channel: "push", contentId: 5504, messageCategory: "loyalty", status: "active", campaignId: 1005 },
      { channel: "email", contentId: 5505, messageCategory: "genius_programme", status: "active", campaignId: 1005 },
    ],
    deduplicationEnabled: true, deduplicationWindowHours: 48,
    totalReach: 1800000, uniqueReach: 1620000,
    aggregateOpenRate: 28.5, aggregateClickRate: 6.2,
    status: "Published", type: "marketing",
  },
  {
    id: "UCG-2026-003", name: "Cart Abandonment Recovery",
    description: "Sequential cross-channel recovery: push first, email fallback, WhatsApp reminder",
    orchestrationMode: "sequential",
    channels: ["push", "email", "whatsapp"],
    channelDeliveries: [
      { channel: "push", contentId: 5506, messageCategory: "price_alerts", status: "active", campaignId: 1008 },
      { channel: "email", contentId: 5507, messageCategory: "deal_discovery", status: "active", campaignId: 1008 },
      { channel: "whatsapp", contentId: 5508, messageCategory: "offers", status: "active", campaignId: 1008 },
    ],
    deduplicationEnabled: true, deduplicationWindowHours: 12,
    totalReach: 3100000, uniqueReach: 2480000,
    aggregateOpenRate: 41.8, aggregateClickRate: 12.3,
    status: "Live", type: "marketing",
  },
  {
    id: "UCG-2026-004", name: "Loyalty Upgrade Notification",
    description: "Cross-channel Genius level upgrade celebration",
    orchestrationMode: "multi_channel",
    channels: ["email", "push", "whatsapp"],
    channelDeliveries: [
      { channel: "email", contentId: 5509, messageCategory: "genius_programme", status: "active", campaignId: 1010 },
      { channel: "push", contentId: 5510, messageCategory: "loyalty", status: "active", campaignId: 1010 },
      { channel: "whatsapp", contentId: 5511, messageCategory: "loyalty", status: "active", campaignId: 1010 },
    ],
    deduplicationEnabled: false, deduplicationWindowHours: 0,
    totalReach: 620000, uniqueReach: 620000,
    aggregateOpenRate: 72.1, aggregateClickRate: 35.6,
    status: "Live", type: "non_marketing",
  },
];

/* ── Subscriber Profiles ── */

export const mockSubscriberProfiles: SubscriberProfile[] = [
  {
    id: "SUB-001", name: "Anna M. (DE)",
    preferredChannel: "email",
    channels: [
      { channel: "email", optedIn: true, lastEngaged: "2 hours ago", engagementScore: 92, openRate: 68.4 },
      { channel: "push", optedIn: true, lastEngaged: "1 day ago", engagementScore: 71, openRate: 45.2 },
      { channel: "sms", optedIn: false, lastEngaged: "never", engagementScore: 0, openRate: 0 },
      { channel: "whatsapp", optedIn: true, lastEngaged: "3 hours ago", engagementScore: 85, openRate: 72.1 },
    ],
    reachableChannels: 3, deduplicatedCount: 4,
  },
  {
    id: "SUB-002", name: "James T. (US)",
    preferredChannel: "push",
    channels: [
      { channel: "email", optedIn: true, lastEngaged: "3 days ago", engagementScore: 45, openRate: 22.1 },
      { channel: "push", optedIn: true, lastEngaged: "30 min ago", engagementScore: 96, openRate: 78.3 },
      { channel: "sms", optedIn: true, lastEngaged: "5 days ago", engagementScore: 38, openRate: 95.0 },
      { channel: "whatsapp", optedIn: true, lastEngaged: "1 hour ago", engagementScore: 88, openRate: 65.7 },
    ],
    reachableChannels: 4, deduplicatedCount: 7,
  },
  {
    id: "SUB-003", name: "Yuki S. (JP)",
    preferredChannel: "whatsapp",
    channels: [
      { channel: "email", optedIn: true, lastEngaged: "1 week ago", engagementScore: 28, openRate: 12.5 },
      { channel: "push", optedIn: false, lastEngaged: "never", engagementScore: 0, openRate: 0 },
      { channel: "sms", optedIn: false, lastEngaged: "never", engagementScore: 0, openRate: 0 },
      { channel: "whatsapp", optedIn: true, lastEngaged: "15 min ago", engagementScore: 98, openRate: 91.2 },
    ],
    reachableChannels: 2, deduplicatedCount: 2,
  },
  {
    id: "SUB-004", name: "Carlos R. (BR)",
    preferredChannel: "sms",
    channels: [
      { channel: "email", optedIn: true, lastEngaged: "2 days ago", engagementScore: 55, openRate: 31.8 },
      { channel: "push", optedIn: true, lastEngaged: "1 day ago", engagementScore: 62, openRate: 42.0 },
      { channel: "sms", optedIn: true, lastEngaged: "4 hours ago", engagementScore: 89, openRate: 97.5 },
      { channel: "whatsapp", optedIn: false, lastEngaged: "never", engagementScore: 0, openRate: 0 },
    ],
    reachableChannels: 3, deduplicatedCount: 5,
  },
];

/* ── Eligibility Rules Examples ── */

export const mockEligibilityRules: EligibilityRule[] = [
  { id: "r1", attribute: "genius_level", operator: "greater_than", value: 1, connector: "AND" },
  { id: "r2", attribute: "country", operator: "in", value: ["US", "UK", "DE", "FR", "NL"], connector: "AND" },
  { id: "r3", attribute: "booking_count", operator: "greater_than", value: 2, connector: "AND" },
  { id: "r4", attribute: "days_since_last_booking", operator: "less_than", value: 90, connector: "OR" },
];

/* ── Omni-Channel KPI Data ── */

export const omniChannelKPIs = {
  unifiedGroupCount: 4,
  dedupRate: 12.4,
  bestChannelRouting: 34.2,
  multiChannelReachability: 78.6,
  dedupSavings: 3240000,
  routingLift: 18.3,
  crossChannelConversionLift: 24.7,
  channelCannibalizationRate: 6.2,
  frequencyCapViolationsPrevented: 3200000,
  channelFatigueScore: 2.1,
};

/* ── Channel Overlap Data ── */

export const channelOverlap = {
  emailOnly: 8.2,
  pushOnly: 5.4,
  smsOnly: 3.1,
  inAppOnly: 1.8,
  emailAndPush: 72.1,
  emailAndSms: 45.3,
  pushAndInApp: 58.7,
  allFour: 34.2,
  reachabilityTiers: [
    { channels: 1, subscribers: 2400000, pct: 18.3, avgEngagement: 22.1 },
    { channels: 2, subscribers: 4100000, pct: 31.3, avgEngagement: 38.5 },
    { channels: 3, subscribers: 4200000, pct: 32.1, avgEngagement: 52.8 },
    { channels: 4, subscribers: 2400000, pct: 18.3, avgEngagement: 71.4 },
  ],
};

/* ══════════════════════════════════════════════════════════════
   NEW: Message Triggers, Holdouts, Priority, No-Send, Subscriptions
   ══════════════════════════════════════════════════════════════ */

/* ── Message Triggers ── */

export interface MockTrigger {
  id: number;
  name: string;
  reportingLabel: string;
  status: "Live" | "Draft" | "Test" | "Archived";
  triggerType: "GENERAL" | "SESSION";
  channels: MessageChannel[];
  inputTopic: string;
  joiningWindowSec: number;
  delayMinutes: number;
  linkedCampaigns: number;
  dailyVolume: number;
  ruleExpression: string;
  omniChannelRouting: boolean;
  channelRoutingRules?: { channel: MessageChannel; condition: string }[];
}

export const mockTriggers: MockTrigger[] = [
  {
    id: 3001, name: "booking_confirmed_trigger", reportingLabel: "booking_conf_omni",
    status: "Live", triggerType: "GENERAL", channels: ["email"],
    inputTopic: "booking.state_change", joiningWindowSec: 300, delayMinutes: 0,
    linkedCampaigns: 3, dailyVolume: 420000,
    ruleExpression: "event.type == 'CONFIRMED' AND event.status == 'NEW'",
    omniChannelRouting: false,
  },
  {
    id: 3002, name: "cart_abandon_trigger", reportingLabel: "cart_abandon_omni",
    status: "Live", triggerType: "SESSION", channels: ["push", "email", "whatsapp"],
    inputTopic: "browsing.cart_events", joiningWindowSec: 1800, delayMinutes: 30,
    linkedCampaigns: 2, dailyVolume: 310000,
    ruleExpression: "event.type == 'CART_ABANDON' AND event.cart_value > 50",
    omniChannelRouting: true,
    channelRoutingRules: [
      { channel: "push", condition: "subscriber.has_app == true" },
      { channel: "email", condition: "fallback OR subscriber.has_app == false" },
      { channel: "whatsapp", condition: "subscriber.active_session == true" },
    ],
  },
  {
    id: 3003, name: "price_drop_alert", reportingLabel: "price_drop_push",
    status: "Live", triggerType: "GENERAL", channels: ["push"],
    inputTopic: "pricing.price_change", joiningWindowSec: 60, delayMinutes: 0,
    linkedCampaigns: 1, dailyVolume: 180000,
    ruleExpression: "event.price_delta_pct > 10 AND event.wishlisted == true",
    omniChannelRouting: false,
  },
  {
    id: 3004, name: "genius_level_change", reportingLabel: "genius_upgrade_omni",
    status: "Live", triggerType: "GENERAL", channels: ["email", "push", "whatsapp"],
    inputTopic: "loyalty.status_change", joiningWindowSec: 600, delayMinutes: 5,
    linkedCampaigns: 2, dailyVolume: 45000,
    ruleExpression: "event.new_level > event.old_level",
    omniChannelRouting: true,
    channelRoutingRules: [
      { channel: "email", condition: "always" },
      { channel: "push", condition: "subscriber.has_app == true" },
      { channel: "whatsapp", condition: "subscriber.has_app == true" },
    ],
  },
  {
    id: 3005, name: "checkin_reminder", reportingLabel: "checkin_reminder_push",
    status: "Draft", triggerType: "GENERAL", channels: ["push", "sms"],
    inputTopic: "trip.date_approaching", joiningWindowSec: 0, delayMinutes: 0,
    linkedCampaigns: 1, dailyVolume: 95000,
    ruleExpression: "event.days_until_checkin <= 1",
    omniChannelRouting: true,
    channelRoutingRules: [
      { channel: "push", condition: "subscriber.has_app == true" },
      { channel: "sms", condition: "subscriber.has_app == false OR market.sms_primary == true" },
    ],
  },
];

/* ── Holdout Groups ── */

export interface MockHoldout {
  id: number;
  name: string;
  description: string;
  purpose: "marketing" | "test";
  status: "Live" | "Draft" | "Archived";
  channels: MessageChannel[];
  funnels: string[];
  verticals: string[];
  hashRange: { start: number; end: number };
  salt: string;
  matchedCampaigns: number;
  subscribersHeldOut: number;
  crossChannelCoordinated: boolean;
  perChannelRanges?: Record<string, { start: number; end: number }>;
}

export const mockHoldouts: MockHoldout[] = [
  {
    id: 4001, name: "global_marketing_holdout_5pct",
    description: "5% global marketing holdout across all channels for incrementality measurement",
    purpose: "marketing", status: "Live",
    channels: ["email", "push", "sms", "whatsapp"],
    funnels: ["pre_book", "post_book", "post_trip", "reactivation"],
    verticals: ["accommodation"],
    hashRange: { start: 0, end: 5 }, salt: "mktg_holdout_2026",
    matchedCampaigns: 42, subscribersHeldOut: 650000,
    crossChannelCoordinated: true,
    perChannelRanges: { email: { start: 0, end: 5 }, push: { start: 0, end: 5 }, sms: { start: 0, end: 5 }, whatsapp: { start: 0, end: 5 } },
  },
  {
    id: 4002, name: "email_incrementality_10pct",
    description: "10% email-only holdout for email channel incrementality testing",
    purpose: "test", status: "Live",
    channels: ["email"],
    funnels: ["pre_book", "reactivation"],
    verticals: ["accommodation", "flights"],
    hashRange: { start: 5, end: 15 }, salt: "email_incr_2026",
    matchedCampaigns: 18, subscribersHeldOut: 1300000,
    crossChannelCoordinated: false,
  },
  {
    id: 4003, name: "push_engagement_holdout",
    description: "3% push holdout for engagement lift measurement",
    purpose: "test", status: "Live",
    channels: ["push"],
    funnels: ["post_book"],
    verticals: ["accommodation"],
    hashRange: { start: 0, end: 3 }, salt: "push_eng_2026",
    matchedCampaigns: 8, subscribersHeldOut: 390000,
    crossChannelCoordinated: false,
  },
  {
    id: 4004, name: "omni_rewards_holdout",
    description: "Cross-channel rewards holdout — coordinated across email + push + WhatsApp",
    purpose: "marketing", status: "Draft",
    channels: ["email", "push", "whatsapp"],
    funnels: ["post_book", "post_trip"],
    verticals: ["accommodation"],
    hashRange: { start: 0, end: 8 }, salt: "omni_rewards_2026",
    matchedCampaigns: 0, subscribersHeldOut: 0,
    crossChannelCoordinated: true,
    perChannelRanges: { email: { start: 0, end: 8 }, push: { start: 0, end: 8 }, whatsapp: { start: 0, end: 8 } },
  },
];

/* ── Campaign Priority ── */

export interface MockCampaignPriority {
  campaignId: number;
  campaignName: string;
  channel: MessageChannel;
  pipeline: string;
  priority: number;
  type: "marketing" | "non_marketing" | "transactional";
  unifiedGroupId?: string;
}

export const mockCampaignPriorities: MockCampaignPriority[] = [
  { campaignId: 1001, campaignName: "booking_confirmation_email", channel: "email", pipeline: "Transactional Priority", priority: 100, type: "transactional" },
  { campaignId: 1012, campaignName: "security_alert_sms_email", channel: "email", pipeline: "Transactional Priority", priority: 99, type: "transactional" },
  { campaignId: 1002, campaignName: "otp_verification_sms", channel: "sms", pipeline: "Transactional Priority", priority: 100, type: "transactional" },
  { campaignId: 1003, campaignName: "summer_deals_omnichannel", channel: "email", pipeline: "Scheduled: Daily EMK", priority: 85, type: "marketing", unifiedGroupId: "UCG-2026-001" },
  { campaignId: 1003, campaignName: "summer_deals_omnichannel", channel: "push", pipeline: "Scheduled: Daily Notifications", priority: 80, type: "marketing", unifiedGroupId: "UCG-2026-001" },
  { campaignId: 1003, campaignName: "summer_deals_omnichannel", channel: "sms", pipeline: "Scheduled: Daily SMS", priority: 70, type: "marketing", unifiedGroupId: "UCG-2026-001" },
  { campaignId: 1008, campaignName: "cart_abandonment_omni", channel: "push", pipeline: "Trigger: cart_abandon", priority: 90, type: "marketing", unifiedGroupId: "UCG-2026-003" },
  { campaignId: 1008, campaignName: "cart_abandonment_omni", channel: "email", pipeline: "Trigger: cart_abandon", priority: 75, type: "marketing", unifiedGroupId: "UCG-2026-003" },
  { campaignId: 1005, campaignName: "genius_promo_push_email", channel: "push", pipeline: "Scheduled: Daily Notifications", priority: 82, type: "marketing", unifiedGroupId: "UCG-2026-002" },
  { campaignId: 1005, campaignName: "genius_promo_push_email", channel: "email", pipeline: "Scheduled: Daily EMK", priority: 78, type: "marketing", unifiedGroupId: "UCG-2026-002" },
  { campaignId: 1006, campaignName: "checkin_reminder_push", channel: "push", pipeline: "Trigger: checkin_reminder", priority: 88, type: "non_marketing" },
  { campaignId: 1011, campaignName: "price_alert_push", channel: "push", pipeline: "Trigger: price_change", priority: 72, type: "marketing" },
];

/* ── No-Send Reasons ── */

export interface MockNoSendReason {
  id: number;
  label: string;
  description: string;
  status: "ENABLED" | "DISABLED" | "ARCHIVED";
  channels: (MessageChannel | "all")[];
  purpose: "marketing" | "non_marketing" | "all";
  defaultApply: boolean;
  overridable: boolean;
  matchedCampaigns: number;
  suppressedLast7d: number;
  omniChannelBehavior: "suppress_all" | "suppress_channel" | "fallback_to_other";
  rules?: string;
}

export const mockNoSendReasons: MockNoSendReason[] = [
  {
    id: 5001, label: "frequency_cap_exceeded",
    description: "Subscriber has exceeded the daily/weekly message frequency cap for this channel",
    status: "ENABLED", channels: ["all"], purpose: "marketing",
    defaultApply: true, overridable: false, matchedCampaigns: 42, suppressedLast7d: 1240000,
    omniChannelBehavior: "fallback_to_other",
    rules: "subscriber.messages_received_24h > channel.daily_cap",
  },
  {
    id: 5002, label: "unsubscribed_category",
    description: "Subscriber has opted out of this message category via Janet subscription preferences",
    status: "ENABLED", channels: ["all"], purpose: "marketing",
    defaultApply: true, overridable: false, matchedCampaigns: 42, suppressedLast7d: 3800000,
    omniChannelBehavior: "suppress_channel",
    rules: "subscriber.subscription_status(category) == 'opted_out'",
  },
  {
    id: 5003, label: "recent_booking_suppression",
    description: "Suppress marketing messages within 48h of a booking to avoid confusion with transactional messages",
    status: "ENABLED", channels: ["email", "push"], purpose: "marketing",
    defaultApply: true, overridable: true, matchedCampaigns: 28, suppressedLast7d: 890000,
    omniChannelBehavior: "suppress_all",
    rules: "subscriber.hours_since_last_booking < 48",
  },
  {
    id: 5004, label: "channel_fatigue_crosschannel",
    description: "Subscriber received 5+ messages across all channels in last 24h — suppress non-transactional",
    status: "ENABLED", channels: ["all"], purpose: "marketing",
    defaultApply: true, overridable: false, matchedCampaigns: 42, suppressedLast7d: 560000,
    omniChannelBehavior: "suppress_all",
    rules: "subscriber.total_messages_all_channels_24h >= 5",
  },
  {
    id: 5005, label: "gdpr_consent_missing",
    description: "Subscriber has not provided GDPR marketing consent for this market",
    status: "ENABLED", channels: ["all"], purpose: "marketing",
    defaultApply: true, overridable: false, matchedCampaigns: 42, suppressedLast7d: 2100000,
    omniChannelBehavior: "suppress_all",
    rules: "subscriber.gdpr_consent(market) == false",
  },
  {
    id: 5006, label: "sms_market_restriction",
    description: "SMS marketing not permitted in subscriber's market due to local regulation",
    status: "ENABLED", channels: ["sms"], purpose: "all",
    defaultApply: true, overridable: false, matchedCampaigns: 12, suppressedLast7d: 420000,
    omniChannelBehavior: "fallback_to_other",
    rules: "market.sms_marketing_allowed == false",
  },
];

/* ── Subscription Categories ── */

export interface MockSubscriptionCategory {
  id: string;
  name: string;
  channels: MessageChannel[];
  optInRate: number;
  totalSubscribers: number;
  description: string;
}

export const mockSubscriptionCategories: MockSubscriptionCategory[] = [
  { id: "cat_deals", name: "Deals & Offers", channels: ["email", "push", "sms"], optInRate: 72.3, totalSubscribers: 9400000, description: "Promotional deals, discounts, and special offers" },
  { id: "cat_travel", name: "Travel Inspiration", channels: ["email", "push", "whatsapp"], optInRate: 65.1, totalSubscribers: 8500000, description: "Destination ideas, travel guides, and recommendations" },
  { id: "cat_genius", name: "Genius Programme", channels: ["email", "push", "whatsapp"], optInRate: 88.7, totalSubscribers: 5200000, description: "Genius level updates, rewards, and exclusive benefits" },
  { id: "cat_reviews", name: "Reviews & Ratings", channels: ["email", "push"], optInRate: 58.4, totalSubscribers: 7600000, description: "Post-stay review requests and community updates" },
  { id: "cat_price_alert", name: "Price Alerts", channels: ["push", "email", "sms"], optInRate: 45.2, totalSubscribers: 5900000, description: "Price drop notifications for wishlisted properties" },
  { id: "cat_trip_info", name: "Trip Information", channels: ["email", "push", "sms", "whatsapp"], optInRate: 94.1, totalSubscribers: 12300000, description: "Check-in reminders, trip updates, and local info" },
];

export const consentGapAnalysis = {
  emailOnly: { subscribers: 2100000, pct: 16.1, missingPush: 68, missingSms: 82 },
  pushOnly: { subscribers: 890000, pct: 6.8, missingEmail: 34, missingSms: 71 },
  emailAndPush: { subscribers: 7200000, pct: 55.1, missingSms: 52, missingInApp: 28 },
  allChannels: { subscribers: 2400000, pct: 18.4, gapNone: true },
  noConsent: { subscribers: 470000, pct: 3.6 },
};
