import { Info, ShoppingBag, Camera, Database } from "lucide-react";
import PKLogo from "@/components/PKLogo";
import { useT } from "@/lib/i18n";

export default function Tentang() {
  const { t } = useT();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl space-y-5" data-testid="tentang-page">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <PKLogo size={48} />
          <div>
            <div className="text-xs uppercase tracking-wider text-stone-500">{t("about.section")}</div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
              PelangganKu
            </h1>
          </div>
        </div>
        <div className="text-sm font-semibold text-orange-800 uppercase tracking-widest">
          {t("brand.tagline")}
        </div>
      </div>

      <div className="pp-card p-6 space-y-4">
        <p className="text-stone-700 leading-relaxed">{t("about.p1")}</p>
        <p className="text-stone-700 leading-relaxed">{t("about.p2")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card icon={Camera} title={t("about.f1.title")} body={t("about.f1.body")} />
        <Card icon={Database} title={t("about.f2.title")} body={t("about.f2.body")} />
        <Card icon={ShoppingBag} title={t("about.f3.title")} body={t("about.f3.body")} />
      </div>

      <div className="pp-card p-5 flex items-start gap-3" style={{ background: "var(--accent-light)", borderColor: "#FED7AA" }}>
        <Info className="w-5 h-5 text-orange-800 mt-0.5" />
        <div className="text-sm text-stone-800">
          <b>{t("about.demoLabel")}</b> {t("about.demoNote").replace(t("about.demoLabel"), "").trim()}
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
