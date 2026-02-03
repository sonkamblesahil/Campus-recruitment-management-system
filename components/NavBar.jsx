import Image from "next/image";

export default function NavBar() {
  return (
    <header className="bg-gray-900 h-16 flex items-center justify-between px-4 border-b border-gray-700">
      
      {/* Left: SGGSIE&T */}
      <div className="flex items-center">
        <div className="leading-tight">
          <h1 className="font-bold text-white text-base">
            SGGSIE&amp;T
          </h1>
          <span className="text-xs text-gray-400">
            Training & Placement Office
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <span className="text-gray-300 text-sm font-medium">Username</span>
        <div className="w-9 h-9 bg-gray-700 rounded-full hover:bg-gray-600 cursor-pointer" />
      </div>
    </header>
  );
}
