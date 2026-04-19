"use client";

import {
  APP_ROLES,
  isAdminRole,
  isStudentRole,
  isSuperAdminRole,
} from "@/lib/authRoles";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import Navbar from "./NavBar";
import SideBar from "./SideBar";

const subscribe = (onStoreChange) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => onStoreChange();
  window.addEventListener("storage", handleChange);
  window.addEventListener("auth-user-changed", handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener("auth-user-changed", handleChange);
  };
};

const getServerSnapshot = () => false;
const getClientSnapshot = () => {
  if (typeof window === "undefined") {
    return false;
  }
  return Boolean(localStorage.getItem("auth_user"));
};

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
  const isSuperAdminPath = pathname.startsWith("/superadmin");
  const isAdminSharedPath =
    pathname.startsWith("/interviews") || pathname.startsWith("/analytics");

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
        if (isSuperAdminRole(parsedUser?.role)) {
          setRole(APP_ROLES.SUPERADMIN);
          return;
        }

        if (isAdminRole(parsedUser?.role)) {
          setRole(APP_ROLES.ADMIN);
          return;
        }

        setRole(APP_ROLES.STUDENT);
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
      if (isSuperAdminRole(role)) {
        router.replace("/superadmin");
        return;
      }

      if (isAdminRole(role)) {
        router.replace("/admin/jobs");
        return;
      }

      router.replace("/dashboard");
      return;
    }

    if (
      !isAuthPage &&
      isAuthenticated &&
      isSuperAdminRole(role) &&
      !isSuperAdminPath
    ) {
      router.replace("/superadmin");
      return;
    }

    if (
      !isAuthPage &&
      isAuthenticated &&
      isAdminRole(role) &&
      !(isAdminPath || isAdminSharedPath)
    ) {
      router.replace("/admin/jobs");
      return;
    }

    if (
      !isAuthPage &&
      isAuthenticated &&
      isStudentRole(role) &&
      (isAdminPath || isSuperAdminPath)
    ) {
      router.replace("/dashboard");
      return;
    }

    if (
      !isAuthPage &&
      isAuthenticated &&
      isAdminRole(role) &&
      isSuperAdminPath
    ) {
      router.replace("/admin/jobs");
    }
  }, [
    isAdminPath,
    isAdminSharedPath,
    isAuthPage,
    isAuthenticated,
    isSuperAdminPath,
    role,
    router,
  ]);

  if (isAuthPage) {
    if (isAuthenticated) {
      return null;
    }
    return <main className="flex-1 overflow-y-auto">{children}</main>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const sidebarTopOffsetClass = "top-14 h-[calc(100vh-56px)]";

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      <header className="h-14 shrink-0">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen ? (
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-20 md:hidden"
          />
        ) : null}

        <aside
          className={`group/sidebar fixed md:static left-0 ${sidebarTopOffsetClass} md:h-auto w-58 md:w-20 md:hover:w-58 overflow-hidden border-r border-gray-700 z-30 transform transition-[transform,width] duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <SideBar />
        </aside>

        <main className="flex-1 p-1 md:p-2 overflow-y-auto rounded-xl bg-gray-200">
          {children}
        </main>
      </div>
    </div>
  );
}
