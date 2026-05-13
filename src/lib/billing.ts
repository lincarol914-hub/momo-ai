import type { Lead } from "./leads";
import type { Quote } from "./pricing";
import { upsertLead, loadLeads } from "./leads";
import { logActivity } from "./activity";
import { queueMessage } from "./messages";

export type PaymentMethodType = "card" | "bank" | "crypto";
export type PaymentSchedule = "monthly" | "annual";

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  schedule: PaymentSchedule;
  identifier: string;   // last4 for card, masked iban for bank, wallet tail for crypto
  network?: string;     // Visa, Mastercard, BTC, ETH, USDC, etc.
  setupAt: string;
}

export interface PolicyRenewalEvent {
  at: string;
  type: "reminder" | "renewed" | "cancelled";
  detail: string;
}

export type PolicyStatus = "active" | "cancelled" | "lapsed" | "pending_renewal";

export interface Policy {
  id: string;
  leadId: string;
  quoteId: string;
  status: PolicyStatus;
  inceptionDate: string;
  renewalDate: string;
  annualPremium: number;
  currency: "GBP" | "USD" | "EUR";
  payment: PaymentMethod;
  autoRenew: boolean;
  cancelAtRenewal: boolean;
  renewalEvents: PolicyRenewalEvent[];
  bindReference: string;
}

const POLICY_KEY = "momo:policies";
const PAYMENT_KEY = "momo:paymentMethods";

export function loadPolicies(): Policy[] {
  try {
    return JSON.parse(localStorage.getItem(POLICY_KEY) || "[]") as Policy[];
  } catch {
    return [];
  }
}

export function savePolicies(policies: Policy[]) {
  try {
    localStorage.setItem(POLICY_KEY, JSON.stringify(policies));
  } catch {
    // ignore
  }
}

export function upsertPolicy(p: Policy) {
  const all = loadPolicies();
  const i = all.findIndex((x) => x.id === p.id);
  if (i >= 0) all[i] = p;
  else all.unshift(p);
  savePolicies(all);
  return all;
}

export function policyForLead(leadId: string): Policy | undefined {
  return loadPolicies().find((p) => p.leadId === leadId);
}

export function loadPaymentMethods(): PaymentMethod[] {
  try {
    return JSON.parse(localStorage.getItem(PAYMENT_KEY) || "[]") as PaymentMethod[];
  } catch {
    return [];
  }
}

export function savePaymentMethod(pm: PaymentMethod) {
  const all = loadPaymentMethods();
  all.unshift(pm);
  try {
    localStorage.setItem(PAYMENT_KEY, JSON.stringify(all.slice(0, 50)));
  } catch {
    // ignore
  }
}

// --- Validation helpers (kept light — no PCI scope on the client) ---

export function maskCardNumber(num: string): string {
  const digits = num.replace(/\s+/g, "");
  return digits.slice(-4).padStart(4, "•");
}

export function detectCardNetwork(num: string): string {
  const digits = num.replace(/\s+/g, "");
  if (/^4/.test(digits)) return "Visa";
  if (/^5[1-5]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^6/.test(digits)) return "Discover";
  return "Card";
}

export function luhnValid(num: string): boolean {
  const digits = num.replace(/\s+/g, "");
  if (!/^\d{12,19}$/.test(digits)) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

// --- Renewal scheduling ---

function offsetDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export function bindPolicy(
  lead: Lead,
  quote: Quote,
  payment: PaymentMethod,
  options: { autoRenew: boolean }
): Policy {
  const inception = new Date();
  const renewal = new Date(inception);
  renewal.setFullYear(renewal.getFullYear() + 1);

  const policy: Policy = {
    id: `POL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    leadId: lead.id,
    quoteId: quote.id,
    status: "active",
    inceptionDate: inception.toISOString(),
    renewalDate: renewal.toISOString(),
    annualPremium: quote.totalAnnualPremium,
    currency: quote.currency,
    payment,
    autoRenew: options.autoRenew,
    cancelAtRenewal: false,
    renewalEvents: [],
    bindReference: `BIND-${Date.now().toString(36).toUpperCase()}`,
  };
  upsertPolicy(policy);

  // Mark lead as "won"
  const updatedLead: Lead = { ...lead, status: "won" };
  upsertLead(updatedLead);

  // Activity + customer confirmation
  logActivity({
    leadId: lead.id,
    type: "policy_issued",
    actor: "ai",
    summary: `Policy ${policy.id} bound for ${lead.companyName}. Payment via ${payment.type} (${payment.identifier}) — ${payment.schedule}.`,
    data: { policyId: policy.id, autoRenew: options.autoRenew },
  });

  const monthly = Math.round(quote.totalAnnualPremium / 12);
  queueMessage({
    leadId: lead.id,
    channel: "email",
    to: lead.email,
    subject: `${lead.companyName} · cover is live (${policy.id})`,
    body: [
      `Hi ${lead.contactName.split(" ")[0] || "there"},`,
      "",
      `Your cover is active from ${inception.toLocaleDateString()} under policy ${policy.id}.`,
      "",
      `Annual premium: £${quote.totalAnnualPremium.toLocaleString()} (£${monthly.toLocaleString()}/month).`,
      `Payment: ${payment.type === "card" ? `${payment.network} card ending ${payment.identifier}` : payment.type === "bank" ? `Bank ${payment.identifier}` : `${payment.network} wallet ${payment.identifier}`} — ${payment.schedule}.`,
      "",
      options.autoRenew
        ? `Auto-renewal is ON. We'll email you 45, 14, and 1 day before your renewal on ${renewal.toLocaleDateString()} — you can cancel in one click from any of those emails.`
        : `Auto-renewal is OFF. We'll email you 45 days before your renewal on ${renewal.toLocaleDateString()} to confirm next year.`,
      "",
      "Full policy documents are attached and stored in your Momo file.",
      "",
      "Best,",
      "Momo Autopilot",
    ].join("\n"),
    template: "welcome_with_quote",
  });

  // Schedule reminder emails relative to renewal (45 / 14 / 1 days before).
  for (const days of [45, 14, 1]) {
    const sendAt = offsetDays(renewal, -days).toISOString();
    queueMessage({
      leadId: lead.id,
      channel: "email",
      to: lead.email,
      subject:
        days === 1
          ? `${lead.companyName} · renewing tomorrow — cancel anytime`
          : `${lead.companyName} · renewal in ${days} days`,
      body: [
        `Hi ${lead.contactName.split(" ")[0] || "there"},`,
        "",
        `Your Momo policy ${policy.id} renews on ${renewal.toLocaleDateString()}.`,
        options.autoRenew
          ? `We'll auto-renew unless you tell us otherwise. To cancel before renewal, reply to this email or visit your Momo file.`
          : `Renewal is not automatic. Reply to this email to confirm renewal at this year's terms.`,
        "",
        "Best,",
        "Momo Autopilot",
      ].join("\n"),
      template: "renewal_reminder",
      status: "queued",
    });
    logActivity({
      leadId: lead.id,
      type: "renewal_scheduled",
      actor: "ai",
      summary: `Renewal email scheduled for ${new Date(sendAt).toLocaleDateString()} (${days} days before renewal).`,
      data: { sendAt },
    });
  }

  return policy;
}

export function cancelAtRenewal(policyId: string, reason?: string): Policy | null {
  const all = loadPolicies();
  const i = all.findIndex((p) => p.id === policyId);
  if (i < 0) return null;
  const updated: Policy = {
    ...all[i],
    cancelAtRenewal: true,
    autoRenew: false,
    renewalEvents: [
      ...all[i].renewalEvents,
      { at: new Date().toISOString(), type: "cancelled", detail: reason || "Customer cancelled before renewal." },
    ],
  };
  all[i] = updated;
  savePolicies(all);
  logActivity({
    leadId: updated.leadId,
    type: "status_changed",
    actor: "customer",
    summary: `Auto-renewal cancelled. Cover remains active until ${new Date(updated.renewalDate).toLocaleDateString()}.`,
  });
  queueMessage({
    leadId: updated.leadId,
    channel: "email",
    to: leadEmail(updated.leadId),
    subject: `${updated.id} · auto-renewal cancelled`,
    body: [
      "Hi,",
      "",
      `We've turned off auto-renewal for policy ${updated.id}.`,
      `Your cover stays active until ${new Date(updated.renewalDate).toLocaleDateString()} — no action needed.`,
      "",
      "If this was a mistake, reply to this email and we'll re-enable renewal.",
      "",
      "Best,",
      "Momo Autopilot",
    ].join("\n"),
    template: "renewal_reminder",
  });
  return updated;
}

export function toggleAutoRenew(policyId: string, autoRenew: boolean): Policy | null {
  const all = loadPolicies();
  const i = all.findIndex((p) => p.id === policyId);
  if (i < 0) return null;
  const updated: Policy = { ...all[i], autoRenew, cancelAtRenewal: !autoRenew && all[i].cancelAtRenewal };
  all[i] = updated;
  savePolicies(all);
  logActivity({
    leadId: updated.leadId,
    type: "status_changed",
    actor: "customer",
    summary: `Auto-renewal ${autoRenew ? "enabled" : "disabled"}.`,
  });
  return updated;
}

function leadEmail(leadId: string): string {
  return loadLeads().find((l) => l.id === leadId)?.email ?? "";
}
