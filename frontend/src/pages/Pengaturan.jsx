import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Trash2, Plus, Save, MessageCircle, MapPin, Tag as TagIcon, Users, FileText, Upload as UploadIcon, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/lib/auth.jsx";
import { useT } from "@/lib/i18n.jsx";

const TAB_META = [
  { key: "norm", labelKey: "st.tab.norm", icon: MapPin },
  { key: "tags", labelKey: "st.tab.tags", icon: TagIcon },
  { key: "wa", labelKey: "st.tab.wa", icon: MessageCircle },
  { key: "pdf", labelKey: "st.tab.pdf", icon: FileText },
  { key: "csv", labelKey: "st.tab.csv", icon: MapPin },
  { key: "users", labelKey: "st.tab.users", icon: Users },
];

export default function Pengaturan() {
  const { t } = useT();
  const { isOwner } = useAuth();
  const [tab, setTab] = useState("norm");

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5" data-testid="pengaturan-page">
      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">{t("st.section")}</div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">{t("st.heading")}</h1>
        {!isOwner && <p className="text-xs text-amber-800 mt-2">{t("st.ownerOnly")}</p>}
      </div>

      <div className="flex flex-wrap gap-1 border-b" style={{ borderColor: "var(--border)" }}>
        {TAB_META.map((tt) => (
          <button key={tt.key} onClick={() => setTab(tt.key)} data-testid={`tab-${tt.key}`}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    tab === tt.key ? "border-orange-700 text-orange-800" : "border-transparent text-stone-600 hover:text-stone-900"
                  }`}>
            <tt.icon className="w-3.5 h-3.5 inline mr-1.5" />{t(tt.labelKey)}
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
  const { t } = useT();
  const [rules, setRules] = useState([]);
  const [unmapped, setUnmapped] = useState([]);
  const [form, setForm] = useState({ raw: "", normalized: "", level: "provinsi" });

  const load = () => {
    api.get("/normalization/rules").then((r) => setRules(r.data));
    api.get("/normalization/unmapped").then((r) => setUnmapped(r.data));
  };
  useEffect(load, []);

  const add = async () => {
    if (!form.raw || !form.normalized) return toast.error(t("st.norm.fillBoth"));
    await api.post("/normalization/rules", form);
    toast.success(t("st.norm.added"));
    setForm({ raw: "", normalized: "", level: form.level });
    load();
  };
  const del = async (id) => {
    await api.delete(`/normalization/rules/${id}`);
    toast.success(t("st.norm.deleted"));
    load();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 pp-card p-5">
        <h3 className="font-display font-bold mb-3">{t("st.norm.title", { n: rules.length })}</h3>
        {isOwner && (
          <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
            <input value={form.raw} onChange={(e) => setForm({ ...form, raw: e.target.value })}
                   placeholder={t("st.norm.rawPh")} className="pp-input rounded-md px-2.5 py-1.5 text-sm flex-1" data-testid="norm-raw" />
            <input value={form.normalized} onChange={(e) => setForm({ ...form, normalized: e.target.value })}
                   placeholder={t("st.norm.normPh")} className="pp-input rounded-md px-2.5 py-1.5 text-sm flex-1" data-testid="norm-normalized" />
            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="pp-input rounded-md px-2.5 py-1.5 text-sm">
              <option value="provinsi">{t("st.norm.provinsi")}</option>
              <option value="kota">{t("st.norm.kota")}</option>
            </select>
            <button onClick={add} className="pp-btn-primary rounded-md px-3 py-1.5 text-sm inline-flex items-center gap-1"
                    data-testid="norm-add">
              <Plus className="w-3 h-3" /> {t("st.norm.add")}
            </button>
          </div>
        )}
        <div className="max-h-96 overflow-y-auto">
          <table className="pp-table">
            <thead>
              <tr><th>{t("st.norm.col.raw")}</th><th>{t("st.norm.col.norm")}</th><th>{t("st.norm.col.level")}</th><th></th></tr>
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
        <h3 className="font-display font-bold mb-2">{t("st.norm.unmapped", { n: unmapped.length })}</h3>
        <p className="text-xs text-stone-500 mb-3">{t("st.norm.unmappedSub")}</p>
        {unmapped.length === 0 ? (
          <div className="text-sm text-stone-500 py-6 text-center">{t("st.norm.unmappedEmpty")}</div>
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
                          className="text-xs pp-link">{t("st.norm.map")}</button>
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
  const { t } = useT();
  const [tags, setTags] = useState([]);
  const [form, setForm] = useState({ name: "", color: "#C2410C" });

  const load = () => api.get("/tags").then((r) => setTags(r.data));
  useEffect(load, []);

  const add = async () => {
    if (!form.name) return;
    await api.post("/tags", form);
    toast.success(t("st.tags.added"));
    setForm({ name: "", color: "#C2410C" });
    load();
  };
  const update = async (tg) => {
    await api.patch(`/tags/${tg.id}`, { name: tg.name, color: tg.color });
    toast.success(t("st.tags.updated"));
    load();
  };
  const del = async (id) => {
    if (!window.confirm(t("st.tags.confirmDelete"))) return;
    await api.delete(`/tags/${id}`);
    toast.success(t("st.tags.deleted"));
    load();
  };

  return (
    <div className="pp-card p-5">
      <h3 className="font-display font-bold mb-3">{t("st.tags.title")}</h3>
      {isOwner && (
        <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                 placeholder={t("st.tags.namePh")} className="pp-input rounded-md px-2.5 py-1.5 text-sm flex-1" data-testid="tag-name" />
          <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
                 className="pp-input rounded-md w-14 h-9" data-testid="tag-color" />
          <button onClick={add} className="pp-btn-primary rounded-md px-3 py-1.5 text-sm inline-flex items-center gap-1"
                  data-testid="tag-add">
            <Plus className="w-3 h-3" /> {t("st.tags.add")}
          </button>
        </div>
      )}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {tags.map((tg, i) => (
          <div key={tg.id} className="flex items-center gap-2 p-2 rounded-md" style={{ background: "var(--surface-muted)" }}>
            <input type="color" value={tg.color} disabled={!isOwner}
                   onChange={(e) => setTags((prev) => prev.map((x, j) => j === i ? { ...x, color: e.target.value } : x))}
                   className="w-8 h-8 rounded" />
            <input value={tg.name} disabled={!isOwner}
                   onChange={(e) => setTags((prev) => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                   className="pp-input rounded-md px-2 py-1 text-sm flex-1" />
            <span className="pp-badge" style={{ background: `${tg.color}20`, color: tg.color, borderColor: `${tg.color}55` }}>{tg.name}</span>
            {isOwner && (
              <>
                <button onClick={() => update(tg)} className="text-xs pp-link">{t("st.tags.saveEach")}</button>
                <button onClick={() => del(tg.id)} className="text-red-700 hover:underline text-xs"><Trash2 className="w-3 h-3" /></button>
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
  const { t } = useT();
  const [tpl, setTpl] = useState("");
  useEffect(() => { api.get("/settings/wa_template").then((r) => setTpl(r.data?.value || "")); }, []);
  const save = async () => {
    await api.put("/settings/wa_template", { value: tpl });
    toast.success(t("st.wa.saved"));
  };
  return (
    <div className="pp-card p-5 max-w-2xl">
      <h3 className="font-display font-bold mb-2">{t("st.wa.title")}</h3>
      <p className="text-xs text-stone-500 mb-3">{t("st.wa.helpUse")} <code className="bg-stone-100 px-1 rounded">{"{nama}"}</code> {t("st.wa.help")}</p>
      <textarea value={tpl} onChange={(e) => setTpl(e.target.value)} rows={5} disabled={!isOwner}
                className="pp-input rounded-md px-3 py-2 text-sm w-full font-mono"
                data-testid="wa-template-textarea" />
      {isOwner && (
        <button onClick={save} className="pp-btn-primary rounded-md px-4 py-2 text-sm inline-flex items-center gap-2 mt-3"
                data-testid="wa-template-save">
          <Save className="w-4 h-4" /> {t("st.wa.save")}
        </button>
      )}
    </div>
  );
}

// ---------------- PDF Header ----------------
function PdfHeaderPanel({ isOwner }) {
  const { t } = useT();
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
    if (!/image\/(png|jpe?g|webp)/i.test(file.type)) return toast.error(t("st.pdf.errFormat"));
    if (file.size > 1_500_000) return toast.error(t("st.pdf.errSize"));
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
    toast.success(t("st.pdf.logoOk"));
  };

  const removeLogo = () => setCfg((p) => ({ ...p, logo_data_url: "" }));

  const save = async () => {
    await api.put("/settings/pdf_header", { value: cfg });
    toast.success(t("st.pdf.saved"));
  };

  if (loading) return <div className="text-sm text-stone-500">{t("common.loading")}</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="pp-card p-5 space-y-4">
        <div>
          <h3 className="font-display font-bold text-lg">{t("st.pdf.title")}</h3>
          <p className="text-xs text-stone-500 mt-1">
            {t("st.pdf.sub")}
          </p>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider font-semibold text-stone-500 block mb-1">{t("st.pdf.shopName")}</label>
          <input value={cfg.shop_name} onChange={(e) => setCfg({ ...cfg, shop_name: e.target.value })}
                 placeholder={t("st.pdf.shopNamePh")} disabled={!isOwner}
                 className="pp-input rounded-md px-2.5 py-1.5 text-sm w-full" data-testid="pdf-shop-name" />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider font-semibold text-stone-500 block mb-1">{t("st.pdf.note")}</label>
          <textarea value={cfg.note} onChange={(e) => setCfg({ ...cfg, note: e.target.value })}
                    rows={3} placeholder={t("st.pdf.notePh")}
                    disabled={!isOwner}
                    className="pp-input rounded-md px-2.5 py-2 text-sm w-full" data-testid="pdf-note" />
          <div className="text-[10px] text-stone-500 mt-1">{t("st.pdf.noteHint")}</div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider font-semibold text-stone-500 block mb-2 flex items-center gap-1">
            <ImageIcon className="w-3 h-3" /> {t("st.pdf.logo")}
          </label>
          <div className="flex items-center gap-3">
            <label className="pp-btn-secondary rounded-md px-3 py-1.5 text-sm inline-flex items-center gap-2 cursor-pointer"
                   data-testid="pdf-logo-upload">
              <UploadIcon className="w-4 h-4" /> {cfg.logo_data_url ? t("st.pdf.replace") : t("st.pdf.upload")}
              <input type="file" accept="image/png,image/jpeg,image/webp" hidden disabled={!isOwner}
                     onChange={(e) => onLogo(e.target.files?.[0])} />
            </label>
            {cfg.logo_data_url && isOwner && (
              <button onClick={removeLogo} className="text-xs text-red-700 hover:underline inline-flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> {t("common.delete")}
              </button>
            )}
          </div>
          <div className="text-[10px] text-stone-500 mt-1">{t("st.pdf.logoHint")}</div>
        </div>

        {isOwner && (
          <button onClick={save} className="pp-btn-primary rounded-md px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
                  data-testid="pdf-header-save">
            <Save className="w-4 h-4" /> {t("st.pdf.save")}
          </button>
        )}
      </div>

      <div className="pp-card p-5">
        <div className="text-xs uppercase tracking-wider font-semibold text-stone-500 mb-3">{t("st.pdf.preview")}</div>
        <div className="border rounded-lg p-4 flex items-start gap-3" style={{ borderColor: "var(--border)", background: "#fff" }}>
          {cfg.logo_data_url ? (
            <img src={cfg.logo_data_url} alt="Logo" className="w-20 h-20 object-contain rounded" style={{ background: "#F3EFE6" }} />
          ) : (
            <div className="w-20 h-20 rounded flex items-center justify-center text-[10px] text-stone-400 text-center px-1"
                 style={{ background: "#F3EFE6" }}>
              {t("st.pdf.noLogo")}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-orange-700" style={{ fontFamily: "Helvetica, sans-serif" }}>
              {cfg.shop_name || "PelangganKu"}
            </div>
            <div className="text-xs text-stone-600 whitespace-pre-line mt-0.5">
              {cfg.note || <span className="text-stone-400 italic">{t("st.pdf.noNote")}</span>}
            </div>
            <div className="border-t mt-2 pt-2" style={{ borderColor: "#C2410C" }}>
              <div className="font-bold text-stone-900 text-sm">{t("st.pdf.previewTitle")}</div>
              <div className="text-[10px] text-stone-500">{t("st.pdf.previewMeta")}</div>
            </div>
          </div>
        </div>
        <div className="text-[10px] text-stone-500 mt-2">{t("st.pdf.previewCaption")}</div>
      </div>
    </div>
  );
}

// ---------------- CSV Mapping ----------------
function CsvMappingPanel({ isOwner }) {
  const { t } = useT();
  const [map, setMap] = useState({});
  useEffect(() => { api.get("/settings/csv_mapping").then((r) => setMap(r.data?.value || {})); }, []);
  const save = async () => {
    await api.put("/settings/csv_mapping", { value: map });
    toast.success(t("st.csv.saved"));
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
      <h3 className="font-display font-bold mb-3">{t("st.csv.title")}</h3>
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
          <Save className="w-4 h-4" /> {t("st.csv.save")}
        </button>
      )}
    </div>
  );
}

// ---------------- Users ----------------
function UsersPanel({ isOwner }) {
  const { t } = useT();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const load = () => {
    if (!isOwner) return;
    api.get("/auth/users").then((r) => setUsers(r.data)).catch(() => {});
  };
  useEffect(load, [isOwner]);
  const add = async () => {
    if (!form.email || !form.password) return toast.error(t("st.users.needEmail"));
    try {
      await api.post("/auth/register", { ...form, role: "operator" });
      toast.success(t("st.users.added"));
      setForm({ email: "", password: "", name: "" });
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || t("st.users.fail"));
    }
  };
  if (!isOwner) return <div className="pp-card p-5 text-sm text-stone-500">{t("st.users.deny")}</div>;
  return (
    <div className="pp-card p-5 max-w-2xl">
      <h3 className="font-display font-bold mb-3">{t("st.users.title")}</h3>
      <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
               placeholder={t("st.users.emailPh")} className="pp-input rounded-md px-2.5 py-1.5 text-sm flex-1" data-testid="op-email" />
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
               placeholder={t("st.users.namePh")} className="pp-input rounded-md px-2.5 py-1.5 text-sm flex-1" data-testid="op-name" />
        <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
               placeholder={t("st.users.pwPh")} type="password" className="pp-input rounded-md px-2.5 py-1.5 text-sm w-32" data-testid="op-password" />
        <button onClick={add} className="pp-btn-primary rounded-md px-3 py-1.5 text-sm inline-flex items-center gap-1" data-testid="op-add">
          <Plus className="w-3 h-3" /> {t("st.users.add")}
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
