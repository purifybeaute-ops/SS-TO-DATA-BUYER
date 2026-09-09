import { useState } from "react";
import { Camera, FileSpreadsheet, Users, ArrowRight, X } from "lucide-react";
import PKLogo from "@/components/PKLogo";
import { useT } from "@/lib/i18n";

const STEP_KEYS = [
  { icon: Camera, key: "step1" },
  { icon: FileSpreadsheet, key: "step2" },
  { icon: Users, key: "step3" },
];

export default function Onboarding({ onClose }) {
  const { t } = useT();
  const [idx, setIdx] = useState(0);
  const step = STEP_KEYS[idx];
  const Icon = step.icon;
  const isLast = idx === STEP_KEYS.length - 1;

  const finish = () => {
    localStorage.setItem("pp_onboarded", "1");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" data-testid="onboarding-modal">
      <div className="pp-card max-w-md w-full overflow-hidden">
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
          <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white/80 text-xs">
            <PKLogo size={20} /> {t("ob.welcome")}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-orange-700 font-semibold">
              {t("ob.step", { n: idx + 1, total: STEP_KEYS.length })}
            </div>
            <h3 className="font-display font-extrabold text-2xl text-stone-900 mt-1">{t(`ob.${step.key}.title`)}</h3>
            <p className="text-stone-700 text-sm leading-relaxed mt-2">{t(`ob.${step.key}.body`)}</p>
          </div>

          <div className="rounded-lg p-3 text-xs text-stone-700" style={{ background: "var(--accent-light)", border: "1px solid #FED7AA" }}>
            <span className="font-semibold text-orange-800">💡 {t("ob.tip")}: </span>{t(`ob.${step.key}.tip`)}
          </div>

          <div className="flex items-center justify-center gap-1.5 pt-2">
            {STEP_KEYS.map((_, i) => (
              <div key={i} className="h-1.5 rounded-full transition-all"
                   style={{ width: i === idx ? 24 : 8, background: i <= idx ? "var(--accent)" : "var(--border-bold)" }} />
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button onClick={finish} className="text-xs text-stone-500 hover:text-stone-700" data-testid="onboarding-skip">
              {t("ob.skip")}
            </button>
            <div className="flex items-center gap-2">
              {idx > 0 && (
                <button onClick={() => setIdx(idx - 1)}
                        className="pp-btn-secondary rounded-md px-3 py-1.5 text-xs font-medium">
                  {t("ob.back")}
                </button>
              )}
              {isLast ? (
                <button onClick={finish} data-testid="onboarding-finish"
                        className="pp-btn-primary rounded-md px-4 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5">
                  {t("ob.finish")} <ArrowRight className="w-3 h-3" />
                </button>
              ) : (
                <button onClick={() => setIdx(idx + 1)} data-testid="onboarding-next"
                        className="pp-btn-primary rounded-md px-4 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5">
                  {t("ob.next")} <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
