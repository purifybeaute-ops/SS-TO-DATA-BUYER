import { useT } from "@/lib/i18n";
import { Languages } from "lucide-react";

export default function LanguageSwitcher({ variant = "pill" }) {
  const { lang, setLang, t } = useT();

  if (variant === "compact") {
    return (
      <button
        onClick={() => setLang(lang === "id" ? "en" : "id")}
        data-testid="lang-toggle-compact"
        title={t("common.language")}
        className="text-xs text-stone-600 hover:text-orange-700 inline-flex items-center gap-1 font-semibold uppercase tracking-wider"
      >
        <Languages className="w-3.5 h-3.5" />
        {lang.toUpperCase()}
      </button>
    );
  }

  return (
    <div
      className="inline-flex rounded-lg border p-0.5 text-xs"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      data-testid="lang-switcher"
    >
      {["id", "en"].map((code) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          data-testid={`lang-${code}`}
          className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
            lang === code ? "text-white" : "text-stone-600 hover:text-stone-900"
          }`}
          style={lang === code ? { background: "var(--accent)" } : {}}
        >
          {code === "id" ? "🇮🇩 ID" : "🇬🇧 EN"}
        </button>
      ))}
    </div>
  );
}
