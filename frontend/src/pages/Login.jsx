import { useState } from "react";
import { useAuth } from "@/lib/auth.jsx";
import { useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { MapPinned, Loader2 } from "lucide-react";

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("owner@petapembeli.id");
  const [password, setPassword] = useState("owner123");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      toast.success("Berhasil masuk. Selamat datang!");
      nav("/", { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Gagal masuk");
    } finally {
      setLoading(false);
    }
  };

  const pickDemo = (kind) => {
    if (kind === "owner") {
      setEmail("owner@petapembeli.id"); setPassword("owner123");
    } else {
      setEmail("operator@petapembeli.id"); setPassword("operator123");
    }
  };

  return (
    <div className="min-h-screen flex items-stretch grain-texture" style={{ background: "var(--bg)" }}>
      <div className="hidden lg:flex flex-1 items-center justify-center p-12"
           style={{ background: "linear-gradient(160deg, #FFEDD5 0%, #FED7AA 60%, #FDBA74 100%)" }}>
        <div className="max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6"
               style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(194,65,12,0.2)" }}>
            <span className="w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />
            <span className="text-xs font-medium tracking-wider uppercase text-orange-900">Untuk Seller Indonesia</span>
          </div>
          <h1 className="font-display text-5xl font-extrabold leading-[1.05] text-stone-900 mb-4">
            Ubah screenshot pesanan jadi <span className="text-orange-700">database pelanggan</span> Anda sendiri.
          </h1>
          <p className="text-stone-700 text-base leading-relaxed">
            TikTok Shop tidak memberi Anda akses data pembeli. PelangganKu membaca screenshot,
            merapikan alamat, mendeteksi pembeli berulang, dan memetakan kota mereka — semua di satu tempat.
          </p>
          <div className="mt-8 flex items-center gap-3 text-sm text-stone-700">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-white" style={{ background: "#C2410C" }} />
              <div className="w-8 h-8 rounded-full border-2 border-white" style={{ background: "#D97706" }} />
              <div className="w-8 h-8 rounded-full border-2 border-white" style={{ background: "#B45309" }} />
            </div>
            <span>40+ pelanggan demo sudah tersedia</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5" data-testid="login-form">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
              <MapPinned className="w-5 h-5 text-white" />
            </div>
            <div className="font-display font-extrabold text-xl">PelangganKu</div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-stone-900">Masuk Akun Seller</h2>
            <p className="text-sm text-stone-500 mt-1">Gunakan akun demo untuk mencoba semua fitur.</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="login-email-input"
                className="pp-input w-full rounded-lg px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="login-password-input"
                className="pp-input w-full rounded-lg px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            data-testid="login-submit-btn"
            className="pp-btn-primary w-full rounded-lg py-2.5 font-semibold text-sm inline-flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Memproses..." : "Masuk"}
          </button>

          <div className="pt-3 border-t text-xs text-stone-500 space-y-2" style={{ borderColor: "var(--border)" }}>
            <div className="uppercase tracking-wider font-semibold text-stone-400">Akun Demo</div>
            <div className="flex gap-2">
              <button type="button" onClick={() => pickDemo("owner")} data-testid="demo-owner-btn"
                      className="pp-btn-secondary flex-1 rounded-lg py-2 text-xs">
                Owner
              </button>
              <button type="button" onClick={() => pickDemo("operator")} data-testid="demo-operator-btn"
                      className="pp-btn-secondary flex-1 rounded-lg py-2 text-xs">
                Operator
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
