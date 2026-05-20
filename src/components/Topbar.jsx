import { Menu, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import WalletConnectButton from "./WalletConnectButton";
import { useLanguage } from "../contexts/LanguageContext";

export default function Topbar({
  title,
  onOpenMenu,
  showCreate = true,
  createTo = "/batches/new",
  createLabel,
}) {
  const { t } = useLanguage();
  const effectiveCreateLabel = createLabel || t("topbar.newBatch");

  return (
    <header className="sticky top-0 z-20 border-b border-[rgba(214,204,190,0.8)] bg-[rgba(250,247,241,0.9)] px-3 py-3 backdrop-blur sm:px-4 sm:py-4 lg:px-8">
      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <button
            className="sidebar-toggle-button mt-1 shrink-0 overflow-hidden rounded-2xl border border-[#ddd0bf] bg-white p-2.5 text-slate-700 shadow-sm transition hover:bg-[#fbf7ef]"
            onClick={onOpenMenu}
            title={t("sidebar.toggle")}
            type="button"
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0">
            <div className="inline-flex max-w-full items-center rounded-full border border-[#e6dccd] bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f7d6d] shadow-sm sm:text-[11px] sm:tracking-[0.22em]">
              Tea Traceability
            </div>
            <h2 className="mt-2 break-words text-xl font-bold tracking-tight text-slate-900 sm:mt-3 sm:text-2xl">{title}</h2>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3 xl:justify-end">
          <WalletConnectButton />
          {showCreate && (
            <Link to={createTo} className="btn-primary min-h-11 flex-1 gap-2 px-3 shadow-sm sm:flex-none sm:px-4">
              <Plus size={16} />
              <span className="truncate">{effectiveCreateLabel}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
