"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Navbar from "./NavBar";

export default function ConditionalNavbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't show navbar on login page (root path)
  // Return null on server to avoid hydration mismatch
  if (!mounted || pathname === "/") {
    return null;
  }

  return (
    <header className="h-16 border-b">
      <Navbar />
    </header>
  );
}
