import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Link2,
  Play,
  SkipForward,
  Wallet,
} from "lucide-react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import Topbar from "../components/Topbar";
import StageTimeline from "../components/StageTimeline";
import ManualBlockchainAnchor from "../components/ManualBlockchainAnchor";
import TraceabilityQrCode, { getPublicTraceabilityPath } from "../components/TraceabilityQrCode";
import api from "../services/api";
import {
  formatDate,
  getActiveStages,
  getSkippableStages,
  humanStage,
  humanWorkflowMode,
  shortHash,
  stageStatusText,
  statusClasses,
  statusText,
} from "../utils/formatters";
import { useLanguage } from "../contexts/LanguageContext";

export default function BatchDetailPage() {
  const { id } = useParams();
  const { openSidebar } = useOutletContext();
  const { language, t } = useLanguage();
  const [batch, setBatch] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const loadBatch = async () => {
    const response = await api.get(`/batches/${id}`);
    setBatch(response.data);
  };

  useEffect(() => {
    loadBatch();
  }, [id]);

  const availableStages = useMemo(() => getActiveStages(batch), [batch]);
  const skippableStages = useMemo(() => getSkippableStages(batch), [batch]);
  const finalTrace = batch?.trace?.finalTrace;
  const blockchainFinalization = batch?.trace?.blockchainFinalization;

  const handleSkip = async (stage) => {
    const reason = window.prompt(`${t("timeline.skipReason")} ${humanStage(stage.stageName)}:`);
    if (reason === null) return;

    setActionError("");
    setActionLoading(`skip-${stage.stageName}`);
    try {
      await api.post(`/batches/${batch.id}/stages/${stage.stageName}/skip`, {
        reason: reason.trim() || t("batchDetail.defaultSkipReason"),
      });
      await loadBatch();
    } catch (error) {
      setActionError(error.response?.data?.message || t("batchDetail.skipStage"));
    } finally {
      setActionLoading("");
    }
  };

  if (!batch) {
    return <div className="p-10">{t("batchDetail.loading")}</div>;
  }

  return (
    <div>
      <Topbar
        title={t("batchDetail.title", { batchCode: batch.batchCode })}
        onOpenMenu={openSidebar}
      />
      <div className="space-y-5 p-3 sm:p-4 lg:space-y-6 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <div className="card-paper p-4 sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="text-sm text-slate-500">{t("batchDetail.code")}</div>
                <h3 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{batch.batchCode}</h3>
                <p className="mt-2 break-words text-sm text-slate-500">
                  {batch.teaType} - {batch.gardenBlock || "-"}
                </p>
              </div>
              <span className={`${statusClasses(batch.status)} w-fit shrink-0`}>{statusText(batch.status, language)}</span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:mt-6 xl:grid-cols-3">
              <div className="surface-muted rounded-[20px] p-4 sm:rounded-[24px]">
                <p className="text-sm text-slate-500">{t("batchDetail.harvestDate")}</p>
                <p className="mt-2 font-semibold text-slate-900">{formatDate(batch.harvestDate || batch.createdAt, language)}</p>
              </div>
              <div className="surface-muted rounded-[20px] p-4 sm:rounded-[24px]">
                <p className="text-sm text-slate-500">{t("batchDetail.workflowMode")}</p>
                <p className="mt-2 font-semibold text-slate-900">{humanWorkflowMode()}</p>
                <p className="mt-1 text-xs text-slate-500">{t("batchDetail.activeNow", { count: availableStages.length })}</p>
              </div>
              <div className="surface-muted rounded-[20px] p-4 sm:col-span-2 sm:rounded-[24px] xl:col-span-1">
                <p className="text-sm text-slate-500">{t("batchDetail.finalCidSepolia")}</p>
                <p className="mt-2 break-all text-xs font-semibold text-slate-900">{blockchainFinalization?.txHash || "-"}</p>
                <p className="mt-2 text-xs text-slate-500">{t("batchDetail.network", { network: blockchainFinalization?.network || "sepolia" })}</p>
                {blockchainFinalization?.txUrl && (
                  <a
                    href={blockchainFinalization.txUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-sky-700"
                  >
                    <ExternalLink size={14} />
                    {t("batchDetail.openFinalTx")}
                  </a>
                )}
              </div>
            </div>

            {actionError && (
              <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {actionError}
              </div>
            )}
          </div>

          <div className="card p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-2xl bg-emerald-50 p-2 text-emerald-700">
                <Wallet size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t("batchDetail.quickActions")}</h3>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <Link to={`/traceability?batch=${batch.id}`} className="btn-secondary w-full justify-between gap-3 !rounded-[22px] !px-4">
                {t("batchDetail.fullTraceability")}
                <ExternalLink size={16} className="shrink-0" />
              </Link>

              <TraceabilityQrCode batch={batch} />

              <ManualBlockchainAnchor batch={batch} onRecorded={loadBatch} />

              <div className="rounded-[22px] border border-[#e7ddcf] bg-[rgba(249,246,240,0.92)] p-4 sm:rounded-[24px]">
                <div className="text-sm font-semibold text-slate-900">{t("batchDetail.readyStages")}</div>
                <div className="mt-3 space-y-3">
                  {availableStages.length ? (
                    availableStages.map((stage) => (
                      <div key={stage.stageName} className="rounded-[20px] bg-white/80 p-4 shadow-sm sm:rounded-[22px]">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900">{humanStage(stage.stageName)}</div>
                          </div>
                          <Link to={`/batches/${batch.id}/stages/${stage.stageName}`} className="btn-primary w-full gap-2 !rounded-full !px-4 !py-2.5 !text-xs sm:w-auto">
                            <Play size={14} />
                            {t("batchDetail.inputStage")}
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[22px] bg-white/75 p-4 text-sm text-slate-500">{t("batchDetail.noActive")}</div>
                  )}
                </div>
              </div>

              <div className="rounded-[22px] border border-[#e7ddcf] bg-[rgba(249,246,240,0.92)] p-4 sm:rounded-[24px]">
                <div className="text-sm font-semibold text-slate-900">{t("batchDetail.skippableStages")}</div>
                <div className="mt-3 space-y-3">
                  {skippableStages.length ? (
                    skippableStages.map((stage) => (
                      <div key={stage.stageName} className="rounded-[20px] bg-white/80 p-4 shadow-sm sm:rounded-[22px]">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900">{humanStage(stage.stageName)}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              {t("batchDetail.currentStatus", { status: stageStatusText(stage.status, language) })}
                            </div>
                          </div>
                          <button
                            className="btn-secondary w-full gap-2 !rounded-full !px-4 !py-2.5 !text-xs sm:w-auto"
                            onClick={() => handleSkip(stage)}
                            type="button"
                            disabled={actionLoading === `skip-${stage.stageName}`}
                          >
                            <SkipForward size={14} />
                            {actionLoading === `skip-${stage.stageName}` ? t("batchDetail.savingSkip") : t("batchDetail.skipStage")}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[22px] bg-white/75 p-4 text-sm text-slate-500">{t("batchDetail.allOptionalDecided")}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
          <StageTimeline stages={batch.stages} />

          <div className="card p-4 sm:p-6">
            <h3 className="text-lg font-bold text-slate-900">{t("batchDetail.summary")}</h3>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="surface-muted rounded-[20px] p-4 sm:rounded-[22px]">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("batchDetail.finalTx")}</div>
                <div className="mt-2 font-semibold text-slate-900">{shortHash(blockchainFinalization?.txHash)}</div>
              </div>
              <div className="surface-muted rounded-[20px] p-4 sm:rounded-[22px]">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("batchDetail.finalJson")}</div>
                <div className="mt-2 break-all text-xs font-semibold text-slate-900">{finalTrace?.ipfsCid || t("common.inactive")}</div>
              </div>
              <div className="surface-muted rounded-[20px] p-4 sm:rounded-[22px]">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("batchDetail.activeStage")}</div>
                <div className="mt-2 font-semibold text-slate-900">{availableStages.length ? availableStages.map((stage) => humanStage(stage.stageName)).join(", ") : t("common.none")}</div>
              </div>
              <div className="surface-muted rounded-[20px] p-4 sm:rounded-[22px]">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("batchDetail.optionalStage")}</div>
                <div className="mt-2 font-semibold text-slate-900">{skippableStages.length ? skippableStages.map((stage) => humanStage(stage.stageName)).join(", ") : t("batchDetail.allOptionalDecided")}</div>
              </div>
              <div className="surface-muted rounded-[20px] p-4 sm:rounded-[22px]">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Link2 size={15} />
                  {t("batchDetail.quickLinks")}
                </div>
                <div className="mt-3 grid gap-2 sm:flex sm:flex-wrap">
                  {blockchainFinalization?.txUrl && (
                    <a href={blockchainFinalization.txUrl} target="_blank" rel="noreferrer" className="btn-secondary w-full gap-2 !rounded-full !px-4 !py-2.5 !text-xs sm:w-auto">
                      <ExternalLink size={14} />
                      {t("common.etherscan")}
                    </a>
                  )}
                  {finalTrace?.ipfsUrl && (
                    <a href={finalTrace.ipfsUrl} target="_blank" rel="noreferrer" className="btn-secondary w-full gap-2 !rounded-full !px-4 !py-2.5 !text-xs sm:w-auto">
                      <ExternalLink size={14} />
                      Pinata JSON
                    </a>
                  )}
                  <Link to={`/traceability?batch=${batch.id}`} className="btn-secondary w-full gap-2 !rounded-full !px-4 !py-2.5 !text-xs sm:w-auto">
                    {t("common.traceability")}
                  </Link>
                  <Link to={getPublicTraceabilityPath(batch.id)} target="_blank" className="btn-secondary w-full gap-2 !rounded-full !px-4 !py-2.5 !text-xs sm:w-auto">
                    {t("common.public")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
