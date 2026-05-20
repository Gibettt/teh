import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useLanguage } from "../contexts/LanguageContext";

export function getPublicTraceabilityPath(batchId) {
  return `/trace/${encodeURIComponent(batchId || "")}`;
}

export function getPublicTraceabilityUrl(batchId) {
  if (!batchId) return "";
  const path = getPublicTraceabilityPath(batchId);

  if (typeof window === "undefined") {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}

export default function TraceabilityQrCode({ batch, className = "" }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const publicUrl = useMemo(() => getPublicTraceabilityUrl(batch?.id), [batch?.id]);

  const handleCopy = async () => {
    if (!publicUrl || !navigator.clipboard) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  if (!batch?.id) {
    return null;
  }

  return (
    <div className={`rounded-[22px] border border-[#e7ddcf] bg-[rgba(249,246,240,0.92)] p-4 sm:rounded-[24px] ${className}`}>
      <div className="flex items-start gap-3">
        <div className="inline-flex rounded-2xl bg-white p-2 text-emerald-700 shadow-sm">
          <QrCode size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-900">{t("qr.title")}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-stretch gap-4 sm:flex-row sm:items-start">
        <div className="mx-auto rounded-[18px] border border-[#ded4c6] bg-white p-3 sm:mx-0">
          <QRCodeSVG
            value={publicUrl}
            size={144}
            level="M"
            includeMargin
            bgColor="#ffffff"
            fgColor="#0f172a"
          />
        </div>
        <div className="min-w-0 flex-1 text-xs text-slate-600">
          <div className="font-semibold text-slate-800">{batch.batchCode}</div>
          <div className="mt-2 break-all rounded-2xl bg-white/80 p-3">{publicUrl}</div>
          <div className="mt-3 grid gap-2 sm:flex sm:flex-wrap">
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary w-full gap-2 !rounded-full !px-4 !py-2.5 !text-xs sm:w-auto"
            >
              <ExternalLink size={14} />
              {t("common.openPublic")}
            </a>
            <button
              className="btn-secondary w-full gap-2 !rounded-full !px-4 !py-2.5 !text-xs sm:w-auto"
              onClick={handleCopy}
              type="button"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? t("common.copied") : t("common.copyUrl")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
