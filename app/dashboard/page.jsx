import React from "react";

export default function DashBoardPage() {
  return (
    <div className="bg-gray-200 h-full p-2">
      <h1 className="text-zinc-600 text-base font-bold">
        Welcome Sahil Sonkamble
      </h1>

      <div className="h-[82vh] gap-2 rounded-2xl flex   bg-gray-200 mt-2">
        <div className="h-full bg-white w-2/3 rounded-xl p-4 overflow-y-auto">
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
        <div className="h-full w-1/3 bg-white rounded-2xl">
          <h1 className="text-zinc-600 text-base font-bold pl-2 pt-2 ">
            Notifications
          </h1>
          <div className="p-2 space-y-2 overflow-y-auto max-h-[75vh]">
            <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm font-semibold text-zinc-700">
                New Application Received
              </p>
              <p className="text-xs text-zinc-500">
                John Doe applied for Software Engineer position
              </p>
              <span className="text-xs text-zinc-400">2 minutes ago</span>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
              <p className="text-sm font-semibold text-zinc-700">
                Interview Scheduled
              </p>
              <p className="text-xs text-zinc-500">
                Interview with Sarah Smith confirmed for tomorrow
              </p>
              <span className="text-xs text-zinc-400">1 hour ago</span>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <p className="text-sm font-semibold text-zinc-700">
                Offer Pending Response
              </p>
              <p className="text-xs text-zinc-500">
                Awaiting response from Michael Johnson
              </p>
              <span className="text-xs text-zinc-400">3 hours ago</span>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
              <p className="text-sm font-semibold text-zinc-700">
                New Job Posted
              </p>
              <p className="text-xs text-zinc-500">
                Frontend Developer position is now live
              </p>
              <span className="text-xs text-zinc-400">5 hours ago</span>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
              <p className="text-sm font-semibold text-zinc-700">
                Application Deadline
              </p>
              <p className="text-xs text-zinc-500">
                UX Designer applications close in 2 days
              </p>
              <span className="text-xs text-zinc-400">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
