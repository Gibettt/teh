import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Blocks,
  CheckCircle2,
  CircleDotDashed,
  ExternalLink,
  FileJson,
  ShieldCheck,
} from "lucide-react";
import api from "../services/api";
import {
  formatDate,
  humanStage,
  shortHash,
  stageStatusClasses,
  stageStatusText,
  statusClasses,
  statusText,
} from "../utils/formatters";
import { useLanguage } from "../contexts/LanguageContext";

function formatFieldLabel(field) {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(value) {
  if (value === null || typeof value === "undefined" || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function PublicStageTimeline({ stages = [] }) {
  const { language, t } = useLanguage();

  return (
    <div className="card p-4 sm:p-5 lg:p-6">
      <div className="mb-5 flex items-center justify-between gap-4 sm:mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{t("timeline.title")}</h2>
        </div>
      </div>

      <div className="space-y-4">
        {stages.length ? stages.map((stage, index) => {
          const completed = stage.status === "completed";
          const entries = Object.entries(stage.data || {}).filter(([, value]) => value !== "");

          return (
            <div key={stage.stageName} className="flex gap-3 sm:gap-4">
              <div className="flex w-6 shrink-0 flex-col items-center sm:w-7">
                <div className={`mt-1 ${completed ? "text-emerald-600" : "text-slate-300"}`}>
                  {completed ? <CheckCircle2 size={20} /> : <CircleDotDashed size={20} />}
                </div>
                {index !== stages.length - 1 && <div className="mt-2 h-full w-px bg-[#dfd5c7]" />}
              </div>

              <div className="surface-muted min-w-0 flex-1 rounded-[20px] p-3 sm:rounded-[24px] sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-slate-900">{humanStage(stage.stageName)}</p>
                    <p className="mt-1 break-words text-xs text-slate-500 sm:text-sm">
                      {completed
                        ? `${stage.operator || t("common.operator")} - ${formatDate(stage.recordedAt, language)}`
                        : t("publicTrace.stageNotRecorded")}
                    </p>
                  </div>
                  <span className={stageStatusClasses(stage.status)}>{stageStatusText(stage.status, language)}</span>
                </div>

                {completed && entries.length > 0 && (
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {entries.map(([field, value]) => (
                      <div key={field} className="rounded-2xl bg-white/75 p-3 text-sm">
                        <div className="text-xs font-semibold uppercase text-slate-500">{formatFieldLabel(field)}</div>
                        <div className="mt-1 break-words font-semibold text-slate-900">{formatValue(value)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="surface-muted rounded-[24px] p-5 text-sm text-slate-500">
            {t("publicTrace.emptyStages")}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PublicTraceabilityPage() {
  const { id } = useParams();
  const { language, t } = useLanguage();
  const [traceability, setTraceability] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setError("");

    api
      .get(`/batches/public/${id}/traceability`)
      .then((response) => {
        if (!cancelled) setTraceability(response.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || t("publicTrace.notFound"));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, t]);

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10">
        <div className="card-paper w-full p-5 text-center sm:p-8">
          <div className="mx-auto inline-flex rounded-2xl bg-rose-50 p-3 text-rose-700">
            <CircleDotDashed size={24} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">{t("publicTrace.unavailable")}</h1>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
        </div>
      </main>
    );
  }

  if (!traceability) {
    return <div className="p-6 text-sm text-slate-600 sm:p-10">{t("publicTrace.loading")}</div>;
  }

  const { batch, summary, finalTrace, blockchainFinalization, stages } = traceability;

  return (
    <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6 lg:px-8 lg:py-10">
      <div className="card-paper overflow-hidden p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 sm:px-4">
              <ShieldCheck size={14} />
              {t("publicTrace.badge")}
            </div>
            <h1 className="mt-4 break-words text-2xl font-bold tracking-tight text-slate-900 sm:mt-5 sm:text-3xl lg:text-4xl">{batch.batchCode}</h1>
            <p className="mt-3 break-words text-sm text-slate-600">
              {batch.teaType} - {batch.gardenBlock || t("publicTrace.gardenMissing")}
            </p>
          </div>
          <span className={`${statusClasses(batch.status)} w-fit shrink-0`}>{statusText(batch.status, language)}</span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:mt-8 xl:grid-cols-4 xl:gap-4">
          <div className="surface-muted rounded-[20px] p-4 sm:rounded-[22px]">
            <div className="text-xs font-semibold uppercase text-slate-500">{t("publicTrace.harvestDate")}</div>
            <div className="mt-2 font-semibold text-slate-900">{formatDate(batch.harvestDate || batch.createdAt, language)}</div>
          </div>
          <div className="surface-muted rounded-[20px] p-4 sm:rounded-[22px]">
            <div className="text-xs font-semibold uppercase text-slate-500">{t("publicTrace.stagesShown")}</div>
            <div className="mt-2 font-semibold text-slate-900">{summary.totalStagesShown}</div>
          </div>
          <div className="surface-muted rounded-[20px] p-4 sm:rounded-[22px]">
            <div className="text-xs font-semibold uppercase text-slate-500">{t("publicTrace.stagesCompleted")}</div>
            <div className="mt-2 font-semibold text-slate-900">{summary.completedStages}</div>
          </div>
          <div className="surface-muted rounded-[20px] p-4 sm:rounded-[22px]">
            <div className="text-xs font-semibold uppercase text-slate-500">Final CID</div>
            <div className="mt-2 break-all text-xs font-semibold text-slate-900">
              {shortHash(finalTrace?.ipfsCid || blockchainFinalization?.finalCid)}
            </div>
          </div>
        </div>

        {(finalTrace?.ipfsUrl || blockchainFinalization?.txUrl) && (
          <div className="mt-6 grid gap-2 sm:flex sm:flex-wrap sm:gap-3">
            {finalTrace?.ipfsUrl && (
              <a
                href={finalTrace.ipfsUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary w-full gap-2 !rounded-full !px-4 !py-2.5 !text-xs sm:w-auto"
              >
                <FileJson size={14} />
                JSON Pinata
              </a>
            )}
            {blockchainFinalization?.txUrl && (
              <a
                href={blockchainFinalization.txUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary w-full gap-2 !rounded-full !px-4 !py-2.5 !text-xs sm:w-auto"
              >
                <ExternalLink size={14} />
                {t("publicTrace.sepoliaTx")}
              </a>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
        <PublicStageTimeline stages={stages} />

        <div className="card p-4 sm:p-6">
          <div className="inline-flex rounded-2xl bg-sky-50 p-3 text-sky-700">
            <Blocks size={22} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">{t("publicTrace.blockchainValidation")}</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="surface-muted rounded-[20px] p-4 sm:rounded-[22px]">
              <div className="text-xs font-semibold uppercase text-slate-500">Status</div>
              <div className="mt-2 font-semibold text-slate-900">{blockchainFinalization?.status || t("publicTrace.notAnchored")}</div>
            </div>
            <div className="surface-muted rounded-[20px] p-4 sm:rounded-[22px]">
              <div className="text-xs font-semibold uppercase text-slate-500">Network</div>
              <div className="mt-2 font-semibold text-slate-900">{blockchainFinalization?.network || "sepolia"}</div>
            </div>
            <div className="surface-muted rounded-[20px] p-4 sm:rounded-[22px]">
              <div className="text-xs font-semibold uppercase text-slate-500">Tx Hash</div>
              <div className="mt-2 break-all text-xs font-semibold text-slate-900">
                {blockchainFinalization?.txHash || "-"}
              </div>
            </div>
            <div className="surface-muted rounded-[20px] p-4 sm:rounded-[22px]">
              <div className="text-xs font-semibold uppercase text-slate-500">Contract</div>
              <div className="mt-2 break-all text-xs font-semibold text-slate-900">
                {blockchainFinalization?.contractAddress || "-"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
