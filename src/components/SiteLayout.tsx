import { NavLink, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/insurance-analysis", label: "Insurance Analysis" },
  { to: "/businesses", label: "Businesses" },
  { to: "/broker-owners", label: "Broker Owners" },
  { to: "/partners", label: "Partners" },
  { to: "/platform", label: "Platform" },
  { to: "/investors", label: "Investors" },
  { to: "/contact", label: "Contact" },
];

export function AtlasLogo({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5 group", className)}>
      <div className={cn(
        "relative h-8 w-8 rounded-lg flex items-center justify-center overflow-hidden",
        dark ? "bg-accent text-navy" : "bg-accent text-ink"
      )}>
        <span className="font-display font-bold text-[15px] leading-none">P</span>
        <span className="absolute -right-0.5 -bottom-0.5 h-1.5 w-1.5 rounded-full bg-paper" />
      </div>
      <div className="leading-none">
        <div className={cn("font-display text-[18px] font-semibold tracking-tight", dark ? "text-paper" : "text-ink")}>
          Pistachio<span className="text-accent">.</span>
        </div>
        <div className={cn("text-[9px] uppercase tracking-[0.22em] mt-1 font-medium", dark ? "text-paper/55" : "text-muted-foreground")}>
          AI · Insurance
        </div>
      </div>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();

  useEffect(() => { setOpen(false); }, [loc.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn(
      "sticky top-0 z-50 transition-all",
      scrolled ? "bg-background/85 backdrop-blur-md border-b border-border" : "bg-transparent"
    )}>
      <div className="container-atlas flex items-center justify-between h-16 lg:h-18">
        <AtlasLogo />
        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) => cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive ? "text-ink" : "text-muted-foreground hover:text-ink"
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
                  isActive ? "bg-secondary text-ink font-medium" : "text-muted-foreground"
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
    <footer className="bg-navy-deep text-paper mt-24">
      <div className="container-atlas py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2">
            <AtlasLogo dark />
            <p className="mt-5 text-sm text-paper/60 max-w-xs leading-relaxed">
              The AI-native insurance platform for modern businesses. Insurance, rebuilt around AI.
            </p>
          </div>
          <FooterCol title="Product" links={[
            { to: "/insurance-analysis", label: "Insurance Analysis" },
            { to: "/platform", label: "Platform" },
            { to: "/businesses", label: "For Businesses" },
          ]} />
          <FooterCol title="Company" links={[
            { to: "/about", label: "About" },
            { to: "/broker-owners", label: "Broker Owners" },
            { to: "/partners", label: "Insurance Partners" },
            { to: "/investors", label: "Investors" },
          ]} />
          <FooterCol title="Contact" links={[
            { to: "/contact", label: "Contact" },
            { to: "/admin", label: "Admin" },
          ]} />
        </div>
        <div className="hairline border-paper/10 mt-14 pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-paper/50">
          <div>© {new Date().getFullYear()} Pistachio AI. All rights reserved.</div>
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
