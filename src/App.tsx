import { useEffect, useState, type ReactNode } from "react";
import { StoreProvider, useStore } from "./lib/store";
import { AuthProvider, useAuth } from "./lib/auth";
import { supabase } from "./lib/supabase";
import type { View } from "./lib/types";
import type { SitePage } from "./site/shared";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import SiteNav from "./site/SiteNav";
import Features from "./site/Features";
import HowWeSort from "./site/HowWeSort";
import Pricing from "./site/Pricing";
import About from "./site/About";
import Contact from "./site/Contact";
import AuthPage from "./site/AuthPage";
import Entry from "./views/Entry";
import Dash from "./views/Dash";
import Records from "./views/Records";
import Costing from "./views/Costing";
import Report from "./views/Report";
import RootCause from "./views/RootCause";
import Legal from "./views/Legal";
import Admin from "./views/Admin";
import Setup from "./views/Setup";

type Route = SitePage | "app";

// Runs once at module load — before any React render, survives all component remounts.
// Reads the plan name and clears both the URL param and sessionStorage immediately.
const PAYMENT_PLAN = (() => {
  if (new URLSearchParams(window.location.search).get("payment") !== "success") return null;
  const plan = sessionStorage.getItem("pendingPlan") ?? "Per-Project";
  sessionStorage.removeItem("pendingPlan");
  window.history.replaceState({}, "", window.location.pathname);
  return plan;
})();

function Shell() {
  const { user, refresh } = useAuth();
  const { toast } = useStore();
  const [route, setRoute] = useState<Route>("home");
  const [appView, setAppView] = useState<View>("entry");
  const [pendingEnter, setPendingEnter] = useState(false);
  const [activatingPremium, setActivatingPremium] = useState(PAYMENT_PLAN !== null);

  /* Entering the app: premium members go in; free accounts go to pricing; guests to login. */
  const openApp = (target: View = "entry") => {
    if (user?.premium) {
      setAppView(target);
      setRoute("app");
    } else if (user) {
      toast("Premium required — pick a plan to unlock the dashboard");
      setRoute("pricing");
    } else {
      setRoute("auth");
    }
  };

  /* After login/register completes, redirect based on the fresh user state. */
  useEffect(() => {
    if (!pendingEnter || !user) return;
    setPendingEnter(false);
    if (user.premium) {
      setRoute("app");
    } else {
      setRoute("pricing");
    }
  }, [pendingEnter, user]);

  /* If the session ends while inside the app, fall back to the public site. */
  useEffect(() => {
    if (route === "app" && !user?.premium) setRoute("home");
  }, [route, user]);

  /* Wait for auth to load (user !== null), then write premium to Supabase.
     PAYMENT_PLAN is module-level so it survives StoreProvider remounts. */
  useEffect(() => {
    if (!activatingPremium || !user) return;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setActivatingPremium(false);
        toast("Session expired — please log in again.");
        return;
      }
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: session.user.id, premium: true, plan: PAYMENT_PLAN ?? "Per-Project" });
      if (error) {
        setActivatingPremium(false);
        toast(`Could not activate premium: ${error.message}`);
        return;
      }
      // Set false BEFORE refresh so the effect doesn't re-fire when user updates
      setActivatingPremium(false);
      await refresh();
      setRoute("app");
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activatingPremium, user]);

  if (activatingPremium) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg font-sans text-ink">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        <p className="text-lg font-semibold">Activating your premium account…</p>
        <p className="text-sm text-ink-soft">Confirming payment with Stripe — this takes a few seconds.</p>
      </div>
    );
  }

  if (route === "app" && user?.premium) {
    return (
      <div className="min-h-screen bg-bg font-sans text-ink antialiased">
        <Navbar
          view={appView}
          onNav={(v) => (v === "home" ? setRoute("home") : setAppView(v))}
          onExit={() => setRoute("home")}
          userName={user.name}
        />
        <main
          className="dot-grid mx-auto min-h-[calc(100vh-140px)] max-w-[1180px] animate-rise px-4 pb-20 pt-6 print:max-w-none print:p-0"
          key={appView}
        >
          {appView === "entry" && <Entry />}
          {appView === "dash" && <Dash />}
          {appView === "records" && <Records />}
          {appView === "costing" && <Costing />}
          {appView === "report" && <Report />}
          {appView === "rootcause" && <RootCause />}
          {appView === "legal" && <Legal />}
          {appView === "admin" && <Admin />}
          {appView === "setup" && <Setup />}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg font-sans text-ink antialiased">
      <SiteNav page={route as SitePage} onNav={setRoute} onOpenApp={() => openApp("dash")} />
      {route === "home" && (
        <Hero
          isPublic={!user?.premium}
          startLabel={user?.premium ? "Enter control room" : "Get premium access"}
          dashLabel={user?.premium ? "View dashboard" : "See how we sort"}
          onStart={() => (user?.premium ? openApp("entry") : setRoute("pricing"))}
          onDash={() => (user?.premium ? openApp("dash") : setRoute("how"))}
        />
      )}
      {route === "features" && <Features />}
      {route === "how" && <HowWeSort />}
      {route === "pricing" && (
        <Pricing
          onNeedAccount={() => setRoute("auth")}
          onUnlocked={() => {
            toast("Premium unlocked ✓ — welcome to the control room");
            setRoute("app");
          }}
        />
      )}
      {route === "about" && <About />}
      {route === "contact" && <Contact />}
      {route === "auth" && (
        <AuthPage onDone={() => setPendingEnter(true)} onPricing={() => setRoute("pricing")} />
      )}
      {route !== "home" && <Footer />}
    </div>
  );
}

function StoreWrapper({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // key forces a full remount (and fresh load from localStorage) when the user changes
  const userId = user?.id ?? "guest";
  return (
    <StoreProvider key={userId} userId={userId}>
      {children}
    </StoreProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StoreWrapper>
        <Shell />
      </StoreWrapper>
    </AuthProvider>
  );
}
