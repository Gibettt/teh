import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Leaf,
  LogOut,
  SearchCode,
  Settings,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const items = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/batches", icon: Boxes, label: "Batch Produksi" },
  { to: "/traceability", icon: SearchCode, label: "Traceability" },
  { to: "/reports", icon: ClipboardList, label: "Log Aktivitas" },
  { to: "/settings", icon: Settings, label: "Pengaturan" },
];

export default function Sidebar({ mobile = false, onNavigate }) {
  const { logout, user } = useAuth();

  return (
    <aside
      className={`flex h-full flex-col ${mobile ? "w-full rounded-r-[32px]" : "w-[19rem] rounded-r-[36px]"} border-r border-white/10 bg-[linear-gradient(180deg,#183228_0%,#1f4334_36%,#244d3d_100%)] text-slate-100 shadow-2xl shadow-emerald-950/20`}
    >
      <div className="border-b border-white/10 px-6 py-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-emerald-200 backdrop-blur">
          <Leaf size={14} />
          Tea Chain
        </div>
        <h1 className="mt-4 text-2xl font-bold">Traceability Admin</h1>
        <p className="mt-2 text-sm text-emerald-100/75">Paper dashboard untuk kontrol proses produksi teh dari kebun sampai packing.</p>
      </div>

      <div className="px-4 py-4">
        <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
          <p className="text-sm font-semibold">{user?.name}</p>
          <p className="mt-1 text-xs text-emerald-100/65">{user?.email}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 px-3">
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
                    ? "bg-white text-emerald-900 shadow-lg shadow-emerald-950/10"
                    : "text-emerald-50/85 hover:bg-white/10"
                }`
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4">
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-100 hover:bg-white/10"
          type="button"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
