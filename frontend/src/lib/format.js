// Indonesian formatters
const ID_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function formatDateID(input) {
  if (!input) return "-";
  const d = typeof input === "string" ? new Date(input) : input;
  if (isNaN(d.getTime())) return input;
  return `${d.getDate()} ${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateShortID(input) {
  if (!input) return "-";
  const d = typeof input === "string" ? new Date(input) : input;
  if (isNaN(d.getTime())) return input;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function formatRupiah(n) {
  if (n == null) return "Rp 0";
  return "Rp " + Number(n).toLocaleString("id-ID");
}

export function waLink(phone, template, name) {
  if (!phone) return "#";
  const digits = phone.replace(/\D/g, "");
  const msg = (template || "Halo {nama}").replaceAll("{nama}", name || "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
}
