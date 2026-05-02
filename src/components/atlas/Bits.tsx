import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Eyebrow({ children, className, dark = false }: { children: React.ReactNode; className?: string; dark?: boolean }) {
  return (
    <div className={cn("eyebrow", dark ? "text-paper/60" : "text-muted-foreground", className)}>
      <span className={cn("h-px w-6", dark ? "bg-paper/30" : "bg-muted-foreground/40")} />
      {children}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  dark = false,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  dark?: boolean;
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && <Eyebrow dark={dark} className={cn(align === "center" && "justify-center")}>{eyebrow}</Eyebrow>}
      <h2 className={cn(
        "mt-5 font-display text-4xl md:text-5xl font-medium leading-[1.05] text-balance",
        dark ? "text-paper" : "text-ink"
      )}>
        {title}
      </h2>
      {description && (
        <p className={cn("mt-5 text-lg leading-relaxed", dark ? "text-paper/70" : "text-muted-foreground")}>
          {description}
        </p>
      )}
    </div>
  );
}

export function CTARow({
  primaryHref = "/insurance-analysis",
  primaryLabel = "Run Insurance Analysis",
  secondaryHref = "/contact",
  secondaryLabel = "Book a Call",
  dark = false,
  className,
}: {
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col sm:flex-row gap-3", className)}>
      <Button asChild variant={dark ? "accent" : "atlas"} size="lg">
        <Link to={primaryHref}>{primaryLabel} <ArrowUpRight className="h-4 w-4" /></Link>
      </Button>
      <Button asChild variant={dark ? "atlas-outline" : "outline"} size="lg">
        <Link to={secondaryHref}>{secondaryLabel}</Link>
      </Button>
    </div>
  );
}

export function FeatureCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "group relative rounded-xl border border-border bg-card p-6 shadow-card hover:shadow-elev transition-all hover:-translate-y-0.5",
      className
    )}>
      {Icon && (
        <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-ink">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h3 className="font-display text-lg font-medium text-ink">{title}</h3>
      <div className="mt-2 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}

export function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-l border-paper/15 pl-5">
      <div className="font-display text-3xl text-paper">{value}</div>
      <div className="text-xs uppercase tracking-[0.16em] text-paper/50 mt-1.5">{label}</div>
    </div>
  );
}

export function Disclaimer({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/50 p-4 text-xs leading-relaxed text-muted-foreground">
      <span className="font-medium text-ink">Important: </span>{children}
    </div>
  );
}
