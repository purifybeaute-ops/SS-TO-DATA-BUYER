import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth.jsx";
import { useT } from "@/lib/i18n";
import PKLogo from "@/components/PKLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  ArrowRight, PlayCircle, Upload, Sparkles, MessageCircle,
  Search, MapPin, Users, Heart, Star, Check,
} from "lucide-react";

/* ---------- Sub-components ---------- */

function BrowserMock({ t }) {
  // Simplified Indonesia map pins (relative % coords inside a stylized outline).
  // Orange pins = high volume (>50), gray = low.
  const pins = [
    { x: 22, y: 55, big: false, label: "" },              // Sumatra
    { x: 28, y: 62, big: false, label: "" },
    { x: 42, y: 68, big: true,  label: "Jakarta" },       // Jakarta
    { x: 47, y: 70, big: false, label: "" },              // Bandung
    { x: 55, y: 71, big: true,  label: "Surabaya" },      // Surabaya
    { x: 60, y: 72, big: false, label: "" },              // Bali
    { x: 68, y: 55, big: false, label: "" },              // Sulawesi
    { x: 72, y: 62, big: true,  label: "Makassar" },      // Makassar
    { x: 84, y: 60, big: false, label: "" },              // Papua
    { x: 38, y: 60, big: false, label: "" },
    { x: 51, y: 69, big: false, label: "" },
    { x: 65, y: 66, big: false, label: "" },
  ];

  const rows = [
    { initial: "S", color: "#C2410C", name: t("land.feat.card1.name"), city: t("land.feat.card1.city"), followers: "34.2K", likes: "812K", orders: 3, highlight: true },
    { initial: "R", color: "#D97706", name: t("land.feat.card2.name"), city: t("land.feat.card2.city"), followers: "18.4K", likes: "402K", orders: 2, highlight: false },
    { initial: "M", color: "#B45309", name: t("land.feat.card3.name"), city: t("land.feat.card3.city"), followers: "2.1K",  likes: "24.7K", orders: 7, highlight: false },
    { initial: "A", color: "#92400E", name: "Andi Prakoso",           city: "Medan",                    followers: "890",   likes: "12.1K", orders: 1, highlight: false },
  ];

  return (
    <div className="relative">
      {/* Browser chrome */}
      <div
        className="rounded-xl overflow-hidden shadow-2xl border"
        style={{ borderColor: "var(--border)", background: "#fff" }}
      >
        <div className="flex items-center gap-2 px-3 py-2.5 border-b" style={{ background: "#f3efe6", borderColor: "var(--border)" }}>
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
          </div>
          <div className="ml-3 flex-1 flex justify-center">
            <div className="text-[10px] font-mono px-3 py-0.5 rounded-md truncate max-w-[260px]"
                 style={{ background: "#fff", color: "#78716c", border: "1px solid var(--border)" }}>
              {t("land.mock.browserUrl")}
            </div>
          </div>
          <div className="w-12" />
        </div>

        {/* Content: 2 columns */}
        <div className="grid grid-cols-12 gap-0" style={{ minHeight: "310px" }}>
          {/* Map side */}
          <div className="col-span-5 p-3 border-r" style={{ borderColor: "var(--border)", background: "#fefcf8" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin className="w-3 h-3" style={{ color: "var(--accent)" }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-600">{t("land.mock.mapTitle")}</span>
            </div>
            {/* Stylized Indonesia archipelago SVG */}
            <div className="relative" style={{ aspectRatio: "16/9" }}>
              <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                {/* Dot grid background */}
                <defs>
                  <pattern id="dotgrid" width="4" height="4" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="0.35" fill="#e5dec9" />
                  </pattern>
                </defs>
                <rect width="100" height="60" fill="url(#dotgrid)" />
                {/* Rough archipelago shapes */}
                <g fill="#fed7aa" opacity="0.55" stroke="#fdba74" strokeWidth="0.15">
                  <path d="M15,50 Q20,45 26,48 Q32,52 30,60 Q22,64 15,58 Z" />
                  <path d="M35,63 Q45,60 55,64 Q60,66 58,70 Q45,74 35,70 Z" transform="translate(0,-4)" />
                  <path d="M60,62 Q68,60 74,64 Q76,68 70,70 Q62,68 60,66 Z" transform="translate(0,-2)" />
                  <path d="M64,50 Q70,48 75,52 Q76,58 70,58 Q64,56 64,52 Z" />
                  <path d="M80,55 Q88,53 92,58 Q90,64 82,62 Z" />
                </g>
              </svg>
              {/* Pins */}
              {pins.map((p, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%,-50%)" }}
                >
                  <div
                    className="rounded-full ring-2 ring-white"
                    style={{
                      width: p.big ? 10 : 6,
                      height: p.big ? 10 : 6,
                      background: p.big ? "var(--accent)" : "#a8a29e",
                      boxShadow: p.big ? "0 0 0 3px rgba(194,65,12,0.18)" : "none",
                    }}
                  />
                  {p.label && (
                    <div className="absolute left-3 top-0 text-[8px] font-semibold whitespace-nowrap"
                         style={{ color: "#1c1917", background: "#fff", padding: "1px 4px", borderRadius: 3, border: "1px solid var(--border)" }}>
                      {p.label}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3 mt-2 text-[9px] text-stone-500">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />
                {t("land.mock.mapLegendHi")}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: "#a8a29e" }} />
                {t("land.mock.mapLegendLo")}
              </div>
            </div>
          </div>

          {/* Table side */}
          <div className="col-span-7 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Users className="w-3 h-3" style={{ color: "var(--accent)" }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-600">{t("land.mock.tableTitle")}</span>
            </div>
            <table className="w-full text-[9px] table-fixed">
              <colgroup>
                <col style={{ width: "34%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "11%" }} />
              </colgroup>
              <thead>
                <tr style={{ background: "#f9f5ec" }}>
                  <th className="text-left px-1 py-1 font-semibold text-stone-500 uppercase text-[8px] overflow-hidden">{t("land.mock.col.name")}</th>
                  <th className="text-left px-1 py-1 font-semibold text-stone-500 uppercase text-[8px] overflow-hidden">{t("land.mock.col.city")}</th>
                  <th className="text-right px-1 py-1 font-semibold text-stone-500 uppercase text-[7px] overflow-hidden whitespace-nowrap">{t("land.mock.col.followers")}</th>
                  <th className="text-right px-1 py-1 font-semibold text-stone-500 uppercase text-[8px] overflow-hidden">{t("land.mock.col.likes")}</th>
                  <th className="text-right px-1 py-1 font-semibold text-stone-500 uppercase text-[8px] overflow-hidden">{t("land.mock.col.orders")}</th>
                  <th className="text-center px-1 py-1 font-semibold text-stone-500 uppercase text-[8px] overflow-hidden">{t("land.mock.col.action")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-1 py-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[9px] shrink-0"
                             style={{ background: r.color }}>{r.initial}</div>
                        <div className="min-w-0">
                          <div className="text-stone-900 font-medium leading-tight truncate">{r.name}</div>
                          {r.highlight && (
                            <span className="inline-block mt-0.5 px-1 py-0 text-[7px] font-bold rounded"
                                  style={{ background: "var(--accent)", color: "#fff", letterSpacing: "0.05em" }}>
                              {t("land.mock.badge.influential")}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-1 py-1.5 text-stone-700 truncate">{r.city}</td>
                    <td className="px-1 py-1.5 text-right font-mono text-stone-800 font-semibold">{r.followers}</td>
                    <td className="px-1 py-1.5 text-right font-mono text-stone-600">{r.likes}</td>
                    <td className="px-1 py-1.5 text-right font-mono text-stone-700">{r.orders}</td>
                    <td className="px-1 py-1.5 text-center">
                      <div className="inline-flex w-5 h-5 items-center justify-center rounded border"
                           style={{ borderColor: "var(--border)", background: "#fff" }} title="Google">
                        <svg width="9" height="9" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        </svg>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Floating stat cards */}
      <div className="hidden md:flex absolute -left-6 -bottom-4 items-center gap-2 rounded-lg px-3 py-2 shadow-lg"
           style={{ background: "#fff", border: "1px solid var(--border)" }}>
        <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: "var(--accent-light)" }}>
          <Users className="w-4 h-4" style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <div className="font-display font-bold text-lg leading-none text-stone-900">{t("land.stat1.num")}</div>
          <div className="text-[10px] text-stone-500">{t("land.stat1.label")}</div>
        </div>
      </div>

      <div className="hidden md:flex absolute -right-4 -top-4 items-center gap-2 rounded-lg px-3 py-2 shadow-lg"
           style={{ background: "#fff", border: "1px solid var(--border)" }}>
        <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: "#fef3c7" }}>
          <Sparkles className="w-4 h-4" style={{ color: "#b45309" }} />
        </div>
        <div>
          <div className="font-display font-bold text-lg leading-none text-stone-900">{t("land.stat2.num")}</div>
          <div className="text-[10px] text-stone-500">{t("land.stat2.label")}</div>
        </div>
      </div>
    </div>
  );
}

function HowItWorks({ t }) {
  const steps = [
    { icon: Upload, k: "step1", tint: "#ffedd5" },
    { icon: Sparkles, k: "step2", tint: "#fef3c7" },
    { icon: MessageCircle, k: "step3", tint: "#dcfce7" },
  ];
  return (
    <section id="how" className="py-24" style={{ background: "var(--bg-2)" }}>
      <div className="max-w-[1200px] mx-auto px-6 md:px-20">
        <div className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>
          {t("land.how.section")}
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-extrabold text-stone-900 mt-2 max-w-2xl leading-tight">
          {t("land.how.heading")}
        </h2>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {steps.map(({ icon: Icon, k, tint }, i) => (
            <div key={k} className="pp-card p-6 relative overflow-hidden">
              <div className="absolute top-4 right-4 font-display text-6xl font-black opacity-5 text-stone-900 leading-none">
                {i + 1}
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: tint }}>
                <Icon className="w-6 h-6" strokeWidth={1.5} style={{ color: "var(--accent)" }} />
              </div>
              <h3 className="font-display font-bold text-lg text-stone-900 mt-4">{t(`land.how.${k}.title`)}</h3>
              <p className="text-sm text-stone-600 mt-2 leading-relaxed">{t(`land.how.${k}.body`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InfluencerCards({ t }) {
  const cards = [
    { key: "card1", initial: "S", color: "#C2410C", tint: "#ffedd5", followers: "34.2K", likes: "812K", orders: 3, badgeColor: "#C2410C" },
    { key: "card2", initial: "R", color: "#D97706", tint: "#fef3c7", followers: "18.4K", likes: "402K", orders: 2, badgeColor: "#D97706" },
    { key: "card3", initial: "M", color: "#B45309", tint: "#fed7aa", followers: "2.1K",  likes: "24.7K", orders: 7, badgeColor: "#B45309" },
  ];
  return (
    <section id="features" className="py-24">
      <div className="max-w-[1200px] mx-auto px-6 md:px-20">
        <div className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>
          {t("land.feat.section")}
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-extrabold text-stone-900 mt-2 max-w-3xl leading-tight">
          {t("land.feat.heading")}
        </h2>
        <div className="mt-8 grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4 text-stone-700 leading-relaxed">
            <p>{t("land.feat.body")}</p>
            <p className="text-stone-800 font-medium">{t("land.feat.body2")}</p>
          </div>
          <div className="grid gap-4">
            {cards.map((c) => (
              <div key={c.key} className="pp-card p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-display font-extrabold text-xl shrink-0"
                     style={{ background: c.color }}>
                  {c.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-semibold text-stone-900">{t(`land.feat.${c.key}.name`)}</div>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider text-white"
                          style={{ background: c.badgeColor }}>
                      {t(`land.feat.${c.key}.badge`)}
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5">{t(`land.feat.${c.key}.city`)}</div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-stone-600 font-mono">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c.followers}</span>
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {c.likes}</span>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {c.orders} {t("land.feat.orders")}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button className="text-[10px] px-2 py-1 rounded border font-medium text-stone-700 hover:bg-stone-50"
                          style={{ borderColor: "var(--border)" }}>
                    {t("land.feat.viewProfile")}
                  </button>
                  <button className="text-[10px] px-2 py-1 rounded border font-medium text-stone-700 hover:bg-stone-50 inline-flex items-center gap-1"
                          style={{ borderColor: "var(--border)" }}>
                    <Search className="w-2.5 h-2.5" /> {t("land.feat.searchGoogle")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BusinessImpact({ t, onCta }) {
  const metrics = [
    { k: "metric1" },
    { k: "metric2" },
    { k: "metric3" },
  ];
  return (
    <section id="impact" className="py-24" style={{ background: "var(--bg-2)" }}>
      <div className="max-w-[1200px] mx-auto px-6 md:px-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>
            {t("land.impact.section")}
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-stone-900 mt-2 leading-tight">
            {t("land.impact.heading")}
          </h2>
          <p className="text-stone-700 mt-5 leading-relaxed">{t("land.impact.body")}</p>
          <button
            onClick={onCta}
            data-testid="landing-impact-cta"
            className="pp-btn-primary mt-6 rounded-lg px-5 py-2.5 font-semibold text-sm inline-flex items-center gap-2"
          >
            {t("land.impact.cta")} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid gap-4">
          {metrics.map(({ k }) => (
            <div key={k} className="pp-card p-6 flex items-center gap-5">
              <div className="font-display text-4xl font-extrabold" style={{ color: "var(--accent)" }}>
                {t(`land.impact.${k}.num`)}
              </div>
              <div className="text-sm text-stone-700">{t(`land.impact.${k}.label`)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Main Landing ---------- */

export default function Landing() {
  const { user, login } = useAuth();
  const { t } = useT();
  const nav = useNavigate();
  const [autoLoading, setAutoLoading] = useState(null); // "owner" | "operator" | null

  if (user) return <Navigate to="/dashboard" replace />;

  const primaryCta = () => nav("/login");
  const scrollHow = () => {
    document.getElementById("how")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const autoLogin = async (kind) => {
    setAutoLoading(kind);
    try {
      const email = kind === "owner" ? "owner@pelangganku.id" : "operator@pelangganku.id";
      const password = kind === "owner" ? "owner123" : "operator123";
      await login(email, password);
      toast.success(t("login.success"));
      nav("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.detail || t("login.failed"));
      setAutoLoading(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Nav bar */}
      <header className="border-b" style={{ borderColor: "var(--border)", background: "rgba(250,247,242,0.85)", backdropFilter: "blur(8px)", position: "sticky", top: 0, zIndex: 30 }}>
        <div className="max-w-[1200px] mx-auto px-6 md:px-20 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <PKLogo size={36} />
            <div>
              <div className="font-display font-extrabold text-base leading-none text-stone-900">PelangganKu</div>
              <div className="text-[9px] uppercase tracking-widest text-stone-500 mt-0.5">
                {t("land.hero.eyebrow")}
              </div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm text-stone-700">
            <a href="#features" className="hover:text-orange-800">{t("land.nav.features")}</a>
            <a href="#how" className="hover:text-orange-800">{t("land.nav.howItWorks")}</a>
            <a href="#impact" className="hover:text-orange-800">{t("land.nav.impact")}</a>
            <LanguageSwitcher />
            <Link
              to="/login"
              data-testid="landing-nav-signin"
              className="pp-btn-primary rounded-lg px-4 py-2 text-sm font-semibold"
            >
              {t("land.nav.signin")}
            </Link>
          </nav>
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher variant="compact" />
            <Link to="/login" className="pp-btn-primary rounded-lg px-3 py-1.5 text-xs font-semibold">{t("land.nav.signin")}</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: "calc(100vh - 64px)" }}
      >
        {/* Background: dot grid + soft orange radial in corner */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 100% 0%, rgba(253,186,116,0.35) 0%, rgba(253,186,116,0) 45%)," +
              "radial-gradient(circle at 0% 100%, rgba(254,215,170,0.25) 0%, rgba(254,215,170,0) 40%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(120,113,108,0.18) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative max-w-[1200px] mx-auto px-6 md:px-20 py-14 md:py-16">
          <div className="grid lg:grid-cols-[55%_45%] gap-10 lg:gap-12 items-center">
            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                   style={{ background: "var(--accent-light)", color: "var(--accent-hover)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                {t("land.hero.eyebrow")}
              </div>
              <h1
                className="font-display font-extrabold text-stone-900 mt-5"
                style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 1.1 }}
              >
                {t("land.hero.h1a")}
                <br />
                <span style={{ color: "var(--accent)" }}>{t("land.hero.h1b")}</span>
              </h1>
              <p className="text-stone-700 mt-5 text-base md:text-lg leading-relaxed max-w-xl">
                {t("land.hero.sub")}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  onClick={primaryCta}
                  data-testid="landing-hero-cta-primary"
                  className="pp-btn-primary rounded-lg px-5 py-3 font-semibold text-sm inline-flex items-center gap-2"
                >
                  {t("land.hero.cta1")} <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={scrollHow}
                  data-testid="landing-hero-cta-secondary"
                  className="rounded-lg px-5 py-3 font-semibold text-sm inline-flex items-center gap-2 border text-stone-800 hover:bg-stone-50"
                  style={{ borderColor: "var(--border-bold)", background: "#fff" }}
                >
                  <PlayCircle className="w-4 h-4" /> {t("land.hero.cta2")}
                </button>
              </div>

              {/* Demo auto-login chips */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-stone-500">{t("land.hero.tryAs")}</span>
                <button
                  onClick={() => autoLogin("owner")}
                  disabled={autoLoading !== null}
                  data-testid="landing-demo-owner-btn"
                  className="text-xs px-3 py-1.5 rounded-full font-medium border transition disabled:opacity-60"
                  style={{ background: "#fff", borderColor: "var(--border-bold)", color: "var(--accent-hover)" }}
                >
                  {autoLoading === "owner" ? t("login.processing") : `→ ${t("land.hero.demoOwner")}`}
                </button>
                <button
                  onClick={() => autoLogin("operator")}
                  disabled={autoLoading !== null}
                  data-testid="landing-demo-operator-btn"
                  className="text-xs px-3 py-1.5 rounded-full font-medium border transition disabled:opacity-60"
                  style={{ background: "#fff", borderColor: "var(--border-bold)", color: "var(--accent-hover)" }}
                >
                  {autoLoading === "operator" ? t("login.processing") : `→ ${t("land.hero.demoOperator")}`}
                </button>
              </div>

              {/* Chips */}
              <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone-700">
                {["land.chip.1", "land.chip.2", "land.chip.3", "land.chip.4", "land.chip.5"].map((k) => (
                  <li key={k} className="inline-flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" style={{ color: "var(--wa)" }} />
                    {t(k)}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: browser mock */}
            <div className="relative lg:pl-2">
              <BrowserMock t={t} />
            </div>
          </div>
        </div>
      </section>

      <HowItWorks t={t} />
      <InfluencerCards t={t} />
      <BusinessImpact t={t} onCta={primaryCta} />

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
        <div className="max-w-[1200px] mx-auto px-6 md:px-20 py-10">
          <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
            {t("land.footer.badges").split("·").map((b, i) => (
              <span key={i}
                    className="text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                    style={{ background: "var(--accent-light)", color: "var(--accent-hover)" }}>
                {b.trim()}
              </span>
            ))}
          </div>
          <p className="text-center text-xs text-stone-500 max-w-2xl mx-auto leading-relaxed">
            {t("land.footer.pdp")}
          </p>
          <div className="flex items-center justify-between mt-6 pt-6 border-t text-xs text-stone-500"
               style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <PKLogo size={22} />
              <span>{t("land.footer.copy")}</span>
            </div>
            <Link to="/login" className="hover:text-orange-800">{t("land.nav.signin")} →</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
