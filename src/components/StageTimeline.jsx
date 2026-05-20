import {
  CheckCircle2,
  CircleDotDashed,
  Clock3,
  ExternalLink,
  GitBranch,
  Link as LinkIcon,
  SkipForward,
} from "lucide-react";
import {
  formatDate,
  humanStage,
  shortHash,
  stageStatusClasses,
  stageStatusText,
} from "../utils/formatters";
import { useLanguage } from "../contexts/LanguageContext";

function StageIcon({ status }) {
  if (status === "completed") {
    return <CheckCircle2 size={20} />;
  }

  if (status === "skipped") {
    return <SkipForward size={20} />;
  }

  if (status === "available") {
    return <Clock3 size={20} />;
  }

  return <CircleDotDashed size={20} />;
}

function stageIconColor(status) {
  switch (status) {
    case "completed":
      return "text-emerald-600";
    case "skipped":
      return "text-rose-600";
    case "available":
      return "text-amber-500";
    default:
      return "text-slate-300";
  }
}

export default function StageTimeline({ stages = [], hideSkipped = false }) {
  const { language, t } = useLanguage();
  const visibleStages = hideSkipped ? stages.filter((stage) => stage.status !== "skipped") : stages;

  return (
    <div className="card p-4 sm:p-5 lg:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{t("timeline.title")}</h3>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 sm:px-4">
          <GitBranch size={14} />
          {t("timeline.badge")}
        </div>
      </div>

      <div className="space-y-4">
        {visibleStages.length ? visibleStages.map((stage, index) => {
          const finalized = stage.status === "completed" || stage.status === "skipped";

          return (
            <div key={stage.stageName} className="flex gap-3 sm:gap-4">
              <div className="flex w-6 shrink-0 flex-col items-center sm:w-7">
                <div className={`mt-1 ${stageIconColor(stage.status)}`}>
                  <StageIcon status={stage.status} />
                </div>
                {index !== visibleStages.length - 1 && <div className="mt-2 h-full w-px bg-[#dfd5c7]" />}
              </div>
              <div className="surface-muted min-w-0 flex-1 rounded-[20px] p-3 sm:rounded-[24px] sm:p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-slate-900">{humanStage(stage.stageName)}</p>
                    <p className="mt-1 break-words text-xs text-slate-500 sm:text-sm">
                      {finalized
                        ? `${stage.operator || t("common.operator")} - ${formatDate(stage.timestamp, language)}`
                        : stageStatusText(stage.status, language)}
                    </p>
                  </div>
                  <div>
                    <span className={stageStatusClasses(stage.status)}>{stageStatusText(stage.status, language)}</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 break-words text-xs text-slate-500">
                  {stage.skippable && (
                    <span className="rounded-full bg-white/80 px-3 py-1 font-medium text-slate-600">{t("timeline.skippable")}</span>
                  )}
                  {!!stage.prerequisiteStages?.length && (
                    <span className="rounded-full bg-white/80 px-3 py-1 font-medium text-slate-500">
                      {t("timeline.prerequisite", { stages: stage.prerequisiteStages.map((item) => humanStage(item)).join(", ") })}
                    </span>
                  )}
                </div>

                {stage.status === "skipped" && stage.skipReason && (
                  <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">
                    <span className="font-medium">{t("timeline.skipReason")}</span> {stage.skipReason}
                  </div>
                )}

                {finalized && (
                  <div className="mt-4 grid gap-3 text-sm text-slate-600 lg:grid-cols-2">
                    <div className="rounded-2xl bg-white/70 p-3">
                      <p className="font-medium text-slate-800">{t("timeline.supabaseRecord")}</p>
                      <p className="mt-1 break-all text-xs">{stage.historyId || "-"}</p>
                      <p className="mt-2 text-xs text-slate-500">Event: {stage.payload?.eventType || "-"}</p>
                    </div>
                    <div className="rounded-2xl bg-white/70 p-3">
                      <p className="font-medium text-slate-800">{t("timeline.blockchainAnchor")}</p>
                      <p className="mt-1 break-all text-xs">{stage.txHash || t("timeline.waitingCid")}</p>
                    </div>
                  </div>
                )}

                {finalized && (
                  <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap sm:gap-3">
                    {stage.ipfsUrl && (
                      <a
                        href={stage.ipfsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary w-full gap-2 !rounded-full !px-4 !py-2.5 !text-xs sm:w-auto"
                      >
                        <LinkIcon size={15} />
                        {shortHash(stage.ipfsCid)}
                      </a>
                    )}
                    {stage.txUrl && (
                      <a
                        href={stage.txUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary w-full gap-2 !rounded-full !px-4 !py-2.5 !text-xs sm:w-auto"
                      >
                        <ExternalLink size={15} />
                        {shortHash(stage.txHash)}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="surface-muted rounded-[24px] p-5 text-sm text-slate-500">
            {t("timeline.empty")}
          </div>
        )}
      </div>
    </div>
  );
}
