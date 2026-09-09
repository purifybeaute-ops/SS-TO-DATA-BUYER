import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import ReactECharts from "echarts-for-react";
import { Package, MapPin } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { useT } from "@/lib/i18n.jsx";

export default function ProductRevenue() {
  const { t } = useT();
  const [data, setData] = useState({ products: [], total_revenue: 0, total_orders: 0 });
  const [kotaList, setKotaList] = useState([]);
  const [provList, setProvList] = useState([]);
  const [filterKota, setFilterKota] = useState("");
  const [filterProv, setFilterProv] = useState("");

  useEffect(() => {
    api.get("/analytics/regions?source=csv").then((r) => {
      setKotaList(r.data.kota.map((x) => x.name));
      setProvList(r.data.provinsi.map((x) => x.name));
    });
  }, []);

  useEffect(() => {
    const p = new URLSearchParams();
    if (filterKota) p.append("kota", filterKota);
    if (filterProv) p.append("provinsi", filterProv);
    api.get(`/analytics/products?${p}`).then((r) => setData(r.data));
  }, [filterKota, filterProv]);

  const chartOpt = useMemo(() => ({
    grid: { left: 160, right: 20, top: 10, bottom: 30 },
    xAxis: {
      type: "value",
      axisLabel: {
        formatter: (v) => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}rb` : v,
        fontFamily: "Plus Jakarta Sans",
      },
      splitLine: { lineStyle: { color: "#EDE8DE" } },
    },
    yAxis: {
      type: "category",
      data: data.products.slice(0, 12).map((p) => p.variation).reverse(),
      axisLabel: { fontFamily: "Plus Jakarta Sans", fontSize: 11 },
    },
    tooltip: {
      trigger: "axis",
      formatter: (params) => {
        const p = params[0];
        return `<b>${p.name}</b><br/>${t("pr.totalOmset")}: <b>${formatRupiah(p.value)}</b>`;
      },
    },
    series: [{
      type: "bar",
      data: data.products.slice(0, 12).map((p) => p.revenue).reverse(),
      itemStyle: { color: "#C2410C", borderRadius: [0, 6, 6, 0] },
      barWidth: 14,
    }],
  }), [data.products]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5" data-testid="produk-page">
      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">{t("pr.section")}</div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
          {t("pr.heading")}
        </h1>
        <p className="text-stone-600 mt-2">
          {t("pr.sub")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={filterProv} onChange={(e) => setFilterProv(e.target.value)}
                className="pp-input rounded-lg px-3 py-1.5 text-sm" data-testid="prod-filter-prov">
          <option value="">{t("pr.allProv")}</option>
          {provList.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterKota} onChange={(e) => setFilterKota(e.target.value)}
                className="pp-input rounded-lg px-3 py-1.5 text-sm" data-testid="prod-filter-kota">
          <option value="">{t("pr.allKota")}</option>
          {kotaList.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        {(filterKota || filterProv) && (
          <button onClick={() => { setFilterKota(""); setFilterProv(""); }} className="text-xs pp-link">
            {t("pr.resetFilter")}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Tile label={t("pr.totalOmset")} value={formatRupiah(data.total_revenue)} accent="#C2410C" />
        <Tile label={t("pr.totalOrder")} value={data.total_orders} accent="#D97706" />
        <Tile label={t("pr.variantCount")} value={data.products.length} accent="#B45309" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 pp-card p-5">
          <h3 className="font-display font-bold text-base mb-2 flex items-center gap-2">
            <Package className="w-4 h-4 text-orange-700" /> {t("pr.rankByRev")}
          </h3>
          {data.products.length ? (
            <ReactECharts option={chartOpt} style={{ height: 340 }} />
          ) : (
            <div className="py-10 text-center text-sm text-stone-500">
              {t("pr.emptyChart")} <a href="/perlu-ss" className="pp-link">{t("pr.importHere")}</a>.
            </div>
          )}
        </div>
        <div className="pp-card p-5">
          <h3 className="font-display font-bold text-base mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-700" /> {t("pr.topCity")}
          </h3>
          {data.products.slice(0, 5).length ? (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {data.products.slice(0, 5).map((p) => (
                <div key={p.variation}>
                  <div className="text-sm font-medium text-stone-900">{p.variation}</div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    {p.top_cities.length ? p.top_cities.map(([k, v]) => `${k} (${v})`).join(" · ") : "-"}
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="py-6 text-center text-sm text-stone-500">-</div>}
        </div>
      </div>

      <div className="pp-table-scroll" data-testid="products-table">
        <table className="pp-table">
          <thead>
            <tr>
              <th>{t("pr.col.variation")}</th>
              <th className="text-right">{t("pr.col.order")}</th>
              <th className="text-right">{t("pr.col.qty")}</th>
              <th className="text-right">{t("pr.col.revenue")}</th>
              <th>{t("pr.col.topCity")}</th>
            </tr>
          </thead>
          <tbody>
            {data.products.map((p) => (
              <tr key={p.variation}>
                <td className="font-medium">{p.variation}</td>
                <td className="text-right font-mono">{p.orders}</td>
                <td className="text-right font-mono">{p.qty}</td>
                <td className="text-right font-mono font-semibold">{formatRupiah(p.revenue)}</td>
                <td className="text-xs text-stone-600">
                  {p.top_cities.map(([k, v]) => `${k} (${v})`).join(", ") || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.products.length === 0 && (
          <div className="text-center py-12 text-sm text-stone-500">{t("pr.emptyTable")}</div>
        )}
      </div>
    </div>
  );
}

function Tile({ label, value, accent }) {
  return (
    <div className="pp-card p-4">
      <div className="w-8 h-8 rounded-md flex items-center justify-center mb-2" style={{ background: `${accent}15` }}>
        <Package className="w-4 h-4" style={{ color: accent }} />
      </div>
      <div className="text-xl sm:text-2xl font-display font-extrabold text-stone-900">{value}</div>
      <div className="text-xs text-stone-500 mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}
