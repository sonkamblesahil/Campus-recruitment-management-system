"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Navbar from "./NavBar";
import SideBar from "./SideBar";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoginPage = pathname === "/";

  // On login page, just render children without navbar/sidebar
  if (!mounted) {
    return <main className="flex-1">{children}</main>;
  }

  if (isLoginPage) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      {/* Top Navbar */}
      <header className="h-16 shrink-0 border-b">
        <Navbar />
      </header>

      {/* App Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r">
          <SideBar />
        </aside>

        {/* Main Page Content */}
        <main className="flex-1 overflow-y-auto ">{children}</main>
      </div>
    </>
  );
}
