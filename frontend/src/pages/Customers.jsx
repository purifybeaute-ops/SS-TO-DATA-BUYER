import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Search, MessageCircle, StickyNote, X, Save, Tag as TagIcon, CheckSquare, Square, Trash2 } from "lucide-react";
import { formatDateShortID, waLink } from "@/lib/format";

export default function Customers() {
  const [rows, setRows] = useState([]);
  const [tags, setTags] = useState([]);
  const [waTemplate, setWaTemplate] = useState("");
  const [q, setQ] = useState("");
  const [filterRepeat, setFilterRepeat] = useState("all");
  const [filterTag, setFilterTag] = useState("");
  const [drawer, setDrawer] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkPanel, setBulkPanel] = useState(false);

  const load = () => api.get("/customers").then((r) => setRows(r.data));

  useEffect(() => {
    load();
    api.get("/tags").then((r) => setTags(r.data));
    api.get("/settings/wa_template").then((r) => setWaTemplate(r.data?.value || ""));
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (q) {
        const p = q.toLowerCase();
        const hay = `${r.recipient_name} ${r.tiktok_username} ${r.phone} ${r.kota} ${r.provinsi} ${r.kecamatan}`.toLowerCase();
        if (!hay.includes(p)) return false;
      }
      if (filterRepeat === "yes" && !r.is_repeat) return false;
      if (filterRepeat === "no" && r.is_repeat) return false;
      if (filterTag && !(r.tag_ids || []).includes(filterTag)) return false;
      return true;
    });
  }, [rows, q, filterRepeat, filterTag]);

  const tagById = useMemo(() => Object.fromEntries(tags.map((t) => [t.id, t])), [tags]);

  const toggle = (id) => {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  };
  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  const applyBulk = async (payload) => {
    if (selected.size === 0) return;
    await api.post("/customers/bulk", { ids: Array.from(selected), ...payload });
    toast.success(`${selected.size} pelanggan diperbarui`);
    setSelected(new Set());
    setBulkPanel(false);
    load();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 pb-32" data-testid="customers-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">CRM</div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
            Database Pelanggan
          </h1>
          <p className="text-stone-600 mt-2">{filtered.length} pelanggan · {rows.filter((r) => r.is_repeat).length} pembeli berulang</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama, username, telepon, kecamatan, kota..."
            className="pp-input w-full rounded-lg pl-9 pr-3 py-2 text-sm"
            data-testid="search-pelanggan-input"
          />
        </div>
        <select value={filterRepeat} onChange={(e) => setFilterRepeat(e.target.value)}
                className="pp-input rounded-lg px-3 py-2 text-sm" data-testid="filter-repeat-select">
          <option value="all">Semua Pembeli</option>
          <option value="yes">Hanya Berulang</option>
          <option value="no">Hanya Baru</option>
        </select>
        <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)}
                className="pp-input rounded-lg px-3 py-2 text-sm" data-testid="filter-tag-select">
          <option value="">Semua Tag</option>
          {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="pp-table-scroll" data-testid="customers-table">
        <table className="pp-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <button onClick={toggleAll} data-testid="bulk-select-all" className="text-stone-500 hover:text-orange-700">
                  {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                </button>
              </th>
              <th>Nama</th>
              <th>Username</th>
              <th>Telepon</th>
              <th>Kecamatan</th>
              <th>Kota</th>
              <th>Provinsi</th>
              <th>Creator</th>
              <th>Order</th>
              <th>Tag</th>
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className={selected.has(c.id) ? "bg-orange-50" : ""}>
                <td>
                  <button onClick={() => toggle(c.id)} data-testid={`bulk-select-${c.id}`}
                          className={selected.has(c.id) ? "text-orange-700" : "text-stone-400 hover:text-orange-700"}>
                    {selected.has(c.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                </td>
                <td>
                  <button onClick={() => setDrawer(c.id)} className="font-medium hover:underline text-stone-900"
                          data-testid={`open-detail-${c.id}`}>
                    {c.recipient_name}
                  </button>
                  <div className="flex items-center gap-1 mt-0.5">
                    {c.is_repeat && (
                      <span className="pp-badge" style={{ background: "#DCFCE7", color: "#166534", borderColor: "#86EFAC" }}>
                        Pembeli Berulang ×{c.order_count}
                      </span>
                    )}
                    {c.notes && <StickyNote className="w-3 h-3 text-amber-600" title="Ada catatan" />}
                  </div>
                </td>
                <td className="font-mono text-xs text-stone-600">{c.tiktok_username || "-"}</td>
                <td>
                  <a href={waLink(c.phone, waTemplate, c.recipient_name)} target="_blank" rel="noreferrer"
                     className="inline-flex items-center gap-1 text-green-700 hover:underline font-mono text-xs"
                     data-testid={`btn-whatsapp-chat-${c.id}`}>
                    <MessageCircle className="w-3 h-3" /> {c.phone}
                  </a>
                </td>
                <td className="text-stone-700">{c.kecamatan || "-"}</td>
                <td className="text-stone-700">{c.kota || "-"}</td>
                <td className="text-stone-700">{c.provinsi || "-"}</td>
                <td className="text-stone-700 text-xs">{c.affiliate_creator || <span className="text-stone-400">Organik</span>}</td>
                <td className="font-mono text-center">{c.order_count}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {(c.tag_ids || []).map((tid) => {
                      const t = tagById[tid];
                      if (!t) return null;
                      return (
                        <span key={tid} className="pp-badge" style={{ background: `${t.color}20`, color: t.color, borderColor: `${t.color}55` }}>
                          {t.name}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="text-xs text-stone-500">{formatDateShortID(c.last_seen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-stone-500">
            Tidak ada pelanggan cocok dengan filter.
          </div>
        )}
      </div>

      {/* Sticky bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pp-card shadow-xl px-4 py-3 flex items-center gap-3"
             style={{ background: "#1C1917", color: "white", borderColor: "#292524" }}
             data-testid="bulk-action-bar">
          <div className="text-sm">
            <span className="font-bold">{selected.size}</span> dipilih
          </div>
          <button onClick={() => setBulkPanel(true)} data-testid="btn-open-bulk"
                  className="rounded-md px-3 py-1.5 text-xs font-semibold" style={{ background: "var(--accent)" }}>
            Aksi Bulk
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {bulkPanel && (
        <BulkPanel
          count={selected.size}
          tags={tags}
          onClose={() => setBulkPanel(false)}
          onApply={applyBulk}
        />
      )}

      {drawer && (
        <CustomerDrawer
          id={drawer}
          onClose={() => setDrawer(null)}
          onUpdated={load}
          tags={tags}
          waTemplate={waTemplate}
        />
      )}
    </div>
  );
}

function BulkPanel({ count, tags, onClose, onApply }) {
  const [addTags, setAddTags] = useState(new Set());
  const [removeTags, setRemoveTags] = useState(new Set());
  const [noteAppend, setNoteAppend] = useState("");
  const [applying, setApplying] = useState(false);

  const toggleAdd = (id) => setAddTags((p) => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleRemove = (id) => setRemoveTags((p) => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const apply = async () => {
    setApplying(true);
    try {
      await onApply({
        add_tag_ids: Array.from(addTags),
        remove_tag_ids: Array.from(removeTags),
        note_append: noteAppend || null,
      });
    } finally { setApplying(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" data-testid="bulk-panel">
      <div className="pp-card w-full max-w-md p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display font-bold text-lg">Aksi Bulk untuk {count} pelanggan</h3>
            <p className="text-xs text-stone-500 mt-0.5">Perubahan akan diterapkan ke semua yang dipilih.</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded"><X className="w-4 h-4" /></button>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider font-semibold text-stone-500 block mb-2">Tambah Tag</label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => {
              const on = addTags.has(t.id);
              return (
                <button key={t.id} onClick={() => toggleAdd(t.id)}
                        className="pp-badge cursor-pointer"
                        data-testid={`bulk-add-${t.name}`}
                        style={{ background: on ? t.color : `${t.color}20`, color: on ? "#fff" : t.color, borderColor: `${t.color}55` }}>
                  + {t.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider font-semibold text-stone-500 block mb-2">Hapus Tag</label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => {
              const on = removeTags.has(t.id);
              return (
                <button key={t.id} onClick={() => toggleRemove(t.id)}
                        className="pp-badge cursor-pointer inline-flex items-center gap-1"
                        style={{ background: on ? "#991B1B" : "#F3F4F6", color: on ? "#fff" : "#4B5563", borderColor: on ? "#7F1D1D" : "#D1D5DB" }}>
                  <Trash2 className="w-2.5 h-2.5" /> {t.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider font-semibold text-stone-500 block mb-2">Tambah Catatan (ditambahkan ke catatan yang ada)</label>
          <textarea value={noteAppend} onChange={(e) => setNoteAppend(e.target.value)} rows={3}
                    placeholder="mis. Prospek VIP, pantau closing rate minggu depan"
                    className="pp-input w-full rounded-md px-2.5 py-2 text-sm" data-testid="bulk-note-append" />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="pp-btn-secondary rounded-md px-3 py-2 text-sm">Batal</button>
          <button onClick={apply} disabled={applying || (addTags.size === 0 && removeTags.size === 0 && !noteAppend)}
                  className="pp-btn-primary rounded-md px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
                  data-testid="btn-bulk-apply">
            <Save className="w-4 h-4" /> {applying ? "Menyimpan..." : "Terapkan"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomerDrawer({ id, onClose, onUpdated, tags, waTemplate }) {
  const [data, setData] = useState(null);
  const [notes, setNotes] = useState("");
  const [tagIds, setTagIds] = useState([]);

  useEffect(() => {
    api.get(`/customers/${id}`).then((r) => {
      setData(r.data);
      setNotes(r.data.customer.notes || "");
      setTagIds(r.data.customer.tag_ids || []);
    });
  }, [id]);

  const save = async () => {
    await api.patch(`/customers/${id}`, { notes, tag_ids: tagIds });
    toast.success("Data pelanggan disimpan");
    onUpdated();
  };

  const toggleTag = (tid) => {
    setTagIds((prev) => (prev.includes(tid) ? prev.filter((x) => x !== tid) : [...prev, tid]));
  };

  return (
    <div className="fixed inset-0 z-50 flex" data-testid="customer-detail-drawer">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg h-full overflow-y-auto p-6 space-y-5" style={{ background: "var(--bg)" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-stone-500">Detail Pelanggan</div>
            <h2 className="font-display text-2xl font-extrabold text-stone-900 mt-0.5">
              {data?.customer.recipient_name || "..."}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-stone-100" data-testid="drawer-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {data && (
          <>
            <div className="pp-card p-4 space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Info label="Username" value={data.customer.tiktok_username} />
                <Info label="Telepon" value={data.customer.phone} mono />
                <Info label="Kota" value={data.customer.kota} />
                <Info label="Provinsi" value={data.customer.provinsi} />
                <Info label="Kecamatan" value={data.customer.kecamatan} />
                <Info label="Kelurahan" value={data.customer.kelurahan} />
              </div>
              <Info label="Detail Alamat" value={data.customer.address_detail} block />
              <Info label="Creator Afiliasi" value={data.customer.affiliate_creator} />
              <div className="pt-2 flex items-center gap-2">
                <a
                  href={waLink(data.customer.phone, waTemplate, data.customer.recipient_name)}
                  target="_blank" rel="noreferrer"
                  className="pp-btn-wa inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
                  data-testid="btn-chat-wa-detail"
                >
                  <MessageCircle className="w-4 h-4" /> Chat WA
                </a>
                {data.customer.is_repeat && (
                  <span className="pp-badge" style={{ background: "#DCFCE7", color: "#166534", borderColor: "#86EFAC" }}>
                    Berulang ×{data.customer.order_count}
                  </span>
                )}
              </div>
            </div>

            <div className="pp-card p-4">
              <label className="text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2 flex items-center gap-2">
                <TagIcon className="w-3 h-3" /> Tag Khusus
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => {
                  const on = tagIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleTag(t.id)}
                      className="pp-badge cursor-pointer transition-all"
                      style={{
                        background: on ? t.color : `${t.color}20`,
                        color: on ? "#fff" : t.color,
                        borderColor: `${t.color}55`,
                      }}
                      data-testid={`toggle-tag-${t.name}`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pp-card p-4">
              <label className="text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2 block">Catatan</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Catatan owner khusus untuk pelanggan ini..."
                className="pp-input w-full rounded-md px-3 py-2 text-sm"
                data-testid="input-catatan-pelanggan"
              />
            </div>

            <div className="pp-card p-4">
              <div className="text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2">Riwayat Pesanan ({data.orders.length})</div>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {data.orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between text-xs border-b pb-2 last:border-b-0" style={{ borderColor: "var(--border)" }}>
                    <div>
                      <div className="font-mono text-stone-700">{o.order_id || "(tanpa ID)"}</div>
                      <div className="text-stone-500">{o.created_at_order || o.created_at?.slice(0, 10)}</div>
                    </div>
                    <div className="text-right text-stone-600">
                      <div>{o.variation || "-"}</div>
                      <div className="text-stone-400">Qty {o.quantity || 1}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={save}
              className="pp-btn-primary w-full rounded-lg py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2"
              data-testid="btn-simpan-catatan"
            >
              <Save className="w-4 h-4" /> Simpan Perubahan
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Info({ label, value, mono, block }) {
  return (
    <div className={block ? "col-span-2" : ""}>
      <div className="text-[10px] uppercase tracking-wider text-stone-500">{label}</div>
      <div className={`text-stone-900 ${mono ? "font-mono text-xs" : "text-sm"}`}>{value || "-"}</div>
    </div>
  );
}
