import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  GitBranch,
  Link2,
  Play,
  SkipForward,
  Wallet,
} from "lucide-react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import Topbar from "../components/Topbar";
import StageTimeline from "../components/StageTimeline";
import api from "../services/api";
import {
  formatDate,
  getActiveStages,
  getSkippableStages,
  humanStage,
  humanWorkflowMode,
  shortHash,
  statusClasses,
} from "../utils/formatters";

export default function BatchDetailPage() {
  const { id } = useParams();
  const { openSidebar } = useOutletContext();
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
  const batchRegistration = batch?.trace?.batchRegistration;

  const handleSkip = async (stage) => {
    const reason = window.prompt(`Alasan skip tahap ${humanStage(stage.stageName)}:`);
    if (reason === null) return;

    setActionError("");
    setActionLoading(`skip-${stage.stageName}`);
    try {
      await api.post(`/batches/${batch.id}/stages/${stage.stageName}/skip`, {
        reason: reason.trim() || "Keputusan skip dari awal proses",
      });
      await loadBatch();
    } catch (error) {
      setActionError(error.response?.data?.message || "Gagal skip tahap");
    } finally {
      setActionLoading("");
    }
  };

  if (!batch) {
    return <div className="p-10">Memuat data batch...</div>;
  }

  return (
    <div>
      <Topbar
        title={`Detail Batch ${batch.batchCode}`}
        subtitle="Pantau progres tahapan, keputusan skip awal, koneksi wallet operator, dan jejak data yang tersimpan di IPFS serta Sepolia."
        onOpenMenu={openSidebar}
      />
      <div className="space-y-6 p-4 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <div className="card-paper p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-sm text-slate-500">Kode Batch</div>
                <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{batch.batchCode}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {batch.teaType} • {batch.gardenBlock || "-"}
                </p>
              </div>
              <span className={statusClasses(batch.status)}>{batch.status}</span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="surface-muted rounded-[24px] p-4">
                <p className="text-sm text-slate-500">Tanggal panen</p>
                <p className="mt-2 font-semibold text-slate-900">{formatDate(batch.harvestDate || batch.createdAt)}</p>
              </div>
              <div className="surface-muted rounded-[24px] p-4">
                <p className="text-sm text-slate-500">Mode alur</p>
                <p className="mt-2 font-semibold text-slate-900">{humanWorkflowMode()}</p>
                <p className="mt-1 text-xs text-slate-500">Tahap aktif sekarang: {availableStages.length}</p>
              </div>
              <div className="surface-muted rounded-[24px] p-4">
                <p className="text-sm text-slate-500">Registrasi batch di Sepolia</p>
                <p className="mt-2 break-all text-xs font-semibold text-slate-900">{batchRegistration?.txHash || "-"}</p>
                <p className="mt-2 text-xs text-slate-500">Network: {batchRegistration?.network || "sepolia"}</p>
                {batchRegistration?.txUrl && (
                  <a
                    href={batchRegistration.txUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-sky-700"
                  >
                    <ExternalLink size={14} />
                    Buka tx batch
                  </a>
                )}
              </div>
            </div>

            <div className="surface-muted mt-6 rounded-[26px] p-4 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <GitBranch size={18} className="mt-0.5 shrink-0 text-emerald-700" />
                <div>
                  <div className="font-semibold text-slate-900">Batch ini memakai alur dinamis multi-path.</div>
                  <div className="mt-1 text-slate-600">
                    Tahap tersedia saat ini: {availableStages.length ? availableStages.map((stage) => humanStage(stage.stageName)).join(", ") : "tidak ada"}. Tahap opsional bisa di-skip dari awal proses tanpa perlu menunggu tahap itu aktif.
                  </div>
                </div>
              </div>
            </div>

            {actionError && (
              <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {actionError}
              </div>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-2xl bg-emerald-50 p-2 text-emerald-700">
                <Wallet size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Panel Aksi Cepat</h3>
                <p className="text-sm text-slate-500">Input tahap aktif atau ambil keputusan skip lebih awal.</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <Link to={`/traceability?batch=${batch.id}`} className="btn-secondary w-full justify-between !rounded-[22px]">
                Lihat traceability lengkap
                <ExternalLink size={16} />
              </Link>

              <div className="rounded-[24px] border border-[#e7ddcf] bg-[rgba(249,246,240,0.92)] p-4">
                <div className="text-sm font-semibold text-slate-900">Tahap siap diinput</div>
                <div className="mt-3 space-y-3">
                  {availableStages.length ? (
                    availableStages.map((stage) => (
                      <div key={stage.stageName} className="rounded-[22px] bg-white/80 p-4 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{humanStage(stage.stageName)}</div>
                            <div className="mt-1 text-xs text-slate-500">Prasyarat terpenuhi dan siap direkam ke Pinata.</div>
                          </div>
                          <Link to={`/batches/${batch.id}/stages/${stage.stageName}`} className="btn-primary gap-2 !rounded-full !px-4 !py-2.5 !text-xs">
                            <Play size={14} />
                            Input tahap
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[22px] bg-white/75 p-4 text-sm text-slate-500">Belum ada tahap aktif saat ini.</div>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-[#e7ddcf] bg-[rgba(249,246,240,0.92)] p-4">
                <div className="text-sm font-semibold text-slate-900">Tahap opsional yang bisa di-skip dari awal</div>
                <div className="mt-1 text-xs text-slate-500">Keputusan skip akan tetap dibuatkan JSON di Pinata dan CID-nya dicatat ke Sepolia.</div>
                <div className="mt-3 space-y-3">
                  {skippableStages.length ? (
                    skippableStages.map((stage) => (
                      <div key={stage.stageName} className="rounded-[22px] bg-white/80 p-4 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{humanStage(stage.stageName)}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              Status saat ini: <span className="font-medium text-slate-700">{stage.status}</span>
                            </div>
                          </div>
                          <button
                            className="btn-secondary gap-2 !rounded-full !px-4 !py-2.5 !text-xs"
                            onClick={() => handleSkip(stage)}
                            type="button"
                            disabled={actionLoading === `skip-${stage.stageName}`}
                          >
                            <SkipForward size={14} />
                            {actionLoading === `skip-${stage.stageName}` ? "Menyimpan skip..." : "Skip tahap"}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[22px] bg-white/75 p-4 text-sm text-slate-500">Semua tahap opsional sudah diputuskan.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
          <StageTimeline stages={batch.stages} />

          <div className="card p-6">
            <h3 className="text-lg font-bold text-slate-900">Ringkasan Jejak Batch</h3>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="surface-muted rounded-[22px] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tx registrasi</div>
                <div className="mt-2 font-semibold text-slate-900">{shortHash(batchRegistration?.txHash)}</div>
              </div>
              <div className="surface-muted rounded-[22px] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tahap aktif</div>
                <div className="mt-2 font-semibold text-slate-900">{availableStages.length ? availableStages.map((stage) => humanStage(stage.stageName)).join(", ") : "Tidak ada"}</div>
              </div>
              <div className="surface-muted rounded-[22px] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tahap opsional</div>
                <div className="mt-2 font-semibold text-slate-900">{skippableStages.length ? skippableStages.map((stage) => humanStage(stage.stageName)).join(", ") : "Sudah diputuskan"}</div>
              </div>
              <div className="surface-muted rounded-[22px] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">IPFS + Blockchain</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="badge bg-emerald-100 text-emerald-700">Pinata JSON</span>
                  <span className="badge bg-sky-100 text-sky-700">Sepolia CID</span>
                  <span className="badge bg-amber-100 text-amber-800">Skip from start</span>
                </div>
                <p className="mt-3 text-xs text-slate-500">Setiap keputusan proses tetap menyisakan jejak yang bisa diaudit.</p>
              </div>
              <div className="surface-muted rounded-[22px] p-4">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Link2 size={15} />
                  Link cepat
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {batchRegistration?.txUrl && (
                    <a href={batchRegistration.txUrl} target="_blank" rel="noreferrer" className="btn-secondary gap-2 !rounded-full !px-4 !py-2.5 !text-xs">
                      <ExternalLink size={14} />
                      Etherscan
                    </a>
                  )}
                  <Link to={`/traceability?batch=${batch.id}`} className="btn-secondary gap-2 !rounded-full !px-4 !py-2.5 !text-xs">
                    Traceability
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
