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

  // Avoid hydration mismatch
  if (!mounted) {
    return <main className="flex-1">{children}</main>;
  }

  // Login page: no navbar / sidebar
  if (isLoginPage) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      
      {/* Top Navbar */}
      <header className="h-16 shrink-0  border-gray-700">
        <Navbar />
      </header>

      {/* App Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-64 shrink-0  border-gray-700">
          <SideBar />
        </aside>

        {/* Main Page Content */}
        <main className="flex-1 p-1 overflow-y-auto rounded-xl bg-gray-200">
          {children}
        </main>

      </div>
    </div>
  );
}
