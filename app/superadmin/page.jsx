"use client";

import { useEffect, useMemo, useState } from "react";
import { getSuperAdminOverviewAction } from "./actions";

export default function SuperAdminDashboardPage() {
  const [authUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const rawUser = localStorage.getItem("auth_user");
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(() => Boolean(authUser?.userId));
  const [error, setError] = useState("");
  const [overview, setOverview] = useState({
    totalAdmins: 0,
    totalStudents: 0,
    bannedUsers: 0,
    dismissedUsers: 0,
    adminsByBranch: [],
    studentsByBranch: [],
  });

  useEffect(() => {
    if (!authUser?.userId) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void (async () => {
        const result = await getSuperAdminOverviewAction(authUser.userId);
        if (!result?.success) {
          setError(result?.error || "Failed to load superadmin dashboard");
        } else {
          setOverview(result.data);
        }
        setLoading(false);
      })();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [authUser?.userId]);

  const branchCards = useMemo(
    () =>
      overview.studentsByBranch.map((branchStat) => {
        const adminStat = overview.adminsByBranch.find(
          (item) => item.branch === branchStat.branch,
        );
        return {
          ...branchStat,
          adminCount: adminStat?.count || 0,
        };
      }),
    [overview.adminsByBranch, overview.studentsByBranch],
  );

  if (!authUser || authUser.role !== "superadmin") {
    return <div className="p-4 text-sm text-red-600">Access Restricted</div>;
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-zinc-600">Loading dashboard...</div>
    );
  }

  return (
    <div className="h-full p-2">
      <h1 className="text-zinc-700 text-lg font-bold mb-3">
        Superadmin Control Center
      </h1>
      {error ? <p className="text-sm text-red-600 mb-2">{error}</p> : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-xs text-zinc-500">Total Admins</p>
          <p className="text-xl font-bold text-zinc-700">
            {overview.totalAdmins}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-xs text-zinc-500">Total Students</p>
          <p className="text-xl font-bold text-zinc-700">
            {overview.totalStudents}
          </p>
        </div>
        <div className="bg-white border border-red-200 rounded-xl p-3">
          <p className="text-xs text-red-600">Banned Users</p>
          <p className="text-xl font-bold text-red-700">
            {overview.bannedUsers}
          </p>
        </div>
        <div className="bg-white border border-orange-200 rounded-xl p-3">
          <p className="text-xs text-orange-600">Dismissed Users</p>
          <p className="text-xl font-bold text-orange-700">
            {overview.dismissedUsers}
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-3 h-[68vh] overflow-y-auto">
        <h2 className="text-sm font-semibold text-zinc-700 mb-3">
          Branch Snapshot (Students and Admins)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {branchCards.map((item) => (
            <div
              key={item.branch}
              className="border border-gray-200 rounded-lg p-3 bg-gray-50"
            >
              <p className="text-sm font-semibold text-zinc-700">
                {item.branchLabel}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-zinc-500">Students</span>
                <span className="font-semibold text-zinc-700">
                  {item.count}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-zinc-500">Assigned Admins</span>
                <span className="font-semibold text-zinc-700">
                  {item.adminCount}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
