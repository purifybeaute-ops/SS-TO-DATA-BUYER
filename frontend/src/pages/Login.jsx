import { useState } from "react";
import { useAuth } from "@/lib/auth.jsx";
import { useT } from "@/lib/i18n";
import { useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import PKLogo from "@/components/PKLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Login() {
  const { user, login } = useAuth();
  const { t } = useT();
  const nav = useNavigate();
  const [email, setEmail] = useState("owner@pelangganku.id");
  const [password, setPassword] = useState("owner123");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      toast.success(t("login.success"));
      nav("/", { replace: true });
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
    <div className="min-h-screen flex items-stretch grain-texture" style={{ background: "var(--bg)" }}>
      <div className="hidden lg:flex flex-1 items-center justify-center p-12"
           style={{ background: "linear-gradient(160deg, #FFEDD5 0%, #FED7AA 60%, #FDBA74 100%)" }}>
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <PKLogo size={56} />
            <div>
              <div className="font-display font-extrabold text-xl text-stone-900 leading-tight">PelangganKu</div>
              <div className="text-xs uppercase tracking-widest text-orange-900/70">{t("brand.tagline")}</div>
            </div>
          </div>
          <h1 className="font-display text-5xl font-extrabold leading-[1.05] text-stone-900 mb-4">
            {t("login.hero")}
          </h1>
          <p className="text-stone-700 text-base leading-relaxed">{t("login.subhero")}</p>
          <div className="mt-8 flex items-center gap-3 text-sm text-stone-700">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-white" style={{ background: "#C2410C" }} />
              <div className="w-8 h-8 rounded-full border-2 border-white" style={{ background: "#D97706" }} />
              <div className="w-8 h-8 rounded-full border-2 border-white" style={{ background: "#B45309" }} />
            </div>
            <span>{t("login.demoCount")}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5" data-testid="login-form">
          <div className="flex items-center justify-between mb-2">
            <div className="lg:hidden flex items-center gap-2">
              <PKLogo size={40} />
              <div className="font-display font-extrabold text-lg">PelangganKu</div>
            </div>
            <div className="ml-auto"><LanguageSwitcher /></div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-stone-900">{t("login.title")}</h2>
            <p className="text-sm text-stone-500 mt-1">{t("login.subtitle")}</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">{t("login.email")}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                     data-testid="login-email-input"
                     className="pp-input w-full rounded-lg px-3.5 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">{t("login.password")}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                     data-testid="login-password-input"
                     className="pp-input w-full rounded-lg px-3.5 py-2.5 text-sm" />
            </div>
          </div>

          <button type="submit" disabled={loading} data-testid="login-submit-btn"
                  className="pp-btn-primary w-full rounded-lg py-2.5 font-semibold text-sm inline-flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? t("login.processing") : t("login.submit")}
          </button>

          <div className="pt-3 border-t text-xs text-stone-500 space-y-2" style={{ borderColor: "var(--border)" }}>
            <div className="uppercase tracking-wider font-semibold text-stone-400">{t("login.demoAccounts")}</div>
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
  );
}
