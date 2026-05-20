import { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import BatchTable from "../components/BatchTable";
import api from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";

export default function DashboardPage() {
  const { openSidebar } = useOutletContext();
  const { t } = useLanguage();
  const [batches, setBatches] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    api.get("/batches").then((response) => setBatches(response.data));
    api.get("/system/web3-status").then((response) => setSystemStatus(response.data)).catch(() => setSystemStatus(null));
  }, []);

  const stats = useMemo(() => {
    const completed = batches.filter((batch) => batch.status === "completed").length;
    const progress = batches.filter((batch) => batch.status === "in_progress").length;
    return {
      total: batches.length,
      completed,
      progress,
      ipfsRecords: batches.reduce(
        (sum, batch) => sum + (batch.trace?.finalTrace?.ipfsCid ? 1 : 0),
        0
      ),
    };
  }, [batches]);

  return (
    <div>
      <Topbar
        title={t("dashboard.title")}
        onOpenMenu={openSidebar}
      />
      <div className="space-y-5 p-3 sm:p-4 lg:space-y-6 lg:p-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title={t("dashboard.totalBatch")} value={stats.total} tone="default" />
          <StatCard title={t("common.inProgress")} value={stats.progress} tone="amber" />
          <StatCard title={t("common.completed")} value={stats.completed} tone="green" />
          <StatCard title={t("dashboard.finalJson")} value={stats.ipfsRecords} tone="sky" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.85fr_1.65fr] xl:gap-6">
          <div className="card p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-2xl bg-emerald-50 p-2 text-emerald-700">
                <ShieldCheck size={18} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{t("dashboard.integrationStatus")}</h3>
            </div>
            <div className="mt-5 space-y-3">
              <div className="surface-muted rounded-[22px] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pinata</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{systemStatus?.ipfs?.enabled ? t("common.active") : t("common.inactive")}</p>
              </div>
              <div className="surface-muted rounded-[22px] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Blockchain</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{systemStatus?.blockchain?.enabled ? t("dashboard.metamaskReady") : t("common.inactive")}</p>
              </div>
            </div>
          </div>

          <BatchTable batches={batches.slice(0, 8)} />
        </div>
      </div>
    </div>
  );
}
