import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Trash2, Plus, Save, MessageCircle, MapPin, Tag as TagIcon, Users, FileText, Upload as UploadIcon, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/lib/auth.jsx";

const TABS = [
  { key: "norm", label: "Normalisasi Wilayah", icon: MapPin },
  { key: "tags", label: "Tag Khusus", icon: TagIcon },
  { key: "wa", label: "Template WA", icon: MessageCircle },
  { key: "pdf", label: "Header PDF", icon: FileText },
  { key: "csv", label: "Mapping CSV", icon: MapPin },
  { key: "users", label: "Operator", icon: Users },
];

export default function Pengaturan() {
  const { isOwner } = useAuth();
  const [tab, setTab] = useState("norm");

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5" data-testid="pengaturan-page">
      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">Konfigurasi</div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">Pengaturan</h1>
        {!isOwner && <p className="text-xs text-amber-800 mt-2">Sebagian pengaturan hanya bisa diubah oleh owner.</p>}
      </div>

      <div className="flex flex-wrap gap-1 border-b" style={{ borderColor: "var(--border)" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} data-testid={`tab-${t.key}`}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    tab === t.key ? "border-orange-700 text-orange-800" : "border-transparent text-stone-600 hover:text-stone-900"
                  }`}>
            <t.icon className="w-3.5 h-3.5 inline mr-1.5" />{t.label}
          </button>
        ))}
      </div>

      {tab === "norm" && <NormPanel isOwner={isOwner} />}
      {tab === "tags" && <TagsPanel isOwner={isOwner} />}
      {tab === "wa" && <WaPanel isOwner={isOwner} />}
      {tab === "pdf" && <PdfHeaderPanel isOwner={isOwner} />}
      {tab === "csv" && <CsvMappingPanel isOwner={isOwner} />}
      {tab === "users" && <UsersPanel isOwner={isOwner} />}
    </div>
  );
}

// ---------------- Normalization ----------------
function NormPanel({ isOwner }) {
  const [rules, setRules] = useState([]);
  const [unmapped, setUnmapped] = useState([]);
  const [form, setForm] = useState({ raw: "", normalized: "", level: "provinsi" });

  const load = () => {
    api.get("/normalization/rules").then((r) => setRules(r.data));
    api.get("/normalization/unmapped").then((r) => setUnmapped(r.data));
  };
  useEffect(load, []);

  const add = async () => {
    if (!form.raw || !form.normalized) return toast.error("Isi kedua field");
    await api.post("/normalization/rules", form);
    toast.success("Aturan ditambahkan");
    setForm({ raw: "", normalized: "", level: form.level });
    load();
  };
  const del = async (id) => {
    await api.delete(`/normalization/rules/${id}`);
    toast.success("Aturan dihapus");
    load();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 pp-card p-5">
        <h3 className="font-display font-bold mb-3">Aturan Aktif ({rules.length})</h3>
        {isOwner && (
          <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
            <input value={form.raw} onChange={(e) => setForm({ ...form, raw: e.target.value })}
                   placeholder="Nilai mentah (mis. West Java)" className="pp-input rounded-md px-2.5 py-1.5 text-sm flex-1" data-testid="norm-raw" />
            <input value={form.normalized} onChange={(e) => setForm({ ...form, normalized: e.target.value })}
                   placeholder="Nilai baku (mis. Jawa Barat)" className="pp-input rounded-md px-2.5 py-1.5 text-sm flex-1" data-testid="norm-normalized" />
            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="pp-input rounded-md px-2.5 py-1.5 text-sm">
              <option value="provinsi">Provinsi</option>
              <option value="kota">Kota</option>
            </select>
            <button onClick={add} className="pp-btn-primary rounded-md px-3 py-1.5 text-sm inline-flex items-center gap-1"
                    data-testid="norm-add">
              <Plus className="w-3 h-3" /> Tambah
            </button>
          </div>
        )}
        <div className="max-h-96 overflow-y-auto">
          <table className="pp-table">
            <thead>
              <tr><th>Nilai Mentah</th><th>Baku</th><th>Level</th><th></th></tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id}>
                  <td className="text-stone-700">{r.raw}</td>
                  <td className="font-medium">{r.normalized}</td>
                  <td className="text-xs uppercase text-stone-500">{r.level}</td>
                  <td className="text-right">
                    {isOwner && <button onClick={() => del(r.id)} className="text-red-700 hover:underline text-xs"><Trash2 className="w-3 h-3 inline" /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="pp-card p-5">
        <h3 className="font-display font-bold mb-2">Nilai Belum Dipetakan ({unmapped.length})</h3>
        <p className="text-xs text-stone-500 mb-3">Muncul dari CSV/screenshot tapi belum ada aturannya.</p>
        {unmapped.length === 0 ? (
          <div className="text-sm text-stone-500 py-6 text-center">Semua nilai sudah terpetakan!</div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {unmapped.map((u) => (
              <div key={`${u.raw}-${u.level}`} className="flex items-center justify-between p-2 rounded-md" style={{ background: "var(--surface-muted)" }}>
                <div>
                  <div className="text-sm font-medium">{u.raw}</div>
                  <div className="text-[10px] uppercase text-stone-500">{u.level} · {u.count}×</div>
                </div>
                {isOwner && (
                  <button onClick={() => setForm({ raw: u.raw, normalized: "", level: u.level })}
                          className="text-xs pp-link">Petakan</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- Tags ----------------
function TagsPanel({ isOwner }) {
  const [tags, setTags] = useState([]);
  const [form, setForm] = useState({ name: "", color: "#C2410C" });

  const load = () => api.get("/tags").then((r) => setTags(r.data));
  useEffect(load, []);

  const add = async () => {
    if (!form.name) return;
    await api.post("/tags", form);
    toast.success("Tag ditambah");
    setForm({ name: "", color: "#C2410C" });
    load();
  };
  const update = async (t) => {
    await api.patch(`/tags/${t.id}`, { name: t.name, color: t.color });
    toast.success("Tag diperbarui");
    load();
  };
  const del = async (id) => {
    if (!window.confirm("Hapus tag ini dari semua pelanggan?")) return;
    await api.delete(`/tags/${id}`);
    toast.success("Tag dihapus");
    load();
  };

  return (
    <div className="pp-card p-5">
      <h3 className="font-display font-bold mb-3">Tag Khusus Pelanggan</h3>
      {isOwner && (
        <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                 placeholder="Nama tag" className="pp-input rounded-md px-2.5 py-1.5 text-sm flex-1" data-testid="tag-name" />
          <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
                 className="pp-input rounded-md w-14 h-9" data-testid="tag-color" />
          <button onClick={add} className="pp-btn-primary rounded-md px-3 py-1.5 text-sm inline-flex items-center gap-1"
                  data-testid="tag-add">
            <Plus className="w-3 h-3" /> Tambah
          </button>
        </div>
      )}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {tags.map((t, i) => (
          <div key={t.id} className="flex items-center gap-2 p-2 rounded-md" style={{ background: "var(--surface-muted)" }}>
            <input type="color" value={t.color} disabled={!isOwner}
                   onChange={(e) => setTags((prev) => prev.map((x, j) => j === i ? { ...x, color: e.target.value } : x))}
                   className="w-8 h-8 rounded" />
            <input value={t.name} disabled={!isOwner}
                   onChange={(e) => setTags((prev) => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                   className="pp-input rounded-md px-2 py-1 text-sm flex-1" />
            <span className="pp-badge" style={{ background: `${t.color}20`, color: t.color, borderColor: `${t.color}55` }}>{t.name}</span>
            {isOwner && (
              <>
                <button onClick={() => update(t)} className="text-xs pp-link">Simpan</button>
                <button onClick={() => del(t.id)} className="text-red-700 hover:underline text-xs"><Trash2 className="w-3 h-3" /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- WA Template ----------------
function WaPanel({ isOwner }) {
  const [tpl, setTpl] = useState("");
  useEffect(() => { api.get("/settings/wa_template").then((r) => setTpl(r.data?.value || "")); }, []);
  const save = async () => {
    await api.put("/settings/wa_template", { value: tpl });
    toast.success("Template WA disimpan");
  };
  return (
    <div className="pp-card p-5 max-w-2xl">
      <h3 className="font-display font-bold mb-2">Template Pesan WhatsApp Default</h3>
      <p className="text-xs text-stone-500 mb-3">Gunakan <code className="bg-stone-100 px-1 rounded">{"{nama}"}</code> untuk mengisi nama pelanggan otomatis.</p>
      <textarea value={tpl} onChange={(e) => setTpl(e.target.value)} rows={5} disabled={!isOwner}
                className="pp-input rounded-md px-3 py-2 text-sm w-full font-mono"
                data-testid="wa-template-textarea" />
      {isOwner && (
        <button onClick={save} className="pp-btn-primary rounded-md px-4 py-2 text-sm inline-flex items-center gap-2 mt-3"
                data-testid="wa-template-save">
          <Save className="w-4 h-4" /> Simpan
        </button>
      )}
    </div>
  );
}

// ---------------- PDF Header ----------------
function PdfHeaderPanel({ isOwner }) {
  const [cfg, setCfg] = useState({ shop_name: "", note: "", logo_data_url: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/settings/pdf_header").then((r) => {
      setCfg(r.data?.value || { shop_name: "", note: "", logo_data_url: "" });
      setLoading(false);
    });
  }, []);

  const onLogo = async (file) => {
    if (!file) return;
    if (!/image\/(png|jpe?g|webp)/i.test(file.type)) return toast.error("Hanya PNG, JPG, atau WEBP");
    if (file.size > 1_500_000) return toast.error("Ukuran logo maksimal 1,5MB");
    // Resize to max 400px width using canvas to keep PDF file small
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxW = 400;
          const scale = Math.min(1, maxW / img.width);
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    setCfg((p) => ({ ...p, logo_data_url: dataUrl }));
    toast.success("Logo diproses. Klik Simpan untuk menerapkan.");
  };

  const removeLogo = () => setCfg((p) => ({ ...p, logo_data_url: "" }));

  const save = async () => {
    await api.put("/settings/pdf_header", { value: cfg });
    toast.success("Header PDF disimpan");
  };

  if (loading) return <div className="text-sm text-stone-500">Memuat...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="pp-card p-5 space-y-4">
        <div>
          <h3 className="font-display font-bold text-lg">Header PDF Ekspor</h3>
          <p className="text-xs text-stone-500 mt-1">
            Nama toko, logo, dan catatan singkat yang tercetak di atas setiap PDF segmen.
          </p>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider font-semibold text-stone-500 block mb-1">Nama Toko</label>
          <input value={cfg.shop_name} onChange={(e) => setCfg({ ...cfg, shop_name: e.target.value })}
                 placeholder="mis. Purify Beaute Official" disabled={!isOwner}
                 className="pp-input rounded-md px-2.5 py-1.5 text-sm w-full" data-testid="pdf-shop-name" />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider font-semibold text-stone-500 block mb-1">Catatan Singkat</label>
          <textarea value={cfg.note} onChange={(e) => setCfg({ ...cfg, note: e.target.value })}
                    rows={3} placeholder="mis. Rekap pelanggan periode Februari 2026 · dikirim ke tim admin"
                    disabled={!isOwner}
                    className="pp-input rounded-md px-2.5 py-2 text-sm w-full" data-testid="pdf-note" />
          <div className="text-[10px] text-stone-500 mt-1">Boleh multi-baris. Muncul di bawah nama toko.</div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider font-semibold text-stone-500 block mb-2 flex items-center gap-1">
            <ImageIcon className="w-3 h-3" /> Logo Toko
          </label>
          <div className="flex items-center gap-3">
            <label className="pp-btn-secondary rounded-md px-3 py-1.5 text-sm inline-flex items-center gap-2 cursor-pointer"
                   data-testid="pdf-logo-upload">
              <UploadIcon className="w-4 h-4" /> {cfg.logo_data_url ? "Ganti Logo" : "Upload Logo"}
              <input type="file" accept="image/png,image/jpeg,image/webp" hidden disabled={!isOwner}
                     onChange={(e) => onLogo(e.target.files?.[0])} />
            </label>
            {cfg.logo_data_url && isOwner && (
              <button onClick={removeLogo} className="text-xs text-red-700 hover:underline inline-flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Hapus
              </button>
            )}
          </div>
          <div className="text-[10px] text-stone-500 mt-1">PNG/JPG/WEBP, otomatis di-resize ke max 400px.</div>
        </div>

        {isOwner && (
          <button onClick={save} className="pp-btn-primary rounded-md px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
                  data-testid="pdf-header-save">
            <Save className="w-4 h-4" /> Simpan Header PDF
          </button>
        )}
      </div>

      <div className="pp-card p-5">
        <div className="text-xs uppercase tracking-wider font-semibold text-stone-500 mb-3">Preview Header</div>
        <div className="border rounded-lg p-4 flex items-start gap-3" style={{ borderColor: "var(--border)", background: "#fff" }}>
          {cfg.logo_data_url ? (
            <img src={cfg.logo_data_url} alt="Logo" className="w-20 h-20 object-contain rounded" style={{ background: "#F3EFE6" }} />
          ) : (
            <div className="w-20 h-20 rounded flex items-center justify-center text-[10px] text-stone-400 text-center px-1"
                 style={{ background: "#F3EFE6" }}>
              (belum ada logo)
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-orange-700" style={{ fontFamily: "Helvetica, sans-serif" }}>
              {cfg.shop_name || "PetaPembeli"}
            </div>
            <div className="text-xs text-stone-600 whitespace-pre-line mt-0.5">
              {cfg.note || <span className="text-stone-400 italic">(belum ada catatan)</span>}
            </div>
            <div className="border-t mt-2 pt-2" style={{ borderColor: "#C2410C" }}>
              <div className="font-bold text-stone-900 text-sm">Segmen Pelanggan — Semua</div>
              <div className="text-[10px] text-stone-500">Dibuat 20/02/2026 15:30 · Total 45 pelanggan</div>
            </div>
          </div>
        </div>
        <div className="text-[10px] text-stone-500 mt-2">Ini pratinjau kasar. Layout final akan tercetak di kertas A4 landscape.</div>
      </div>
    </div>
  );
}

// ---------------- CSV Mapping ----------------
function CsvMappingPanel({ isOwner }) {
  const [map, setMap] = useState({});
  useEffect(() => { api.get("/settings/csv_mapping").then((r) => setMap(r.data?.value || {})); }, []);
  const save = async () => {
    await api.put("/settings/csv_mapping", { value: map });
    toast.success("Mapping CSV disimpan");
  };
  const KEYS = [
    ["order_id", "Order ID"],
    ["variation", "Variation"],
    ["quantity", "Quantity"],
    ["province", "Province"],
    ["regency_city", "Regency and City"],
    ["creator_handle", "Creator Handle"],
  ];
  return (
    <div className="pp-card p-5 max-w-2xl">
      <h3 className="font-display font-bold mb-3">Mapping Kolom CSV TikTok Shop</h3>
      <div className="space-y-2">
        {KEYS.map(([k, def]) => (
          <div key={k} className="grid grid-cols-2 gap-2 items-center">
            <div className="text-sm text-stone-700">{def}</div>
            <input value={map[k] || ""} onChange={(e) => setMap({ ...map, [k]: e.target.value })}
                   disabled={!isOwner} placeholder={def}
                   className="pp-input rounded-md px-2.5 py-1.5 text-sm" data-testid={`map-${k}`} />
          </div>
        ))}
      </div>
      {isOwner && (
        <button onClick={save} className="pp-btn-primary rounded-md px-4 py-2 text-sm inline-flex items-center gap-2 mt-4">
          <Save className="w-4 h-4" /> Simpan Mapping
        </button>
      )}
    </div>
  );
}

// ---------------- Users ----------------
function UsersPanel({ isOwner }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const load = () => {
    if (!isOwner) return;
    api.get("/auth/users").then((r) => setUsers(r.data)).catch(() => {});
  };
  useEffect(load, [isOwner]);
  const add = async () => {
    if (!form.email || !form.password) return toast.error("Email & password wajib");
    try {
      await api.post("/auth/register", { ...form, role: "operator" });
      toast.success("Operator ditambahkan");
      setForm({ email: "", password: "", name: "" });
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal");
    }
  };
  if (!isOwner) return <div className="pp-card p-5 text-sm text-stone-500">Hanya owner yang bisa mengelola operator.</div>;
  return (
    <div className="pp-card p-5 max-w-2xl">
      <h3 className="font-display font-bold mb-3">Operator Toko</h3>
      <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
               placeholder="email" className="pp-input rounded-md px-2.5 py-1.5 text-sm flex-1" data-testid="op-email" />
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
               placeholder="nama" className="pp-input rounded-md px-2.5 py-1.5 text-sm flex-1" data-testid="op-name" />
        <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
               placeholder="password" type="password" className="pp-input rounded-md px-2.5 py-1.5 text-sm w-32" data-testid="op-password" />
        <button onClick={add} className="pp-btn-primary rounded-md px-3 py-1.5 text-sm inline-flex items-center gap-1" data-testid="op-add">
          <Plus className="w-3 h-3" /> Tambah
        </button>
      </div>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-3 p-2 rounded-md" style={{ background: "var(--surface-muted)" }}>
            <div className="flex-1">
              <div className="text-sm font-medium">{u.name || "-"}</div>
              <div className="text-xs text-stone-500">{u.email}</div>
            </div>
            <span className="pp-badge" style={{ background: "#FFEDD5", color: "#9A3412", borderColor: "#FED7AA" }}>{u.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
