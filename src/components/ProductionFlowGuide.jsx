import { Fragment } from "react";
import { ChevronRight, GitBranch } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { getTeaStageGuide, TEA_STAGE_GUIDES } from "../utils/teaFlows";

function StageRoute({ stages, compact = false }) {
  const chipClass = compact
    ? "rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm ring-1 ring-[#eadfce]"
    : "rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm ring-1 ring-[#eadfce]";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {stages.map((stage, index) => (
        <Fragment key={`${stage}-${index}`}>
          <span className={chipClass}>{stage}</span>
          {index < stages.length - 1 && (
            <ChevronRight size={compact ? 13 : 15} className="shrink-0 text-emerald-700" />
          )}
        </Fragment>
      ))}
    </div>
  );
}

export default function ProductionFlowGuide({ teaType }) {
  const { t } = useLanguage();
  const selectedGuide = getTeaStageGuide(teaType);

  return (
    <section className="card p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="inline-flex rounded-2xl bg-emerald-50 p-2 text-emerald-700">
          <GitBranch size={18} />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-900">{t("batchDetail.workflowGuide")}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{t("batchDetail.workflowGuideDescription")}</p>
        </div>
      </div>

      <div className="mt-5 rounded-[22px] border border-emerald-100 bg-emerald-50/70 p-4">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
          {t("batchDetail.selectedWorkflow")}
        </div>
        <div className="mt-2 text-base font-bold text-slate-900">{selectedGuide.teaType}</div>
        <div className="mt-3">
          <StageRoute stages={selectedGuide.stages} />
        </div>
      </div>

      <div className="mt-5">
        <div className="text-sm font-semibold text-slate-900">{t("batchDetail.allWorkflows")}</div>
        <div className="mt-3 space-y-3">
          {TEA_STAGE_GUIDES.map((guide) => (
            <div key={guide.teaType} className="border-t border-[#eee4d7] pt-3 first:border-t-0 first:pt-0">
              <div className="text-sm font-semibold text-slate-800">{guide.teaType}</div>
              <div className="mt-2">
                <StageRoute stages={guide.stages} compact />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
