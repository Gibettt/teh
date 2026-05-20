import { useEffect, useState } from "react";
import { Languages, PlugZap, Smartphone } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../components/Topbar";
import api from "../services/api";
import { walletProjectIdConfigured } from "../web3/config";
import { useLanguage } from "../contexts/LanguageContext";

export default function SettingsPage() {
  const { openSidebar } = useOutletContext();
  const { language, languageLabels, setLanguage, t } = useLanguage();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api
      .get("/system/web3-status")
      .then((response) => setStatus(response.data))
      .catch(() => setStatus(null));
  }, []);

  return (
    <div>
      <Topbar
        title={t("settings.title")}
        onOpenMenu={openSidebar}
      />
      <div className="grid gap-5 p-3 sm:p-4 lg:grid-cols-2 lg:gap-6 lg:p-8">
        <div className="card p-4 sm:p-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-2xl bg-emerald-50 p-2 text-emerald-700">
              <Languages size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold">{t("settings.languageTitle")}</h3>
            </div>
          </div>
          <div className="mt-4 grid w-full grid-cols-2 rounded-2xl border border-[#ddd0bf] bg-white/80 p-1 sm:inline-grid sm:w-auto">
            {Object.entries(languageLabels).map(([value, label]) => (
              <button
                key={value}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  language === value ? "bg-emerald-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                }`}
                onClick={() => setLanguage(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-2xl bg-emerald-50 p-2 text-emerald-700">
              <PlugZap size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold">{t("settings.integrationStatus")}</h3>
            </div>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="surface-muted rounded-[20px] p-4 sm:rounded-[24px]">
              <div className="font-semibold text-slate-900">Supabase</div>
              <div className="mt-1">{status?.storage?.enabled ? t("common.active") : t("common.inactive")}</div>
              <div className="mt-2 break-all text-xs text-slate-500">{t("common.project")}: {status?.storage?.projectRef || "-"}</div>
              <div className="mt-1 break-all text-xs text-slate-500">{t("common.url")}: {status?.storage?.url || "-"}</div>
              <div className="mt-1 text-xs text-slate-500">{t("common.key")}: {status?.storage?.activeKeyType || "-"}</div>
              <div className="mt-1 text-xs text-slate-500">{t("settings.publishableKey")}: {status?.storage?.publishableKeyConfigured ? t("common.configured") : t("common.notConfigured")}</div>
            </div>
            <div className="surface-muted rounded-[20px] p-4 sm:rounded-[24px]">
              <div className="font-semibold text-slate-900">Pinata</div>
              <div className="mt-1">{status?.ipfs?.enabled ? t("common.active") : t("common.inactive")}</div>
              <div className="mt-2 break-all text-xs text-slate-500">{t("common.gateway")}: {status?.ipfs?.gateway || "-"}</div>
            </div>
            <div className="surface-muted rounded-[20px] p-4 sm:rounded-[24px]">
              <div className="font-semibold text-slate-900">Blockchain</div>
              <div className="mt-1">{status?.blockchain?.enabled ? t("dashboard.metamaskReady") : t("common.inactive")}</div>
              <div className="mt-2 text-xs text-slate-500">{t("common.network")}: {status?.blockchain?.network || "sepolia"}</div>
              <div className="mt-1 text-xs text-slate-500">Chain ID: {status?.blockchain?.chainId || "11155111"}</div>
              <div className="mt-1 break-all text-xs text-slate-500">{t("common.contract")}: {status?.blockchain?.contractAddress || "-"}</div>
              <div className="mt-1 text-xs text-slate-500">{t("common.mode")}: {status?.blockchain?.transactionMode || "manual_metamask"}</div>
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-2xl bg-sky-50 p-2 text-sky-700">
              <Smartphone size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold">{t("settings.walletConnect")}</h3>
            </div>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="surface-muted rounded-[20px] p-4 sm:rounded-[24px]">
              <div className="font-semibold text-slate-900">{t("settings.projectId")}</div>
              <div className="mt-1">{walletProjectIdConfigured ? t("common.configured") : t("common.notConfigured")}</div>
            </div>
            <div className="surface-muted rounded-[20px] p-4 sm:rounded-[24px]">
              <div className="font-semibold text-slate-900">{t("settings.desktopWallet")}</div>
              <div className="mt-1">{t("common.active")}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
