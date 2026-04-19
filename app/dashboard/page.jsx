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
    <div className="bg-gray-200 h-full p-2">
      <h1 className="text-zinc-600 text-base font-bold">Welcome {userName}</h1>
      {error ? <p className="text-xs text-red-600 mt-1">{error}</p> : null}

      <div className="h-[82vh] gap-2 rounded-2xl flex bg-gray-200 mt-2">
        <div className="h-full bg-white w-full rounded-xl p-4 overflow-y-auto space-y-4">
          <h2 className="text-zinc-600 text-base font-bold mb-4">
            Student Placement Overview
          </h2>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-zinc-600 text-sm font-semibold">
                Placement Tracker
              </h3>
              <span className="text-xs text-zinc-400">Updated today</span>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xl font-bold text-zinc-800">
                  {dashboard.summary.totalApplications}
                </p>
                <p className="text-xs text-zinc-500">Applications</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xl font-bold text-blue-600">
                  {dashboard.summary.shortlisted}
                </p>
                <p className="text-xs text-zinc-500">Shortlisted</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xl font-bold text-red-600">
                  {dashboard.summary.rejected}
                </p>
                <p className="text-xs text-zinc-500">Rejected</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xl font-bold text-green-600">
                  {dashboard.summary.selected}
                </p>
                <p className="text-xs text-zinc-500">Selected</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-lg font-bold text-amber-600">
                  {dashboard.summary.underReview}
                </p>
                <p className="text-xs text-zinc-500">Under Review</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-lg font-bold text-violet-600">
                  {dashboard.summary.offersPending}
                </p>
                <p className="text-xs text-zinc-500">Pending Offers</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-lg font-bold text-cyan-600">
                  {dashboard.summary.upcomingInterviews}
                </p>
                <p className="text-xs text-zinc-500">Upcoming Interviews</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-700">
                  Recent Applications
                </p>
                <p className="text-xs text-zinc-400">Status</p>
              </div>

              <div className="divide-y divide-gray-100">
                {dashboard.recentApplications.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-zinc-500">
                    No applications yet. Explore jobs and apply to get started.
                  </div>
                ) : (
                  dashboard.recentApplications.map((application) => (
                    <div
                      key={application.id}
                      className="px-4 py-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-700">
                          {application.job.company}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {application.job.title} • Applied{" "}
                          {application.appliedAt}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${statusPillClass(application.status)}`}
                      >
                        {toStatusLabel(application.status)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-700">
                  Upcoming Interviews
                </p>
                <p className="text-xs text-zinc-400">
                  Total: {dashboard.summary.upcomingInterviews}
                </p>
              </div>

              {dashboard.upcomingInterviews.length === 0 ? (
                <div className="px-4 py-6 text-sm text-zinc-500">
                  No upcoming interviews scheduled.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {dashboard.upcomingInterviews.map((interview) => (
                    <div
                      key={interview.id}
                      className="px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-700">
                          {interview.title}
                        </p>
                        <p className="text-xs text-zinc-400">
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
                          className="text-xs font-medium text-blue-700 underline"
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
