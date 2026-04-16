"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  HomeIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  GiftIcon,
  ChartBarIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

const studentNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/jobs", label: "Job Postings", icon: BriefcaseIcon },
  { href: "/applications", label: "Applications", icon: DocumentTextIcon },
  { href: "/offers", label: "Offers", icon: GiftIcon },
  { href: "/analytics", label: "Placement Analytics", icon: ChartBarIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

const adminNavItems = [
  { href: "/admin/jobs", label: "Create Jobs", icon: BriefcaseIcon },
];

const recruiterNavItems = [
  { href: "/recruiter/jobs", label: "Create Jobs", icon: BriefcaseIcon },
];

export default function SideBar() {
  const pathname = usePathname();
  const [role, setRole] = useState("student");

  useEffect(() => {
    const readRole = () => {
      try {
        const rawUser = localStorage.getItem("auth_user");
        if (!rawUser) {
          setRole("student");
          return;
        }

        const parsedUser = JSON.parse(rawUser);
        setRole(
          parsedUser?.role === "admin" || parsedUser?.role === "recruiter"
            ? parsedUser.role
            : "student",
        );
      } catch {
        setRole("student");
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

  const navItems =
    role === "admin"
      ? adminNavItems
      : role === "recruiter"
        ? recruiterNavItems
        : studentNavItems;

  return (
    <nav className="h-full bg-gray-900/95 md:group-hover/sidebar:bg-gray-900/60 backdrop-blur-md text-white shadow-2xl flex flex-col transition-colors duration-300">
      {/* Navigation */}
      <ul className="flex-1 p-3 space-y-4 mt-10">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`group flex items-center justify-center md:justify-start rounded-xl p-3 transition-all duration-200 ease-in-out active:bg-white/20 ${
                  pathname === item.href
                    ? "bg-white text-gray-900"
                    : "text-gray-300 hover:bg-white/15 hover:text-white"
                }`}
                title={item.label}
              >
                <Icon className="h-5 w-5 shrink-0 md:mr-0 md:group-hover/sidebar:mr-3 opacity-80 group-hover:opacity-100 transition-all duration-200" />
                <span className="font-medium whitespace-nowrap opacity-100 md:opacity-0 md:translate-x-2 md:group-hover/sidebar:opacity-100 md:group-hover/sidebar:translate-x-0 transition-all duration-200">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
