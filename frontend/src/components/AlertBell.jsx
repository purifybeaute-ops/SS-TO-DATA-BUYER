import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Users, Heart, MapPin, Sparkles, X } from "lucide-react";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";

/**
 * AlertBell — small bell icon showing count of new influential buyers
 * (TikTok followers >= 100K). Click opens a dropdown. "Mark all read"
 * updates the per-user last-seen timestamp on the backend.
 */
export default function AlertBell() {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unseen, setUnseen] = useState(0);
  const ref = useRef(null);

  const fetchAlerts = async () => {
    try {
      const r = await api.get("/alerts/influential?limit=25");
      setItems(r.data.items || []);
      setUnseen(r.data.unseen || 0);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchAlerts();
    const iv = setInterval(fetchAlerts, 60_000); // refresh 1 min
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const markRead = async () => {
    await api.post("/alerts/mark-read");
    setUnseen(0);
    setItems((prev) => prev.map((it) => ({ ...it, is_new: false })));
  };

  const fmtCount = (n) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        data-testid="alert-bell-btn"
        className="relative w-9 h-9 rounded-lg flex items-center justify-center transition"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}
        aria-label={t("alerts.title")}
      >
        <Bell className="w-4 h-4" style={{ color: unseen > 0 ? "var(--accent)" : "#94a3b8" }} />
        {unseen > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse-glow"
            style={{ background: "linear-gradient(90deg, #22d3ee, #a855f7)", color: "#0a0e1a" }}
            data-testid="alert-bell-count"
          >
            {unseen > 99 ? "99+" : unseen}
          </span>
        )}
      </button>

      {open && (
        <div
          data-testid="alert-bell-panel"
          className="fixed bottom-20 left-4 lg:left-20 w-[360px] rounded-xl overflow-hidden z-[60] glass"
          style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)" }}
        >
          <div className="px-4 py-3 border-b flex items-center justify-between"
               style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-gradient">
                {t("alerts.title")}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">{t("alerts.subtitle")}</div>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-40" />
              {t("alerts.empty")}
            </div>
          ) : (
            <>
              <ul className="max-h-[380px] overflow-y-auto divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                {items.map((it) => (
                  <li key={it.id} className={`px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition ${it.is_new ? "bg-white/[0.03]" : ""}`}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                         style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)", boxShadow: "0 0 10px rgba(168,85,247,0.4)" }}>
                      {(it.name || "?").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to="/dashboard/pelanggan"
                          onClick={() => setOpen(false)}
                          data-testid={`alert-item-${it.id}`}
                          className="text-sm font-semibold text-white hover:text-cyan-300 truncate"
                        >
                          {it.name}
                        </Link>
                        {it.is_new && (
                          <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                                style={{ background: "rgba(34,211,238,0.15)", color: "var(--accent)", border: "1px solid rgba(34,211,238,0.3)" }}>
                            {t("alerts.new")}
                          </span>
                        )}
                      </div>
                      {it.handle && (
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">@{it.handle}</div>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-300 font-mono">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3 text-cyan-300" /> {fmtCount(it.followers)}</span>
                        {it.likes > 0 && <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-purple-300" /> {fmtCount(it.likes)}</span>}
                        {(it.kota || it.provinsi) && (
                          <span className="flex items-center gap-1 text-gray-400"><MapPin className="w-3 h-3" /> {it.kota || it.provinsi}</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="px-4 py-2 border-t flex items-center justify-between text-xs"
                   style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                <span className="text-gray-500">{t("alerts.threshold")}</span>
                <button
                  onClick={markRead}
                  data-testid="alert-mark-read"
                  disabled={unseen === 0}
                  className="text-cyan-300 hover:text-cyan-200 font-semibold disabled:opacity-40 disabled:cursor-default"
                >
                  {t("alerts.markRead")}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
