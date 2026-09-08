import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth.jsx";
import Onboarding from "@/components/Onboarding";
import {
  LayoutDashboard, Upload as UploadIcon, Users, Map, Sparkles,
  ClipboardList, Filter, Settings, Info, LogOut, MapPinned, Package, Clock, HelpCircle, ScrollText,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Ikhtisar", icon: LayoutDashboard, testId: "nav-dashboard", end: true },
  { to: "/upload", label: "Upload & Ekstraksi", icon: UploadIcon, testId: "nav-upload-ekstraksi" },
  { to: "/pelanggan", label: "Database Pelanggan", icon: Users, testId: "nav-database-pelanggan" },
  { to: "/peta", label: "Peta & Analisis Lokasi", icon: Map, testId: "nav-peta-lokasi" },
  { to: "/creator", label: "Analisis Creator", icon: Sparkles, testId: "nav-analisis-creator" },
  { to: "/produk", label: "Omset per Varian", icon: Package, testId: "nav-produk" },
  { to: "/reminder", label: "Segmen Reminder", icon: Clock, testId: "nav-reminder" },
  { to: "/perlu-ss", label: "Perlu Di-SS", icon: ClipboardList, testId: "nav-perlu-di-ss" },
  { to: "/segmen", label: "Segmen & Export", icon: Filter, testId: "nav-segmen-export" },
  { to: "/riwayat", label: "Riwayat Aktivitas", icon: ScrollText, testId: "nav-riwayat", ownerOnly: true },
  { to: "/pengaturan", label: "Pengaturan", icon: Settings, testId: "nav-pengaturan" },
  { to: "/tentang", label: "Tentang", icon: Info, testId: "nav-tentang" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("pp_onboarded")) {
      setShowOnboarding(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}      {/* Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0 border-r"
        style={{ background: "var(--bg-2)", borderColor: "var(--border)" }}
        data-testid="app-sidebar"
      >
        <div className="p-6 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
              <MapPinned className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-display font-extrabold text-lg tracking-tight text-stone-900">
                PelangganKu
              </div>
              <div className="text-[10px] uppercase tracking-wider text-stone-500">
                TikTok Shop CRM
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV.filter((n) => !n.ownerOnly || user?.role === "owner").map(({ to, label, icon: Icon, testId, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              data-testid={testId}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-stone-700 hover:bg-stone-100"
                }`
              }
              style={({ isActive }) => (isActive ? { background: "var(--accent)" } : {})}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="text-xs text-stone-600 mb-2 px-2">
            <div className="font-medium truncate">{user?.name || user?.email}</div>
            <div className="text-[10px] uppercase tracking-wider text-stone-400">
              {user?.role}
            </div>
          </div>
          <button
            onClick={logout}
            data-testid="btn-logout"
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-stone-100 text-stone-700"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
          <button
            onClick={() => setShowOnboarding(true)}
            data-testid="btn-open-onboarding"
            className="w-full flex items-center gap-2 px-3 py-2 mt-1 text-xs rounded-lg hover:bg-stone-100 text-stone-500"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Lihat panduan lagi
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center gap-2 px-4 py-3 border-b"
           style={{ background: "var(--bg-2)", borderColor: "var(--border)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
          <MapPinned className="w-4 h-4 text-white" />
        </div>
        <div className="font-display font-bold text-base">PelangganKu</div>
        <button onClick={logout} className="ml-auto text-xs text-stone-600 flex items-center gap-1"
                data-testid="btn-logout-mobile">
          <LogOut className="w-3.5 h-3.5" /> Keluar
        </button>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-5 border-t"
           style={{ background: "var(--bg-2)", borderColor: "var(--border)" }}>
        {NAV.slice(0, 5).map(({ to, label, icon: Icon, testId, end }) => (
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
            <span className="truncate max-w-full px-1">{label.split(" ")[0]}</span>
          </NavLink>
        ))}
      </nav>

      <main className="flex-1 min-w-0 pt-16 lg:pt-0 pb-20 lg:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
