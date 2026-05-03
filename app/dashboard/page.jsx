"use client";

import { useEffect, useMemo, useState } from "react";
import { getStudentDashboardAction } from "./actions";

function statusPillClass(status) {
  const normalized = String(status || "applied").toLowerCase();

  if (normalized === "selected") {
    return "bg-green-50 text-green-700 border border-green-200";
  }

  if (normalized === "shortlisted") {
    return "bg-indigo-50 text-indigo-700 border border-indigo-200";
  }

  if (normalized === "under-review") {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }

  if (normalized === "rejected") {
    return "bg-red-50 text-red-700 border border-red-200";
  }

  return "bg-blue-50 text-blue-700 border border-blue-200";
}

function toStatusLabel(status) {
  const normalized = String(status || "applied").toLowerCase();
  const map = {
    applied: "Applied",
    "under-review": "Under Review",
    shortlisted: "Shortlisted",
    rejected: "Rejected",
    selected: "Selected",
  };

  return map[normalized] || normalized;
}

export default function DashBoardPage() {
  const [authUser] = useState(() => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const rawUser = localStorage.getItem("auth_user");
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState({
    summary: {
      totalApplications: 0,
      underReview: 0,
      shortlisted: 0,
      rejected: 0,
      selected: 0,
      offersPending: 0,
      offersAccepted: 0,
      upcomingInterviews: 0,
    },
    recentApplications: [],
    upcomingInterviews: [],
  });

  const userName = useMemo(() => authUser?.name || "User", [authUser?.name]);

  useEffect(() => {
    async function loadDashboard() {
      if (!authUser?.userId || authUser?.role !== "student") {
        setLoading(false);
        return;
      }

      const result = await getStudentDashboardAction(authUser.userId);

      if (!result?.success) {
        setError(result?.error || "Unable to load dashboard");
        setLoading(false);
        return;
      }

      setDashboard(result.data);
      setLoading(false);
    }

    loadDashboard();
  }, [authUser]);

  if (!authUser || authUser.role !== "student") {
    return (
      <div className="p-4 text-sm text-red-600">
        Dashboard is available only for students.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-zinc-600">Loading dashboard...</div>
    );
  }

  return (
    <div className="bg-gray-50 md:bg-gray-200 h-full p-2 sm:p-3 md:p-2">
      <h1 className="text-zinc-600 text-sm sm:text-base font-bold">
        Welcome {userName}
      </h1>
      {error ? <p className="text-xs text-red-600 mt-1">{error}</p> : null}

      <div className="min-h-[82vh] gap-2 rounded-2xl flex bg-gray-50 md:bg-gray-200 mt-2">
        <div className="min-h-full bg-white w-full rounded-xl p-3 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4">
          <h2 className="text-zinc-600 text-sm sm:text-base font-bold mb-3 sm:mb-4">
            Student Placement Overview
          </h2>

          <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-zinc-600 text-xs sm:text-sm font-semibold">
                Placement Tracker
              </h3>
              <span className="text-xs text-zinc-400">Updated today</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
              <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3">
                <p className="text-lg sm:text-xl font-bold text-zinc-800">
                  {dashboard.summary.totalApplications}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Applications</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3">
                <p className="text-lg sm:text-xl font-bold text-blue-600">
                  {dashboard.summary.shortlisted}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Shortlisted</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3">
                <p className="text-lg sm:text-xl font-bold text-red-600">
                  {dashboard.summary.rejected}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Rejected</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3">
                <p className="text-lg sm:text-xl font-bold text-green-600">
                  {dashboard.summary.selected}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Selected</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
              <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3">
                <p className="text-base sm:text-lg font-bold text-amber-600">
                  {dashboard.summary.underReview}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Under Review</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3">
                <p className="text-base sm:text-lg font-bold text-violet-600">
                  {dashboard.summary.offersPending}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Pending Offers</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3">
                <p className="text-base sm:text-lg font-bold text-cyan-600">
                  {dashboard.summary.upcomingInterviews}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Interviews</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 flex items-center justify-between">
                <p className="text-xs sm:text-sm font-semibold text-zinc-700">
                  Recent Applications
                </p>
                <p className="text-xs text-zinc-400">Status</p>
              </div>

              <div className="divide-y divide-gray-100">
                {dashboard.recentApplications.length === 0 ? (
                  <div className="px-3 sm:px-4 py-4 sm:py-6 text-xs sm:text-sm text-zinc-500">
                    No applications yet. Explore jobs and apply to get started.
                  </div>
                ) : (
                  dashboard.recentApplications.map((application) => (
                    <div
                      key={application.id}
                      className="px-3 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-zinc-700 truncate">
                          {application.job.company}
                        </p>
                        <p className="text-xs text-zinc-400 line-clamp-1">
                          {application.job.title} • Applied{" "}
                          {application.appliedAt}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${statusPillClass(application.status)}`}
                      >
                        {toStatusLabel(application.status)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 flex items-center justify-between">
                <p className="text-xs sm:text-sm font-semibold text-zinc-700">
                  Upcoming Interviews
                </p>
                <p className="text-xs text-zinc-400">
                  Total: {dashboard.summary.upcomingInterviews}
                </p>
              </div>

              {dashboard.upcomingInterviews.length === 0 ? (
                <div className="px-3 sm:px-4 py-4 sm:py-6 text-xs sm:text-sm text-zinc-500">
                  No upcoming interviews scheduled.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {dashboard.upcomingInterviews.map((interview) => (
                    <div
                      key={interview.id}
                      className="px-3 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-zinc-700 truncate">
                          {interview.title}
                        </p>
                        <p className="text-xs text-zinc-400 line-clamp-1">
                          {interview.job.company} • {interview.job.title}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {interview.date}
                        </p>
                      </div>
                      {interview.meetingLink ? (
                        <a
                          href={interview.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-blue-700 hover:text-blue-900 underline whitespace-nowrap"
                        >
                          Join
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
