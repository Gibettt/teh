import { Link } from "react-router-dom";
import { formatDate, getActiveStages, humanStage, statusClasses } from "../utils/formatters";

export default function BatchTable({ batches }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-[#e6dccd] px-5 py-4">
        <h3 className="text-lg font-semibold text-slate-900">Batch Produksi</h3>
        <p className="mt-1 text-sm text-slate-500">Pantau batch aktif, jalur yang terbuka, dan histori finalisasi tahap.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[rgba(249,246,240,0.95)] text-left text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Kode</th>
              <th className="px-5 py-3 font-medium">Jenis</th>
              <th className="px-5 py-3 font-medium">Tahap aktif</th>
              <th className="px-5 py-3 font-medium">Tanggal</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Aksi</th>
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
                  <td className="px-5 py-4 text-slate-600">{formatDate(batch.harvestDate || batch.createdAt)}</td>
                  <td className="px-5 py-4">
                    <span className={statusClasses(batch.status)}>{batch.status}</span>
                  </td>
                  <td className="px-5 py-4">
                    <Link to={`/batches/${batch.id}`} className="font-medium text-emerald-700 hover:text-emerald-800">
                      Detail
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!batches.length && (
              <tr>
                <td className="px-5 py-8 text-center text-slate-500" colSpan="6">
                  Belum ada data batch.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
