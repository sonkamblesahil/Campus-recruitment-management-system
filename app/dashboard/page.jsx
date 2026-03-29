"use client";

import React, { useEffect, useState } from "react";

export default function DashBoardPage() {
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("auth_user");
      if (!rawUser) {
        setUserName("User");
        return;
      }

      const parsedUser = JSON.parse(rawUser);
      setUserName(parsedUser?.name || "User");
    } catch {
      setUserName("User");
    }
  }, []);

  return (
    <div className="bg-gray-200 h-full p-2">
      <h1 className="text-zinc-600 text-base font-bold">Welcome {userName}</h1>

      <div className="h-[82vh] gap-2 rounded-2xl flex   bg-gray-200 mt-2">
        <div className="h-full bg-white w-full rounded-xl p-4 overflow-y-auto">
          <h2 className="text-zinc-600 text-base font-bold mb-4">
            Student Placement Overview
          </h2>

          {/* Placement Tracker */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-zinc-600 text-sm font-semibold">
                Placement Tracker
              </h3>
              <span className="text-xs text-zinc-400">Updated today</span>
            </div>

            {/* Placement Snapshot */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xl font-bold text-zinc-800">12</p>
                <p className="text-xs text-zinc-500">Companies Applied</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xl font-bold text-blue-600">4</p>
                <p className="text-xs text-zinc-500">Shortlisted</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xl font-bold text-red-600">6</p>
                <p className="text-xs text-zinc-500">Rejected</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xl font-bold text-green-600">1</p>
                <p className="text-xs text-zinc-500">Selected</p>
              </div>
            </div>

            {/* Company-wise Status */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-700">Companies</p>
                <p className="text-xs text-zinc-400">Status</p>
              </div>

              <div className="divide-y divide-gray-100">
                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-700">Google</p>
                    <p className="text-xs text-zinc-400">
                      SWE Intern • Applied 3 days ago
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Shortlisted
                  </span>
                </div>

                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-700">
                      Microsoft
                    </p>
                    <p className="text-xs text-zinc-400">
                      SDE • Applied 1 week ago
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                    Applied
                  </span>
                </div>

                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-700">Amazon</p>
                    <p className="text-xs text-zinc-400">
                      SDE Intern • Applied 10 days ago
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                    Rejected
                  </span>
                </div>

                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-700">Infosys</p>
                    <p className="text-xs text-zinc-400">
                      System Engineer • Applied 2 weeks ago
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                    Selected
                  </span>
                </div>

                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-700">TCS</p>
                    <p className="text-xs text-zinc-400">
                      Ninja • Applied 3 weeks ago
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                    Rejected
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
