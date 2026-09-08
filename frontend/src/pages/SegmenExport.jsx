import { useEffect, useMemo, useState } from "react";
import { api, API } from "@/lib/api";
import { toast } from "sonner";
import { Filter, Download, MessageCircle, Copy } from "lucide-react";
import { waLink } from "@/lib/format";

export default function SegmenExport() {
  const [tags, setTags] = useState([]);
  const [waTemplate, setWaTemplate] = useState("");
  const [tplLocal, setTplLocal] = useState("");
  const [filters, setFilters] = useState({
    kota: "", provinsi: "", repeat: "", tag_id: "", creator: "",
    date_from: "", date_to: "",
  });
  const [preview, setPreview] = useState({ count: 0, customers: [] });
  const [showWaList, setShowWaList] = useState(false);

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
      date_from: filters.date_from || null,
      date_to: filters.date_to || null,
    };
    const r = await api.post("/segments/preview", body);
    setPreview(r.data);
  };

  useEffect(() => { runPreview(); }, [filters]);

  const exportCsv = async () => {
    const body = {
      kota: filters.kota || null,
      provinsi: filters.provinsi || null,
      repeat: filters.repeat === "yes" ? true : filters.repeat === "no" ? false : null,
      tag_id: filters.tag_id || null,
      creator: filters.creator || null,
      date_from: filters.date_from || null,
      date_to: filters.date_to || null,
    };
    const token = localStorage.getItem("pp_token");
    const resp = await fetch(`${API}/segments/export/csv`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "segmen.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV segmen berhasil diunduh");
  };

  const copyList = () => {
    const list = preview.customers
      .map((c) => `${c.recipient_name} - ${c.phone}`)
      .join("\n");
    navigator.clipboard.writeText(list);
    toast.success("Daftar disalin ke clipboard");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5" data-testid="segmen-page">
      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">Segmentasi</div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
          Segmen & Export
        </h1>
        <p className="text-stone-600 mt-2">Filter pelanggan, ekspor CSV, atau siapkan daftar broadcast WhatsApp.</p>
      </div>

      <div className="pp-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-orange-700" />
          <h2 className="font-display font-bold">Filter Segmen</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <Field label="Kota">
            <input value={filters.kota} onChange={(e) => setFilters({ ...filters, kota: e.target.value })}
                   className="pp-input rounded-md px-2.5 py-1.5 w-full" data-testid="seg-kota" />
          </Field>
          <Field label="Provinsi">
            <input value={filters.provinsi} onChange={(e) => setFilters({ ...filters, provinsi: e.target.value })}
                   className="pp-input rounded-md px-2.5 py-1.5 w-full" data-testid="seg-provinsi" />
          </Field>
          <Field label="Repeat">
            <select value={filters.repeat} onChange={(e) => setFilters({ ...filters, repeat: e.target.value })}
                    className="pp-input rounded-md px-2.5 py-1.5 w-full" data-testid="seg-repeat">
              <option value="">Semua</option>
              <option value="yes">Ya</option>
              <option value="no">Tidak</option>
            </select>
          </Field>
          <Field label="Tag">
            <select value={filters.tag_id} onChange={(e) => setFilters({ ...filters, tag_id: e.target.value })}
                    className="pp-input rounded-md px-2.5 py-1.5 w-full" data-testid="seg-tag">
              <option value="">Semua</option>
              {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="Creator">
            <input value={filters.creator} onChange={(e) => setFilters({ ...filters, creator: e.target.value })}
                   className="pp-input rounded-md px-2.5 py-1.5 w-full" placeholder="handle" data-testid="seg-creator" />
          </Field>
          <Field label="Dari Tanggal">
            <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                   className="pp-input rounded-md px-2.5 py-1.5 w-full" data-testid="seg-from" />
          </Field>
          <Field label="Sampai Tanggal">
            <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                   className="pp-input rounded-md px-2.5 py-1.5 w-full" data-testid="seg-to" />
          </Field>
        </div>
        <div className="flex flex-wrap items-center justify-between mt-4 gap-3">
          <div className="text-sm">
            <span className="text-stone-500">Cocok: </span>
            <span className="font-display font-extrabold text-2xl text-orange-700" data-testid="seg-count">{preview.count}</span>
            <span className="text-stone-500"> pelanggan</span>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCsv} data-testid="btn-export-csv"
                    className="pp-btn-secondary rounded-lg px-3 py-2 text-sm font-medium inline-flex items-center gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={() => setShowWaList(true)} data-testid="btn-export-wa-list"
                    className="pp-btn-wa rounded-lg px-3 py-2 text-sm font-medium inline-flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> Daftar WA
            </button>
          </div>
        </div>
      </div>

      {showWaList && (
        <div className="pp-card p-5" data-testid="wa-list-panel">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-lg">Daftar Broadcast WhatsApp ({preview.count})</h3>
            <button onClick={() => setShowWaList(false)} className="text-xs pp-link">Tutup</button>
          </div>
          <div className="mb-3">
            <label className="text-xs uppercase tracking-wider text-stone-500 font-semibold block mb-1">Template Pesan (gunakan {"{nama}"})</label>
            <textarea value={tplLocal} onChange={(e) => setTplLocal(e.target.value)}
                      rows={2} className="pp-input rounded-md px-2.5 py-2 text-sm w-full" data-testid="wa-template-input" />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <button onClick={copyList} className="pp-btn-secondary rounded-lg px-3 py-1.5 text-xs inline-flex items-center gap-1">
              <Copy className="w-3 h-3" /> Salin Nama + Telepon
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y" style={{ borderColor: "var(--border)" }}>
            {preview.customers.map((c) => (
              <div key={c.id} className="py-2 flex items-center gap-3 text-sm">
                <div className="flex-1">
                  <div className="font-medium">{c.recipient_name}</div>
                  <div className="text-xs text-stone-500 font-mono">{c.phone}</div>
                </div>
                <a href={waLink(c.phone, tplLocal, c.recipient_name)} target="_blank" rel="noreferrer"
                   className="pp-btn-wa rounded-md px-2.5 py-1.5 text-xs font-medium inline-flex items-center gap-1"
                   data-testid={`wa-link-${c.id}`}>
                  <MessageCircle className="w-3 h-3" /> Kirim
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
