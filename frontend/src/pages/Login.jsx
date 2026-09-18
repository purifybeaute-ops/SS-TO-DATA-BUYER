import { useState } from "react";
import { useAuth } from "@/lib/auth.jsx";
import { useT } from "@/lib/i18n";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import PKLogo from "@/components/PKLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Login() {
  const { user, login } = useAuth();
  const { t } = useT();
  const nav = useNavigate();
  const [email, setEmail] = useState("owner@pelangganku.id");
  const [password, setPassword] = useState("owner123");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      toast.success(t("login.success"));
      nav("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.detail || t("login.failed"));
    } finally {
      setLoading(false);
    }
  };

  const pickDemo = (kind) => {
    if (kind === "owner") { setEmail("owner@pelangganku.id"); setPassword("owner123"); }
    else { setEmail("operator@pelangganku.id"); setPassword("operator123"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden"
         style={{ background: "#0a0e1a" }}>
      {/* Ambient orbs */}
      <div className="ambient-glow animate-blob" style={{ top: -180, left: -100 }} />
      <div className="ambient-glow animate-blob animation-delay-2000"
           style={{ bottom: -160, right: -100, background: "radial-gradient(circle, rgba(168,85,247,0.18) 0%, rgba(168,85,247,0) 60%)" }} />

      <div className="relative w-full max-w-sm">
        <Link
          to="/"
          data-testid="login-back-home"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-cyan-300 mb-6 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> PelangganKu
        </Link>

        <div className="glass rounded-2xl p-7"
             style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)" }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <PKLogo size={40} />
              <div>
                <div className="font-display font-extrabold text-base leading-none text-white">PelangganKu</div>
                <div className="text-[9px] uppercase tracking-widest text-gray-400 mt-0.5">{t("brand.tagline")}</div>
              </div>
            </div>
            <LanguageSwitcher />
          </div>

          <div className="mb-5">
            <h2 className="font-display text-2xl font-black text-white">{t("login.title")}</h2>
            <p className="text-xs text-gray-400 mt-1.5">{t("login.subtitle")}</p>
          </div>

          <form onSubmit={submit} className="space-y-4" data-testid="login-form">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                {t("login.email")}
              </label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                data-testid="login-email-input"
                className="pp-input w-full rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                {t("login.password")}
              </label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                data-testid="login-password-input"
                className="pp-input w-full rounded-lg px-3 py-2.5 text-sm"
              />
            </div>

            <button
              type="submit" disabled={loading}
              data-testid="login-submit-btn"
              className="pp-btn-primary w-full rounded-lg py-3 text-sm inline-flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? t("login.processing") : t("login.submit")}
            </button>

            <div className="pt-3 border-t space-y-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="uppercase tracking-wider font-semibold text-gray-500 text-[10px]">
                {t("login.demoAccounts")}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => pickDemo("owner")} data-testid="demo-owner-btn"
                        className="pp-btn-secondary flex-1 rounded-lg py-2 text-xs">
                  {t("login.demoOwner")}
                </button>
                <button type="button" onClick={() => pickDemo("operator")} data-testid="demo-operator-btn"
                        className="pp-btn-secondary flex-1 rounded-lg py-2 text-xs">
                  {t("login.demoOperator")}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
