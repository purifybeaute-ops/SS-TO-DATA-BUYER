import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Clock, MessageCircle, AlertOctagon, Search } from "lucide-react";
import { formatDateShortID, waLink } from "@/lib/format";

const BUCKETS = [
  { key: "days_30_59", label: "30–59 Hari", color: "#D97706", desc: "Baru diam, sapa singkat sudah cukup." },
  { key: "days_60_89", label: "60–89 Hari", color: "#C2410C", desc: "Tawarkan produk baru atau diskon kecil." },
  { key: "days_90_plus", label: "90+ Hari", color: "#991B1B", desc: "Kirim pesan reaktivasi dengan penawaran menarik." },
];

export default function Reminder() {
  const [data, setData] = useState({ counts: {}, buckets: { days_30_59: [], days_60_89: [], days_90_plus: [] } });
  const [waTemplate, setWaTemplate] = useState("");
  const [tab, setTab] = useState("days_60_89");
  const [q, setQ] = useState("");

  useEffect(() => {
    api.get("/reminders").then((r) => setData(r.data));
    api.get("/settings/wa_template").then((r) => setWaTemplate(r.data?.value || ""));
  }, []);

  const rows = useMemo(() => {
    const list = data.buckets[tab] || [];
    if (!q) return list;
    const p = q.toLowerCase();
    return list.filter((c) => `${c.recipient_name} ${c.tiktok_username} ${c.kota}`.toLowerCase().includes(p));
  }, [data.buckets, tab, q]);

  const totalDormant = Object.values(data.counts).reduce((a, b) => a + b, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5" data-testid="reminder-page">
      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">Reaktivasi</div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
          Segmen Reminder
        </h1>
        <p className="text-stone-600 mt-2">
          Pelanggan yang sudah lama tidak order. Sapa mereka sebelum mereka lupa.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {BUCKETS.map((b) => (
          <button
            key={b.key}
            onClick={() => setTab(b.key)}
            data-testid={`tab-${b.key}`}
            className={`pp-card p-4 text-left transition-all ${tab === b.key ? "ring-2" : ""}`}
            style={tab === b.key ? { borderColor: b.color, ringColor: b.color, boxShadow: `0 0 0 2px ${b.color}30` } : {}}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ background: `${b.color}18` }}>
              <Clock className="w-4 h-4" style={{ color: b.color }} />
            </div>
            <div className="text-2xl sm:text-3xl font-display font-extrabold" style={{ color: b.color }}>
              {data.counts[b.key] || 0}
            </div>
            <div className="text-xs uppercase tracking-wider text-stone-500 mt-1">{b.label}</div>
          </button>
        ))}
      </div>

      {totalDormant === 0 && (
        <div className="pp-card p-8 text-center">
          <AlertOctagon className="w-8 h-8 text-stone-400 mx-auto mb-2" />
          <div className="font-semibold text-stone-800">Semua pelanggan Anda masih aktif!</div>
          <div className="text-sm text-stone-500 mt-1">Belum ada yang tidak order &gt;30 hari.</div>
        </div>
      )}

      {totalDormant > 0 && (
        <>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari nama, username, atau kota..."
                className="pp-input w-full rounded-lg pl-9 pr-3 py-2 text-sm"
                data-testid="reminder-search"
              />
            </div>
            <div className="text-sm text-stone-500 ml-auto">
              {rows.length} dari {data.counts[tab] || 0}
            </div>
          </div>

          <div className="pp-table-scroll" data-testid="reminder-table">
            <table className="pp-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Telepon</th>
                  <th>Kota</th>
                  <th>Provinsi</th>
                  <th>Order</th>
                  <th>Terakhir Aktif</th>
                  <th className="text-right">Hari Diam</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium">{c.recipient_name}</td>
                    <td className="font-mono text-xs">{c.phone}</td>
                    <td>{c.kota || "-"}</td>
                    <td>{c.provinsi || "-"}</td>
                    <td className="font-mono text-center">{c.order_count}</td>
                    <td className="text-xs text-stone-600">{formatDateShortID(c.last_seen)}</td>
                    <td className="text-right font-mono font-semibold" style={{ color: BUCKETS.find((b) => b.key === tab).color }}>
                      {c.days_since_last_order} hr
                    </td>
                    <td>
                      <a
                        href={waLink(c.phone, waTemplate, c.recipient_name)}
                        target="_blank" rel="noreferrer"
                        className="pp-btn-wa rounded-md px-2.5 py-1 text-xs font-medium inline-flex items-center gap-1"
                        data-testid={`wa-remind-${c.id}`}
                      >
                        <MessageCircle className="w-3 h-3" /> Sapa
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div className="py-10 text-center text-sm text-stone-500">Tidak ada pelanggan cocok.</div>
            )}
          </div>

          <div className="pp-card p-4 flex items-start gap-3" style={{ background: "var(--accent-light)", borderColor: "#FED7AA" }}>
            <MessageCircle className="w-4 h-4 text-orange-800 mt-0.5" />
            <div className="text-sm text-stone-800">
              <b>Tips:</b> {BUCKETS.find((b) => b.key === tab).desc} Anda bisa juga menggunakan halaman <a href="/segmen" className="pp-link">Segmen &amp; Export</a> untuk broadcast otomatis dengan jeda.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
