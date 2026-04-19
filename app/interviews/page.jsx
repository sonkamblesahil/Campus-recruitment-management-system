"use client";

import { isAdminRole } from "@/lib/authRoles";
import { useEffect, useMemo, useState } from "react";
import { getInterviewsAction, updateInterviewStatusAction } from "./actions";

export default function InterviewsPage() {
  const [authUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const rawUser = localStorage.getItem("auth_user");
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  });

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(() => Boolean(authUser?.userId));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingInterviewId, setUpdatingInterviewId] = useState("");

  const canManageStatus = useMemo(
    () => isAdminRole(authUser?.role),
    [authUser?.role],
  );

  useEffect(() => {
    if (!authUser?.userId) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void (async () => {
        setLoading(true);
        const result = await getInterviewsAction(
          authUser.userId,
          authUser.role,
        );
        if (!result?.success) {
          setError(result?.error || "Failed to fetch interviews");
        } else {
          setInterviews(result.data || []);
        }
        setLoading(false);
      })();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [authUser?.role, authUser?.userId]);

  const filteredInterviews = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return interviews.filter((interview) => {
      const status = String(interview.status || "").toLowerCase();
      const statusMatch = statusFilter === "all" || status === statusFilter;

      const title = String(interview.title || "").toLowerCase();
      const company = String(interview.job?.company || "").toLowerCase();
      const role = String(interview.job?.title || "").toLowerCase();
      const candidate = String(interview.student?.name || "").toLowerCase();

      const searchMatch =
        normalizedSearch === "" ||
        title.includes(normalizedSearch) ||
        company.includes(normalizedSearch) ||
        role.includes(normalizedSearch) ||
        candidate.includes(normalizedSearch);

      return statusMatch && searchMatch;
    });
  }, [interviews, searchTerm, statusFilter]);

  const handleStatusUpdate = async (interviewId, nextStatus) => {
    if (!authUser?.userId || !interviewId || !nextStatus) {
      return;
    }

    setError("");
    setMessage("");
    setUpdatingInterviewId(interviewId);

    const result = await updateInterviewStatusAction(
      authUser.userId,
      interviewId,
      nextStatus,
    );

    if (!result?.success) {
      setError(result?.error || "Failed to update interview status");
      setUpdatingInterviewId("");
      return;
    }

    setInterviews((prevInterviews) =>
      prevInterviews.map((interview) =>
        interview.id === interviewId
          ? { ...interview, status: nextStatus }
          : interview,
      ),
    );
    setMessage("Interview status updated.");
    setUpdatingInterviewId("");
  };

  if (!authUser) {
    return (
      <div className="p-4 text-red-600">Please login to view interviews.</div>
    );
  }

  return (
    <div className="h-full p-2 relative">
      <h1 className="text-zinc-700 text-lg font-bold mb-2">
        Interviews & Appointments
      </h1>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      {message && <p className="text-green-600 text-sm mb-2">{message}</p>}

      <div className="flex flex-wrap items-center gap-2 mb-2">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by title, company, role, candidate"
          className="border border-gray-300 rounded px-3 py-1.5 text-sm min-w-65"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no-show">No Show</option>
        </select>
      </div>

      <div className="h-[80vh] bg-white rounded-lg p-4 overflow-auto shadow">
        {loading ? (
          <p className="text-gray-500">Loading your schedule...</p>
        ) : filteredInterviews.length === 0 ? (
          <p className="text-gray-500">No upcoming interviews scheduled yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInterviews.map((inv) => (
              <div
                key={inv.id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col gap-2"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-800">{inv.title}</h3>
                  <span
                    className={`px-2 py-1 text-xs font-bold rounded ${
                      inv.status === "scheduled"
                        ? "bg-blue-100 text-blue-700"
                        : inv.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {inv.status.toUpperCase()}
                  </span>
                </div>
                {authUser.role !== "student" && (
                  <div className="text-sm">
                    <span className="font-semibold text-gray-600">
                      Candidate:
                    </span>{" "}
                    {inv.student?.name} ({inv.student?.email})
                  </div>
                )}
                <div className="text-sm">
                  <span className="font-semibold text-gray-600">
                    Job Reference:
                  </span>{" "}
                  {inv.job?.title} at {inv.job?.company}
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-gray-600">
                    Date & Time:
                  </span>{" "}
                  <span className="text-blue-700 font-medium">{inv.date}</span>
                </div>
                {inv.meetingLink && (
                  <div className="text-sm mt-2 pt-2 border-t border-gray-200">
                    <a
                      href={inv.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-semibold underline"
                    >
                      🔗 Join Meeting Room
                    </a>
                  </div>
                )}
                {inv.instructions && (
                  <div className="text-xs mt-1 text-gray-600 italic">
                    <span className="font-semibold">Instructions:</span>{" "}
                    {inv.instructions}
                  </div>
                )}
                {canManageStatus ? (
                  <div className="mt-2 pt-2 border-t border-gray-200 flex items-center gap-2">
                    <span className="text-xs text-gray-600 font-semibold">
                      Update Status:
                    </span>
                    <select
                      value={inv.status}
                      onChange={(event) =>
                        handleStatusUpdate(inv.id, event.target.value)
                      }
                      disabled={updatingInterviewId === inv.id}
                      className="border border-gray-300 rounded px-2 py-1 text-xs bg-white"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no-show">No Show</option>
                    </select>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
