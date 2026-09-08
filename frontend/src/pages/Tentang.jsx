import PKLogo from "@/components/PKLogo";
import { Info, ShoppingBag, Camera, Database } from "lucide-react";

export default function Tentang() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl space-y-5" data-testid="tentang-page">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <PKLogo size={48} />
          <div>
            <div className="text-xs uppercase tracking-wider text-stone-500">Tentang</div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
              PelangganKu
            </h1>
          </div>
        </div>
        <div className="text-sm font-semibold text-orange-800 uppercase tracking-widest">
          Jangkau Ulang Setiap Pembeli
        </div>
      </div>

      <div className="pp-card p-6 space-y-4">
        <p className="text-stone-700 leading-relaxed">
          PelangganKu adalah alat sederhana untuk seller TikTok Shop Indonesia yang <b>tidak diberi akses ke data pembeli mereka sendiri</b>.
          Aplikasi ini mengubah screenshot halaman detail pesanan menjadi database pelanggan yang bisa Anda cari, filter, dan hubungi ulang lewat WhatsApp.
        </p>
        <p className="text-stone-700 leading-relaxed">
          Tidak ada scraping, tidak ada akses ke API TikTok. Kami hanya membaca screenshot yang Anda upload, mengekstrak nama & alamat dengan AI, lalu menyimpannya dengan rapi — sehingga Anda tetap punya <b>daftar pelanggan sendiri</b>, milik Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card icon={Camera} title="Screenshot > Data" body="Ekstrak nama, telepon +62, alamat lengkap, dan kreator afiliasi dari 1 klik." />
        <Card icon={Database} title="Dedupe Otomatis" body="Nomor telepon sama = pelanggan sama. Order berulang terdeteksi otomatis." />
        <Card icon={ShoppingBag} title="Segmen & Broadcast" body="Filter berdasarkan kota, tag, creator, lalu siapkan daftar WhatsApp." />
      </div>

      <div className="pp-card p-5 flex items-start gap-3" style={{ background: "var(--accent-light)", borderColor: "#FED7AA" }}>
        <Info className="w-5 h-5 text-orange-800 mt-0.5" />
        <div className="text-sm text-stone-800">
          <b>Versi Demo:</b> Aplikasi sudah dilengkapi ~40 pelanggan contoh dari 6 kota Indonesia. Anda bisa langsung mencoba fitur peta, filter, dan ekspor tanpa upload data terlebih dahulu.
        </div>
      </div>
    </div>
  );
}

function Card({ icon: Icon, title, body }) {
  return (
    <div className="pp-card p-5">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ background: "var(--accent-light)" }}>
        <Icon className="w-4 h-4 text-orange-700" />
      </div>
      <div className="font-display font-bold text-stone-900">{title}</div>
      <div className="text-sm text-stone-600 mt-1">{body}</div>
    </div>
  );
}
