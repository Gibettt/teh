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

export default function StageTimeline({ stages }) {
  return (
    <div className="card p-5 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Timeline Tahapan</h3>
          <p className="mt-1 text-sm text-slate-500">
            Setiap tahap selesai atau skip tetap menyimpan JSON ke Pinata lalu CID-nya ditulis ke Sepolia.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800">
          <GitBranch size={14} />
          Dynamic multi-path
        </div>
      </div>

      <div className="space-y-4">
        {stages.map((stage, index) => {
          const finalized = stage.status === "completed" || stage.status === "skipped";

          return (
            <div key={stage.stageName} className="flex gap-4">
              <div className="flex w-7 flex-col items-center">
                <div className={`mt-1 ${stageIconColor(stage.status)}`}>
                  <StageIcon status={stage.status} />
                </div>
                {index !== stages.length - 1 && <div className="mt-2 h-full w-px bg-[#dfd5c7]" />}
              </div>
              <div className="surface-muted flex-1 rounded-[24px] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{humanStage(stage.stageName)}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {finalized
                        ? `${stage.operator || "Operator"} • ${formatDate(stage.timestamp)}`
                        : stage.status === "available"
                          ? "Tahap ini siap diproses. Tahap opsional juga bisa di-skip sejak awal."
                          : "Menunggu tahapan prasyarat selesai atau keputusan skip awal."}
                    </p>
                  </div>
                  <div>
                    <span className={stageStatusClasses(stage.status)}>{stageStatusText(stage.status)}</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {stage.skippable && (
                    <span className="rounded-full bg-white/80 px-3 py-1 font-medium text-slate-600">
                      Bisa di-skip dari awal
                    </span>
                  )}
                  {!!stage.prerequisiteStages?.length && (
                    <span className="rounded-full bg-white/80 px-3 py-1 font-medium text-slate-500">
                      Prasyarat: {stage.prerequisiteStages.map((item) => humanStage(item)).join(", ")}
                    </span>
                  )}
                </div>

                {stage.status === "skipped" && stage.skipReason && (
                  <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">
                    <span className="font-medium">Alasan skip:</span> {stage.skipReason}
                  </div>
                )}

                {finalized && (
                  <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                    <div className="rounded-2xl bg-white/70 p-3">
                      <p className="font-medium text-slate-800">CID IPFS</p>
                      <p className="mt-1 break-all text-xs">{stage.ipfsCid || "-"}</p>
                      <p className="mt-2 text-xs text-slate-500">Label file: {stage.ipfsName || "-"}</p>
                    </div>
                    <div className="rounded-2xl bg-white/70 p-3">
                      <p className="font-medium text-slate-800">Transaksi Sepolia</p>
                      <p className="mt-1 break-all text-xs">{stage.txHash || "-"}</p>
                      <p className="mt-2 text-xs text-slate-500">Chain ID: {stage.chainId || "11155111"}</p>
                    </div>
                  </div>
                )}

                {finalized && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {stage.ipfsUrl && (
                      <a
                        href={stage.ipfsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary gap-2 !rounded-full !px-4 !py-2.5 !text-xs"
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
                        className="btn-secondary gap-2 !rounded-full !px-4 !py-2.5 !text-xs"
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
        })}
      </div>
    </div>
  );
}
