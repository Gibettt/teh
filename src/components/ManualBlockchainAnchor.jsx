import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Blocks, CheckCircle2, ExternalLink, Loader2, Wallet } from "lucide-react";
import { sepolia } from "wagmi/chains";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import api from "../services/api";
import { shortHash } from "../utils/formatters";
import { resolveContractAddress, teaTraceabilityAbi } from "../web3/contract";
import { useLanguage } from "../contexts/LanguageContext";

export default function ManualBlockchainAnchor({ batch, onRecorded }) {
  const { t } = useLanguage();
  const [systemStatus, setSystemStatus] = useState(null);
  const [txHash, setTxHash] = useState("");
  const [recordedHash, setRecordedHash] = useState("");
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { writeContractAsync, isPending: isWriting } = useWriteContract();

  useEffect(() => {
    api
      .get("/system/web3-status")
      .then((response) => setSystemStatus(response.data))
      .catch(() => setSystemStatus(null));
  }, []);

  const finalTrace = batch?.trace?.finalTrace;
  const finalization = batch?.trace?.blockchainFinalization;
  const finalCid = finalTrace?.ipfsCid || finalization?.finalCid || "";
  const contractAddress = resolveContractAddress(systemStatus);
  const anchored = finalization?.status === "anchored";
  const txUrl = finalization?.txUrl || (txHash ? `${systemStatus?.blockchain?.explorerBaseUrl || "https://sepolia.etherscan.io"}/tx/${txHash}` : "");

  const disabledReason = useMemo(() => {
    if (batch?.status !== "completed") {
      return t("manualAnchor.batchIncomplete");
    }
    if (finalTrace?.status === "failed") {
      return finalTrace.errorMessage || t("manualAnchor.pinataFailed");
    }
    if (finalTrace?.mock?.ipfs) {
      return t("manualAnchor.pinataMock");
    }
    if (!finalCid) {
      return t("manualAnchor.cidMissing");
    }
    if (!contractAddress) {
      return t("manualAnchor.contractMissing");
    }
    if (!isConnected) {
      return t("manualAnchor.walletMissing");
    }
    return "";
  }, [batch?.status, contractAddress, finalCid, finalTrace, isConnected, t]);

  const {
    error: receiptError,
    isError: receiptFailed,
    isSuccess: receiptSuccess,
  } = useWaitForTransactionReceipt({
    hash: txHash || undefined,
    query: {
      enabled: Boolean(txHash),
    },
  });
  const waitingForReceipt = Boolean(txHash) && !receiptSuccess && !receiptFailed && !recordedHash;

  useEffect(() => {
    if (!receiptFailed) return;
    setError(receiptError?.shortMessage || receiptError?.message || t("manualAnchor.receiptFailed"));
  }, [receiptError, receiptFailed]);

  useEffect(() => {
    if (!receiptSuccess || !txHash || recordedHash === txHash || !batch?.id) {
      return;
    }

    let cancelled = false;
    setRecording(true);
    setError("");

    api
      .post(`/batches/${batch.id}/blockchain`, {
        txHash,
        walletAddress: address,
        chainId: sepolia.id,
      })
      .then(async () => {
        if (cancelled) return;
        setRecordedHash(txHash);
        await onRecorded?.();
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.data?.message || t("manualAnchor.recordFailed"));
      })
      .finally(() => {
        if (!cancelled) {
          setRecording(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [address, batch?.id, contractAddress, onRecorded, receiptSuccess, recordedHash, txHash]);

  const handleAnchor = async () => {
    setError("");

    if (disabledReason) {
      setError(disabledReason);
      return;
    }

    try {
      if (chainId !== sepolia.id) {
        await switchChainAsync({ chainId: sepolia.id });
      }

      const hash = await writeContractAsync({
        address: contractAddress,
        abi: teaTraceabilityAbi,
        functionName: "storeIpfsCid",
        args: [finalCid],
        chainId: sepolia.id,
      });

      setTxHash(hash);
      setRecordedHash("");
    } catch (err) {
      setError(err.shortMessage || err.message || t("manualAnchor.cancelled"));
    }
  };

  return (
    <div className="rounded-[22px] border border-[#e7ddcf] bg-[rgba(249,246,240,0.92)] p-4 sm:rounded-[24px]">
      <div className="flex items-start gap-3">
        <div className="inline-flex rounded-2xl bg-white p-2 text-sky-700 shadow-sm">
          <Blocks size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-900">{t("manualAnchor.title")}</div>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-xs text-slate-600">
        <div className="rounded-2xl bg-white/75 p-3">
          <div className="font-semibold text-slate-800">{t("manualAnchor.cid")}</div>
          <div className="mt-1 break-all">{finalCid || "-"}</div>
          {finalTrace?.ipfsUrl && (
            <a href={finalTrace.ipfsUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 font-semibold text-sky-700">
              <ExternalLink size={13} />
              {t("common.openJson")}
            </a>
          )}
        </div>

        <div className="rounded-2xl bg-white/75 p-3">
          <div className="font-semibold text-slate-800">{t("manualAnchor.status")}</div>
          <div className="mt-1 break-all">
            {anchored ? finalization?.txHash : waitingForReceipt ? txHash : t("manualAnchor.waitingManual")}
          </div>
          <div className="mt-2 break-all text-slate-500">{t("common.contract")}: {contractAddress || "-"}</div>
          {txUrl && (
            <a href={txUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 font-semibold text-sky-700">
              <ExternalLink size={13} />
              {shortHash(anchored ? finalization?.txHash : txHash)}
            </a>
          )}
        </div>
      </div>

      {anchored ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">
          <CheckCircle2 size={14} />
          {t("manualAnchor.anchored")}
        </div>
      ) : (
        <button
          className="btn-primary mt-4 w-full gap-2 !rounded-full !px-3 !py-2.5 !text-xs"
          disabled={Boolean(disabledReason) || isWriting || isSwitching || recording || waitingForReceipt}
          onClick={handleAnchor}
          type="button"
        >
          {isWriting || isSwitching || recording || waitingForReceipt ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Wallet size={14} />
          )}
          {waitingForReceipt || recording ? t("manualAnchor.waiting") : t("manualAnchor.send")}
        </button>
      )}

      {(disabledReason || error) && !anchored && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-800">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error || disabledReason}</span>
        </div>
      )}
    </div>
  );
}
