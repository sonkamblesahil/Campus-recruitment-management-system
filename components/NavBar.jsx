"use client";

import { normalizeRole } from "@/lib/authRoles";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function NavBar({ onMenuClick }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState({ name: "User", role: "Student" });
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

  useEffect(() => {
    const readUser = () => {
      try {
        const rawUser = localStorage.getItem("auth_user");
        if (!rawUser) {
          setUser({ name: "User", role: "Student" });
          return;
        }

        const parsedUser = JSON.parse(rawUser);
        setUser({
          name: parsedUser?.name || "User",
          role: normalizeRole(parsedUser?.role) || "student",
        });
      } catch {
        setUser({ name: "User", role: "Student" });
      }
    };

    readUser();
    window.addEventListener("storage", readUser);
    window.addEventListener("auth-user-changed", readUser);

    return () => {
      window.removeEventListener("storage", readUser);
      window.removeEventListener("auth-user-changed", readUser);
    };
  }, []);

  return (
    <header className="bg-gray-900 h-14 flex items-center justify-between px-3 sm:px-4 relative z-40">
      {/* Left: Institute Info */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-gray-200 hover:bg-white/10 transition-colors shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="leading-tight min-w-0">
          <h1 className="font-bold text-white text-xs sm:text-sm md:text-base truncate">
            SGGSIE&amp;T
          </h1>
          <span className="text-xs text-gray-400  sm:block truncate">
            Training and Placement Office
          </span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* User Info */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            aria-haspopup="menu"
            aria-expanded={isDropdownOpen}
            aria-label="Open profile menu"
          >
            <div className="text-right hidden sm:block">
              <p className="text-gray-300 text-xs sm:text-sm font-medium leading-tight truncate max-w-[120px]">
                {user.name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </p>
            </div>

            {/* Avatar */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors shrink-0 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
          </button>

          {/* Dropdown */}
          <div
            className={`absolute right-0 top-full mt-1 sm:mt-2 w-40 sm:w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-lg transition ${
              isDropdownOpen
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 -translate-y-1 pointer-events-none"
            }`}
          >
            <ul className="text-xs sm:text-sm text-gray-300" role="menu">
              <li
                className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-gray-700 cursor-pointer transition-colors"
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
                className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-gray-700 cursor-pointer text-red-400 transition-colors border-t border-gray-700"
                role="menuitem"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    localStorage.removeItem("auth_user");
                    window.dispatchEvent(new Event("auth-user-changed"));
                    router.push("/login");
                  }}
                  className="w-full text-left"
                >
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
