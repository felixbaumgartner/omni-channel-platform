import type { Campaign, Journey } from "../types";

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
    channels: ["push", "email", "in_app"], status: "Live", type: "marketing",
    pipeline: "Trigger: cart_abandon",
    createdAt: "10 Feb 2026", updatedAt: "5 Mar 2026", updatedBy: "convert-team",
    deliveryCount: 3100000, openRate: 41.8, clickRate: 12.3,
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
    channels: ["email", "push", "in_app"], status: "Live", type: "non_marketing",
    pipeline: "Trigger: loyalty_status_change",
    createdAt: "28 Feb 2026", updatedAt: "1 Mar 2026", updatedBy: "loyalty-team",
    deliveryCount: 620000, openRate: 72.1, clickRate: 35.6,
  },
  {
    id: 1011, name: "price_alert_push",
    description: "Real-time price drop alerts for wishlisted properties",
    channels: ["push", "in_app"], status: "Live", type: "marketing",
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
    channels: ["email", "push", "in_app"],
    steps: [
      { id: "s1", type: "trigger", label: "Booking Confirmed" },
      { id: "s2", type: "email", label: "Welcome Email", children: ["s3"] },
      { id: "s3", type: "delay", label: "Wait 2 hours", config: { duration: "2h" }, children: ["s4"] },
      { id: "s4", type: "push", label: "App Download Prompt", children: ["s5"] },
      { id: "s5", type: "delay", label: "Wait 1 day", config: { duration: "1d" }, children: ["s6"] },
      { id: "s6", type: "condition", label: "Opened Email?", children: ["s7", "s8"] },
      { id: "s7", type: "in_app", label: "Trip Checklist Card" },
      { id: "s8", type: "email", label: "Reminder: Complete Profile" },
    ],
    createdAt: "1 Mar 2026", updatedAt: "6 Mar 2026",
    audienceSize: 340000, conversionRate: 62.4,
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
      { id: "s5", type: "split", label: "Exit: Converted" },
      { id: "s6", type: "email", label: "Fallback Email with Deals" },
    ],
    createdAt: "15 Feb 2026", updatedAt: "5 Mar 2026",
    audienceSize: 890000, conversionRate: 18.7,
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
  },
  {
    id: 2004,
    name: "Genius Level Upgrade Celebration",
    description: "Cross-channel celebration when user reaches new Genius level",
    status: "Draft",
    entryChannel: "email",
    channels: ["email", "push", "in_app"],
    steps: [
      { id: "s1", type: "trigger", label: "Genius Level Changed" },
      { id: "s2", type: "email", label: "Congratulations Email", children: ["s3"] },
      { id: "s3", type: "push", label: "Badge Unlocked Push", children: ["s4"] },
      { id: "s4", type: "in_app", label: "In-App Celebration Banner" },
    ],
    createdAt: "8 Mar 2026", updatedAt: "8 Mar 2026",
    audienceSize: 0, conversionRate: 0,
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
  { channel: "In-App", sent: 2100000, delivered: 2100000, opened: 1470000, clicked: 630000, bounced: 0, deliveryRate: 100.0, openRate: 70.0, clickRate: 30.0, bounceRate: 0 },
];

export interface DailyMetric {
  date: string;
  email: number;
  push: number;
  sms: number;
  in_app: number;
}

export const dailySends: DailyMetric[] = [
  { date: "Mar 1", email: 420000, push: 310000, sms: 95000, in_app: 78000 },
  { date: "Mar 2", email: 380000, push: 290000, sms: 102000, in_app: 65000 },
  { date: "Mar 3", email: 510000, push: 380000, sms: 88000, in_app: 92000 },
  { date: "Mar 4", email: 460000, push: 340000, sms: 110000, in_app: 71000 },
  { date: "Mar 5", email: 550000, push: 410000, sms: 97000, in_app: 85000 },
  { date: "Mar 6", email: 490000, push: 360000, sms: 105000, in_app: 88000 },
  { date: "Mar 7", email: 530000, push: 395000, sms: 92000, in_app: 79000 },
];
