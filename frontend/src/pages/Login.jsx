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
         style={{ background: "var(--bg)" }}>
      {/* Soft orange radial + dot grid backdrop */}
      <div className="absolute inset-0 pointer-events-none"
           style={{
             backgroundImage:
               "radial-gradient(circle at 100% 0%, rgba(253,186,116,0.28) 0%, rgba(253,186,116,0) 40%)," +
               "radial-gradient(circle at 0% 100%, rgba(254,215,170,0.22) 0%, rgba(254,215,170,0) 40%)",
           }} />
      <div className="absolute inset-0 pointer-events-none opacity-30"
           style={{
             backgroundImage:
               "radial-gradient(circle, rgba(120,113,108,0.16) 1px, transparent 1px)",
             backgroundSize: "22px 22px",
           }} />

      <div className="relative w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 mb-6"
              data-testid="login-back-home">
          <ArrowLeft className="w-3.5 h-3.5" /> PelangganKu
        </Link>

        <div className="pp-card p-7">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <PKLogo size={40} />
              <div>
                <div className="font-display font-extrabold text-base leading-none text-stone-900">PelangganKu</div>
                <div className="text-[9px] uppercase tracking-widest text-stone-500 mt-0.5">{t("brand.tagline")}</div>
              </div>
            </div>
            <LanguageSwitcher />
          </div>

          <div className="mb-5">
            <h2 className="font-display text-xl font-bold text-stone-900">{t("login.title")}</h2>
            <p className="text-xs text-stone-500 mt-1">{t("login.subtitle")}</p>
          </div>

          <form onSubmit={submit} className="space-y-4" data-testid="login-form">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">{t("login.email")}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                     data-testid="login-email-input"
                     className="pp-input w-full rounded-lg px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">{t("login.password")}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                     data-testid="login-password-input"
                     className="pp-input w-full rounded-lg px-3 py-2.5 text-sm" />
            </div>

            <button type="submit" disabled={loading} data-testid="login-submit-btn"
                    className="pp-btn-primary w-full rounded-lg py-2.5 font-semibold text-sm inline-flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? t("login.processing") : t("login.submit")}
            </button>

            <div className="pt-3 border-t text-xs text-stone-500 space-y-2" style={{ borderColor: "var(--border)" }}>
              <div className="uppercase tracking-wider font-semibold text-stone-400 text-[10px]">{t("login.demoAccounts")}</div>
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
