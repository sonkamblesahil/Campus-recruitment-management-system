import Image from "next/image";

export default function NavBar() {
  return (
    <header className="bg-gray-900 h-14 flex items-center justify-between px-4  border-gray-700">
      
      {/* Left: Institute Info */}
      <div className="flex items-center gap-3">
        {/* Optional Logo */}
        {/* <Image src="/logo.png" alt="SGGSIE&T" width={32} height={32} /> */}

        <div className="leading-tight">
          <h1 className="font-bold text-white text-base">
            SGGSIE&amp;T
          </h1>
          <span className="text-xs text-gray-400">
            Training & Placement Office
          </span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        
       

        {/* User Info */}
        <div className="flex items-center gap-2 cursor-pointer group relative">
          <div className="text-right">
            <p className="text-gray-300 text-sm font-medium leading-none">
              Sahil Sonkamble
            </p>
            <p className="text-xs text-gray-400">
              Student
            </p>
          </div>

          {/* Avatar */}
          <div className="w-9 h-9 bg-gray-700 rounded-full hover:bg-gray-600" />

          {/* Dropdown */}
          <div className="absolute right-0 top-12 w-40 bg-gray-800 border border-gray-700 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition">
            <ul className="text-sm text-gray-300">
              <li className="px-3 py-2 hover:bg-gray-700 cursor-pointer">
                Profile
              </li>
              <li className="px-3 py-2 hover:bg-gray-700 cursor-pointer">
                Settings
              </li>
              <li className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-red-400">
                Logout
              </li>
            </ul>
          </div>
        </div>

      </div>
    </header>
  );
}
