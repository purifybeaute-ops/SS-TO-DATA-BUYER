import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth.jsx";
import { useT } from "@/lib/i18n";
import PKLogo from "@/components/PKLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  ArrowRight, PlayCircle, Upload, Sparkles, MessageCircle,
  Search, Users, Heart, ShoppingBag, Filter, Star, Check, Database,
} from "lucide-react";

/* -------- Sub-components -------- */

function AmbientOrbs() {
  return (
    <>
      <div className="ambient-glow animate-blob"
           style={{ top: -200, left: -100 }} />
      <div className="ambient-glow animate-blob animation-delay-2000"
           style={{
             bottom: "18%", right: -100,
             background: "radial-gradient(circle, rgba(168,85,247,0.18) 0%, rgba(168,85,247,0) 60%)",
           }} />
    </>
  );
}

function Nav({ t }) {
  return (
    <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-md" style={{ background: "rgba(10,14,26,0.65)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <PKLogo size={36} />
          <div>
            <div className="font-display font-extrabold text-white text-base leading-none">PelangganKu</div>
            <div className="text-[9px] uppercase tracking-widest text-gray-400 mt-0.5">
              {t("land.hero.eyebrow")}
            </div>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-7 text-sm text-gray-300">
          <a href="#how-it-works" className="hover:text-white transition">{t("land.nav.howItWorks")}</a>
          <a href="#features" className="hover:text-white transition">{t("land.nav.features")}</a>
          <a href="#impact" className="hover:text-white transition">{t("land.nav.impact")}</a>
          <LanguageSwitcher />
          <Link
            to="/login"
            data-testid="landing-nav-signin"
            className="px-4 py-2 rounded-lg text-sm font-bold text-[#0a0e1a] bg-gradient-to-r from-cyan-400 to-cyan-200 hover:from-cyan-200 hover:to-cyan-400 transition-all"
            style={{ boxShadow: "0 0 18px rgba(34,211,238,0.35)" }}
          >
            {t("land.nav.signin")}
          </Link>
        </nav>
        <div className="md:hidden flex items-center gap-2">
          <LanguageSwitcher variant="compact" />
          <Link to="/login" className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#0a0e1a] bg-gradient-to-r from-cyan-400 to-cyan-200">
            {t("land.nav.signin")}
          </Link>
        </div>
      </div>
    </header>
  );
}

function Mockup({ t }) {
  const rows = [
    { init: "S", name: t("land.feat.card1.name"), city: t("land.feat.card1.city"), followers: "34.2K", likes: "812K", status: "active", influential: true, gradient: "from-fuchsia-500 to-pink-500", glow: "rgba(168,85,247,0.5)" },
    { init: "R", name: t("land.feat.card2.name"), city: t("land.feat.card2.city"), followers: "18.4K", likes: "402K", status: "active", influential: false, gradient: "from-cyan-500 to-blue-500", glow: "rgba(34,211,238,0.4)" },
    { init: "M", name: t("land.feat.card3.name"), city: t("land.feat.card3.city"), followers: "2.1K",  likes: "24.7K", status: "inactive", influential: false, gradient: "from-slate-600 to-slate-800", glow: "rgba(100,116,139,0.4)" },
    { init: "A", name: "Andi Prakoso",           city: "Medan",                    followers: "898",   likes: "12.1K", status: "inactive", influential: false, gradient: "from-slate-600 to-slate-800", glow: "rgba(100,116,139,0.4)" },
  ];

  return (
    <div className="relative animate-float perspective-1000">
      <div className="glass rounded-2xl overflow-hidden relative z-10"
           style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)" }}>
        {/* Chrome */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80" style={{ boxShadow: "0 0 8px rgba(239,68,68,0.6)" }} />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" style={{ boxShadow: "0 0 8px rgba(234,179,8,0.6)" }} />
            <span className="w-3 h-3 rounded-full bg-green-500/80" style={{ boxShadow: "0 0 8px rgba(34,197,94,0.6)" }} />
          </div>
          <div className="text-[10px] text-gray-400 bg-black/30 border border-white/5 px-4 py-1.5 rounded-full font-mono tracking-widest flex items-center gap-2">
            <Database className="w-3 h-3" style={{ color: "var(--accent)" }} />
            {t("land.mock.browserUrl")}
          </div>
          <div className="w-12" />
        </div>

        {/* Table */}
        <div className="p-6" style={{ background: "rgba(10,14,26,0.4)" }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4" style={{ color: "var(--accent)", filter: "drop-shadow(0 0 5px rgba(34,211,238,0.8))" }} />
              {t("land.mock.tableTitle")}
            </h3>
            <div className="flex gap-2">
              <div className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-gray-300 flex items-center gap-1">
                <Filter className="w-3 h-3" style={{ color: "var(--neon-purple)" }} /> Filter
              </div>
              <div className="px-3 py-1 rounded-md text-[10px] font-semibold"
                   style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.35)", color: "var(--accent)" }}>
                Export CSV
              </div>
            </div>
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-white/10 uppercase tracking-widest text-[9px]">
                <th className="pb-3 font-semibold">{t("land.mock.col.name")}</th>
                <th className="pb-3 font-semibold">{t("land.mock.col.city")}</th>
                <th className="pb-3 font-semibold">{t("land.mock.col.followers")}</th>
                <th className="pb-3 font-semibold">{t("land.mock.col.likes")}</th>
                <th className="pb-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors group">
                  <td className="py-3.5 pr-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${r.gradient} flex items-center justify-center text-white font-bold text-sm shrink-0`}
                           style={{ boxShadow: `0 0 10px ${r.glow}` }}>
                        {r.init}
                      </div>
                      <div>
                        <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">{r.name}</div>
                        {r.influential && (
                          <div className="text-[9px] font-bold tracking-wider mt-0.5 border px-1.5 py-0.5 rounded inline-block uppercase"
                               style={{ borderColor: "rgba(34,211,238,0.3)", background: "rgba(34,211,238,0.1)", color: "var(--accent)" }}>
                            {t("land.mock.badge.influential")}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 text-gray-400">{r.city}</td>
                  <td className="py-3.5 font-bold text-gray-200">{r.followers}</td>
                  <td className="py-3.5 text-gray-400">{r.likes}</td>
                  <td className="py-3.5 text-center">
                    {r.status === "active" ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[9px] font-bold tracking-wider uppercase"
                            style={{ background: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.25)", color: "#4ade80" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[9px] font-bold tracking-wider uppercase"
                            style={{ background: "rgba(100,116,139,0.1)", borderColor: "rgba(100,116,139,0.25)", color: "#94a3b8" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Idle
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -top-6 right-6 glass px-4 py-3 rounded-xl flex items-center gap-3 z-20 animate-float-delayed"
           style={{ borderColor: "rgba(168,85,247,0.35)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center"
             style={{ background: "rgba(168,85,247,0.2)", color: "var(--neon-purple)", filter: "drop-shadow(0 0 8px rgba(168,85,247,0.8))" }}>
          <Star className="w-5 h-5" fill="currentColor" />
        </div>
        <div>
          <div className="text-base font-black text-white leading-tight">{t("land.stat2.num")} {t("land.mock.buyers")}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">{t("land.stat2.label")}</div>
        </div>
      </div>
    </div>
  );
}

function HowItWorks({ t }) {
  const cards = [
    { icon: Upload, key: "step1", accent: "var(--accent)", accentBg: "rgba(34,211,238,0.1)", accentBorder: "rgba(34,211,238,0.2)", numColor: "rgba(34,211,238,0.1)", offset: "" },
    { icon: Sparkles, key: "step2", accent: "var(--neon-purple)", accentBg: "rgba(168,85,247,0.1)", accentBorder: "rgba(168,85,247,0.2)", numColor: "rgba(168,85,247,0.1)", offset: "md:mt-8" },
    { icon: MessageCircle, key: "step3", accent: "#60a5fa", accentBg: "rgba(59,130,246,0.1)", accentBorder: "rgba(59,130,246,0.2)", numColor: "rgba(59,130,246,0.1)", offset: "md:mt-16" },
  ];
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-14">
          <p className="text-[10px] font-bold tracking-widest text-gradient uppercase mb-3 inline-block bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
            {t("land.how.section")}
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight font-display">
            {t("land.how.heading").split(".")[0]}.<br />
            <span className="text-gradient">{t("land.how.heading").split(".")[1]?.trim() || t("land.how.headingSuffix")}.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map(({ icon: Icon, key, accent, accentBg, accentBorder, numColor, offset }, i) => (
            <div key={key} className={`glass glass-card rounded-2xl p-8 relative overflow-hidden group ${offset}`}>
              <div className="absolute -top-4 -right-4 text-8xl font-black pointer-events-none transition-colors duration-500"
                   style={{ color: "rgba(255,255,255,0.04)" }}>
                {i + 1}
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                   style={{ background: accentBg, border: `1px solid ${accentBorder}`, color: accent, boxShadow: `0 0 15px ${accentBg}` }}>
                <Icon className="w-6 h-6" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 relative z-10">{t(`land.how.${key}.title`)}</h3>
              <p className="text-gray-400 text-sm leading-relaxed relative z-10 font-light">{t(`land.how.${key}.body`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features({ t }) {
  const cards = [
    { key: "card1", init: "S", gradient: "from-fuchsia-500 to-pink-600", glow: "rgba(168,85,247,0.5)", badgeBg: "rgba(168,85,247,0.2)", badgeBorder: "rgba(168,85,247,0.5)", badgeColor: "var(--neon-purple)", followers: "34.2K", likes: "812K", orders: 3, accentActive: true, sideGrad: "from-cyan-300 to-fuchsia-500" },
    { key: "card2", init: "R", gradient: "from-cyan-400 to-blue-600", glow: "rgba(34,211,238,0.4)", badgeBg: "rgba(6,182,212,0.2)", badgeBorder: "rgba(6,182,212,0.5)", badgeColor: "#22d3ee", followers: "18.4K", likes: "402K", orders: 2, accentActive: false, sideGrad: "from-cyan-400 to-blue-500" },
    { key: "card3", init: "M", gradient: "from-slate-600 to-slate-800", glow: "rgba(100,116,139,0.3)", badgeBg: "rgba(100,116,139,0.35)", badgeBorder: "rgba(148,163,184,0.5)", badgeColor: "#cbd5e1", followers: "2.1K", likes: "24.7K", orders: 7, accentActive: false, sideGrad: "from-slate-400 to-slate-600" },
  ];
  return (
    <section id="features" className="py-24 relative overflow-hidden border-t"
             style={{ borderColor: "rgba(255,255,255,0.06)", background: "linear-gradient(180deg, #0a0e1a 0%, #0d1323 100%)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
          <div>
            <div className="inline-block glass px-4 py-1.5 rounded-full border border-white/10 mb-6">
              <p className="text-[10px] font-bold tracking-widest text-gradient uppercase">{t("land.feat.section")}</p>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight mb-6 leading-tight font-display">
              {(() => {
                const h = t("land.feat.heading");
                const re = /(reach\.?|jangkauan besar\.?)$/i;
                const m = h.match(re);
                if (!m) return h;
                const before = h.slice(0, m.index).trim();
                return (
                  <>
                    {before}{" "}
                    <span className="text-gradient">{m[0]}</span>
                  </>
                );
              })()}
            </h2>
            <div className="space-y-5 text-gray-400 font-light leading-relaxed">
              <p>{t("land.feat.body")}</p>
              <p className="text-gray-300">{t("land.feat.body2")}</p>
            </div>
          </div>
          <div className="space-y-4">
            {cards.map((c) => (
              <div key={c.key} className="glass glass-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition duration-300 relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${c.sideGrad} opacity-60 group-hover:opacity-100 transition-opacity`} />
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${c.gradient} text-white flex items-center justify-center text-xl font-black shrink-0`}
                       style={{ boxShadow: `0 0 15px ${c.glow}` }}>
                    {c.init}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <h4 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors">{t(`land.feat.${c.key}.name`)}</h4>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                            style={{ background: c.badgeBg, border: `1px solid ${c.badgeBorder}`, color: c.badgeColor }}>
                        {t(`land.feat.${c.key}.badge`)}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-wide">{t(`land.feat.${c.key}.city`)}</p>
                    <div className="flex items-center gap-4 text-[11px] font-semibold text-gray-300">
                      <span className="flex items-center gap-1.5"><Users className={`w-3.5 h-3.5 ${c.accentActive ? "text-cyan-300" : "text-gray-500"}`} /> {c.followers}</span>
                      <span className="flex items-center gap-1.5"><Heart className={`w-3.5 h-3.5 ${c.accentActive ? "text-cyan-300" : "text-gray-500"}`} /> {c.likes}</span>
                      <span className="flex items-center gap-1.5"><ShoppingBag className={`w-3.5 h-3.5 ${c.accentActive ? "text-cyan-300" : "text-gray-500"}`} /> {c.orders} {t("land.feat.orders")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex sm:flex-col gap-2 shrink-0">
                  <button className="text-[10px] font-bold text-white bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-2 rounded-lg transition">
                    {t("land.feat.viewProfile")}
                  </button>
                  <button className="text-[10px] font-bold text-gray-300 bg-black/40 hover:bg-black/60 border border-white/5 px-3 py-2 rounded-lg transition inline-flex items-center gap-1.5">
                    <Search className="w-3 h-3 text-gray-400" /> {t("land.feat.searchGoogle")}
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

function Impact({ t, onCta }) {
  const isID = /id/i.test(document?.documentElement?.lang || "en");
  const [head1, head2] = isID
    ? [t("land.impact.heading").split("gratis")[0].trim(), "gratis."]
    : [t("land.impact.heading").split("free")[0].trim(), "free."];

  return (
    <section id="impact" className="py-24 relative overflow-hidden border-t"
             style={{ borderColor: "rgba(255,255,255,0.06)", background: "#0a0e1a" }}>
      <div className="ambient-glow" style={{ bottom: -200, left: -200, background: "radial-gradient(circle, rgba(147,51,234,0.12) 0%, rgba(147,51,234,0) 60%)" }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
          <div>
            <div className="inline-block glass px-4 py-1.5 rounded-full border border-white/10 mb-6">
              <p className="text-[10px] font-bold tracking-widest text-gradient uppercase">{t("land.impact.section")}</p>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6 leading-tight font-display">
              {head1}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-300">{head2}</span>
            </h2>
            <p className="text-gray-400 text-base md:text-lg mb-8 leading-relaxed font-light">
              {t("land.impact.body")}
            </p>
            <button
              onClick={onCta}
              data-testid="landing-impact-cta"
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-[#0a0e1a] transition-all"
              style={{
                background: "linear-gradient(90deg, var(--neon-purple), var(--accent))",
                boxShadow: "0 0 20px rgba(168,85,247,0.4)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 30px rgba(34,211,238,0.6)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 0 20px rgba(168,85,247,0.4)")}
            >
              {t("land.impact.cta")}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="space-y-4">
            {[
              { num: t("land.impact.metric1.num"), label: t("land.impact.metric1.label"), border: "hover:border-cyan-300/30" },
              { num: t("land.impact.metric2.num"), label: t("land.impact.metric2.label"), border: "hover:border-fuchsia-400/30" },
              { num: t("land.impact.metric3.num"), label: t("land.impact.metric3.label"), border: "hover:border-cyan-300/30" },
            ].map((m, i) => (
              <div key={i} className={`glass glass-card rounded-2xl p-6 flex items-center gap-6 border border-white/10 ${m.border} transition-all`}>
                <div className="text-5xl sm:text-6xl font-black text-gradient tracking-tighter leading-none"
                     style={{ filter: "drop-shadow(0 0 10px rgba(34,211,238,0.5))" }}>
                  {m.num}
                </div>
                <div className="text-sm sm:text-base text-gray-300 font-medium">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({ t }) {
  return (
    <footer className="border-t py-10" style={{ borderColor: "rgba(255,255,255,0.06)", background: "#080b15" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
          {t("land.footer.badges").split("·").map((b, i) => (
            <span key={i}
                  className="text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full glass"
                  style={{ color: "var(--accent)", borderColor: "rgba(34,211,238,0.25)" }}>
              {b.trim()}
            </span>
          ))}
        </div>
        <p className="text-center text-xs text-gray-500 max-w-2xl mx-auto leading-relaxed">
          {t("land.footer.pdp")}
        </p>
        <div className="flex items-center justify-between mt-6 pt-6 border-t text-xs text-gray-500"
             style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2">
            <PKLogo size={22} />
            <span>{t("land.footer.copy")}</span>
          </div>
          <Link to="/login" className="hover:text-cyan-300 transition">{t("land.nav.signin")} →</Link>
        </div>
      </div>
    </footer>
  );
}

/* -------- Main -------- */

export default function Landing() {
  const { user, login } = useAuth();
  const { t, lang } = useT();
  const nav = useNavigate();
  const [autoLoading, setAutoLoading] = useState(null);

  if (user) return <Navigate to="/dashboard" replace />;

  // Set <html lang="..."> for downstream sections that peek at language
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang || "en";
  }

  const primaryCta = () => nav("/login");
  const scrollHow = () => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });

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

  // Split hero headline into "The truth: you're" + "blind" + "in your own marketplace."
  const heroText = t("login.hero"); // "The truth: you're blind in your own marketplace." or ID variant
  const keywordRe = /(blind|buta)/i;
  const match = heroText.match(keywordRe);
  let heroBefore = heroText, heroKey = "", heroAfter = "";
  if (match) {
    heroBefore = heroText.slice(0, match.index).trim();
    heroKey = match[0];
    heroAfter = heroText.slice(match.index + match[0].length).trim();
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden font-sans" style={{ background: "#0a0e1a", color: "#fff" }}>
      <AmbientOrbs />
      <Nav t={t} />

      {/* HERO */}
      <section className="relative pt-28 pb-16 lg:pt-32 lg:pb-20 overflow-hidden min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-5"
                   style={{ borderColor: "rgba(34,211,238,0.3)", boxShadow: "0 0 10px rgba(34,211,238,0.1)" }}>
                <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse-glow" style={{ color: "#22d3ee" }} />
                <span className="text-[10px] sm:text-xs font-bold tracking-widest text-gradient uppercase">
                  {t("land.hero.eyebrow")}
                </span>
              </div>

              <h1 className="font-black tracking-tight mb-5 text-white font-display"
                  style={{ fontSize: "clamp(38px, 5vw, 66px)", lineHeight: 1.08 }}>
                {heroBefore}{heroBefore ? <br /> : null}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">{heroKey}</span>
                {heroAfter ? ` ${heroAfter}` : null}
              </h1>

              <div className="space-y-3 text-sm sm:text-base text-gray-400 mb-7 max-w-xl font-light leading-relaxed">
                <p>{t("login.subhero")}</p>
                <p className="text-gray-300">
                  <strong className="text-white font-semibold">{t("login.solutionLead")}</strong>{" "}
                  {t("login.solutionBody")}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button
                  onClick={primaryCta}
                  data-testid="landing-hero-cta-primary"
                  className="px-7 py-3.5 rounded-xl text-sm font-bold text-[#0a0e1a] transition-all inline-flex items-center justify-center gap-2 group"
                  style={{
                    background: "linear-gradient(90deg, var(--accent), #67e8f9)",
                    boxShadow: "0 0 20px rgba(34,211,238,0.4)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 30px rgba(34,211,238,0.6)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 0 20px rgba(34,211,238,0.4)")}
                >
                  {t("land.hero.cta1")}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={scrollHow}
                  data-testid="landing-hero-cta-secondary"
                  className="px-7 py-3.5 rounded-xl text-sm font-semibold text-white glass hover:bg-white/10 transition inline-flex items-center justify-center gap-2"
                >
                  <PlayCircle className="w-5 h-5" style={{ color: "var(--neon-purple)" }} />
                  {t("land.hero.cta2")}
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 font-medium">
                  <span>{t("land.hero.tryAs")}</span>
                  <button
                    onClick={() => autoLogin("owner")}
                    disabled={autoLoading !== null}
                    data-testid="landing-demo-owner-btn"
                    className="px-3 py-1.5 glass rounded-md hover:border-cyan-300/50 hover:text-cyan-300 transition disabled:opacity-60"
                  >
                    {autoLoading === "owner" ? t("login.processing") : t("land.hero.demoOwner")}
                  </button>
                  <button
                    onClick={() => autoLogin("operator")}
                    disabled={autoLoading !== null}
                    data-testid="landing-demo-operator-btn"
                    className="px-3 py-1.5 glass rounded-md hover:border-cyan-300/50 hover:text-cyan-300 transition disabled:opacity-60"
                  >
                    {autoLoading === "operator" ? t("login.processing") : t("land.hero.demoOperator")}
                  </button>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs sm:text-sm text-gray-400">
                  {["land.chip.1","land.chip.2","land.chip.3","land.chip.4","land.chip.5"].map((k, i) => (
                    <li key={k} className={`flex items-start gap-2 ${i === 4 ? "sm:col-span-2" : ""}`}>
                      <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--accent)", filter: "drop-shadow(0 0 5px rgba(34,211,238,0.8))" }} />
                      {t(k)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right mockup */}
            <div className="lg:ml-4 mt-8 lg:mt-0">
              <Mockup t={t} />
            </div>
          </div>
        </div>
      </section>

      <HowItWorks t={t} />
      <Features t={t} />
      <Impact t={t} onCta={primaryCta} />
      <Footer t={t} />
    </div>
  );
}
