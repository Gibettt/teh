import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../components/Topbar";
import api from "../services/api";
import { formatDate, humanStage } from "../utils/formatters";

export default function ReportsPage() {
  const { openSidebar } = useOutletContext();
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    api.get("/batches").then((response) => setBatches(response.data));
  }, []);

  const logs = useMemo(
    () =>
      batches.flatMap((batch) =>
        batch.stages
          .filter((stage) => stage.completed)
          .map((stage) => ({
            batchCode: batch.batchCode,
            stageName: stage.stageName,
            operator: stage.operator,
            timestamp: stage.timestamp,
            txHash: stage.txHash,
          }))
      ),
    [batches]
  );

  return (
    <div>
      <Topbar
        title="Log Aktivitas"
        subtitle="Rekap input tahapan yang sudah terkirim ke IPFS dan blockchain"
        onOpenMenu={openSidebar}
      />
      <div className="p-4 lg:p-8">
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4">Batch</th>
                  <th className="px-5 py-4">Tahap</th>
                  <th className="px-5 py-4">Operator</th>
                  <th className="px-5 py-4">Waktu</th>
                  <th className="px-5 py-4">Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={`${log.batchCode}-${log.stageName}-${index}`} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-semibold text-slate-900">{log.batchCode}</td>
                    <td className="px-5 py-4 text-slate-600">{humanStage(log.stageName)}</td>
                    <td className="px-5 py-4 text-slate-600">{log.operator}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(log.timestamp)}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">{log.txHash}</td>
                  </tr>
                ))}
                {!logs.length && (
                  <tr>
                    <td className="px-5 py-8 text-center text-slate-500" colSpan="5">Belum ada aktivitas.</td>
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
