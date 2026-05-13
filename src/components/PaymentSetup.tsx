import { useState } from "react";
import { CreditCard, Wallet, Bitcoin, Check, ShieldCheck, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  bindPolicy,
  cancelAtRenewal,
  detectCardNetwork,
  luhnValid,
  maskCardNumber,
  policyForLead,
  savePaymentMethod,
  toggleAutoRenew,
  type PaymentMethod,
  type PaymentMethodType,
  type PaymentSchedule,
  type Policy,
} from "@/lib/billing";
import type { Lead } from "@/lib/leads";
import type { Quote } from "@/lib/pricing";
import { formatGBP } from "@/lib/pricing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function PaymentSetup({
  lead,
  quote,
  onPolicy,
}: {
  lead: Lead;
  quote: Quote;
  onPolicy?: (p: Policy) => void;
}) {
  const existing = policyForLead(lead.id);
  const [policy, setPolicy] = useState<Policy | undefined>(existing);

  if (policy && policy.status === "active") {
    return <ActivePolicyView policy={policy} onChange={(p) => { setPolicy(p); onPolicy?.(p); }} />;
  }

  return <BindForm lead={lead} quote={quote} onBound={(p) => { setPolicy(p); onPolicy?.(p); }} />;
}

function BindForm({
  lead,
  quote,
  onBound,
}: {
  lead: Lead;
  quote: Quote;
  onBound: (p: Policy) => void;
}) {
  const [method, setMethod] = useState<PaymentMethodType>("card");
  const [schedule, setSchedule] = useState<PaymentSchedule>("monthly");
  const [autoRenew, setAutoRenew] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Card
  const [cardName, setCardName] = useState(lead.contactName);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  // Bank
  const [accountName, setAccountName] = useState(lead.contactName);
  const [iban, setIban] = useState("");
  // Crypto
  const [cryptoNet, setCryptoNet] = useState("USDC");
  const [wallet, setWallet] = useState("");

  const charge = schedule === "monthly" ? quote.totalMonthlyPremium : quote.totalAnnualPremium;

  const validate = (): string | null => {
    if (method === "card") {
      if (!cardName.trim()) return "Name on card required.";
      if (!luhnValid(cardNumber)) return "Card number doesn't look right.";
      if (!/^\d{2}\s*\/\s*\d{2}$/.test(cardExpiry)) return "Use MM/YY for expiry.";
      if (!/^\d{3,4}$/.test(cardCvc)) return "CVC should be 3-4 digits.";
    } else if (method === "bank") {
      if (!accountName.trim()) return "Account name required.";
      if (iban.replace(/\s+/g, "").length < 10) return "IBAN or account number looks too short.";
    } else if (method === "crypto") {
      if (wallet.trim().length < 8) return "Wallet address looks too short.";
    }
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    // Simulate processor latency
    await new Promise((r) => setTimeout(r, 900));

    let pm: PaymentMethod;
    if (method === "card") {
      pm = {
        id: `pm-${Date.now().toString(36)}`,
        type: "card",
        schedule,
        identifier: maskCardNumber(cardNumber),
        network: detectCardNetwork(cardNumber),
        setupAt: new Date().toISOString(),
      };
    } else if (method === "bank") {
      pm = {
        id: `pm-${Date.now().toString(36)}`,
        type: "bank",
        schedule,
        identifier: `••• ${iban.replace(/\s+/g, "").slice(-4)}`,
        setupAt: new Date().toISOString(),
      };
    } else {
      pm = {
        id: `pm-${Date.now().toString(36)}`,
        type: "crypto",
        schedule,
        identifier: `${wallet.slice(0, 4)}…${wallet.slice(-4)}`,
        network: cryptoNet,
        setupAt: new Date().toISOString(),
      };
    }
    savePaymentMethod(pm);
    const policy = bindPolicy(lead, quote, pm, { autoRenew });
    setSubmitting(false);
    toast.success(`Cover bound. Policy ${policy.id} active.`);
    onBound(policy);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Bind cover</div>
          <h3 className="mt-1 font-display text-2xl text-ink">Set up payment & go live.</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            Pay {schedule}ly via card, bank or crypto. Cancel anytime; we'll remind you before each renewal.
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Today's charge</div>
          <div className="mt-1 font-display text-3xl text-ink">{formatGBP(charge)}</div>
          <div className="text-[11px] text-muted-foreground font-mono">{schedule === "monthly" ? "per month" : "per year"}</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <MethodTile selected={method === "card"} onClick={() => setMethod("card")} icon={CreditCard} label="Card" sub="Visa, MC, Amex" />
        <MethodTile selected={method === "bank"} onClick={() => setMethod("bank")} icon={Wallet} label="Bank" sub="ACH, SEPA, FP" />
        <MethodTile selected={method === "crypto"} onClick={() => setMethod("crypto")} icon={Bitcoin} label="Crypto" sub="BTC, ETH, USDC" />
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-secondary/40 p-1">
        <ScheduleTab active={schedule === "monthly"} onClick={() => setSchedule("monthly")}>
          Monthly · {formatGBP(quote.totalMonthlyPremium)}
        </ScheduleTab>
        <ScheduleTab active={schedule === "annual"} onClick={() => setSchedule("annual")}>
          Annual · {formatGBP(quote.totalAnnualPremium)} <span className="text-accent">save 4%</span>
        </ScheduleTab>
      </div>

      <div className="mt-6 space-y-4">
        {method === "card" && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Name on card</Label>
              <Input value={cardName} onChange={(e) => setCardName(e.target.value)} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Card number</Label>
              <Input
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                maxLength={23}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Expiry</Label>
              <Input placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} maxLength={7} />
            </div>
            <div className="space-y-1.5">
              <Label>CVC</Label>
              <Input inputMode="numeric" placeholder="123" value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} maxLength={4} />
            </div>
          </div>
        )}
        {method === "bank" && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Account holder</Label>
              <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>IBAN or account number</Label>
              <Input placeholder="GB29 NWBK 6016 1331 9268 19" value={iban} onChange={(e) => setIban(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              We'll set up a direct debit mandate. You'll see a confirmation in your bank app.
            </p>
          </div>
        )}
        {method === "crypto" && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Network</Label>
              <select
                value={cryptoNet}
                onChange={(e) => setCryptoNet(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 h-10 text-sm"
              >
                <option>USDC</option>
                <option>BTC</option>
                <option>ETH</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Wallet address (paying from)</Label>
              <Input placeholder="0x… or bc1…" value={wallet} onChange={(e) => setWallet(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Premiums are quoted in GBP and settled in stablecoin. Volatile assets convert at the spot rate at billing time.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
        <div>
          <div className="text-sm font-medium text-ink flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-accent" /> Auto-renew at the end of the year
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            We'll email you 45, 14 and 1 day before renewal. Cancel any time from those emails.
          </div>
        </div>
        <Switch checked={autoRenew} onCheckedChange={setAutoRenew} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-success" /> Payment details are tokenised. Cover bound the moment payment confirms.
        </div>
        <Button variant="atlas" size="lg" onClick={submit} disabled={submitting}>
          {submitting ? "Binding cover…" : `Pay ${formatGBP(charge)} & bind cover`}
        </Button>
      </div>
    </div>
  );
}

function ActivePolicyView({
  policy,
  onChange,
}: {
  policy: Policy;
  onChange: (p: Policy) => void;
}) {
  const renewalDate = new Date(policy.renewalDate);
  const daysToRenewal = Math.max(0, Math.round((renewalDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));

  return (
    <div className="rounded-2xl border border-success/30 bg-success/[0.05] p-6 md:p-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-medium text-success">
            <Check className="h-3 w-3" /> Cover active
          </div>
          <h3 className="mt-3 font-display text-2xl text-ink">Policy {policy.id}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Live since {new Date(policy.inceptionDate).toLocaleDateString()} ·
            renews {renewalDate.toLocaleDateString()} ({daysToRenewal} days)
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Premium</div>
          <div className="mt-1 font-display text-3xl text-ink">{formatGBP(policy.annualPremium)}</div>
          <div className="text-[11px] text-muted-foreground font-mono">per year</div>
        </div>
      </div>

      <dl className="mt-6 grid sm:grid-cols-3 gap-4">
        <Field label="Payment method" value={paymentLabel(policy)} />
        <Field label="Schedule" value={policy.payment.schedule === "monthly" ? "Monthly direct debit" : "Annual"} />
        <Field
          label="Auto-renewal"
          value={policy.cancelAtRenewal ? "Cancelled at renewal" : policy.autoRenew ? "On" : "Off"}
        />
      </dl>

      <div className="mt-6 flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
        <div>
          <div className="text-sm font-medium text-ink">Auto-renew</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {policy.cancelAtRenewal
              ? "We won't renew. Cover ends on the renewal date."
              : "We'll remind you 45, 14 and 1 day before. Cancel from any reminder."}
          </div>
        </div>
        <Switch
          checked={policy.autoRenew && !policy.cancelAtRenewal}
          onCheckedChange={(v) => {
            const next = toggleAutoRenew(policy.id, v);
            if (next) { onChange(next); toast.success(v ? "Auto-renewal re-enabled." : "Auto-renewal off."); }
          }}
        />
      </div>

      {!policy.cancelAtRenewal && (
        <div className="mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const p = cancelAtRenewal(policy.id, "Customer requested cancellation at renewal.");
              if (p) { onChange(p); toast.success("We won't renew. Cover stays active until the renewal date."); }
            }}
          >
            <XCircle className="h-4 w-4" /> Cancel at renewal
          </Button>
        </div>
      )}
    </div>
  );
}

function paymentLabel(p: Policy): string {
  if (p.payment.type === "card") return `${p.payment.network} •••• ${p.payment.identifier}`;
  if (p.payment.type === "bank") return `Bank ${p.payment.identifier}`;
  return `${p.payment.network} ${p.payment.identifier}`;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm text-ink">{value}</div>
    </div>
  );
}

function MethodTile({
  selected, onClick, icon: Icon, label, sub,
}: {
  selected: boolean; onClick: () => void; icon: typeof CreditCard; label: string; sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 text-left transition-all",
        selected ? "border-accent bg-accent/5 ring-1 ring-accent/30" : "border-border bg-background hover:border-accent/40"
      )}
    >
      <Icon className={cn("h-5 w-5", selected ? "text-accent" : "text-ink")} />
      <div className="mt-2 font-display text-sm text-ink">{label}</div>
      <div className="text-[11px] text-muted-foreground font-mono leading-tight">{sub}</div>
    </button>
  );
}
