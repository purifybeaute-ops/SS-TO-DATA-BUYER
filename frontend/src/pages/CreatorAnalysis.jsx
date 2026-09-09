import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import ReactECharts from "echarts-for-react";
import { Sparkles, Tag } from "lucide-react";
import { useT } from "@/lib/i18n.jsx";

export default function CreatorAnalysis() {
  const { t } = useT();
  const [data, setData] = useState({ creators: [], niche_summary: [] });
  const [nicheMap, setNicheMap] = useState({}); // handle -> niche
  const [editing, setEditing] = useState({});

  const load = () =>
    api.get("/creators").then((r) => {
      setData(r.data);
      const m = {};
      r.data.creators.forEach((c) => { if (c.handle) m[c.handle] = c.niche || ""; });
      setNicheMap(m);
    });
  useEffect(() => { load(); }, []);

  const saveNiche = async (handle) => {
    await api.post("/creators/niche", { handle, niche: nicheMap[handle] || "" });
    toast.success(t("cr.nicheSaved", { h: handle }));
    setEditing((p) => ({ ...p, [handle]: false }));
    load();
  };

  const chartOpt = {
    grid: { left: 130, right: 20, top: 10, bottom: 20 },
    xAxis: { type: "value", splitLine: { lineStyle: { color: "#EDE8DE" } } },
    yAxis: {
      type: "category",
      data: data.creators.slice(0, 12).map((c) => c.is_organic ? t("cr.organic") : `@${c.handle}`).reverse(),
      axisLabel: { fontFamily: "Plus Jakarta Sans", fontSize: 11 },
    },
    tooltip: { trigger: "axis" },
    series: [{
      type: "bar",
      data: data.creators.slice(0, 12).map((c) => c.total_orders).reverse(),
      itemStyle: { color: "#C2410C", borderRadius: [0, 6, 6, 0] },
      barWidth: 14,
    }],
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5" data-testid="creator-page">
      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">{t("cr.section")}</div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
          {t("cr.heading")}
        </h1>
        <p className="text-stone-600 mt-2">{t("cr.sub")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 pp-card p-5">
          <h3 className="font-display font-bold text-base mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-700" /> {t("cr.rank")}
          </h3>
          {data.creators.length ? <ReactECharts option={chartOpt} style={{ height: 340 }} /> : <EmptyBlock />}
        </div>
        <div className="pp-card p-5">
          <h3 className="font-display font-bold text-base mb-2 flex items-center gap-2">
            <Tag className="w-4 h-4 text-orange-700" /> {t("cr.niche")}
          </h3>
          {data.niche_summary.length ? (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {data.niche_summary.map((n, i) => (
                <div key={n.niche} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 text-xs w-5">#{i + 1}</span>
                    <span className="text-stone-800">{n.niche}</span>
                  </div>
                  <span className="font-mono font-semibold">{n.orders}</span>
                </div>
              ))}
            </div>
          ) : <EmptyBlock />}
        </div>
      </div>

      <div className="pp-table-scroll" data-testid="creator-table">
        <table className="pp-table">
          <thead>
            <tr>
              <th>{t("cr.col.creator")}</th>
              <th>{t("cr.col.niche")}</th>
              <th className="text-right">{t("cr.col.totalOrder")}</th>
              <th className="text-right">{t("cr.col.uniqueBuyer")}</th>
              <th className="text-right">{t("cr.col.repeatPct")}</th>
              <th>{t("cr.col.topCity")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.creators.map((c) => {
              const key = c.is_organic ? "__organic__" : c.handle;
              return (
                <tr key={key}>
                  <td>
                    {c.is_organic ? (
                      <span className="italic text-stone-500">{t("cr.organicRow")}</span>
                    ) : (
                      <span className="font-mono font-medium">@{c.handle}</span>
                    )}
                  </td>
                  <td>
                    {c.is_organic ? "—" : editing[c.handle] ? (
                      <input
                        value={nicheMap[c.handle] || ""}
                        onChange={(e) => setNicheMap((p) => ({ ...p, [c.handle]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && saveNiche(c.handle)}
                        className="pp-input rounded px-2 py-1 text-xs w-40"
                        placeholder={t("cr.nichePlaceholder")}
                        autoFocus
                      />
                    ) : (
                      <span className="text-stone-700 text-xs">{c.niche || <span className="text-stone-400">{t("cr.nicheDash")}</span>}</span>
                    )}
                  </td>
                  <td className="text-right font-mono font-semibold">{c.total_orders}</td>
                  <td className="text-right font-mono">{c.unique_buyers}</td>
                  <td className="text-right font-mono">{c.repeat_pct}%</td>
                  <td className="text-xs text-stone-600">{c.top_cities.map(([k, v]) => `${k} (${v})`).join(", ") || "-"}</td>
                  <td>
                    {!c.is_organic && (
                      editing[c.handle] ? (
                        <button onClick={() => saveNiche(c.handle)} className="text-xs pp-link">{t("common.save")}</button>
                      ) : (
                        <button onClick={() => setEditing((p) => ({ ...p, [c.handle]: true }))} className="text-xs pp-link"
                                data-testid={`edit-niche-${c.handle}`}>
                          {t("cr.setNiche")}
                        </button>
                      )
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {data.creators.length === 0 && (
          <div className="text-center py-12 text-sm text-stone-500">{t("cr.emptyTable")}</div>
        )}
      </div>
    </div>
  );
}

function EmptyBlock() {
  const { t } = useT();
  return <div className="py-8 text-center text-sm text-stone-500">{t("common.empty")}</div>;
}
