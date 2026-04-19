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
    <div className="h-full overflow-y-auto p-3">
      <h1 className="text-lg font-semibold text-zinc-800">
        Superadmin Dashboard
      </h1>
      <p className="text-sm text-zinc-500 mt-1">
        Overview of admins, students, governance activity, and branch
        distribution.
      </p>

      {error ? <p className="text-sm text-red-600 mt-3">{error}</p> : null}

      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        <div className="bg-white border border-zinc-200 rounded-lg p-2">
          <p className="text-[11px] text-zinc-500">Total Users</p>
          <p className="text-lg font-semibold text-zinc-800">
            {formatMetric(totalUsers)}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-2">
          <p className="text-[11px] text-zinc-500">Admins</p>
          <p className="text-lg font-semibold text-zinc-800">
            {formatMetric(overview.totalAdmins)}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-2">
          <p className="text-[11px] text-zinc-500">Students</p>
          <p className="text-lg font-semibold text-zinc-800">
            {formatMetric(overview.totalStudents)}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-2">
          <p className="text-[11px] text-zinc-500">Banned</p>
          <p className="text-lg font-semibold text-zinc-800">
            {formatMetric(overview.bannedUsers)}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-2">
          <p className="text-[11px] text-zinc-500">Dismissed</p>
          <p className="text-lg font-semibold text-zinc-800">
            {formatMetric(overview.dismissedUsers)}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-2">
          <p className="text-[11px] text-zinc-500">Events (7d)</p>
          <p className="text-lg font-semibold text-zinc-800">
            {formatMetric(overview.governanceEventsLast7Days)}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-2">
          <p className="text-[11px] text-zinc-500">Critical (7d)</p>
          <p className="text-lg font-semibold text-zinc-800">
            {formatMetric(overview.criticalActionsLast7Days)}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 xl:grid-cols-4 gap-3 h-[72vh]">
        <section className="xl:col-span-3 bg-white border border-zinc-200 rounded-lg overflow-auto">
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
                <th className="text-left px-3 py-2">Branch</th>
                <th className="text-left px-3 py-2">Students</th>
                <th className="text-left px-3 py-2">Admins</th>
                <th className="text-left px-3 py-2">Student/Admin Load</th>
              </tr>
            </thead>
            <tbody>
              {sortedBranchCards.map((item) => (
                <tr key={item.branch} className="border-t border-zinc-200">
                  <td className="px-3 py-2 text-zinc-700">
                    {item.branchLabel}
                  </td>
                  <td className="px-3 py-2 text-zinc-700">
                    {formatMetric(item.count)}
                  </td>
                  <td className="px-3 py-2 text-zinc-700">
                    {formatMetric(item.adminCount)}
                  </td>
                  <td className="px-3 py-2 text-zinc-700">
                    {item.loadPerAdmin}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <aside className="bg-white border border-zinc-200 rounded-lg p-3">
          <h3 className="text-sm font-semibold text-zinc-800">
            Quick Navigation
          </h3>
          <div className="mt-2 space-y-1.5 text-sm">
            <Link
              href="/superadmin/admins"
              className="block rounded border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-zinc-700 hover:bg-zinc-100"
            >
              Manage Admin Departments
            </Link>
            <Link
              href="/superadmin/students"
              className="block rounded border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-zinc-700 hover:bg-zinc-100"
            >
              Review Student Accounts
            </Link>
            <Link
              href="/superadmin/jobs"
              className="block rounded border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-zinc-700 hover:bg-zinc-100"
            >
              Jobs Intelligence
            </Link>
            <Link
              href="/superadmin/activity"
              className="block rounded border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-zinc-700 hover:bg-zinc-100"
            >
              Governance Activity
            </Link>
            <Link
              href="/superadmin/dismissals"
              className="block rounded border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-zinc-700 hover:bg-zinc-100"
            >
              Bans and Dismissals
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
