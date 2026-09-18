import { Outlet, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth.jsx";
import { useT } from "@/lib/i18n";
import Onboarding from "@/components/Onboarding";
import PKLogo from "@/components/PKLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  LayoutDashboard, Upload as UploadIcon, Users, Map, Sparkles,
  ClipboardList, Filter, Settings, Info, LogOut, Package, Clock, HelpCircle, ScrollText,
} from "lucide-react";

const NAV = [
  { to: "/dashboard", key: "nav.dashboard", icon: LayoutDashboard, testId: "nav-dashboard", end: true },
  { to: "/dashboard/upload", key: "nav.upload", icon: UploadIcon, testId: "nav-upload-ekstraksi" },
  { to: "/dashboard/pelanggan", key: "nav.customers", icon: Users, testId: "nav-database-pelanggan" },
  { to: "/dashboard/peta", key: "nav.map", icon: Map, testId: "nav-peta-lokasi" },
  { to: "/dashboard/creator", key: "nav.creator", icon: Sparkles, testId: "nav-analisis-creator" },
  { to: "/dashboard/produk", key: "nav.products", icon: Package, testId: "nav-produk" },
  { to: "/dashboard/reminder", key: "nav.reminder", icon: Clock, testId: "nav-reminder" },
  { to: "/dashboard/perlu-ss", key: "nav.perluss", icon: ClipboardList, testId: "nav-perlu-di-ss" },
  { to: "/dashboard/segmen", key: "nav.segmen", icon: Filter, testId: "nav-segmen-export" },
  { to: "/dashboard/riwayat", key: "nav.audit", icon: ScrollText, testId: "nav-riwayat", ownerOnly: true },
  { to: "/dashboard/pengaturan", key: "nav.settings", icon: Settings, testId: "nav-pengaturan" },
  { to: "/dashboard/tentang", key: "nav.about", icon: Info, testId: "nav-tentang" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { t } = useT();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("pp_onboarded")) setShowOnboarding(true);
  }, []);

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}

      <aside
        className="hidden lg:flex flex-col w-64 shrink-0 border-r"
        style={{ background: "var(--bg-2)", borderColor: "var(--border)" }}
        data-testid="app-sidebar"
      >
        <div className="p-6 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2.5">
            <PKLogo size={40} />
            <div>
              <div className="font-display font-extrabold text-lg tracking-tight text-stone-900">
                PelangganKu
              </div>
              <div className="text-[10px] uppercase tracking-wider text-stone-500">
                {t("brand.tagline")}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV.filter((n) => !n.ownerOnly || user?.role === "owner").map(({ to, key, icon: Icon, testId, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              data-testid={testId}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? "text-white" : "text-stone-700 hover:bg-stone-100"
                }`
              }
              style={({ isActive }) => (isActive ? { background: "var(--accent)" } : {})}
            >
              <Icon className="w-4 h-4" />
              <span>{t(key)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between px-2">
            <div className="text-xs text-stone-600 min-w-0">
              <div className="font-medium truncate">{user?.name || user?.email}</div>
              <div className="text-[10px] uppercase tracking-wider text-stone-400">{user?.role}</div>
            </div>
            <LanguageSwitcher />
          </div>
          <button
            onClick={logout}
            data-testid="btn-logout"
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-stone-100 text-stone-700"
          >
            <LogOut className="w-4 h-4" /> {t("common.logout")}
          </button>
          <button
            onClick={() => setShowOnboarding(true)}
            data-testid="btn-open-onboarding"
            className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-stone-100 text-stone-500"
          >
            <HelpCircle className="w-3.5 h-3.5" /> {t("common.showGuide")}
          </button>
        </div>
      </aside>

      <div className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center gap-2 px-4 py-3 border-b"
           style={{ background: "var(--bg-2)", borderColor: "var(--border)" }}>
        <PKLogo size={32} />
        <div className="font-display font-bold text-base">PelangganKu</div>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher variant="compact" />
          <button onClick={logout} className="text-xs text-stone-600 flex items-center gap-1"
                  data-testid="btn-logout-mobile">
            <LogOut className="w-3.5 h-3.5" /> {t("common.logout")}
          </button>
        </div>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-5 border-t"
           style={{ background: "var(--bg-2)", borderColor: "var(--border)" }}>
        {NAV.slice(0, 5).map(({ to, key, icon: Icon, testId, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            data-testid={`${testId}-mobile`}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 text-[10px] ${
                isActive ? "text-orange-700 font-semibold" : "text-stone-600"
              }`
            }
          >
            <Icon className="w-4 h-4 mb-0.5" />
            <span className="truncate max-w-full px-1">{t(key).split(" ")[0]}</span>
          </NavLink>
        ))}
      </nav>

      <main className="flex-1 min-w-0 pt-16 lg:pt-0 pb-20 lg:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
