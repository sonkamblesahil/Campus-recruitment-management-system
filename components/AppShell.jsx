"use client";

import { APP_ROLES, isAdminRole, isStudentRole } from "@/lib/authRoles";
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
  const [role, setRole] = useState(APP_ROLES.STUDENT);

  const isAuthPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";
  const isAdminPath = pathname.startsWith("/admin");
  const isAuthenticated = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    const readRole = () => {
      try {
        const rawUser = localStorage.getItem("auth_user");
        if (!rawUser) {
          setRole(APP_ROLES.STUDENT);
          return;
        }

        const parsedUser = JSON.parse(rawUser);
        setRole(
          isAdminRole(parsedUser?.role) ? APP_ROLES.ADMIN : APP_ROLES.STUDENT,
        );
      } catch {
        setRole(APP_ROLES.STUDENT);
      }
    };

    readRole();
    window.addEventListener("storage", readRole);
    window.addEventListener("auth-user-changed", readRole);

    return () => {
      window.removeEventListener("storage", readRole);
      window.removeEventListener("auth-user-changed", readRole);
    };
  }, []);

  useEffect(() => {
    if (!isAuthPage && !isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (isAuthPage && isAuthenticated) {
      if (isAdminRole(role)) {
        router.replace("/admin/jobs");
        return;
      }

      router.replace("/dashboard");
      return;
    }

    if (!isAuthPage && isAuthenticated && isAdminRole(role) && !isAdminPath) {
      router.replace("/admin/jobs");
      return;
    }

    if (!isAuthPage && isAuthenticated && isStudentRole(role) && isAdminPath) {
      router.replace("/dashboard");
      return;
    }
  }, [isAdminPath, isAuthPage, isAuthenticated, role, router]);

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

  const showNavbar = true;
  const isSidebarOpen = sidebarOpen;
  const sidebarTopOffsetClass = "top-14 h-[calc(100vh-56px)]";

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      {/* Top Navbar */}
      {showNavbar ? (
        <header className="h-14 shrink-0">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />
        </header>
      ) : null}

      {/* App Layout */}
      <div className="flex flex-1 overflow-hidden">
        {showNavbar && sidebarOpen && (
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-20 md:hidden"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`group/sidebar fixed md:static left-0 ${sidebarTopOffsetClass} md:h-auto w-58 md:w-20 md:hover:w-58 overflow-hidden border-r border-gray-700 z-30 transform transition-[transform,width] duration-300 ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
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
