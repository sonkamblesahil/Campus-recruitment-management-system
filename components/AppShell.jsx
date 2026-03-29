"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import Navbar from "./NavBar";
import SideBar from "./SideBar";

const subscribe = (onStoreChange) => {
  const handleChange = () => onStoreChange();
  window.addEventListener("storage", handleChange);
  window.addEventListener("auth-user-changed", handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener("auth-user-changed", handleChange);
  };
};
const getServerSnapshot = () => false;
const getClientSnapshot = () => Boolean(localStorage.getItem("auth_user"));

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAuthPage =
    pathname === "/" || pathname === "/login" || pathname === "/signup";
  const isAuthenticated = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (!isAuthPage && !isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (isAuthPage && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthPage, isAuthenticated, router]);

  // Auth pages: no navbar / sidebar
  if (isAuthPage) {
    if (isAuthenticated) {
      return null;
    }
    return <main className="flex-1">{children}</main>;
  }

  if (!isAuthenticated) {
    return null;
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
