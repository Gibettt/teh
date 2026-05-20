import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../components/Topbar";
import api from "../services/api";
import { formatDate, humanStage, shortHash } from "../utils/formatters";
import { useLanguage } from "../contexts/LanguageContext";

export default function ReportsPage() {
  const { openSidebar } = useOutletContext();
  const { language, t } = useLanguage();
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    api.get("/batches").then((response) => setBatches(response.data));
  }, []);

  const logs = useMemo(
    () =>
      batches.flatMap((batch) =>
        batch.stages
          .filter((stage) => stage.completed || stage.skipped)
          .map((stage) => ({
            batchCode: batch.batchCode,
            stageName: stage.stageName,
            operator: stage.operator,
            timestamp: stage.timestamp,
            txHash: batch.trace?.blockchainFinalization?.txHash,
          }))
      ),
    [batches]
  );

  return (
    <div>
      <Topbar
        title={t("reports.title")}
        onOpenMenu={openSidebar}
      />
      <div className="p-3 sm:p-4 lg:p-8">
        <div className="card overflow-hidden">
          <div className="divide-y divide-slate-100 md:hidden">
            {logs.map((log, index) => (
              <div key={`${log.batchCode}-${log.stageName}-${index}`} className="p-4">
                <div className="break-words font-semibold text-slate-900">{log.batchCode}</div>
                <div className="mt-3 grid gap-2 text-xs text-slate-500">
                  <div>
                    <span className="font-semibold text-slate-600">{t("reports.stage")}:</span>{" "}
                    {humanStage(log.stageName)}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">{t("common.operator")}:</span>{" "}
                    {log.operator || "-"}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">{t("common.time")}:</span>{" "}
                    {formatDate(log.timestamp, language)}
                  </div>
                  <div className="break-all">
                    <span className="font-semibold text-slate-600">{t("reports.anchor")}:</span>{" "}
                    {log.txHash ? shortHash(log.txHash) : t("reports.waitingCid")}
                  </div>
                </div>
              </div>
            ))}
            {!logs.length && <div className="px-5 py-8 text-center text-sm text-slate-500">{t("reports.empty")}</div>}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4">{t("common.batch")}</th>
                  <th className="px-5 py-4">{t("reports.stage")}</th>
                  <th className="px-5 py-4">{t("common.operator")}</th>
                  <th className="px-5 py-4">{t("common.time")}</th>
                  <th className="px-5 py-4">{t("reports.anchor")}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={`${log.batchCode}-${log.stageName}-${index}`} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-semibold text-slate-900">{log.batchCode}</td>
                    <td className="px-5 py-4 text-slate-600">{humanStage(log.stageName)}</td>
                    <td className="px-5 py-4 text-slate-600">{log.operator}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(log.timestamp, language)}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">{log.txHash ? shortHash(log.txHash) : t("reports.waitingCid")}</td>
                  </tr>
                ))}
                {!logs.length && (
                  <tr>
                    <td className="px-5 py-8 text-center text-slate-500" colSpan="5">{t("reports.empty")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
