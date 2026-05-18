import { useEffect, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import Topbar from "../components/Topbar";
import StageTimeline from "../components/StageTimeline";
import api from "../services/api";
import { getActiveStages, humanStage, humanWorkflowMode, statusClasses } from "../utils/formatters";

export default function TraceabilityPage() {
  const { openSidebar } = useOutletContext();
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
        title="Traceability"
        subtitle="Telusuri riwayat produksi berdasarkan batch dan tahapan, termasuk keputusan skip awal yang sudah dicatat ke Pinata dan Sepolia."
        onOpenMenu={openSidebar}
      />
      <div className="space-y-6 p-4 lg:p-8">
        <div className="card p-6">
          <h3 className="text-lg font-bold">Daftar Batch</h3>
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
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-slate-900">{item.batchCode}</div>
                    <span className={statusClasses(item.status)}>{item.status}</span>
                  </div>
                  <div className="mt-1 text-slate-500">{item.teaType}</div>
                  <div className="mt-2 text-xs text-slate-500">{humanWorkflowMode()}</div>
                  <div className="mt-2 text-xs text-slate-500">
                    Tahap aktif: {activeStages.length ? activeStages.map((stage) => humanStage(stage.stageName)).join(", ") : "-"}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {batch ? (
          <StageTimeline stages={batch.stages} />
        ) : (
          <div className="card p-10 text-center text-slate-500">Pilih salah satu batch untuk melihat traceability.</div>
        )}
      </div>
    </div>
  );
}
