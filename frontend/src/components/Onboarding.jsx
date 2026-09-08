import { useState } from "react";
import { Camera, FileSpreadsheet, Users, ArrowRight, X, MapPinned } from "lucide-react";

const STEPS = [
  {
    icon: Camera,
    title: "1. Foto Pesanan",
    body: "Buka setiap pesanan di TikTok Shop, screenshot layar detail pembeli — nama, nomor HP, dan alamat lengkap ada di sana. Simpan ke galeri HP dulu.",
    tip: "Kalau ada banyak, foto satu per satu — tenang, nanti bisa upload ratusan sekaligus.",
  },
  {
    icon: FileSpreadsheet,
    title: "2. Atau Export dari Seller Center",
    body: "Di TikTok Seller Center, download data pesanan sebagai Excel atau CSV. Upload file itu di menu Perlu Di-SS untuk tahu pesanan mana yang belum Anda screenshot.",
    tip: "CSV berisi kota + provinsi semua pesanan Anda — otomatis muncul di peta.",
  },
  {
    icon: Users,
    title: "3. Data Otomatis Rapi",
    body: "AI membaca setiap screenshot, memisahkan nama, telepon, dan alamat. Nomor HP sama = pelanggan sama, otomatis ditandai pembeli berulang. Klik telepon untuk chat WhatsApp langsung.",
    tip: "Lihat peta Indonesia untuk tahu kota mana yang paling banyak beli produk Anda.",
  },
];

export default function Onboarding({ onClose }) {
  const [idx, setIdx] = useState(0);
  const step = STEPS[idx];
  const Icon = step.icon;
  const isLast = idx === STEPS.length - 1;

  const finish = () => {
    localStorage.setItem("pp_onboarded", "1");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" data-testid="onboarding-modal">
      <div className="pp-card max-w-md w-full overflow-hidden">
        {/* Header art */}
        <div className="relative h-32" style={{
          background: "linear-gradient(140deg, #C2410C 0%, #9A3412 60%, #7C2D12 100%)",
        }}>
          <button onClick={finish} className="absolute top-3 right-3 text-white/80 hover:text-white p-1 rounded"
                  data-testid="onboarding-close">
            <X className="w-4 h-4" />
          </button>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-md"
                 style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
              <Icon className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-white/70 text-xs">
            <MapPinned className="w-3 h-3" /> Selamat datang di PelangganKu
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-orange-700 font-semibold">
              Langkah {idx + 1} dari {STEPS.length}
            </div>
            <h3 className="font-display font-extrabold text-2xl text-stone-900 mt-1">{step.title}</h3>
            <p className="text-stone-700 text-sm leading-relaxed mt-2">{step.body}</p>
          </div>

          <div className="rounded-lg p-3 text-xs text-stone-700" style={{ background: "var(--accent-light)", border: "1px solid #FED7AA" }}>
            <span className="font-semibold text-orange-800">💡 Tips: </span>{step.tip}
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === idx ? 24 : 8,
                  background: i <= idx ? "var(--accent)" : "var(--border-bold)",
                }}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button onClick={finish} className="text-xs text-stone-500 hover:text-stone-700"
                    data-testid="onboarding-skip">
              Lewati
            </button>
            <div className="flex items-center gap-2">
              {idx > 0 && (
                <button onClick={() => setIdx(idx - 1)}
                        className="pp-btn-secondary rounded-md px-3 py-1.5 text-xs font-medium">
                  Kembali
                </button>
              )}
              {isLast ? (
                <button onClick={finish} data-testid="onboarding-finish"
                        className="pp-btn-primary rounded-md px-4 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5">
                  Mulai Sekarang <ArrowRight className="w-3 h-3" />
                </button>
              ) : (
                <button onClick={() => setIdx(idx + 1)} data-testid="onboarding-next"
                        className="pp-btn-primary rounded-md px-4 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5">
                  Lanjut <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
