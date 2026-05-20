import { Link } from "react-router-dom";
import { formatDate, getActiveStages, humanStage, statusClasses, statusText } from "../utils/formatters";
import { useLanguage } from "../contexts/LanguageContext";

export default function BatchTable({ batches }) {
  const { language, t } = useLanguage();

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-[#e6dccd] px-4 py-4 sm:px-5">
        <h3 className="text-lg font-semibold text-slate-900">{t("batchTable.title")}</h3>
      </div>
      <div className="divide-y divide-[#eee5d8] md:hidden">
        {batches.map((batch) => {
          const activeStages = getActiveStages(batch);
          return (
            <Link key={batch.id} to={`/batches/${batch.id}`} className="block p-4 transition hover:bg-[#fbf7ef]">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="break-words font-semibold text-slate-900">{batch.batchCode}</div>
                  <div className="mt-1 text-sm text-slate-600">{batch.teaType}</div>
                </div>
                <span className={`${statusClasses(batch.status)} shrink-0`}>{statusText(batch.status, language)}</span>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-500">
                <div>
                  <span className="font-semibold text-slate-600">{t("batchTable.activeStage")}:</span>{" "}
                  {activeStages.length ? activeStages.map((stage) => humanStage(stage.stageName)).join(", ") : "-"}
                </div>
                <div>
                  <span className="font-semibold text-slate-600">{t("batchTable.date")}:</span>{" "}
                  {formatDate(batch.harvestDate || batch.createdAt, language)}
                </div>
              </div>
            </Link>
          );
        })}
        {!batches.length && (
          <div className="px-5 py-8 text-center text-sm text-slate-500">
            {t("batchTable.empty")}
          </div>
        )}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-[rgba(249,246,240,0.95)] text-left text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">{t("batchTable.code")}</th>
              <th className="px-5 py-3 font-medium">{t("batchTable.type")}</th>
              <th className="px-5 py-3 font-medium">{t("batchTable.activeStage")}</th>
              <th className="px-5 py-3 font-medium">{t("batchTable.date")}</th>
              <th className="px-5 py-3 font-medium">{t("common.status")}</th>
              <th className="px-5 py-3 font-medium">{t("batchTable.action")}</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => {
              const activeStages = getActiveStages(batch);
              return (
                <tr key={batch.id} className="border-t border-[#eee5d8]">
                  <td className="px-5 py-4 font-semibold text-slate-900">{batch.batchCode}</td>
                  <td className="px-5 py-4 text-slate-600">{batch.teaType}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {activeStages.length ? activeStages.map((stage) => humanStage(stage.stageName)).join(", ") : "-"}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(batch.harvestDate || batch.createdAt, language)}</td>
                  <td className="px-5 py-4">
                    <span className={statusClasses(batch.status)}>{statusText(batch.status, language)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <Link to={`/batches/${batch.id}`} className="font-medium text-emerald-700 hover:text-emerald-800">
                      {t("common.detail")}
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!batches.length && (
              <tr>
                <td className="px-5 py-8 text-center text-slate-500" colSpan="6">
                  {t("batchTable.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
