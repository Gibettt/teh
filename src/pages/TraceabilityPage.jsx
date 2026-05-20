import { useEffect, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import Topbar from "../components/Topbar";
import StageTimeline from "../components/StageTimeline";
import TraceabilityQrCode from "../components/TraceabilityQrCode";
import api from "../services/api";
import { getActiveStages, humanStage, humanWorkflowMode, statusClasses, statusText } from "../utils/formatters";
import { useLanguage } from "../contexts/LanguageContext";

export default function TraceabilityPage() {
  const { openSidebar } = useOutletContext();
  const { language, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get("batch");
  const [batch, setBatch] = useState(null);
  const [all, setAll] = useState([]);

  useEffect(() => {
    api.get("/batches").then((response) => setAll(response.data));
  }, []);

  useEffect(() => {
    if (!batchId) return;
    api.get(`/batches/${batchId}`).then((response) => setBatch(response.data));
  }, [batchId]);

  return (
    <div>
      <Topbar
        title={t("traceability.title")}
        onOpenMenu={openSidebar}
      />
      <div className="space-y-5 p-3 sm:p-4 lg:space-y-6 lg:p-8">
        <div className="card p-4 sm:p-6">
          <h3 className="text-lg font-bold">{t("traceability.batchList")}</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {all.map((item) => {
              const activeStages = getActiveStages(item);
              return (
                <Link
                  key={item.id}
                  to={`/traceability?batch=${item.id}`}
                  className={`rounded-[24px] border p-4 text-sm transition ${
                    item.id === batchId ? "border-emerald-500 bg-emerald-50" : "border-[#e6dccd] bg-white/80 hover:bg-[#fbf7ef]"
                  }`}
                >
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="break-words font-semibold text-slate-900">{item.batchCode}</div>
                    <span className={`${statusClasses(item.status)} w-fit shrink-0`}>{statusText(item.status, language)}</span>
                  </div>
                  <div className="mt-1 text-slate-500">{item.teaType}</div>
                  <div className="mt-2 text-xs text-slate-500">{humanWorkflowMode()}</div>
                  <div className="mt-2 text-xs text-slate-500">
                    {t("traceability.activeStage", { stages: activeStages.length ? activeStages.map((stage) => humanStage(stage.stageName)).join(", ") : "-" })}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {batch ? (
          <>
            <TraceabilityQrCode batch={batch} />
            <StageTimeline
              stages={batch.stages}
              hideSkipped
            />
          </>
        ) : (
          <div className="card p-6 text-center text-sm text-slate-500 sm:p-10">{t("traceability.pickBatch")}</div>
        )}
      </div>
    </div>
  );
}
