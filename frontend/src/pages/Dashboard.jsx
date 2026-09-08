import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { Users, ShoppingBag, Repeat, MapPin, Upload as UploadIcon, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    api.get("/analytics/dashboard").then((r) => setStats(r.data));
    api.get("/customers").then((r) => setRecent(r.data.slice(0, 5)));
  }, []);

  const tiles = stats ? [
    { label: "Total Pelanggan", value: stats.total_customers, icon: Users, accent: "#C2410C" },
    { label: "Total Pesanan", value: stats.total_orders, icon: ShoppingBag, accent: "#D97706" },
    { label: "Pembeli Berulang", value: `${stats.repeat_pct}%`, icon: Repeat, accent: "#B45309" },
    { label: "Kota Terjangkau", value: stats.total_kota, icon: MapPin, accent: "#7C2D12" },
  ] : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8" data-testid="dashboard-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">Ikhtisar</div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
            Performa Pelanggan Anda
          </h1>
          <p className="text-stone-600 mt-2 max-w-xl">
            Ringkasan pelanggan yang sudah masuk database dari screenshot & CSV TikTok Shop.
          </p>
        </div>
        <Link to="/upload" data-testid="dashboard-upload-cta"
              className="pp-btn-primary rounded-lg px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 self-start">
          <UploadIcon className="w-4 h-4" /> Upload Screenshot Baru
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {tiles.map((t) => (
          <div key={t.label} className="pp-card p-4 sm:p-5" data-testid={`tile-${t.label.replaceAll(" ", "-").toLowerCase()}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                   style={{ background: `${t.accent}15` }}>
                <t.icon className="w-4 h-4" style={{ color: t.accent }} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-display font-extrabold text-stone-900 tracking-tight">
              {t.value ?? "-"}
            </div>
            <div className="text-xs text-stone-500 mt-1 uppercase tracking-wider">{t.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 pp-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-stone-900">Pelanggan Terbaru</h2>
            <Link to="/pelanggan" className="text-xs text-orange-700 flex items-center gap-1 hover:underline">
              Lihat semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="text-sm text-stone-500 py-8 text-center">
              Belum ada pelanggan. <Link to="/upload" className="pp-link">Upload screenshot pertama</Link>.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {recent.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium text-stone-900">{c.recipient_name}</div>
                    <div className="text-xs text-stone-500">
                      {c.kota || "-"} · {c.provinsi || "-"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs text-stone-700">{c.phone}</div>
                    {c.is_repeat && (
                      <span className="pp-badge mt-1" style={{ background: "#DCFCE7", color: "#166534", borderColor: "#86EFAC" }}>
                        Berulang ×{c.order_count}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pp-card p-5">
          <h2 className="font-display font-bold text-lg text-stone-900 mb-3">Aksi Cepat</h2>
          <div className="space-y-2 text-sm">
            <Link to="/peta" className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-stone-50 border border-stone-200">
              <span>Lihat peta lokasi pembeli</span>
              <ArrowRight className="w-4 h-4 text-orange-700" />
            </Link>
            <Link to="/creator" className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-stone-50 border border-stone-200">
              <span>Analisis creator affiliate</span>
              <ArrowRight className="w-4 h-4 text-orange-700" />
            </Link>
            <Link to="/segmen" className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-stone-50 border border-stone-200">
              <span>Buat segmen & export WA</span>
              <ArrowRight className="w-4 h-4 text-orange-700" />
            </Link>
            <Link to="/perlu-ss" className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-stone-50 border border-stone-200">
              <span>Cek pesanan yang perlu di-SS</span>
              <ArrowRight className="w-4 h-4 text-orange-700" />
            </Link>
          </div>
          {stats?.top_provinsi && (
            <div className="mt-4 p-3 rounded-lg" style={{ background: "var(--accent-light)" }}>
              <div className="text-xs uppercase tracking-wider text-orange-800 font-semibold mb-1">Provinsi Teratas</div>
              <div className="font-display font-bold text-lg text-stone-900">{stats.top_provinsi.name}</div>
              <div className="text-xs text-stone-600">{stats.top_provinsi.count} pelanggan</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
