import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth.jsx";
import { Navigate } from "react-router-dom";
import { ScrollText, User, Filter } from "lucide-react";
import { formatDateShortID } from "@/lib/format";

const ACTION_LABEL = {
  "orders.save": { text: "Simpan pesanan", color: "#0369A1" },
  "customer.update": { text: "Update pelanggan", color: "#166534" },
  "customer.bulk": { text: "Aksi bulk pelanggan", color: "#166534" },
  "norm.create": { text: "Tambah aturan wilayah", color: "#B45309" },
  "norm.delete": { text: "Hapus aturan wilayah", color: "#991B1B" },
  "tag.create": { text: "Tambah tag", color: "#B45309" },
  "tag.update": { text: "Update tag", color: "#B45309" },
  "tag.delete": { text: "Hapus tag", color: "#991B1B" },
  "csv.import": { text: "Import CSV", color: "#7C2D12" },
  "vision.zip": { text: "Upload ZIP screenshot", color: "#C2410C" },
  "setting.update": { text: "Update pengaturan", color: "#B45309" },
  "user.create": { text: "Tambah operator", color: "#166534" },
};

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("id-ID", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch { return iso; }
}

function detailsSummary(d) {
  if (!d || typeof d !== "object") return "";
  return Object.entries(d)
    .filter(([, v]) => v !== null && v !== "" && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.length + " item" : typeof v === "boolean" ? (v ? "ya" : "tidak") : String(v).slice(0, 60)}`)
    .join(" · ");
}

export default function AuditLog() {
  const { isOwner } = useAuth();
  const [logs, setLogs] = useState([]);
  const [actions, setActions] = useState([]);
  const [actionFilter, setActionFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");

  useEffect(() => {
    if (!isOwner) return;
    const p = new URLSearchParams();
    if (actionFilter) p.append("action", actionFilter);
    if (actorFilter) p.append("actor", actorFilter);
    api.get(`/audit?${p}`).then((r) => {
      setLogs(r.data.logs);
      setActions(r.data.actions);
    });
  }, [isOwner, actionFilter, actorFilter]);

  const actors = useMemo(() => {
    const set = new Set(logs.map((l) => l.actor_email).filter(Boolean));
    return Array.from(set);
  }, [logs]);

  if (!isOwner) return <Navigate to="/" replace />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5" data-testid="audit-page">
      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">Audit Trail</div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
          Riwayat Aktivitas
        </h1>
        <p className="text-stone-600 mt-2">Semua aksi mutasi yang dilakukan owner & operator, terurut dari terbaru.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-xs uppercase tracking-wider text-stone-500 mr-2">
          <Filter className="w-3 h-3" /> Filter
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
                className="pp-input rounded-lg px-3 py-1.5 text-sm" data-testid="audit-action-filter">
          <option value="">Semua aksi ({logs.length})</option>
          {actions.map((a) => (
            <option key={a.action} value={a.action}>
              {ACTION_LABEL[a.action]?.text || a.action} ({a.count})
            </option>
          ))}
        </select>
        <select value={actorFilter} onChange={(e) => setActorFilter(e.target.value)}
                className="pp-input rounded-lg px-3 py-1.5 text-sm" data-testid="audit-actor-filter">
          <option value="">Semua user</option>
          {actors.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        {(actionFilter || actorFilter) && (
          <button onClick={() => { setActionFilter(""); setActorFilter(""); }} className="text-xs pp-link">
            Reset
          </button>
        )}
      </div>

      <div className="pp-table-scroll" data-testid="audit-table">
        <table className="pp-table">
          <thead>
            <tr>
              <th style={{ width: 180 }}>Waktu</th>
              <th>User</th>
              <th>Aksi</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => {
              const meta = ACTION_LABEL[l.action] || { text: l.action, color: "#57534E" };
              return (
                <tr key={l.id}>
                  <td className="text-xs text-stone-600 font-mono">{formatTime(l.created_at)}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-stone-400" />
                      <div>
                        <div className="text-xs font-medium text-stone-900">{l.actor_email}</div>
                        <div className="text-[10px] uppercase tracking-wider text-stone-400">{l.actor_role}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="pp-badge" style={{ background: `${meta.color}18`, color: meta.color, borderColor: `${meta.color}55` }}>
                      {meta.text}
                    </span>
                  </td>
                  <td className="text-xs text-stone-700 max-w-md">
                    {detailsSummary(l.details) || <span className="text-stone-400">—</span>}
                    {l.target_id && <span className="text-stone-400 ml-2 font-mono">#{l.target_id.slice(0, 8)}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div className="py-12 text-center text-sm text-stone-500">
            <ScrollText className="w-8 h-8 mx-auto text-stone-300 mb-2" />
            Belum ada aktivitas tercatat.
          </div>
        )}
      </div>
    </div>
  );
}
