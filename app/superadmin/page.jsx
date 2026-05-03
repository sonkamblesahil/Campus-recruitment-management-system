"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSuperAdminOverviewAction } from "./actions";

function formatMetric(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value || 0));
}

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
    governanceEventsLast7Days: 0,
    criticalActionsLast7Days: 0,
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
          loadPerAdmin:
            (adminStat?.count || 0) > 0
              ? (branchStat.count / adminStat.count).toFixed(1)
              : "-",
        };
      }),
    [overview.adminsByBranch, overview.studentsByBranch],
  );

  const totalUsers = overview.totalAdmins + overview.totalStudents;
  const sortedBranchCards = useMemo(
    () => [...branchCards].sort((a, b) => b.count - a.count),
    [branchCards],
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
    <div className="min-h-[82vh] overflow-y-auto p-2 sm:p-3 md:p-4 bg-gray-50">
      <h1 className="text-sm sm:text-base md:text-lg font-semibold text-zinc-800">
        Superadmin Dashboard
      </h1>
      <p className="text-xs sm:text-sm text-zinc-500 mt-1 sm:mt-2">
        Overview of admins, students, governance activity, and branch
        distribution.
      </p>

      {error ? (
        <p className="text-xs sm:text-sm text-red-600 mt-2 sm:mt-3">{error}</p>
      ) : null}

      {/* Stat Cards Grid */}
      <div className="mt-2 sm:mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
        <div className="bg-white border border-zinc-200 rounded-lg p-2 sm:p-3">
          <p className="text-[10px] sm:text-[11px] text-zinc-500">
            Total Users
          </p>
          <p className="text-base sm:text-lg md:text-xl font-semibold text-zinc-800 mt-1">
            {formatMetric(totalUsers)}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-2 sm:p-3">
          <p className="text-[10px] sm:text-[11px] text-zinc-500">Admins</p>
          <p className="text-base sm:text-lg md:text-xl font-semibold text-zinc-800 mt-1">
            {formatMetric(overview.totalAdmins)}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-2 sm:p-3">
          <p className="text-[10px] sm:text-[11px] text-zinc-500">Students</p>
          <p className="text-base sm:text-lg md:text-xl font-semibold text-zinc-800 mt-1">
            {formatMetric(overview.totalStudents)}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-2 sm:p-3">
          <p className="text-[10px] sm:text-[11px] text-zinc-500">Banned</p>
          <p className="text-base sm:text-lg md:text-xl font-semibold text-zinc-800 mt-1">
            {formatMetric(overview.bannedUsers)}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-2 sm:p-3">
          <p className="text-[10px] sm:text-[11px] text-zinc-500">Dismissed</p>
          <p className="text-base sm:text-lg md:text-xl font-semibold text-zinc-800 mt-1">
            {formatMetric(overview.dismissedUsers)}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-2 sm:p-3">
          <p className="text-[10px] sm:text-[11px] text-zinc-500">
            Events (7d)
          </p>
          <p className="text-base sm:text-lg md:text-xl font-semibold text-zinc-800 mt-1">
            {formatMetric(overview.governanceEventsLast7Days)}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-2 sm:p-3">
          <p className="text-[10px] sm:text-[11px] text-zinc-500">
            Critical (7d)
          </p>
          <p className="text-base sm:text-lg md:text-xl font-semibold text-zinc-800 mt-1">
            {formatMetric(overview.criticalActionsLast7Days)}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-3 sm:mt-4 grid grid-cols-1 xl:grid-cols-4 gap-3 min-h-[65vh]">
        {/* Branch Snapshot - Card View on Mobile */}
        <section className="xl:col-span-3 bg-white border border-zinc-200 rounded-lg overflow-hidden">
          {/* Mobile Card View */}
          <div className="xl:hidden overflow-y-auto">
            <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
              {sortedBranchCards.map((item) => (
                <div
                  key={item.branch}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm sm:text-base text-zinc-800">
                      {item.branchLabel}
                    </h4>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div>
                      <p className="text-xs text-zinc-600">Students</p>
                      <p className="text-sm sm:text-base font-semibold text-zinc-800">
                        {formatMetric(item.count)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-600">Admins</p>
                      <p className="text-sm sm:text-base font-semibold text-zinc-800">
                        {formatMetric(item.adminCount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-600">Load</p>
                      <p className="text-sm sm:text-base font-semibold text-zinc-800">
                        {item.loadPerAdmin}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden xl:block overflow-x-auto">
            <div className="px-3 py-2 border-b border-zinc-200">
              <h2 className="text-sm font-semibold text-zinc-800">
                Branch Snapshot
              </h2>
              <p className="text-xs text-zinc-500">
                Students and assigned admins per branch
              </p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 text-xs sm:text-sm">
                    Branch
                  </th>
                  <th className="text-left px-3 py-2 text-xs sm:text-sm">
                    Students
                  </th>
                  <th className="text-left px-3 py-2 text-xs sm:text-sm">
                    Admins
                  </th>
                  <th className="text-left px-3 py-2 text-xs sm:text-sm">
                    Student/Admin Load
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedBranchCards.map((item) => (
                  <tr
                    key={item.branch}
                    className="border-t border-zinc-200 hover:bg-gray-50"
                  >
                    <td className="px-3 py-2 text-zinc-700 text-xs sm:text-sm">
                      {item.branchLabel}
                    </td>
                    <td className="px-3 py-2 text-zinc-700 text-xs sm:text-sm">
                      {formatMetric(item.count)}
                    </td>
                    <td className="px-3 py-2 text-zinc-700 text-xs sm:text-sm">
                      {formatMetric(item.adminCount)}
                    </td>
                    <td className="px-3 py-2 text-zinc-700 text-xs sm:text-sm">
                      {item.loadPerAdmin}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Navigation */}
        <aside className="bg-white border border-zinc-200 rounded-lg p-2 sm:p-3 md:p-4">
          <h3 className="text-xs sm:text-sm font-semibold text-zinc-800">
            Quick Navigation
          </h3>
          <div className="mt-2 sm:mt-3 space-y-1 sm:space-y-2 text-xs sm:text-sm">
            <Link
              href="/superadmin/admins"
              className="block rounded border border-zinc-200 bg-zinc-50 px-2 sm:px-3 py-1.5 sm:py-2 text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              Manage Admin Departments
            </Link>
            <Link
              href="/superadmin/students"
              className="block rounded border border-zinc-200 bg-zinc-50 px-2 sm:px-3 py-1.5 sm:py-2 text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              Review Student Accounts
            </Link>
            <Link
              href="/superadmin/jobs"
              className="block rounded border border-zinc-200 bg-zinc-50 px-2 sm:px-3 py-1.5 sm:py-2 text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              Jobs Intelligence
            </Link>
            <Link
              href="/superadmin/activity"
              className="block rounded border border-zinc-200 bg-zinc-50 px-2 sm:px-3 py-1.5 sm:py-2 text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              Governance Activity
            </Link>
            <Link
              href="/superadmin/dismissals"
              className="block rounded border border-zinc-200 bg-zinc-50 px-2 sm:px-3 py-1.5 sm:py-2 text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              Bans and Dismissals
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
