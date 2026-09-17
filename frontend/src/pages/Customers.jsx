import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Search, MessageCircle, StickyNote, X, Save, Tag as TagIcon, CheckSquare, Square, Trash2, Users as UsersIcon, Heart, ArrowUp, ArrowDown, ArrowUpDown, Briefcase, ExternalLink } from "lucide-react";
import { formatDateShortID, waLink } from "@/lib/format";
import { useT } from "@/lib/i18n.jsx";

export default function Customers() {
  const { t } = useT();
  const [rows, setRows] = useState([]);
  const [tags, setTags] = useState([]);
  const [waTemplate, setWaTemplate] = useState("");
  const [q, setQ] = useState("");
  const [filterRepeat, setFilterRepeat] = useState("all");
  const [filterTag, setFilterTag] = useState("");
  const [drawer, setDrawer] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkPanel, setBulkPanel] = useState(false);
  const [sortBy, setSortBy] = useState(null);  // "followers" | "orders" | "lastSeen"
  const [sortDir, setSortDir] = useState("desc");

  const load = () => api.get("/customers").then((r) => setRows(r.data));

  useEffect(() => {
    load();
    api.get("/tags").then((r) => setTags(r.data));
    api.get("/settings/wa_template").then((r) => setWaTemplate(r.data?.value || ""));
  }, []);

  const toggleSort = (key) => {
    if (sortBy === key) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else { setSortBy(key); setSortDir("desc"); }
  };
  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <ArrowUpDown className="w-3 h-3 inline text-stone-300 ml-0.5" />;
    return sortDir === "desc"
      ? <ArrowDown className="w-3 h-3 inline text-orange-700 ml-0.5" />
      : <ArrowUp className="w-3 h-3 inline text-orange-700 ml-0.5" />;
  };

  const filtered = useMemo(() => {
    let out = rows.filter((r) => {
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
    if (sortBy) {
      const dir = sortDir === "desc" ? -1 : 1;
      const keyFn = {
        followers: (r) => r.tiktok_followers_num ?? -1,
        orders: (r) => r.order_count || 0,
        lastSeen: (r) => r.last_seen || "",
      }[sortBy];
      out = [...out].sort((a, b) => {
        const va = keyFn(a); const vb = keyFn(b);
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return 0;
      });
    }
    return out;
  }, [rows, q, filterRepeat, filterTag, sortBy, sortDir]);

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
    toast.success(t("cust.bulk.updated", { n: selected.size }));
    setSelected(new Set());
    setBulkPanel(false);
    load();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 pb-32" data-testid="customers-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">{t("cust.section")}</div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
            {t("cust.heading")}
          </h1>
          <p className="text-stone-600 mt-2">{t("cust.summary", { n: filtered.length, r: rows.filter((r) => r.is_repeat).length })}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("cust.searchPlaceholder")}
            className="pp-input w-full rounded-lg pl-9 pr-3 py-2 text-sm"
            data-testid="search-pelanggan-input"
          />
        </div>
        <select value={filterRepeat} onChange={(e) => setFilterRepeat(e.target.value)}
                className="pp-input rounded-lg px-3 py-2 text-sm" data-testid="filter-repeat-select">
          <option value="all">{t("cust.filter.allBuyers")}</option>
          <option value="yes">{t("cust.filter.onlyRepeat")}</option>
          <option value="no">{t("cust.filter.onlyNew")}</option>
        </select>
        <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)}
                className="pp-input rounded-lg px-3 py-2 text-sm" data-testid="filter-tag-select">
          <option value="">{t("cust.filter.allTags")}</option>
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
              <th>{t("cust.col.name")}</th>
              <th>{t("cust.col.username")}</th>
              <th>
                <button onClick={() => toggleSort("followers")} className="inline-flex items-center hover:text-orange-700 uppercase tracking-wider text-xs font-semibold" data-testid="sort-followers">
                  {t("cust.col.followers")}<SortIcon col="followers" />
                </button>
              </th>
              <th>{t("cust.col.phone")}</th>
              <th>{t("cust.col.kecamatan")}</th>
              <th>{t("cust.col.kota")}</th>
              <th>{t("cust.col.provinsi")}</th>
              <th>{t("cust.col.profession")}</th>
              <th>{t("cust.col.creator")}</th>
              <th>
                <button onClick={() => toggleSort("orders")} className="inline-flex items-center hover:text-orange-700 uppercase tracking-wider text-xs font-semibold" data-testid="sort-orders">
                  {t("cust.col.order")}<SortIcon col="orders" />
                </button>
              </th>
              <th>{t("cust.col.tag")}</th>
              <th>
                <button onClick={() => toggleSort("lastSeen")} className="inline-flex items-center hover:text-orange-700 uppercase tracking-wider text-xs font-semibold" data-testid="sort-lastseen">
                  {t("cust.col.lastSeen")}<SortIcon col="lastSeen" />
                </button>
              </th>
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
                        {t("cust.badge.repeat", { n: c.order_count })}
                      </span>
                    )}
                    {c.notes && <StickyNote className="w-3 h-3 text-amber-600" title={t("cust.badge.hasNote")} />}
                  </div>
                </td>
                <td className="font-mono text-xs text-stone-600">
                  <div className="flex flex-col gap-0.5">
                    <span>{c.tiktok_username || "-"}</span>
                    {c.tiktok_likes && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-stone-500" title="Likes">
                        <Heart className="w-2.5 h-2.5" /> {c.tiktok_likes}
                      </span>
                    )}
                  </div>
                </td>
                <td className="text-xs" data-testid={`tt-followers-${c.id}`}>
                  {c.tiktok_followers ? (
                    (() => {
                      const n = c.tiktok_followers_num || 0;
                      const tier = n === 0 ? null : n < 10000 ? "micro" : n <= 100000 ? "mid" : "macro";
                      const tierColor = { micro: "#0369A1", mid: "#B45309", macro: "#991B1B" }[tier] || "#57534E";
                      return (
                        <div className="flex items-center gap-1.5">
                          <UsersIcon className="w-3 h-3 text-stone-500" />
                          <span className="font-semibold text-stone-800">{c.tiktok_followers}</span>
                          {tier && (
                            <span className="pp-badge" style={{ background: `${tierColor}18`, color: tierColor, borderColor: `${tierColor}55`, fontSize: 9 }}>
                              {tier}
                            </span>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <span className="text-stone-300">—</span>
                  )}
                </td>
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
                <td className="text-stone-700 text-xs" data-testid={`profession-${c.id}`}>
                  {c.profession || <span className="text-stone-300">—</span>}
                </td>
                <td className="text-stone-700 text-xs">{c.affiliate_creator || <span className="text-stone-400">{t("cust.organic")}</span>}</td>
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
            {t("cust.emptyFilter")}
          </div>
        )}
      </div>

      {/* Sticky bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pp-card shadow-xl px-4 py-3 flex items-center gap-3"
             style={{ background: "#1C1917", color: "white", borderColor: "#292524" }}
             data-testid="bulk-action-bar">
          <div className="text-sm">
            <span className="font-bold">{selected.size}</span> {t("cust.selected")}
          </div>
          <button onClick={() => setBulkPanel(true)} data-testid="btn-open-bulk"
                  className="rounded-md px-3 py-1.5 text-xs font-semibold" style={{ background: "var(--accent)" }}>
            {t("cust.bulkAction")}
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
  const { t } = useT();
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
            <h3 className="font-display font-bold text-lg">{t("cust.bulk.title", { n: count })}</h3>
            <p className="text-xs text-stone-500 mt-0.5">{t("cust.bulk.subtitle")}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded"><X className="w-4 h-4" /></button>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider font-semibold text-stone-500 block mb-2">{t("cust.bulk.addTags")}</label>
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
          <label className="text-xs uppercase tracking-wider font-semibold text-stone-500 block mb-2">{t("cust.bulk.removeTags")}</label>
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
          <label className="text-xs uppercase tracking-wider font-semibold text-stone-500 block mb-2">{t("cust.bulk.appendNote")}</label>
          <textarea value={noteAppend} onChange={(e) => setNoteAppend(e.target.value)} rows={3}
                    placeholder={t("cust.bulk.notePlaceholder")}
                    className="pp-input w-full rounded-md px-2.5 py-2 text-sm" data-testid="bulk-note-append" />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="pp-btn-secondary rounded-md px-3 py-2 text-sm">{t("common.cancel")}</button>
          <button onClick={apply} disabled={applying || (addTags.size === 0 && removeTags.size === 0 && !noteAppend)}
                  className="pp-btn-primary rounded-md px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
                  data-testid="btn-bulk-apply">
            <Save className="w-4 h-4" /> {applying ? t("common.saving") : t("cust.bulk.apply")}
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomerDrawer({ id, onClose, onUpdated, tags, waTemplate }) {
  const { t } = useT();
  const [data, setData] = useState(null);
  const [notes, setNotes] = useState("");
  const [tagIds, setTagIds] = useState([]);
  const [profession, setProfession] = useState("");

  useEffect(() => {
    api.get(`/customers/${id}`).then((r) => {
      setData(r.data);
      setNotes(r.data.customer.notes || "");
      setTagIds(r.data.customer.tag_ids || []);
      setProfession(r.data.customer.profession || "");
    });
  }, [id]);

  const save = async () => {
    await api.patch(`/customers/${id}`, { notes, tag_ids: tagIds, profession });
    toast.success(t("cust.drawer.saved"));
    onUpdated();
  };

  const googleSearchUrl = data?.customer.recipient_name
    ? `https://www.google.com/search?q=${encodeURIComponent(`"${data.customer.recipient_name}" linkedin`)}`
    : "https://www.google.com";

  const toggleTag = (tid) => {
    setTagIds((prev) => (prev.includes(tid) ? prev.filter((x) => x !== tid) : [...prev, tid]));
  };

  return (
    <div className="fixed inset-0 z-50 flex" data-testid="customer-detail-drawer">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg h-full overflow-y-auto p-6 space-y-5" style={{ background: "var(--bg)" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-stone-500">{t("cust.drawer.title")}</div>
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
                <Info label={t("cust.drawer.username")} value={data.customer.tiktok_username} />
                <Info label={t("cust.drawer.phone")} value={data.customer.phone} mono />
                <Info label={t("cust.drawer.kota")} value={data.customer.kota} />
                <Info label={t("cust.drawer.provinsi")} value={data.customer.provinsi} />
                <Info label={t("cust.drawer.kecamatan")} value={data.customer.kecamatan} />
                <Info label={t("cust.drawer.kelurahan")} value={data.customer.kelurahan} />
              </div>
              <Info label={t("cust.drawer.addressDetail")} value={data.customer.address_detail} block />
              <Info label={t("cust.drawer.creator")} value={data.customer.affiliate_creator} />
              <div className="pt-2 flex items-center gap-2">
                <a
                  href={waLink(data.customer.phone, waTemplate, data.customer.recipient_name)}
                  target="_blank" rel="noreferrer"
                  className="pp-btn-wa inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
                  data-testid="btn-chat-wa-detail"
                >
                  <MessageCircle className="w-4 h-4" /> {t("cust.drawer.chatWa")}
                </a>
                {data.customer.is_repeat && (
                  <span className="pp-badge" style={{ background: "#DCFCE7", color: "#166534", borderColor: "#86EFAC" }}>
                    {t("cust.drawer.repeatBadge", { n: data.customer.order_count })}
                  </span>
                )}
              </div>
            </div>

            <TikTokProfileCard customer={data.customer} t={t} />

            <div className="pp-card p-4" data-testid="profession-card">
              <label className="text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2 flex items-center gap-2">
                <Briefcase className="w-3 h-3" /> {t("cust.drawer.professionLabel")}
              </label>
              <input
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder={t("cust.drawer.professionPlaceholder")}
                className="pp-input rounded-md px-3 py-2 text-sm w-full"
                data-testid="input-profession"
              />
              <div className="flex items-center gap-2 mt-2">
                <a
                  href={googleSearchUrl}
                  target="_blank" rel="noreferrer"
                  className="pp-btn-secondary rounded-md px-3 py-1.5 text-xs font-medium inline-flex items-center gap-1.5"
                  data-testid="btn-search-google"
                >
                  <ExternalLink className="w-3 h-3" /> {t("cust.drawer.searchGoogle")}
                </a>
                <span className="text-[10px] text-stone-500 flex-1">{t("cust.drawer.searchGoogleHint")}</span>
              </div>
            </div>

            <div className="pp-card p-4">
              <label className="text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2 flex items-center gap-2">
                <TagIcon className="w-3 h-3" /> {t("cust.drawer.tagsLabel")}
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
              <label className="text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2 block">{t("cust.drawer.notesLabel")}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder={t("cust.drawer.notesPlaceholder")}
                className="pp-input w-full rounded-md px-3 py-2 text-sm"
                data-testid="input-catatan-pelanggan"
              />
            </div>

            <div className="pp-card p-4">
              <div className="text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2">{t("cust.drawer.orderHistory", { n: data.orders.length })}</div>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {data.orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between text-xs border-b pb-2 last:border-b-0" style={{ borderColor: "var(--border)" }}>
                    <div>
                      <div className="font-mono text-stone-700">{o.order_id || t("cust.drawer.noOrderId")}</div>
                      <div className="text-stone-500">{o.created_at_order || o.created_at?.slice(0, 10)}</div>
                    </div>
                    <div className="text-right text-stone-600">
                      <div>{o.variation || "-"}</div>
                      <div className="text-stone-400">{t("cust.drawer.qty")} {o.quantity || 1}</div>
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
              <Save className="w-4 h-4" /> {t("cust.drawer.saveChanges")}
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

function TikTokProfileCard({ customer, t }) {
  const followers = customer.tiktok_followers;
  const likes = customer.tiktok_likes;
  const hasAny = followers || likes;
  return (
    <div className="pp-card p-4" data-testid="tiktok-profile-card">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase tracking-wider font-semibold text-stone-500">
          {t("cust.drawer.profileTitle")}
        </div>
        {customer.tiktok_username && (
          <span className="font-mono text-xs text-stone-600">@{customer.tiktok_username}</span>
        )}
      </div>
      {hasAny ? (
        <div className="grid grid-cols-2 gap-2">
          <div
            className="rounded-lg p-3 flex items-center gap-3"
            style={{ background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)", border: "1px solid #FED7AA" }}
            data-testid="tt-followers-tile"
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#C2410C" }}>
              <UsersIcon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-stone-500">{t("cust.drawer.followers")}</div>
              <div className="font-display font-extrabold text-xl text-stone-900 leading-tight">
                {followers || "—"}
              </div>
            </div>
          </div>
          <div
            className="rounded-lg p-3 flex items-center gap-3"
            style={{ background: "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)", border: "1px solid #FECACA" }}
            data-testid="tt-likes-tile"
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#DC2626" }}>
              <Heart className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-stone-500">{t("cust.drawer.likes")}</div>
              <div className="font-display font-extrabold text-xl text-stone-900 leading-tight">
                {likes || "—"}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-xs text-stone-500 italic py-2">{t("cust.drawer.profileEmpty")}</div>
      )}
    </div>
  );
}
