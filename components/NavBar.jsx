"use client";

import { Menu } from "lucide-react";
import { signoutAction } from "@/app/auth/actions";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function NavBar({ onMenuClick }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="bg-gray-900 h-14 flex items-center justify-between px-4 relative z-40">
      {/* Left: Institute Info */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-200 hover:bg-white/10"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="leading-tight">
          <h1 className="font-bold text-white text-base">SGGSIE&amp;T</h1>
          <span className="text-xs text-gray-400">
            Training & Placement Office
          </span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* User Info */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 cursor-pointer"
            aria-haspopup="menu"
            aria-expanded={isDropdownOpen}
            aria-label="Open profile menu"
          >
            <div className="text-right hidden sm:block">
              <p className="text-gray-300 text-sm font-medium leading-none">
                Sahil Sonkamble
              </p>
              <p className="text-xs text-gray-400">Student</p>
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 bg-gray-700 rounded-full hover:bg-gray-600" />
          </button>

          {/* Dropdown */}
          <div
            className={`absolute right-0 top-full mt-2 w-40 bg-gray-800 border border-gray-700 shadow-lg transition ${
              isDropdownOpen
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 -translate-y-1 pointer-events-none"
            }`}
          >
            <ul className="text-sm text-gray-300" role="menu">
              <li
                className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                role="menuitem"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    router.push("/profile");
                  }}
                  className="w-full text-left"
                >
                  Profile
                </button>
              </li>
              <li
                className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-red-400"
                role="menuitem"
              >
                <form action={signoutAction}>
                  <button type="submit" className="w-full text-left">
                    Logout
                  </button>
                </form>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
