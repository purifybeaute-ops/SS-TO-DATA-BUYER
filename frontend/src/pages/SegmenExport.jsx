import { useEffect, useMemo, useRef, useState } from "react";
import { api, API } from "@/lib/api";
import { toast } from "sonner";
import { Filter, Download, MessageCircle, Copy, Play, Pause, Square as StopIcon } from "lucide-react";
import { waLink } from "@/lib/format";
import { useT } from "@/lib/i18n.jsx";

export default function SegmenExport() {
  const { t } = useT();
  const [tags, setTags] = useState([]);
  const [waTemplate, setWaTemplate] = useState("");
  const [tplLocal, setTplLocal] = useState("");
  const [filters, setFilters] = useState({
    kota: "", provinsi: "", repeat: "", tag_id: "", creator: "",
    follower_tier: "", profession: "", engagement_tier: "",
    date_from: "", date_to: "",
  });
  const [preview, setPreview] = useState({ count: 0, customers: [] });
  const [showWaList, setShowWaList] = useState(false);

  // Scheduler state
  const [minDelay, setMinDelay] = useState(5);
  const [maxDelay, setMaxDelay] = useState(10);
  const [broadcast, setBroadcast] = useState({ running: false, idx: 0, paused: false });
  const timerRef = useRef(null);
  const brStateRef = useRef({ running: false, paused: false });

  useEffect(() => {
    api.get("/tags").then((r) => setTags(r.data));
    api.get("/settings/wa_template").then((r) => {
      setWaTemplate(r.data?.value || "");
      setTplLocal(r.data?.value || "");
    });
  }, []);

  const runPreview = async () => {
    const body = {
      kota: filters.kota || null,
      provinsi: filters.provinsi || null,
      repeat: filters.repeat === "yes" ? true : filters.repeat === "no" ? false : null,
      tag_id: filters.tag_id || null,
      creator: filters.creator || null,
      follower_tier: filters.follower_tier || null,
      profession: filters.profession || null,
      engagement_tier: filters.engagement_tier || null,
      date_from: filters.date_from || null,
      date_to: filters.date_to || null,
    };
    const r = await api.post("/segments/preview", body);
    setPreview(r.data);
  };

  useEffect(() => { runPreview(); }, [filters]);

  const exportCsv = async () => {
    const body = buildBody();
    const token = localStorage.getItem("pp_token");
    const resp = await fetch(`${API}/segments/export/csv`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const blob = await resp.blob();
    triggerDownload(blob, "segmen.csv");
    toast.success(t("seg.csvOk"));
  };

  const exportPdf = async () => {
    const body = buildBody();
    const token = localStorage.getItem("pp_token");
    const resp = await fetch(`${API}/segments/export/pdf`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!resp.ok) return toast.error(t("seg.pdfFail"));
    const blob = await resp.blob();
    triggerDownload(blob, "segmen.pdf");
    toast.success(t("seg.pdfOk"));
  };

  const buildBody = () => ({
    kota: filters.kota || null, provinsi: filters.provinsi || null,
    repeat: filters.repeat === "yes" ? true : filters.repeat === "no" ? false : null,
    tag_id: filters.tag_id || null, creator: filters.creator || null,
    follower_tier: filters.follower_tier || null,
    profession: filters.profession || null,
    engagement_tier: filters.engagement_tier || null,
    date_from: filters.date_from || null, date_to: filters.date_to || null,
  });

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const copyList = () => {
    const list = preview.customers.map((c) => `${c.recipient_name} - ${c.phone}`).join("\n");
    navigator.clipboard.writeText(list);
    toast.success(t("seg.broadcast.copied"));
  };

  // ---- Broadcast Scheduler ----
  const cancelTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  const scheduleNext = (i, list) => {
    if (!brStateRef.current.running) return;
    if (brStateRef.current.paused) {
      // check again in 500ms
      timerRef.current = setTimeout(() => scheduleNext(i, list), 500);
      return;
    }
    if (i >= list.length) {
      brStateRef.current.running = false;
      setBroadcast({ running: false, idx: 0, paused: false });
      toast.success(t("seg.broadcast.done"));
      return;
    }
    setBroadcast((prev) => ({ ...prev, idx: i }));
    const c = list[i];
    const href = waLink(c.phone, tplLocal, c.recipient_name);
    // Open in a new tab
    window.open(href, "_blank", "noopener,noreferrer");
    const min = Math.max(1, minDelay);
    const max = Math.max(min, maxDelay);
    const delaySec = min + Math.random() * (max - min);
    timerRef.current = setTimeout(() => scheduleNext(i + 1, list), delaySec * 1000);
  };

  const startBroadcast = () => {
    if (preview.customers.length === 0) return toast.error(t("seg.broadcast.noCustomers"));
    if (!window.confirm(t("seg.broadcast.confirm", { n: preview.customers.length, a: minDelay, b: maxDelay }))) return;
    brStateRef.current = { running: true, paused: false };
    setBroadcast({ running: true, idx: 0, paused: false });
    scheduleNext(0, preview.customers);
  };
  const pauseBroadcast = () => {
    brStateRef.current.paused = true;
    setBroadcast((p) => ({ ...p, paused: true }));
  };
  const resumeBroadcast = () => {
    brStateRef.current.paused = false;
    setBroadcast((p) => ({ ...p, paused: false }));
  };
  const stopBroadcast = () => {
    brStateRef.current = { running: false, paused: false };
    cancelTimer();
    setBroadcast({ running: false, idx: 0, paused: false });
    toast.info(t("seg.broadcast.stopped"));
  };

  useEffect(() => () => cancelTimer(), []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5" data-testid="segmen-page">
      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">{t("seg.section")}</div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
          {t("seg.heading")}
        </h1>
        <p className="text-stone-600 mt-2">{t("seg.sub")}</p>
      </div>

      <div className="pp-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-orange-700" />
          <h2 className="font-display font-bold">{t("seg.filter")}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <Field label={t("seg.field.kota")}>
            <input value={filters.kota} onChange={(e) => setFilters({ ...filters, kota: e.target.value })}
                   className="pp-input rounded-md px-2.5 py-1.5 w-full" data-testid="seg-kota" />
          </Field>
          <Field label={t("seg.field.provinsi")}>
            <input value={filters.provinsi} onChange={(e) => setFilters({ ...filters, provinsi: e.target.value })}
                   className="pp-input rounded-md px-2.5 py-1.5 w-full" data-testid="seg-provinsi" />
          </Field>
          <Field label={t("seg.field.repeat")}>
            <select value={filters.repeat} onChange={(e) => setFilters({ ...filters, repeat: e.target.value })}
                    className="pp-input rounded-md px-2.5 py-1.5 w-full" data-testid="seg-repeat">
              <option value="">{t("common.all")}</option>
              <option value="yes">{t("common.yes")}</option>
              <option value="no">{t("common.no")}</option>
            </select>
          </Field>
          <Field label={t("seg.field.tag")}>
            <select value={filters.tag_id} onChange={(e) => setFilters({ ...filters, tag_id: e.target.value })}
                    className="pp-input rounded-md px-2.5 py-1.5 w-full" data-testid="seg-tag">
              <option value="">{t("common.all")}</option>
              {tags.map((t2) => <option key={t2.id} value={t2.id}>{t2.name}</option>)}
            </select>
          </Field>
          <Field label={t("seg.field.creator")}>
            <input value={filters.creator} onChange={(e) => setFilters({ ...filters, creator: e.target.value })}
                   className="pp-input rounded-md px-2.5 py-1.5 w-full" placeholder={t("seg.creatorPlaceholder")} data-testid="seg-creator" />
          </Field>
          <Field label={t("seg.field.followerTier")}>
            <select value={filters.follower_tier} onChange={(e) => setFilters({ ...filters, follower_tier: e.target.value })}
                    className="pp-input rounded-md px-2.5 py-1.5 w-full" data-testid="seg-follower-tier">
              <option value="">{t("seg.tier.all")}</option>
              <option value="micro">{t("seg.tier.micro")}</option>
              <option value="mid">{t("seg.tier.mid")}</option>
              <option value="macro">{t("seg.tier.macro")}</option>
              <option value="unknown">{t("seg.tier.unknown")}</option>
            </select>
          </Field>
          <Field label={t("seg.field.profession")}>
            <input value={filters.profession} onChange={(e) => setFilters({ ...filters, profession: e.target.value })}
                   className="pp-input rounded-md px-2.5 py-1.5 w-full" placeholder={t("seg.professionPlaceholder")} data-testid="seg-profession" />
          </Field>
          <Field label={t("seg.field.engagement")}>
            <select value={filters.engagement_tier} onChange={(e) => setFilters({ ...filters, engagement_tier: e.target.value })}
                    className="pp-input rounded-md px-2.5 py-1.5 w-full" data-testid="seg-engagement-tier">
              <option value="">{t("seg.er.all")}</option>
              <option value="elite">{t("seg.er.elite")}</option>
              <option value="high">{t("seg.er.high")}</option>
              <option value="medium">{t("seg.er.medium")}</option>
              <option value="low">{t("seg.er.low")}</option>
            </select>
          </Field>
          <Field label={t("seg.field.dateFrom")}>
            <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                   className="pp-input rounded-md px-2.5 py-1.5 w-full" data-testid="seg-from" />
          </Field>
          <Field label={t("seg.field.dateTo")}>
            <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                   className="pp-input rounded-md px-2.5 py-1.5 w-full" data-testid="seg-to" />
          </Field>
        </div>
        <div className="flex flex-wrap items-center justify-between mt-4 gap-3">
          <div className="text-sm">
            <span className="text-stone-500">{t("seg.match")} </span>
            <span className="font-display font-extrabold text-2xl text-orange-700" data-testid="seg-count">{preview.count}</span>
            <span className="text-stone-500"> {t("seg.customers")}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCsv} data-testid="btn-export-csv"
                    className="pp-btn-secondary rounded-lg px-3 py-2 text-sm font-medium inline-flex items-center gap-2">
              <Download className="w-4 h-4" /> {t("seg.exportCsv")}
            </button>
            <button onClick={exportPdf} data-testid="btn-export-pdf"
                    className="pp-btn-secondary rounded-lg px-3 py-2 text-sm font-medium inline-flex items-center gap-2">
              <Download className="w-4 h-4" /> {t("seg.exportPdf")}
            </button>
            <button onClick={() => setShowWaList(true)} data-testid="btn-export-wa-list"
                    className="pp-btn-wa rounded-lg px-3 py-2 text-sm font-medium inline-flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> {t("seg.waList")}
            </button>
          </div>
        </div>
      </div>

      {showWaList && (
        <div className="pp-card p-5" data-testid="wa-list-panel">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-lg">{t("seg.broadcast.title", { n: preview.count })}</h3>
            <button onClick={() => setShowWaList(false)} className="text-xs pp-link">{t("common.close")}</button>
          </div>
          <div className="mb-3">
            <label className="text-xs uppercase tracking-wider text-stone-500 font-semibold block mb-1">{t("seg.broadcast.templateLabel", { var: "{nama}" })}</label>
            <textarea value={tplLocal} onChange={(e) => setTplLocal(e.target.value)}
                      rows={2} className="pp-input rounded-md px-2.5 py-2 text-sm w-full" data-testid="wa-template-input" />
          </div>

          {/* Scheduler controls */}
          <div className="rounded-lg p-3 mb-3 border" style={{ background: "var(--surface-muted)", borderColor: "var(--border)" }}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="text-xs uppercase tracking-wider font-semibold text-stone-500 mb-1">{t("seg.broadcast.title2")}</div>
                <div className="text-sm text-stone-700">{t("seg.broadcast.desc")}</div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <label className="flex items-center gap-1">
                  <span className="text-xs text-stone-500">{t("seg.broadcast.min")}</span>
                  <input type="number" min="1" max="60" value={minDelay} onChange={(e) => setMinDelay(Number(e.target.value))}
                         className="pp-input rounded-md px-2 py-1 w-14 text-sm" data-testid="broadcast-min" />
                </label>
                <label className="flex items-center gap-1">
                  <span className="text-xs text-stone-500">{t("seg.broadcast.max")}</span>
                  <input type="number" min="1" max="120" value={maxDelay} onChange={(e) => setMaxDelay(Number(e.target.value))}
                         className="pp-input rounded-md px-2 py-1 w-14 text-sm" data-testid="broadcast-max" />
                </label>
                <span className="text-xs text-stone-500">{t("seg.broadcast.sec")}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              {!broadcast.running ? (
                <button onClick={startBroadcast} data-testid="btn-broadcast-start"
                        className="pp-btn-primary rounded-md px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1">
                  <Play className="w-3 h-3" /> {t("seg.broadcast.start")}
                </button>
              ) : (
                <>
                  {!broadcast.paused ? (
                    <button onClick={pauseBroadcast} data-testid="btn-broadcast-pause"
                            className="pp-btn-secondary rounded-md px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1">
                      <Pause className="w-3 h-3" /> {t("seg.broadcast.pause")}
                    </button>
                  ) : (
                    <button onClick={resumeBroadcast} data-testid="btn-broadcast-resume"
                            className="pp-btn-primary rounded-md px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1">
                      <Play className="w-3 h-3" /> {t("seg.broadcast.resume")}
                    </button>
                  )}
                  <button onClick={stopBroadcast} data-testid="btn-broadcast-stop"
                          className="rounded-md px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1"
                          style={{ background: "#991B1B", color: "#fff" }}>
                    <StopIcon className="w-3 h-3" /> {t("seg.broadcast.stop")}
                  </button>
                  <div className="text-xs text-stone-600 ml-2">
                    {broadcast.paused ? t("seg.broadcast.paused") : t("seg.broadcast.running")} · {broadcast.idx + 1}/{preview.customers.length}
                  </div>
                </>
              )}
              <button onClick={copyList} className="pp-btn-secondary rounded-md px-3 py-1.5 text-xs inline-flex items-center gap-1 ml-auto">
                <Copy className="w-3 h-3" /> {t("seg.broadcast.copyList")}
              </button>
            </div>
            {broadcast.running && (
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "#E5DEC9" }}>
                <div className="h-full transition-all" style={{
                  width: `${((broadcast.idx + 1) / Math.max(1, preview.customers.length)) * 100}%`,
                  background: "var(--accent)",
                }} />
              </div>
            )}
            <div className="text-[11px] text-stone-500 mt-2">
              {t("seg.broadcast.tip")}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y" style={{ borderColor: "var(--border)" }}>
            {preview.customers.map((c, i) => (
              <div key={c.id}
                   className={`py-2 flex items-center gap-3 text-sm ${broadcast.running && i === broadcast.idx ? "bg-orange-50 -mx-2 px-2 rounded" : ""}`}>
                <div className="w-6 text-xs text-stone-400 font-mono">{i + 1}</div>
                <div className="flex-1">
                  <div className="font-medium">{c.recipient_name}</div>
                  <div className="text-xs text-stone-500 font-mono">{c.phone}</div>
                </div>
                <a href={waLink(c.phone, tplLocal, c.recipient_name)} target="_blank" rel="noreferrer"
                   className="pp-btn-wa rounded-md px-2.5 py-1.5 text-xs font-medium inline-flex items-center gap-1"
                   data-testid={`wa-link-${c.id}`}>
                  <MessageCircle className="w-3 h-3" /> {t("seg.broadcast.send")}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold block mb-1">{label}</label>
      {children}
    </div>
  );
}
