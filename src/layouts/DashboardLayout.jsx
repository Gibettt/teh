import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  const handleSidebarToggle = () => {
    const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;

    if (isDesktop) {
      setDesktopOpen((current) => !current);
      return;
    }

    setMobileOpen(true);
  };

  return (
    <div className="min-h-screen text-slate-900 lg:h-screen lg:overflow-hidden">
      <div className="min-h-screen lg:flex lg:h-screen">
        <div
          className={`hidden shrink-0 overflow-hidden transition-[width] duration-300 ease-out lg:block ${
            desktopOpen ? "w-[19rem]" : "w-0"
          }`}
        >
          <div
            className={`h-full w-[19rem] transition-transform duration-300 ease-out ${
              desktopOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <Sidebar onClose={() => setDesktopOpen(false)} />
          </div>
        </div>

        <div
          aria-hidden={!mobileOpen}
          className={`fixed inset-0 z-40 flex transition lg:hidden ${
            mobileOpen ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          <div
            className={`w-80 max-w-[88vw] transition-transform duration-300 ease-out ${
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <Sidebar mobile onClose={() => setMobileOpen(false)} onNavigate={() => setMobileOpen(false)} />
          </div>
          <button
            className={`flex-1 bg-slate-950/35 backdrop-blur-sm transition-opacity duration-300 ease-out ${
              mobileOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setMobileOpen(false)}
            type="button"
          />
        </div>

        <main
          className="main-shell relative min-w-0 flex-1 lg:h-screen lg:overflow-y-auto"
          data-sidebar-open={desktopOpen ? "true" : "false"}
        >
          <Outlet context={{ openSidebar: handleSidebarToggle }} />
        </main>
      </div>
    </div>
  );
}
