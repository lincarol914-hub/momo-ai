import { NavLink, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import momoLogo from "@/assets/momo-logo-clean.png";

const NAV = [
  { to: "/watch-demo", label: "Watch Demo" },
  { to: "/insurance-analysis", label: "Analysis" },
  { to: "/businesses", label: "For Businesses" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function AtlasLogo({
  className,
  dark = false,
  size = "header",
}: {
  className?: string;
  dark?: boolean;
  size?: "header" | "footer";
}) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5 group", className)} aria-label="Momo AI">
      <div className={cn(
        "rounded-xl overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105",
        size === "footer" ? "h-14 w-14" : "h-10 w-10",
        dark ? "bg-paper" : "bg-paper ring-1 ring-border"
      )}>
        <img src={momoLogo} alt="Momo AI" className="h-full w-full object-cover" />
      </div>
      <div
        className={cn(
          "font-display font-[510] tracking-tight leading-none",
          size === "footer" ? "text-2xl" : "text-[18px]",
          dark ? "text-paper" : "text-ink"
        )}
      >
        momo<span className="text-foreground">.</span>ai
      </div>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  useEffect(() => { setOpen(false); }, [loc.pathname]);

  return (
    <header
      className="sticky top-0 z-50 bg-background/70 border-b border-black/[0.08]"
      style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
    >
      <div className="container-atlas flex items-center justify-between h-[73px]">
        <AtlasLogo />
        <nav className="hidden lg:flex items-center gap-0.5">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) => cn(
                "px-2.5 py-2 text-[13px] font-[510] rounded-md transition-colors whitespace-nowrap",
                isActive ? "text-ink bg-secondary" : "text-muted-foreground hover:text-ink"
              )}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/contact">Book a Call</Link>
          </Button>
          <Button asChild variant="atlas" size="sm">
            <Link to="/insurance-analysis">Run Insurance Analysis</Link>
          </Button>
        </div>
        <button className="lg:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <div className="container-atlas py-4 flex flex-col gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) => cn(
                  "px-3 py-2.5 text-base rounded-md",
                  isActive ? "bg-secondary text-ink font-[510]" : "text-muted-foreground"
                )}
              >
                {n.label}
              </NavLink>
            ))}
            <div className="flex gap-2 pt-3">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link to="/contact">Book a Call</Link>
              </Button>
              <Button asChild variant="atlas" size="sm" className="flex-1">
                <Link to="/insurance-analysis">Run Analysis <ArrowUpRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-navy-deep text-paper">
      <div className="container-atlas py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2">
            <AtlasLogo dark size="footer" />
            <p className="mt-5 text-sm text-paper/60 max-w-xs leading-relaxed">
              Smarter business insurance. Clearer cover, fairer prices, faster decisions.
            </p>
          </div>
          <FooterCol title="Get cover" links={[
            { to: "/insurance-analysis", label: "Free Analysis" },
            { to: "/businesses", label: "For Businesses" },
          ]} />
          <FooterCol title="Company" links={[
            { to: "/about", label: "About" },
            { to: "/contact", label: "Contact" },
            { to: "/admin", label: "Admin" },
          ]} />
        </div>
        <div className="hairline border-paper/10 mt-14 pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-paper/50">
          <div>© {new Date().getFullYear()} Momo AI. All rights reserved.</div>
          <div className="max-w-2xl leading-relaxed">
            Information on this website is general in nature and does not constitute insurance advice.
            Cover availability depends on insurer appetite, underwriting, jurisdiction and policy terms.
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-paper/50 mb-4">{title}</div>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="text-sm text-paper/85 hover:text-paper transition-colors">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
