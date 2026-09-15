import { useState } from "react";
import { FileSpreadsheet, Download, Upload, Eye, Sparkles, ArrowRight, X } from "lucide-react";
import PKLogo from "@/components/PKLogo";
import { useT } from "@/lib/i18n";

// Each step: an icon, an i18n key prefix, and (optionally) a tutorial screenshot
// showing what the user should see in TikTok Seller Center at that step.
const STEPS = [
  { icon: FileSpreadsheet, key: "step1", image: "/tutorial/seller-center-export.png", imageAlt: "TikTok Seller Center - tab Dikirim" },
  { icon: Download, key: "step2", image: "/tutorial/seller-center-export.png", imageAlt: "Tombol Ekspor di kanan atas", highlightExport: true },
  { icon: Upload, key: "step3", image: null },
  { icon: Eye, key: "step4", image: "/tutorial/buyer-detail-eye.webp", imageAlt: "Ikon mata tertutup di detail pembeli" },
  { icon: Sparkles, key: "step5", image: null },
];

export default function Onboarding({ onClose }) {
  const { t } = useT();
  const [idx, setIdx] = useState(0);
  const step = STEPS[idx];
  const Icon = step.icon;
  const isLast = idx === STEPS.length - 1;

  const finish = () => {
    localStorage.setItem("pp_onboarded", "1");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      data-testid="onboarding-modal"
    >
      <div className="pp-card w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header bar */}
        <div
          className="relative px-5 py-4 flex items-center justify-between"
          style={{ background: "linear-gradient(140deg, #C2410C 0%, #9A3412 60%, #7C2D12 100%)" }}
        >
          <div className="flex items-center gap-2 text-white/90 text-xs">
            <PKLogo size={22} /> {t("ob.welcome")}
          </div>
          <button
            onClick={finish}
            className="text-white/80 hover:text-white p-1 rounded"
            data-testid="onboarding-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-0 overflow-y-auto">
          {/* Left: image column */}
          <div
            className="relative min-h-[220px] md:min-h-full flex items-center justify-center p-4"
            style={{ background: "#F3EFE6" }}
          >
            {step.image ? (
              <div className="relative w-full">
                <img
                  src={step.image}
                  alt={step.imageAlt}
                  className="w-full h-auto rounded-md border shadow-sm object-contain max-h-[420px]"
                  style={{ borderColor: "#E5DEC9", background: "#fff" }}
                  data-testid={`onboarding-image-${step.key}`}
                />
                {step.highlightExport && (
                  <>
                    {/* Callout ring pointing at Ekspor button (top-right of the seller-center screenshot) */}
                    <div
                      className="absolute pointer-events-none rounded-full animate-pulse"
                      style={{
                        top: "3%",
                        right: "5%",
                        width: "28%",
                        height: "12%",
                        border: "3px solid #F59E0B",
                        boxShadow: "0 0 0 4px rgba(245, 158, 11, 0.25)",
                      }}
                    />
                    <div
                      className="absolute text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full text-white"
                      style={{ top: "17%", right: "8%", background: "#B45309" }}
                    >
                      Klik Ekspor
                    </div>
                  </>
                )}
                {step.key === "step4" && (
                  <>
                    {/* Callout ring for the closed-eye icons */}
                    <div
                      className="absolute pointer-events-none rounded-md animate-pulse"
                      style={{
                        top: "13%",
                        right: "58%",
                        width: "10%",
                        height: "5%",
                        border: "3px solid #F59E0B",
                        boxShadow: "0 0 0 4px rgba(245, 158, 11, 0.25)",
                      }}
                    />
                    <div
                      className="absolute text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full text-white"
                      style={{ top: "6%", right: "32%", background: "#B45309" }}
                    >
                      Klik ikon mata
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(194, 65, 12, 0.12)", border: "1px solid rgba(194, 65, 12, 0.25)" }}
              >
                <Icon className="w-12 h-12 text-orange-700" />
              </div>
            )}
          </div>

          {/* Right: copy */}
          <div className="p-6 space-y-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-orange-700 font-semibold">
                {t("ob.step", { n: idx + 1, total: STEPS.length })}
              </div>
              <h3 className="font-display font-extrabold text-2xl text-stone-900 mt-1 leading-tight">
                {t(`ob.${step.key}.title`)}
              </h3>
              <p className="text-stone-700 text-sm leading-relaxed mt-2">
                {t(`ob.${step.key}.body`)}
              </p>
            </div>

            <div
              className="rounded-lg p-3 text-xs text-stone-700"
              style={{ background: "var(--accent-light)", border: "1px solid #FED7AA" }}
            >
              <span className="font-semibold text-orange-800">💡 {t("ob.tip")}: </span>
              {t(`ob.${step.key}.tip`)}
            </div>
          </div>
        </div>

        {/* Footer nav */}
        <div className="px-5 py-4 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="h-1.5 rounded-full transition-all cursor-pointer"
                style={{
                  width: i === idx ? 24 : 8,
                  background: i <= idx ? "var(--accent)" : "var(--border-bold)",
                }}
                data-testid={`onboarding-dot-${i}`}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={finish}
              className="text-xs text-stone-500 hover:text-stone-700"
              data-testid="onboarding-skip"
            >
              {t("ob.skip")}
            </button>
            {idx > 0 && (
              <button
                onClick={() => setIdx(idx - 1)}
                className="pp-btn-secondary rounded-md px-3 py-1.5 text-xs font-medium"
                data-testid="onboarding-back"
              >
                {t("ob.back")}
              </button>
            )}
            {isLast ? (
              <button
                onClick={finish}
                data-testid="onboarding-finish"
                className="pp-btn-primary rounded-md px-4 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                {t("ob.finish")} <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={() => setIdx(idx + 1)}
                data-testid="onboarding-next"
                className="pp-btn-primary rounded-md px-4 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                {t("ob.next")} <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
