import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/lab-hero.jpg";
import equipImg from "@/assets/lab-equipment.jpg";
import shelfImg from "@/assets/chemicals-shelf.jpg";
import { Button } from "@/components/ui/button";
import { FlaskConical, ShieldAlert, Boxes, ClipboardList, Bell, Users } from "lucide-react";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-base sm:text-lg">
            <FlaskConical className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            ChemTrack
          </Link>
          <nav className="hidden gap-6 text-sm md:flex">
            <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
            <a href="#how" className="text-muted-foreground hover:text-foreground">How it works</a>
            <a href="#about" className="text-muted-foreground hover:text-foreground">About</a>
          </nav>
          <div className="flex gap-2">
            <Link to="/auth"><Button variant="ghost" className="hidden sm:inline-flex">Sign in</Button></Link>
            <Link to="/auth"><Button size="sm" className="sm:h-10 sm:px-4">Get started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-2 md:py-28 md:items-center">
          <div className="text-white">
            <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              Digital Chemistry Lab Inventory
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
              Manage chemicals, equipment & expiry dates — effortlessly.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/90">
              Replace paper registers with a fast, reliable inventory system. Get real-time low-stock and expiry
              alerts, role-based access, and complete usage history.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth"><Button size="lg" variant="secondary">Start free</Button></Link>
              <a href="#features"><Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">Explore features</Button></a>
            </div>
          </div>
          <div className="relative">
            <img
              src={heroImg}
              alt="Chemistry laboratory beakers and flasks with colorful reagents"
              width={1536}
              height={896}
              className="rounded-2xl shadow-elegant"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Everything your lab needs</h2>
          <p className="mt-3 text-muted-foreground">
            Built for chemistry labs that want to retire paper records and run safer, more organized inventories.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: Boxes, title: "Chemical inventory", desc: "Add, update and track every reagent with formula, supplier, location and notes." },
            { icon: ShieldAlert, title: "Expiry alerts", desc: "Automatic warnings for chemicals close to expiry — no more silent waste or hazards." },
            { icon: Bell, title: "Low-stock notifications", desc: "Set minimum thresholds and get notified the moment stock dips." },
            { icon: ClipboardList, title: "Usage history", desc: "Every change is logged: who used what, when and how much." },
            { icon: Users, title: "Roles & access", desc: "Admin and Lab Assistant roles keep destructive actions safe." },
            { icon: FlaskConical, title: "Equipment register", desc: "Track glassware and apparatus condition, location and quantities." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-elegant">
              <f.icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How / showcase */}
      <section id="how" className="bg-gradient-subtle py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-2 md:items-center">
          <img src={shelfImg} alt="Reagent bottles on a laboratory shelf" loading="lazy" width={1280} height={896} className="rounded-2xl shadow-card" />
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">From paper register to digital control</h2>
            <ol className="mt-6 space-y-4">
              {[
                "Add chemicals with quantity, expiry and storage location.",
                "Set minimum stock thresholds so the system can alert you.",
                "Log every usage — keep an auditable trail across your team.",
                "Generate reports to plan purchases and stay compliant.",
              ].map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{i+1}</span>
                  <span className="pt-0.5 text-muted-foreground">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">Built for safety and accuracy</h2>
            <p className="mt-3 text-muted-foreground">
              Manual registers are slow and error-prone. Expired chemicals create real safety risks and waste
              budgets. ChemTrack is a centralized digital platform that keeps every record accurate and visible.
            </p>
          </div>
          <img src={equipImg} alt="Top-down view of laboratory equipment" loading="lazy" width={1280} height={896} className="rounded-2xl shadow-card" />
        </div>
      </section>

      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FlaskConical className="h-4 w-4 text-primary" />
            ChemTrack © {new Date().getFullYear()}
          </div>
          <Link to="/auth" className="text-sm text-primary hover:underline">Sign in to your lab →</Link>
        </div>
      </footer>
    </div>
  );
}
