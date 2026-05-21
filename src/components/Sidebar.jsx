import {
  Boxes,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  Leaf,
  LogOut,
  PanelLeftClose,
  SearchCode,
  Settings,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

const items = [
  { to: "/", icon: LayoutDashboard, labelKey: "dashboard.title" },
  { to: "/batches", icon: Boxes, labelKey: "sidebar.batchProduction" },
  { to: "/traceability", icon: SearchCode, labelKey: "common.traceability" },
  { to: "/reports", icon: ClipboardList, labelKey: "sidebar.activityLog" },
  { to: "/api-docs", icon: BookOpen, labelKey: "sidebar.apiDocs" },
  { to: "/settings", icon: Settings, labelKey: "common.settings" },
];

export default function Sidebar({ mobile = false, onClose, onNavigate }) {
  const { logout, user } = useAuth();
  const { t } = useLanguage();

  return (
    <aside
      className={`flex ${mobile ? "h-full w-full rounded-r-[32px]" : "h-screen max-h-screen w-[19rem] rounded-r-[36px]"} flex-col overflow-hidden border-r border-white/10 bg-[linear-gradient(180deg,#183228_0%,#1f4334_36%,#244d3d_100%)] text-slate-100 shadow-2xl shadow-emerald-950/20`}
    >
      <div className="shrink-0 border-b border-white/10 px-6 py-6">
        <div className="flex items-start justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-emerald-200 backdrop-blur">
            <Leaf size={14} />
            Tea Chain
          </div>
          {onClose && (
            <button
              className="rounded-2xl border border-white/10 bg-white/10 p-2 text-emerald-50 transition hover:bg-white/15"
              onClick={onClose}
              title={t("sidebar.close")}
              type="button"
            >
              <PanelLeftClose size={18} />
            </button>
          )}
        </div>
        <h1 className="mt-4 text-2xl font-bold">Traceability Admin</h1>
      </div>

      <div className="shrink-0 px-4 py-4">
        <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
          <p className="text-sm font-semibold">{user?.name}</p>
          <p className="mt-1 text-xs text-emerald-100/65">{user?.email}</p>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                  isActive
                    ? "border border-white/15 bg-white/10 text-white shadow-inner shadow-white/5 backdrop-blur"
                    : "border border-transparent text-emerald-50/85 hover:bg-white/10"
                }`
              }
            >
              <Icon size={18} />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="shrink-0 p-4">
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-100 hover:bg-white/10"
          type="button"
        >
          <LogOut size={16} />
          {t("sidebar.logout")}
        </button>
      </div>
    </aside>
  );
}
