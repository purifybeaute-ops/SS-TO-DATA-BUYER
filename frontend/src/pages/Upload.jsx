import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { UploadCloud, Loader2, CheckCircle2, AlertCircle, Trash2, Save } from "lucide-react";

// Read file as base64 (strip data URI prefix)
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

const FIELDS = [
  { key: "order_id", label: "ID Pesanan" },
  { key: "created_at", label: "Waktu Pembuatan" },
  { key: "tiktok_username", label: "Username TikTok" },
  { key: "recipient_name", label: "Nama Penerima" },
  { key: "phone", label: "Nomor Telepon" },
  { key: "affiliate_creator", label: "Kreator Afiliasi" },
  { key: "address_detail", label: "Detail Alamat" },
  { key: "kelurahan", label: "Kelurahan" },
  { key: "kecamatan", label: "Kecamatan" },
  { key: "kota", label: "Kota" },
  { key: "provinsi", label: "Provinsi" },
];

export default function Upload() {
  const [rows, setRows] = useState([]); // { file, preview, status, extracted, error }
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef();

  const handleFiles = async (files) => {
    const list = Array.from(files || []);
    const validFiles = list.filter((f) => /image\/(png|jpe?g|webp)/i.test(f.type));
    if (validFiles.length === 0) {
      toast.error("Hanya PNG, JPG, atau WEBP yang didukung.");
      return;
    }
    if (validFiles.length !== list.length) {
      toast.warning(`${list.length - validFiles.length} file dilewati (format tidak didukung).`);
    }
    const newRows = validFiles.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      preview: URL.createObjectURL(f),
      status: "pending",
      extracted: null,
      error: null,
    }));
    setRows((prev) => [...prev, ...newRows]);

    // Process sequentially to avoid rate limits
    for (const row of newRows) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: "processing" } : r)));
      try {
        const b64 = await fileToBase64(row.file);
        const resp = await api.post("/vision/extract", { image_base64: b64, filename: row.file.name });
        const ex = resp.data.extracted;
        const filled = {
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
        };
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: "ready", extracted: filled } : r)));
      } catch (e) {
        const msg = e?.response?.data?.detail || e.message || "Ekstraksi gagal";
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: "error", error: msg } : r)));
      }
    }
  };

  const updateRow = (id, key, value) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, extracted: { ...r.extracted, [key]: value } } : r))
    );
  };

  const removeRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id));

  const saveAll = async () => {
    const ready = rows.filter((r) => r.status === "ready" && r.extracted?.recipient_name && r.extracted?.phone);
    if (ready.length === 0) {
      toast.error("Tidak ada baris siap simpan. Pastikan nama & telepon terisi.");
      return;
    }
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
      toast.success(`${resp.data.saved} pesanan berhasil disimpan ke database.`);
      setRows((prev) => prev.filter((r) => !ready.find((rr) => rr.id === r.id)));
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const readyCount = rows.filter((r) => r.status === "ready").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6" data-testid="upload-page">
      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">Alur Kerja</div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
          Upload & Ekstraksi
        </h1>
        <p className="text-stone-600 mt-2 max-w-2xl">
          Seret satu atau beberapa screenshot halaman detail pesanan TikTok Shop. AI akan membaca nama, telepon, alamat, dan kreator.
        </p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`pp-card cursor-pointer text-center py-12 px-6 border-dashed transition-all ${dragActive ? "pp-drop-active" : ""}`}
        style={{
          borderWidth: "2px",
          borderStyle: "dashed",
          borderColor: dragActive ? "var(--accent)" : "var(--border-bold)",
          background: dragActive ? "var(--accent-light)" : "var(--surface)",
        }}
        data-testid="upload-dropzone"
      >
        <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3"
             style={{ background: "var(--accent-light)" }}>
          <UploadCloud className="w-6 h-6 text-orange-700" />
        </div>
        <div className="font-display font-bold text-lg text-stone-900">
          Tarik & lepas screenshot pesanan TikTok Shop di sini
        </div>
        <div className="text-sm text-stone-600 mt-1">atau klik untuk memilih file (bisa banyak sekaligus)</div>
        <div className="text-xs text-stone-500 mt-2">PNG · JPG · WEBP</div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          data-testid="upload-dropzone-input"
        />
      </div>

      {rows.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-stone-600">
            <span className="font-semibold text-stone-900">{rows.length}</span> file · {readyCount} siap disimpan
          </div>
          <button
            onClick={saveAll}
            disabled={saving || readyCount === 0}
            data-testid="btn-simpan-semua"
            className="pp-btn-primary rounded-lg px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Semua ke Database
          </button>
        </div>
      )}

      <div className="space-y-4" data-testid="table-quick-correct">
        {rows.map((r) => (
          <div key={r.id} className="pp-card p-4">
            <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-4">
              <div>
                <img src={r.preview} alt="" className="w-full rounded-lg border border-stone-200 max-h-56 object-contain" style={{ background: "#F3EFE6" }} />
                <div className="mt-2 flex items-center gap-2 text-xs">
                  {r.status === "processing" && (
                    <span className="inline-flex items-center gap-1 text-orange-700"><Loader2 className="w-3 h-3 animate-spin" /> Membaca...</span>
                  )}
                  {r.status === "ready" && (
                    <span className="inline-flex items-center gap-1 text-green-700"><CheckCircle2 className="w-3 h-3" /> Siap</span>
                  )}
                  {r.status === "error" && (
                    <span className="inline-flex items-center gap-1 text-red-700"><AlertCircle className="w-3 h-3" /> Gagal</span>
                  )}
                  <button onClick={() => removeRow(r.id)} className="ml-auto text-stone-500 hover:text-red-700" title="Hapus">
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                          {lowConf && <span className="pp-badge" style={{ background: "#FEF3C7", color: "#854D0E", borderColor: "#FCD34D" }}>Cek ulang</span>}
                        </label>
                        <input
                          value={r.extracted[f.key] || ""}
                          onChange={(e) => updateRow(r.id, f.key, e.target.value)}
                          className="pp-input w-full rounded-md px-2.5 py-1.5 text-sm"
                          data-testid={`qc-${f.key}-${r.id}`}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center text-sm text-stone-500 min-h-[120px]">
                  {r.status === "processing" ? "Ekstraksi AI sedang berjalan..." : "Menunggu ekstraksi..."}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {rows.length === 0 && (
        <div className="text-center py-8 text-sm text-stone-500">
          Belum ada file. Mulai dengan menarik screenshot ke atas.
        </div>
      )}
    </div>
  );
}
