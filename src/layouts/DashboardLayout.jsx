import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen text-slate-900">
      <div className="flex min-h-screen">
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {open && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div className="w-80 max-w-[88vw]">
              <Sidebar mobile onNavigate={() => setOpen(false)} />
            </div>
            <button className="flex-1 bg-slate-950/35 backdrop-blur-sm" onClick={() => setOpen(false)} type="button" />
          </div>
        )}

        <main className="relative flex-1">
          <Outlet context={{ openSidebar: () => setOpen(true) }} />
        </main>
      </div>
    </div>
  );
}
