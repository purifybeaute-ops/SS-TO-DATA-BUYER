import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Upload as UploadIcon, ClipboardList, FileWarning } from "lucide-react";
import { Link } from "react-router-dom";

export default function PerluDiSS() {
  const [gap, setGap] = useState({ gap: [], total: 0, captured: 0 });
  const [importing, setImporting] = useState(false);
  const [mapping, setMapping] = useState(null);

  const load = () => api.get("/csv/gap").then((r) => setGap(r.data));
  useEffect(() => {
    load();
    api.get("/settings/csv_mapping").then((r) => setMapping(r.data?.value || null));
  }, []);

  const importCsv = async (file) => {
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (mapping) fd.append("mapping_json", JSON.stringify(mapping));
      const r = await api.post("/csv/import", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`Import berhasil: ${r.data.upserted}/${r.data.read} baris tersimpan`);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Import gagal");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5" data-testid="perlu-ss-page">
      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">Gap Analysis</div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
          Perlu Di-SS
        </h1>
        <p className="text-stone-600 mt-2">
          Pesanan dari CSV yang <b>belum</b> di-screenshot. Ambil screenshot sebelum data pesanan terkunci.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="pp-card p-4">
          <div className="text-2xl font-display font-extrabold text-stone-900">{gap.total}</div>
          <div className="text-xs uppercase tracking-wider text-stone-500 mt-1">Total di CSV</div>
        </div>
        <div className="pp-card p-4">
          <div className="text-2xl font-display font-extrabold text-green-700">{gap.captured}</div>
          <div className="text-xs uppercase tracking-wider text-stone-500 mt-1">Sudah Di-SS</div>
        </div>
        <div className="pp-card p-4">
          <div className="text-2xl font-display font-extrabold text-orange-700">{gap.gap.length}</div>
          <div className="text-xs uppercase tracking-wider text-stone-500 mt-1">Belum Di-SS</div>
        </div>
      </div>

      <div className="pp-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <ClipboardList className="w-5 h-5 text-orange-700" />
        <div className="flex-1 text-sm">
          Belum import CSV? Upload TikTok Shop order export untuk sinkronisasi.
        </div>
        <label className="pp-btn-primary rounded-lg px-4 py-2 text-sm font-semibold inline-flex items-center gap-2 cursor-pointer">
          <UploadIcon className="w-4 h-4" /> {importing ? "Mengimport..." : "Import CSV"}
          <input type="file" accept=".csv" hidden onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])}
                 data-testid="csv-import-input" />
        </label>
        <Link to="/pengaturan" className="text-xs pp-link">Atur mapping kolom</Link>
      </div>

      {gap.gap.length === 0 ? (
        <div className="pp-card p-10 text-center">
          <FileWarning className="w-8 h-8 text-stone-400 mx-auto mb-2" />
          <div className="font-semibold text-stone-800">Semua pesanan sudah tercapture!</div>
          <div className="text-sm text-stone-500 mt-1">Atau CSV belum diupload. Cek di atas.</div>
        </div>
      ) : (
        <div className="pp-table-scroll" data-testid="gap-table">
          <table className="pp-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Waktu</th>
                <th>Variasi</th>
                <th>Qty</th>
                <th>Kota</th>
                <th>Provinsi</th>
                <th>Creator</th>
              </tr>
            </thead>
            <tbody>
              {gap.gap.slice(0, 500).map((o) => (
                <tr key={o.order_id}>
                  <td className="font-mono text-xs">{o.order_id}</td>
                  <td className="text-xs text-stone-600">{o.created_at_order || "-"}</td>
                  <td className="text-xs">{o.variation || "-"}</td>
                  <td className="text-center font-mono">{o.quantity}</td>
                  <td>{o.kota || o.kota_raw || "-"}</td>
                  <td>{o.provinsi || o.provinsi_raw || "-"}</td>
                  <td className="text-xs">{o.affiliate_creator || <span className="text-stone-400">-</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
