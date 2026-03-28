"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Navbar from "./NavBar";
import SideBar from "./SideBar";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAuthPage = pathname === "/" || pathname.startsWith("/auth");

  // Auth pages: no navbar / sidebar
  if (isAuthPage) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="h-14 shrink-0">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
      </header>

      {/* App Layout */}
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-20 md:hidden"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`group/sidebar fixed md:static top-14 left-0 h-[calc(100vh-56px)] md:h-auto w-58 md:w-20 md:hover:w-58 overflow-hidden border-r border-gray-700 z-30 transform transition-[transform,width] duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <SideBar />
        </aside>

        {/* Main Page Content */}
        <main className="flex-1 p-1 md:p-2 overflow-y-auto rounded-xl bg-gray-200">
          {children}
        </main>
      </div>
    </div>
  );
}
