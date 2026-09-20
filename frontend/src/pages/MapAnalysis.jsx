import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { MapPin, Layers, AlertTriangle } from "lucide-react";
import { useT } from "@/lib/i18n.jsx";

// Peta wilayah Indonesia.
// Berkas lokal didahulukan supaya aplikasi terinstal tetap menampilkan peta
// saat komputer sedang offline. Dua alamat internet di bawahnya hanya
// cadangan kalau berkas lokal belum ikut terbungkus.
const GEO_URLS = [
  "/data/indonesia-prov.geojson",
  "https://cdn.jsdelivr.net/gh/superpikar/indonesia-geojson@master/indonesia-prov.geojson",
  "https://raw.githubusercontent.com/superpikar/indonesia-geojson/master/indonesia-prov.geojson",
];

// Try to detect province name property in a GeoJSON feature
function pickPropName(props) {
  return (
    props.Propinsi ||
    props.PROPINSI ||
    props.name ||
    props.NAME_1 ||
    props.state ||
    props.province ||
    props.provinsi ||
    ""
  );
}

// Normalize map name -> our normalized Indonesian name for join key
const MAP_NAME_ALIAS = {
  "DI Yogyakarta": "Daerah Istimewa Yogyakarta",
  "Yogyakarta": "Daerah Istimewa Yogyakarta",
  "Bangka Belitung": "Kepulauan Bangka Belitung",
  "Kep. Bangka Belitung": "Kepulauan Bangka Belitung",
  "Kep. Riau": "Kepulauan Riau",
};

const COLOR_SCALE = ["#164e63", "#0e7490", "#0891b2", "#22d3ee", "#67e8f9"];

// Cyan → purple gradient reused for bar charts on dark theme
const barGradient = () => new echarts.graphic.LinearGradient(0, 0, 1, 0, [
  { offset: 0, color: "#22d3ee" },
  { offset: 0.5, color: "#60a5fa" },
  { offset: 1, color: "#a855f7" },
]);
const AXIS_LINE = "rgba(255,255,255,0.12)";
const AXIS_SPLIT = "rgba(255,255,255,0.06)";
const AXIS_TEXT = "#cbd5e1";

export default function MapAnalysis() {
  const { t } = useT();
  const [source, setSource] = useState("both");
  const [data, setData] = useState({ provinsi: [], kota: [], kecamatan: [], repeat_kota: [] });
  const [dashboard, setDashboard] = useState(null);
  const [tags, setTags] = useState([]);
  const [tagFilter, setTagFilter] = useState("");
  const [selectedProv, setSelectedProv] = useState(null);
  const [selectedKota, setSelectedKota] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [unmatched, setUnmatched] = useState([]);
  const [mapError, setMapError] = useState(false);
  const [geoProps, setGeoProps] = useState([]); // list of names present in GeoJSON

  useEffect(() => {
    api.get("/tags").then((r) => setTags(r.data));
    api.get("/analytics/dashboard").then((r) => setDashboard(r.data));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ source });
    if (tagFilter) params.append("tag_id", tagFilter);
    if (selectedProv) params.append("provinsi", selectedProv);
    if (selectedKota) params.append("kota", selectedKota);
    api.get(`/analytics/regions?${params}`).then((r) => setData(r.data));
  }, [source, tagFilter, selectedProv, selectedKota]);

  // Register Indonesia map once
  useEffect(() => {
    (async () => {
      for (const url of GEO_URLS) {
        try {
          const resp = await fetch(url);
          if (!resp.ok) continue;
          const gj = await resp.json();
          echarts.registerMap("indonesia", gj);
          const names = gj.features.map((f) => pickPropName(f.properties));
          setGeoProps(names);
          setMapReady(true);
          return;
        } catch (e) {
          continue;
        }
      }
      setMapError(true);
    })();
  }, []);

  // Compute unmatched normalized names vs geojson
  useEffect(() => {
    if (!mapReady || geoProps.length === 0) return;
    const geoNormSet = new Set(geoProps.map((n) => (MAP_NAME_ALIAS[n] || n).toLowerCase()));
    const um = data.provinsi.filter((p) => {
      const nm = (p.name || "").toLowerCase();
      // Also check without "Provinsi " prefix
      return !geoNormSet.has(nm) && !geoNormSet.has(nm.replace(/^provinsi\s+/, ""));
    });
    setUnmatched(um);
  }, [data.provinsi, mapReady, geoProps]);

  const total = data.provinsi.reduce((s, p) => s + p.count, 0);

  const mapOption = useMemo(() => {
    if (!mapReady) return {};
    // Build map value by matching normalized name -> geojson property name
    const provMap = {};
    for (const p of data.provinsi) provMap[p.name.toLowerCase()] = p.count;

    const mapData = geoProps.map((rawName) => {
      const key = (MAP_NAME_ALIAS[rawName] || rawName).toLowerCase();
      const value = provMap[key] || 0;
      return { name: rawName, value };
    });
    const maxVal = Math.max(1, ...mapData.map((d) => d.value));

    return {
      tooltip: {
        trigger: "item",
        backgroundColor: "#121828",
        borderColor: "rgba(255,255,255,0.1)",
        textStyle: { color: "#fff" },
        formatter: (p) => {
          const pct = total ? ((p.value / total) * 100).toFixed(1) : 0;
          return `<div style="font-family: 'Plus Jakarta Sans'; color:#fff"><b>${p.name}</b><br/>${t("map.tooltip.buyers")}: <b>${p.value || 0}</b><br/>${pct}% ${t("map.tooltip.pct")}</div>`;
        },
      },
      visualMap: {
        min: 0,
        max: maxVal,
        left: 10,
        bottom: 20,
        text: [t("map.legend.many"), t("map.legend.few")],
        inRange: { color: ["#0d1424", ...COLOR_SCALE] },
        textStyle: { color: AXIS_TEXT, fontFamily: "Plus Jakarta Sans" },
        calculable: true,
        itemWidth: 14,
      },
      series: [{
        type: "map",
        map: "indonesia",
        roam: true,
        aspectScale: 1,
        emphasis: {
          label: { show: false },
          itemStyle: { areaColor: "#22d3ee", borderColor: "#67e8f9" },
        },
        select: {
          itemStyle: { areaColor: "#a855f7", borderColor: "#c084fc" },
          label: { color: "#FFFFFF" },
        },
        itemStyle: { borderColor: "rgba(255,255,255,0.12)", borderWidth: 0.6, areaColor: "#0f1424" },
        data: mapData,
      }],
    };
  }, [mapReady, data.provinsi, geoProps, total]);

  const provChart = useMemo(() => ({
    grid: { left: 140, right: 20, top: 10, bottom: 20 },
    xAxis: { type: "value", axisLine: { lineStyle: { color: AXIS_LINE } }, axisLabel: { color: AXIS_TEXT }, splitLine: { lineStyle: { color: AXIS_SPLIT } }},
    yAxis: {
      type: "category",
      data: data.provinsi.slice(0, 15).map((p) => p.name).reverse(),
      axisLine: { lineStyle: { color: AXIS_LINE } },
      axisLabel: { color: AXIS_TEXT, fontFamily: "Plus Jakarta Sans", fontSize: 11 },
    },
    tooltip: { trigger: "axis", backgroundColor: "#121828", borderColor: "rgba(255,255,255,0.1)", textStyle: { color: "#fff" } },
    series: [{
      type: "bar",
      data: data.provinsi.slice(0, 15).map((p) => p.count).reverse(),
      itemStyle: { color: barGradient(), borderRadius: [0, 6, 6, 0] },
      barWidth: 14,
    }],
  }), [data.provinsi]);

  const kotaChart = useMemo(() => ({
    grid: { left: 160, right: 20, top: 10, bottom: 20 },
    xAxis: { type: "value", axisLabel: { color: AXIS_TEXT }, splitLine: { lineStyle: { color: AXIS_SPLIT } }},
    yAxis: {
      type: "category",
      data: data.kota.slice(0, 15).map((p) => p.name).reverse(),
      axisLabel: { color: AXIS_TEXT, fontFamily: "Plus Jakarta Sans", fontSize: 11 },
    },
    tooltip: { trigger: "axis", backgroundColor: "#121828", borderColor: "rgba(255,255,255,0.1)", textStyle: { color: "#fff" } },
    series: [{
      type: "bar",
      data: data.kota.slice(0, 15).map((p) => p.count).reverse(),
      itemStyle: { color: barGradient(), borderRadius: [0, 6, 6, 0] },
      barWidth: 14,
    }],
  }), [data.kota]);

  const kecChart = useMemo(() => ({
    grid: { left: 160, right: 20, top: 10, bottom: 20 },
    xAxis: { type: "value", axisLabel: { color: AXIS_TEXT }, splitLine: { lineStyle: { color: AXIS_SPLIT } }},
    yAxis: {
      type: "category",
      data: data.kecamatan.slice(0, 12).map((p) => p.name).reverse(),
      axisLabel: { color: AXIS_TEXT, fontFamily: "Plus Jakarta Sans", fontSize: 11 },
    },
    tooltip: { trigger: "axis", backgroundColor: "#121828", borderColor: "rgba(255,255,255,0.1)", textStyle: { color: "#fff" } },
    series: [{
      type: "bar",
      data: data.kecamatan.slice(0, 12).map((p) => p.count).reverse(),
      itemStyle: { color: barGradient(), borderRadius: [0, 6, 6, 0] },
      barWidth: 14,
    }],
  }), [data.kecamatan]);

  const onMapClick = (e) => {
    if (!e.name) return;
    // Convert clicked name to normalized name for our data
    const norm = MAP_NAME_ALIAS[e.name] || e.name;
    setSelectedProv(selectedProv === norm ? null : norm);
    setSelectedKota(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5" data-testid="peta-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">{t("map.section")}</div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
            {t("map.heading")}
          </h1>
          <p className="text-stone-600 mt-2">
            {t("map.sub")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--border)" }} data-testid="source-toggle">
            {[
              { v: "screenshots", l: t("map.source.screenshots") },
              { v: "csv", l: t("map.source.csv") },
              { v: "both", l: t("map.source.both") },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => setSource(o.v)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  source === o.v ? "text-white" : "text-stone-700 bg-white hover:bg-stone-50"
                }`}
                style={source === o.v ? { background: "var(--accent)" } : {}}
                data-testid={`source-${o.v}`}
              >{o.l}</button>
            ))}
          </div>
          <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}
                  className="pp-input rounded-lg px-3 py-1.5 text-xs">
            <option value="">{t("map.allTags")}</option>
            {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label={t("map.stat.customers")} value={dashboard.total_customers} />
          <StatTile label={t("map.stat.cities")} value={dashboard.total_kota} />
          <StatTile label={t("map.stat.provinces")} value={dashboard.total_provinsi} />
          <StatTile label={t("map.stat.repeatPct")} value={`${dashboard.repeat_pct}%`} />
        </div>
      )}

      {(selectedProv || selectedKota) && (
        <div className="pp-card p-3 flex items-center gap-3 text-sm" style={{ background: "var(--accent-light)", borderColor: "#FED7AA" }}>
          <Layers className="w-4 h-4 text-orange-800" />
          <span>{t("map.filterActive")} {selectedProv && <b>{selectedProv}</b>} {selectedKota && <> · <b>{selectedKota}</b></>}</span>
          <button onClick={() => { setSelectedProv(null); setSelectedKota(null); }} className="ml-auto text-xs pp-link">{t("map.clearFilter")}</button>
        </div>
      )}

      {!mapError && (
        <div className="pp-card p-3 sm:p-5" data-testid="map-indonesia-echarts">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-orange-700" />
            <h2 className="font-display font-bold text-lg">{t("map.title38")}</h2>
          </div>
          {mapReady ? (
            <ReactECharts
              option={mapOption}
              style={{ height: "480px", width: "100%" }}
              onEvents={{ click: onMapClick }}
            />
          ) : (
            <div className="h-[480px] flex items-center justify-center text-sm text-stone-500">
              {t("map.loading")}
            </div>
          )}
          {unmatched.length > 0 && (
            <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: "#FEF3C7", color: "#854D0E" }}>
              <div className="font-semibold flex items-center gap-1 mb-1"><AlertTriangle className="w-3 h-3" /> {t("map.unmatched", { n: unmatched.length })}</div>
              <div>{unmatched.map((u) => `${u.name} (${u.count})`).join(" · ")}</div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="pp-card p-5" data-testid="chart-top-provinsi">
          <h3 className="font-display font-bold text-base mb-2">{t("map.rankProv")}</h3>
          {data.provinsi.length ? (
            <ReactECharts option={provChart} style={{ height: 380 }} />
          ) : <EmptyChart />}
        </div>
        <div className="pp-card p-5" data-testid="chart-top-kota">
          <h3 className="font-display font-bold text-base mb-2">{t("map.top15Kota")}</h3>
          {data.kota.length ? (
            <ReactECharts option={kotaChart} style={{ height: 380 }} />
          ) : <EmptyChart />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="pp-card p-5">
          <h3 className="font-display font-bold text-base mb-2">
            {selectedProv ? t("map.kecOf", { name: selectedProv }) : selectedKota ? t("map.kecOf", { name: selectedKota }) : t("map.rankKec")}
          </h3>
          {data.kecamatan.length ? (
            <ReactECharts option={kecChart} style={{ height: 320 }} />
          ) : (
            <div className="text-sm text-stone-500 py-8 text-center">{t("map.kecEmpty")}</div>
          )}
        </div>
        <div className="pp-card p-5">
          <h3 className="font-display font-bold text-base mb-2">{t("map.repeatCity")}</h3>
          {data.repeat_kota.length ? (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {data.repeat_kota.slice(0, 15).map((r, i) => (
                <div key={r.name} className="flex items-center gap-2 text-sm">
                  <span className="w-5 text-stone-400 text-xs">#{i + 1}</span>
                  <span className="flex-1">{r.name}</span>
                  <span className="font-mono font-semibold">{r.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-stone-500 py-8 text-center">{t("map.noRepeat")}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="pp-card p-4">
      <div className="text-2xl font-display font-extrabold text-stone-900">{value}</div>
      <div className="text-xs text-stone-500 mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function EmptyChart() {
  const { t } = useT();
  return <div className="h-[300px] flex items-center justify-center text-sm text-stone-500">{t("common.empty")}</div>;
}
