import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth.jsx";
import { Navigate } from "react-router-dom";
import { ScrollText, User, Filter } from "lucide-react";
import { formatDateShortID } from "@/lib/format";
import { useT } from "@/lib/i18n.jsx";

const ACTION_KEYS = {
  "orders.save": { key: "au.act.orders_save", color: "#0369A1" },
  "customer.update": { key: "au.act.customer_update", color: "#166534" },
  "customer.bulk": { key: "au.act.customer_bulk", color: "#166534" },
  "norm.create": { key: "au.act.norm_create", color: "#B45309" },
  "norm.delete": { key: "au.act.norm_delete", color: "#991B1B" },
  "tag.create": { key: "au.act.tag_create", color: "#B45309" },
  "tag.update": { key: "au.act.tag_update", color: "#B45309" },
  "tag.delete": { key: "au.act.tag_delete", color: "#991B1B" },
  "csv.import": { key: "au.act.csv_import", color: "#7C2D12" },
  "vision.zip": { key: "au.act.vision_zip", color: "#C2410C" },
  "setting.update": { key: "au.act.setting_update", color: "#B45309" },
  "user.create": { key: "au.act.user_create", color: "#166534" },
};

function formatTime(iso, lang) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(lang === "en" ? "en-GB" : "id-ID", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch { return iso; }
}

function detailsSummary(d, yesNo) {
  if (!d || typeof d !== "object") return "";
  return Object.entries(d)
    .filter(([, v]) => v !== null && v !== "" && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.length + " item" : typeof v === "boolean" ? (v ? yesNo[0] : yesNo[1]) : String(v).slice(0, 60)}`)
    .join(" · ");
}

export default function AuditLog() {
  const { t, lang } = useT();
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

  if (!isOwner) return <Navigate to="/dashboard" replace />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5" data-testid="audit-page">
      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">{t("au.section")}</div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
          {t("au.heading")}
        </h1>
        <p className="text-stone-600 mt-2">{t("au.sub")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-xs uppercase tracking-wider text-stone-500 mr-2">
          <Filter className="w-3 h-3" /> {t("au.filter")}
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
                className="pp-input rounded-lg px-3 py-1.5 text-sm" data-testid="audit-action-filter">
          <option value="">{t("au.allActions", { n: logs.length })}</option>
          {actions.map((a) => (
            <option key={a.action} value={a.action}>
              {(ACTION_KEYS[a.action] && t(ACTION_KEYS[a.action].key)) || a.action} ({a.count})
            </option>
          ))}
        </select>
        <select value={actorFilter} onChange={(e) => setActorFilter(e.target.value)}
                className="pp-input rounded-lg px-3 py-1.5 text-sm" data-testid="audit-actor-filter">
          <option value="">{t("au.allUsers")}</option>
          {actors.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        {(actionFilter || actorFilter) && (
          <button onClick={() => { setActionFilter(""); setActorFilter(""); }} className="text-xs pp-link">
            {t("au.reset")}
          </button>
        )}
      </div>

      <div className="pp-table-scroll" data-testid="audit-table">
        <table className="pp-table">
          <thead>
            <tr>
              <th style={{ width: 180 }}>{t("au.col.time")}</th>
              <th>{t("au.col.user")}</th>
              <th>{t("au.col.action")}</th>
              <th>{t("au.col.detail")}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => {
              const meta = ACTION_KEYS[l.action] ? { text: t(ACTION_KEYS[l.action].key), color: ACTION_KEYS[l.action].color } : { text: l.action, color: "#57534E" };
              return (
                <tr key={l.id}>
                  <td className="text-xs text-stone-600 font-mono">{formatTime(l.created_at, lang)}</td>
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
                    {detailsSummary(l.details, [t("common.yes"), t("common.no")]) || <span className="text-stone-400">—</span>}
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
            {t("au.empty")}
          </div>
        )}
      </div>
    </div>
  );
}
