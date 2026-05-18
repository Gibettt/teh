import { Menu, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import WalletConnectButton from "./WalletConnectButton";

export default function Topbar({
  title,
  subtitle,
  onOpenMenu,
  showCreate = true,
  createTo = "/batches/new",
  createLabel = "Batch Baru",
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-[rgba(214,204,190,0.8)] bg-[rgba(250,247,241,0.88)] px-4 py-4 backdrop-blur lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <button
            className="mt-1 rounded-2xl border border-[#ddd0bf] bg-white p-2.5 text-slate-700 shadow-sm lg:hidden"
            onClick={onOpenMenu}
            type="button"
          >
            <Menu size={18} />
          </button>
          <div>
            <div className="inline-flex items-center rounded-full border border-[#e6dccd] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7d6d] shadow-sm">
              Tea Traceability
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <WalletConnectButton />
          {showCreate && (
            <Link to={createTo} className="btn-primary gap-2 shadow-sm">
              <Plus size={16} />
              <span>{createLabel}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
