/* ────────────────────────────────────────────────────────────
   Types & Constants for the Omni-Channel Messaging Platform
   ──────────────────────────────────────────────────────────── */

export type MessageChannel = "email" | "push" | "sms" | "whatsapp";
export type MessageType = "marketing" | "non_marketing" | "transactional";
export type CampaignStatus = "Draft" | "Published" | "Live" | "Stopped" | "Archived";
export type JourneyStatus = "Draft" | "Active" | "Paused" | "Completed";

export const CHANNEL_LABELS: Record<MessageChannel, string> = {
  email: "Email",
  push: "Push Notification",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

export const CHANNEL_ICONS: Record<MessageChannel, string> = {
  email: "\u2709",
  push: "\uD83D\uDD14",
  sms: "\uD83D\uDCF1",
  whatsapp: "\uD83D\uDCE8",
};

export const TYPE_LABELS: Record<MessageType, string> = {
  marketing: "Marketing",
  non_marketing: "Non-marketing",
  transactional: "Transactional",
};

/* ── Classification Questionnaire ── */

export const PHASE1_QUESTIONS = {
  q1: "Is the purpose of this message to make a sale or promote products/services?",
  q2: "Does this message include ads, offers, or invitations to buy or join something?",
  q3: "Does this message only provide information about an existing booking or benefits the customer already has?",
  q4: "Is this message critical to the trip, such that its non-delivery would disrupt the journey or prevent Booking.com from providing the agreed service?",
};

export const PHASE2_QUESTIONS = {
  q5: "Is this message triggered by a specific customer action OR by a system/regulatory event that the customer must be informed about?",
  q6: "Would a reasonable customer expect to receive this message regardless of their marketing preferences?",
  q7: "Is the primary purpose of this message to provide operational or informational content (not to cross-sell, upsell, or re-engage)?",
  q8: "Does this message contain ANY promotional, cross-sell, or upsell content alongside its primary informational purpose?",
};

export const PHASE3_QUESTIONS = {
  q9: "Would non-delivery of this message prevent the customer from completing a required action (e.g., verifying identity via OTP, confirming a booking)?",
  q10: "Is delivery of this message required by law or regulation in any market (e.g., invoices, tax receipts, GDPR breach notifications)?",
};

/* ── Input Topics ── */

export type TopicCategory = "state_change" | "behavioral";

export interface InputTopicConfig {
  label: string;
  category: TopicCategory;
  description: string;
  channels: MessageChannel[];
  transactionalExamples?: string[];
}

export const INPUT_TOPICS: Record<string, InputTopicConfig> = {
  booking_events: {
    label: "Booking Events",
    category: "state_change",
    description: "Booking created, modified, cancelled",
    channels: ["email", "push", "sms"],
    transactionalExamples: ["Booking confirmation", "Modification confirmation", "Cancellation confirmation"],
  },
  payment_events: {
    label: "Payment Events",
    category: "state_change",
    description: "Payment succeeded, failed, refunded",
    channels: ["email", "push", "sms"],
    transactionalExamples: ["Payment receipt", "Payment failure notification", "Refund confirmation"],
  },
  identity_events: {
    label: "Identity & Security Events",
    category: "state_change",
    description: "OTP requested, password reset, account locked, suspicious login",
    channels: ["email", "sms", "push"],
    transactionalExamples: ["OTP / verification code", "Password reset link", "Security alert"],
  },
  invoice_events: {
    label: "Invoice & Legal Events",
    category: "state_change",
    description: "Invoice generated, GDPR breach detected, tax receipt issued",
    channels: ["email"],
    transactionalExamples: ["Invoice / tax receipt", "GDPR breach notification"],
  },
  account_events: {
    label: "Account Events",
    category: "state_change",
    description: "Account created, email/phone change requested, account verified",
    channels: ["email", "sms"],
    transactionalExamples: ["Account creation verification", "Email/phone change verification"],
  },
  browsing_events: {
    label: "Browsing Events",
    category: "behavioral",
    description: "Page views, search results, property views",
    channels: ["push", "email", "whatsapp"],
  },
  trip_reminder_events: {
    label: "Trip Reminder Events",
    category: "behavioral",
    description: "Check-in reminders, trip countdown, pre-arrival tips",
    channels: ["push", "email", "sms"],
  },
  engagement_events: {
    label: "Engagement Events",
    category: "behavioral",
    description: "Cart abandonment, wishlist updates, price alerts",
    channels: ["push", "email", "whatsapp"],
  },
  loyalty_events: {
    label: "Loyalty & Rewards Events",
    category: "behavioral",
    description: "Status changes, points earned, reward expiry",
    channels: ["push", "email", "whatsapp"],
  },
  review_events: {
    label: "Review Events",
    category: "behavioral",
    description: "Post-stay review requests, review reminders",
    channels: ["push", "email"],
  },
};

/* ── Omni-Channel Types ── */

export type OrchestrationMode = "best_channel" | "multi_channel";
export type Funnel = "upper" | "mid" | "lower" | "retention";
export type Vertical = "accommodation" | "flights" | "attractions" | "car_rental";

export const FUNNEL_LABELS: Record<Funnel, string> = {
  upper: "Upper Funnel", mid: "Mid Funnel", lower: "Lower Funnel", retention: "Retention",
};

export const VERTICAL_LABELS: Record<Vertical, string> = {
  accommodation: "Accommodation", flights: "Flights", attractions: "Attractions", car_rental: "Car Rental",
};

export const ORCHESTRATION_LABELS: Record<OrchestrationMode, string> = {
  best_channel: "Best Channel", multi_channel: "Multi-Channel",
};

/* ── Channel-Specific Message Categories (from PROD) ── */

export const EMAIL_CATEGORIES = [
  "deal_discovery", "upcoming_booking", "genius_programme", "post_stay",
  "account", "direct_mail", "incentives", "refer_a_friend", "product_announcement",
] as const;

export const PUSH_CATEGORIES = [
  "travel_ideas", "price_alerts", "booking_updates", "loyalty",
  "status_updates", "reviews", "direct_messages",
] as const;

export const SMS_CATEGORIES = [
  "verification", "booking_confirmation", "security", "trip_preparation",
  "genius_offers", "surveys", "travel_inspiration",
] as const;

export const WHATSAPP_CATEGORIES = [
  "trip_enrichment", "offers", "onboarding", "engagement", "loyalty",
] as const;

export const CHANNEL_CATEGORIES: Record<MessageChannel, readonly string[]> = {
  email: EMAIL_CATEGORIES,
  push: PUSH_CATEGORIES,
  sms: SMS_CATEGORIES,
  whatsapp: WHATSAPP_CATEGORIES,
};

/* ── Eligibility Rules ── */

export type RuleOperator = "equals" | "not_equals" | "greater_than" | "less_than" | "in" | "not_in" | "between";
export type RuleConnector = "AND" | "OR";

export interface EligibilityRule {
  id: string;
  attribute: string;
  operator: RuleOperator;
  value: string | number | string[];
  connector: RuleConnector;
}

export const RULE_ATTRIBUTES = [
  "genius_level", "country", "language", "booking_count",
  "days_since_last_booking", "device_type", "has_app_installed",
  "lifetime_value", "is_new_user", "preferred_currency",
] as const;

/* ── Unified Campaign Group ── */

export interface ChannelDelivery {
  channel: MessageChannel;
  contentId: number | null;
  messageCategory: string;
  status: "active" | "paused" | "no_send";
  campaignId: number;
}

export interface UnifiedCampaignGroup {
  id: string;
  name: string;
  description: string;
  orchestrationMode: OrchestrationMode;
  channels: MessageChannel[];
  channelDeliveries: ChannelDelivery[];
  deduplicationEnabled: boolean;
  deduplicationWindowHours: number;
  totalReach: number;
  uniqueReach: number;
  aggregateOpenRate: number;
  aggregateClickRate: number;
  status: CampaignStatus;
  type: MessageType;
}

/* ── Subscriber Profile ── */

export interface SubscriberChannelProfile {
  channel: MessageChannel;
  optedIn: boolean;
  lastEngaged: string;
  engagementScore: number;
  openRate: number;
}

export interface SubscriberProfile {
  id: string;
  name: string;
  preferredChannel: MessageChannel;
  channels: SubscriberChannelProfile[];
  reachableChannels: number;
  deduplicatedCount: number;
}

/* ── Cross-Channel Config ── */

export interface CrossChannelConfig {
  deduplicationEnabled: boolean;
  deduplicationWindowHours: number;
  channelPriority: MessageChannel[];
  respectFrequencyCaps: boolean;
  frequencyCaps: Record<MessageChannel, number>;
}

/* ── Campaign interface ── */

export interface Campaign {
  id: number;
  name: string;
  description: string;
  channels: MessageChannel[];
  status: CampaignStatus;
  type: MessageType;
  pipeline: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  deliveryCount?: number;
  openRate?: number;
  clickRate?: number;
  unifiedGroupId?: string;
  funnel?: Funnel;
  vertical?: Vertical;
  orchestrationMode?: OrchestrationMode;
}

/* ── Journey interface ── */

export type JourneyStepType =
  | "trigger" | "email" | "push" | "sms" | "whatsapp"
  | "delay" | "condition"
  | "best_channel";

export type JourneyOrchestrationType = "single_channel" | "cross_channel" | "omni_channel";

export interface JourneyStep {
  id: string;
  type: JourneyStepType;
  label: string;
  config?: Record<string, string>;
  children?: string[];
}

export interface Journey {
  id: number;
  name: string;
  description: string;
  status: JourneyStatus;
  entryChannel: MessageChannel;
  channels: MessageChannel[];
  steps: JourneyStep[];
  createdAt: string;
  updatedAt: string;
  audienceSize?: number;
  conversionRate?: number;
  orchestrationType?: JourneyOrchestrationType;
  crossChannelHandoffs?: number;
  channelEffectiveness?: Record<MessageChannel, number>;
}
