import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { UploadCloud, Loader2, CheckCircle2, AlertCircle, Trash2, Save, FileArchive } from "lucide-react";
import { useT } from "@/lib/i18n.jsx";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = r.result;
      const idx = s.indexOf(",");
      resolve(idx >= 0 ? s.slice(idx + 1) : s);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const FIELD_KEYS = [
  "order_id", "created_at", "tiktok_username", "recipient_name", "phone",
  "affiliate_creator", "address_detail", "kelurahan", "kecamatan", "kota", "provinsi",
];

export default function Upload() {
  const { t } = useT();
  const FIELDS = FIELD_KEYS.map((key) => ({ key, label: t(`up.f.${key}`) }));
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [zipJob, setZipJob] = useState(null); // {id, status, total, processed}
  const inputRef = useRef();
  const zipRef = useRef();
  const pollRef = useRef();

  const applyExtracted = (ex, filename) => ({
    id: crypto.randomUUID(),
    file: null,
    preview: null,
    filename,
    status: ex ? "ready" : "error",
    extracted: ex ? {
      order_id: ex.order_id || "",
      created_at: ex.created_at || "",
      tiktok_username: ex.tiktok_username || "",
      recipient_name: ex.recipient_name || "",
      phone: ex.phone_normalized || ex.phone || "",
      affiliate_creator: ex.affiliate_creator || "",
      address_detail: ex.address_detail || "",
      kelurahan: ex.kelurahan || "",
      kecamatan: ex.kecamatan || "",
      kota: ex.kota || "",
      provinsi: ex.provinsi || "",
      negara: ex.negara || "Indonesia",
      full_address_raw: ex.full_address_raw || "",
      confidence: ex.confidence || {},
    } : null,
    error: ex ? null : t("up.errExtract"),
  });

  const handleFiles = async (files) => {
    const list = Array.from(files || []);
    const validFiles = list.filter((f) => /image\/(png|jpe?g|webp)/i.test(f.type));
    if (validFiles.length === 0) {
      toast.error(t("up.errFormat"));
      return;
    }
    if (validFiles.length !== list.length) {
      toast.warning(t("up.warnSkipped", { n: list.length - validFiles.length }));
    }
    const newRows = validFiles.map((f) => ({
      id: crypto.randomUUID(),
      file: f, preview: URL.createObjectURL(f), filename: f.name,
      status: "pending", extracted: null, error: null,
    }));
    setRows((prev) => [...prev, ...newRows]);
    for (const row of newRows) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: "processing" } : r)));
      try {
        const b64 = await fileToBase64(row.file);
        const resp = await api.post("/vision/extract", { image_base64: b64, filename: row.file.name });
        const filled = applyExtracted(resp.data.extracted, row.file.name).extracted;
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: "ready", extracted: filled } : r)));
      } catch (e) {
        const msg = e?.response?.data?.detail || e.message || t("up.errExtract");
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: "error", error: msg } : r)));
      }
    }
  };

  const handleZip = async (file) => {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      toast.error(t("up.errNotZip"));
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await api.post("/vision/extract-zip", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setZipJob({ id: r.data.job_id, status: "queued", total: 0, processed: 0 });
      toast.success(t("up.zipQueued"));
      pollJob(r.data.job_id);
    } catch (e) {
      toast.error(e?.response?.data?.detail || t("up.zipUploadFail"));
    }
  };

  const pollJob = (jobId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const r = await api.get(`/vision/jobs/${jobId}`);
        const j = r.data;
        setZipJob({ id: j.id, status: j.status, total: j.total, processed: j.processed });
        if (j.status === "done") {
          clearInterval(pollRef.current);
          const newRows = (j.results || []).map((res) => applyExtracted(res.extracted, res.filename));
          setRows((prev) => [...prev, ...newRows]);
          toast.success(t("up.zipDone", { ok: newRows.filter((x) => x.status === "ready").length, n: newRows.length }));
          setTimeout(() => setZipJob(null), 4000);
        } else if (j.status === "failed") {
          clearInterval(pollRef.current);
          toast.error(t("up.zipFailed", { err: j.error || "unknown" }));
          setZipJob(null);
        }
      } catch (e) { /* ignore */ }
    }, 1500);
  };

  useEffect(() => () => pollRef.current && clearInterval(pollRef.current), []);

  const updateRow = (id, key, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, extracted: { ...r.extracted, [key]: value } } : r)));
  };
  const removeRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id));

  const saveAll = async () => {
    const ready = rows.filter((r) => r.status === "ready" && r.extracted?.recipient_name && r.extracted?.phone);
    if (ready.length === 0) return toast.error(t("up.errNoReady"));
    setSaving(true);
    try {
      const payload = ready.map((r) => ({
        order_id: r.extracted.order_id || null,
        created_at_order: r.extracted.created_at || null,
        tiktok_username: r.extracted.tiktok_username || null,
        recipient_name: r.extracted.recipient_name,
        phone: r.extracted.phone,
        address_detail: r.extracted.address_detail || null,
        kelurahan: r.extracted.kelurahan || null,
        kecamatan: r.extracted.kecamatan || null,
        kota: r.extracted.kota || null,
        provinsi: r.extracted.provinsi || null,
        negara: r.extracted.negara || "Indonesia",
        affiliate_creator: r.extracted.affiliate_creator || null,
        full_address_raw: r.extracted.full_address_raw || null,
      }));
      const resp = await api.post("/orders/save", payload);
      toast.success(t("up.saveOk", { n: resp.data.saved }));
      setRows((prev) => prev.filter((r) => !ready.find((rr) => rr.id === r.id)));
    } catch (e) {
      toast.error(e?.response?.data?.detail || t("up.saveFail"));
    } finally { setSaving(false); }
  };

  const readyCount = rows.filter((r) => r.status === "ready").length;
  const zipProgress = zipJob && zipJob.total > 0 ? (zipJob.processed / zipJob.total) * 100 : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6" data-testid="upload-page">
      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">{t("up.section")}</div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
          {t("up.heading")}
        </h1>
        <p className="text-stone-600 mt-2 max-w-2xl">
          {t("up.subheading")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className="md:col-span-2 pp-card cursor-pointer text-center py-10 px-6 transition-all"
          style={{
            borderWidth: "2px", borderStyle: "dashed",
            borderColor: dragActive ? "var(--accent)" : "var(--border-bold)",
            background: dragActive ? "var(--accent-light)" : "var(--surface)",
          }}
          data-testid="upload-dropzone"
        >
          <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2" style={{ background: "var(--accent-light)" }}>
            <UploadCloud className="w-5 h-5 text-orange-700" />
          </div>
          <div className="font-display font-bold text-base text-stone-900">
            {t("up.dropTitle")}
          </div>
          <div className="text-sm text-stone-600 mt-1">{t("up.dropSubtitle")}</div>
          <div className="text-xs text-stone-500 mt-2">PNG · JPG · WEBP</div>
          <input ref={inputRef} type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden"
                 onChange={(e) => handleFiles(e.target.files)} data-testid="upload-dropzone-input" />
        </div>

        <div className="pp-card p-5 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-2" style={{ background: "#7C2D1218" }}>
              <FileArchive className="w-5 h-5" style={{ color: "#7C2D12" }} />
            </div>
            <div className="font-display font-bold text-stone-900">{t("up.bulkZip")}</div>
            <div className="text-xs text-stone-600 mt-1">{t("up.bulkZipDesc")}</div>
          </div>
          <label className="pp-btn-secondary mt-3 rounded-md py-2 text-sm text-center cursor-pointer inline-flex items-center justify-center gap-2"
                 data-testid="zip-upload-btn">
            <FileArchive className="w-4 h-4" /> {t("up.pickZip")}
            <input ref={zipRef} type="file" accept=".zip" className="hidden"
                   onChange={(e) => e.target.files?.[0] && handleZip(e.target.files[0])} />
          </label>
        </div>
      </div>

      {zipJob && (
        <div className="pp-card p-4" data-testid="zip-progress">
          <div className="flex items-center justify-between mb-2 text-sm">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-orange-700" />
              <span className="font-medium">{t("up.processingZip")}</span>
              <span className="text-stone-500 text-xs">({zipJob.status})</span>
            </div>
            <div className="text-xs font-mono">{zipJob.processed}/{zipJob.total || "?"}</div>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-muted)" }}>
            <div className="h-full transition-all" style={{ width: `${zipProgress}%`, background: "var(--accent)" }} />
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-stone-600">
            <span className="font-semibold text-stone-900">{rows.length}</span> {t("up.fileCount")} · {readyCount} {t("up.readyCount")}
          </div>
          <button onClick={saveAll} disabled={saving || readyCount === 0} data-testid="btn-simpan-semua"
                  className="pp-btn-primary rounded-lg px-4 py-2 text-sm font-semibold inline-flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t("up.saveAll")}
          </button>
        </div>
      )}

      <div className="space-y-4" data-testid="table-quick-correct">
        {rows.map((r) => (
          <div key={r.id} className="pp-card p-4">
            <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-4">
              <div>
                {r.preview ? (
                  <img src={r.preview} alt="" className="w-full rounded-lg border border-stone-200 max-h-56 object-contain" style={{ background: "#F3EFE6" }} />
                ) : (
                  <div className="w-full rounded-lg border border-stone-200 p-4 text-center text-xs text-stone-500 min-h-[100px] flex items-center justify-center" style={{ background: "#F3EFE6" }}>
                    <div>
                      <FileArchive className="w-6 h-6 mx-auto mb-1 text-stone-400" />
                      <div>{t("up.fromZip")}</div>
                      <div className="text-[10px] mt-0.5 font-mono truncate">{r.filename}</div>
                    </div>
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2 text-xs">
                  {r.status === "processing" && <span className="inline-flex items-center gap-1 text-orange-700"><Loader2 className="w-3 h-3 animate-spin" /> {t("up.reading")}</span>}
                  {r.status === "ready" && <span className="inline-flex items-center gap-1 text-green-700"><CheckCircle2 className="w-3 h-3" /> {t("up.readyStatus")}</span>}
                  {r.status === "error" && <span className="inline-flex items-center gap-1 text-red-700"><AlertCircle className="w-3 h-3" /> {t("up.failed")}</span>}
                  <button onClick={() => removeRow(r.id)} className="ml-auto text-stone-500 hover:text-red-700" title={t("common.delete")}><Trash2 className="w-4 h-4" /></button>
                </div>
                {r.error && <div className="text-xs text-red-700 mt-1">{r.error}</div>}
              </div>
              {r.extracted ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {FIELDS.map((f) => {
                    const conf = r.extracted.confidence?.[f.key] ?? 1;
                    const lowConf = conf > 0 && conf < 0.7;
                    return (
                      <div key={f.key}>
                        <label className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold flex items-center gap-2 mb-1">
                          {f.label}
                          {lowConf && <span className="pp-badge" style={{ background: "#FEF3C7", color: "#854D0E", borderColor: "#FCD34D" }}>{t("up.recheck")}</span>}
                        </label>
                        <input value={r.extracted[f.key] || ""} onChange={(e) => updateRow(r.id, f.key, e.target.value)}
                               className="pp-input w-full rounded-md px-2.5 py-1.5 text-sm"
                               data-testid={`qc-${f.key}-${r.id}`} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center text-sm text-stone-500 min-h-[120px]">
                  {r.status === "processing" ? t("up.extractionRunning") : t("up.waitingExtraction")}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {rows.length === 0 && !zipJob && (
        <div className="text-center py-8 text-sm text-stone-500">
          {t("up.emptyState")}
        </div>
      )}
    </div>
  );
}
