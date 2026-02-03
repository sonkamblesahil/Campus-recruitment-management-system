import Link from "next/link";
import { 
  HomeIcon, 
  UserGroupIcon, 
  BriefcaseIcon, 
  DocumentTextIcon, 
  CalendarIcon, 
  GiftIcon, 
  ChartBarIcon,
  CogIcon,
  UserIcon 
} from "@heroicons/react/24/outline";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/jobs", label: "Job Postings", icon: BriefcaseIcon },
  { href: "/applications", label: "Applications", icon: DocumentTextIcon },
  { href: "/offers", label: "Offers", icon: GiftIcon },
  { href: "/analytics", label: "Analytics", icon: ChartBarIcon },
  { href: "/profile", label: "Profile", icon: UserIcon }, // 👈 Added Profile
];

export default function SideBar() {
  return (
    <nav className="h-full bg-gray-900 text-white shadow-2xl border-r border-gray-700 flex flex-col">
      

      {/* Navigation */}
      <ul className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex items-center rounded-xl p-3 text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200 ease-in-out hover:shadow-md hover:scale-[1.02] active:bg-white/20 active:scale-95"
              >
                <Icon className="h-5 w-5 mr-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Footer actions */}
      <div className="p-4 pt-2 border-t border-gray-700">
        <Link
          href="/settings"
          className="group flex items-center rounded-xl p-3 text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200 ease-in-out hover:shadow-md hover:scale-[1.02] active:bg-white/20 active:scale-95"
        >
          <CogIcon className="h-5 w-5 mr-3 opacity-70 group-hover:opacity-100 transition-opacity" />
          <span className="font-medium">Settings</span>
        </Link>
      </div>
    </nav>
  );
}
