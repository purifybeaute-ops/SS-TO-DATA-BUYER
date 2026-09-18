import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, X, ChevronRight, PartyPopper } from "lucide-react";
import { useT } from "@/lib/i18n";

/**
 * OnboardingProgress
 * Renders a live checklist of first-run milestones on the dashboard so the
 * seller can see, at a glance, how much of the initial setup they've completed.
 *
 * Props:
 *   onboarding — object from GET /api/analytics/dashboard `.onboarding`
 */
export default function OnboardingProgress({ onboarding }) {
  const { t } = useT();
  const [dismissed, setDismissed] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("pp_progress_hidden") === "1"
  );

  const items = useMemo(() => {
    if (!onboarding) return [];
    return [
      {
        key: "csv",
        done: !!onboarding.csv_imported,
        label: t("dash.progress.csv"),
        doneLabel: t("dash.progress.csv.done", { n: onboarding.csv_count || 0 }),
        cta: t("dash.progress.csv.cta"),
        to: "/dashboard/perlu-ss",
      },
      {
        key: "ss1",
        done: !!onboarding.ss_first,
        label: t("dash.progress.ss1"),
        doneLabel: t("dash.progress.ss1.done"),
        cta: t("dash.progress.ss1.cta"),
        to: "/dashboard/upload",
      },
      {
        key: "ss5",
        done: !!onboarding.ss_five,
        label: t("dash.progress.ss5"),
        doneLabel: t("dash.progress.ss5.done", { n: onboarding.ss_count || 0 }),
        cta: t("dash.progress.ss5.cta"),
        to: "/dashboard/upload",
      },
      {
        key: "tag",
        done: !!onboarding.tagged_first,
        label: t("dash.progress.tag"),
        doneLabel: t("dash.progress.tag.done", { n: onboarding.tagged_count || 0 }),
        cta: t("dash.progress.tag.cta"),
        to: "/dashboard/pelanggan",
      },
      {
        key: "pdf",
        done: !!onboarding.pdf_header_set,
        label: t("dash.progress.pdf"),
        doneLabel: t("dash.progress.pdf.done"),
        cta: t("dash.progress.pdf.cta"),
        to: "/dashboard/pengaturan",
      },
    ];
  }, [onboarding, t]);

  const doneCount = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;
  const allDone = items.length > 0 && doneCount === items.length;

  // Auto-persist "hidden" state
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pp_progress_hidden", dismissed ? "1" : "0");
    }
  }, [dismissed]);

  if (!onboarding) return null;

  // Collapsed pill
  if (dismissed) {
    return (
      <button
        onClick={() => setDismissed(false)}
        data-testid="progress-show-again"
        className="pp-card px-3 py-1.5 text-xs inline-flex items-center gap-2 hover:bg-stone-50"
      >
        <div className="w-2 h-2 rounded-full" style={{ background: allDone ? "#16A34A" : "#C2410C" }} />
        <span className="text-stone-700">{t("dash.progress.title")}</span>
        <span className="font-mono font-semibold text-stone-900">
          {doneCount}/{items.length}
        </span>
        <span className="text-stone-400">·</span>
        <span className="text-orange-700">{t("dash.progress.show")}</span>
      </button>
    );
  }

  return (
    <div
      className="pp-card p-5"
      data-testid="onboarding-progress"
      style={{
        background: allDone
          ? "linear-gradient(140deg, #ECFDF5 0%, #F0FDF4 100%)"
          : "linear-gradient(140deg, #FFF7ED 0%, #FEF3E2 100%)",
        borderColor: allDone ? "#86EFAC" : "#FED7AA",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: allDone ? "#DCFCE7" : "#FFEDD5" }}
          >
            {allDone ? (
              <PartyPopper className="w-5 h-5 text-green-700" />
            ) : (
              <div className="relative w-6 h-6">
                <svg viewBox="0 0 36 36" className="w-6 h-6 -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#FED7AA" strokeWidth="4" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="#C2410C"
                    strokeWidth="4"
                    strokeDasharray={`${(pct / 100) * 94.2} 94.2`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-base text-stone-900">
                {t("dash.progress.title")}
              </h3>
              <span
                className="pp-badge"
                style={{
                  background: allDone ? "#DCFCE7" : "#FFEDD5",
                  color: allDone ? "#166534" : "#9A3412",
                  borderColor: allDone ? "#86EFAC" : "#FED7AA",
                }}
                data-testid="progress-count"
              >
                {doneCount}/{items.length} · {t("dash.progress.percent", { n: pct })}
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-0.5">
              {allDone ? t("dash.progress.complete") : t("dash.progress.subtitle")}
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          data-testid="progress-dismiss"
          className="p-1 rounded hover:bg-white/50 text-stone-500 hover:text-stone-800 shrink-0"
          aria-label="hide"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.key} data-testid={`progress-item-${item.key}`}>
            {item.done ? (
              <div className="flex items-center gap-2 text-sm text-stone-700 px-2 py-1.5 rounded-md">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span className="line-through text-stone-500">{item.label}</span>
                <span className="text-xs text-green-700 ml-auto font-medium shrink-0">
                  {item.doneLabel}
                </span>
              </div>
            ) : (
              <Link
                to={item.to}
                className="flex items-center gap-2 text-sm text-stone-800 px-2 py-1.5 rounded-md hover:bg-white/70 group"
                data-testid={`progress-cta-${item.key}`}
              >
                <Circle className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="font-medium">{item.label}</span>
                <span className="ml-auto text-xs text-orange-700 inline-flex items-center gap-0.5 group-hover:underline shrink-0">
                  {item.cta} <ChevronRight className="w-3 h-3" />
                </span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
