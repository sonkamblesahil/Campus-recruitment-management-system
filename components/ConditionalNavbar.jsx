"use client";

import { usePathname } from "next/navigation";
import Navbar from "./NavBar";

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // Don't show navbar on login page (root path)
  if (pathname === "/") {
    return null;
  }

  return (
    <header className="h-16 border-b">
      <Navbar />
    </header>
  );
}
