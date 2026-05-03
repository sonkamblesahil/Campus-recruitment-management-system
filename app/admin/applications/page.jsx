"use client";

import { isAdminRole } from "@/lib/authRoles";
import { useEffect, useState } from "react";
import {
  getAdminApplicationsAction,
  updateApplicationStatusAction,
} from "./actions";
import { scheduleInterviewAction } from "../../interviews/actions";

export default function AdminApplicationsPage() {
  const [authUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const rawUser = localStorage.getItem("auth_user");
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  });

  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState("all");
  const [loading, setLoading] = useState(() =>
    Boolean(authUser?.userId && isAdminRole(authUser?.role)),
  );
  const [error, setError] = useState("");
  const [interviewModal, setInterviewModal] = useState({
    open: false,
    app: null,
    title: "",
    scheduledDate: "",
    meetingLink: "",
    instructions: "",
  });
  const [ctcModal, setCtcModal] = useState({
    open: false,
    appId: null,
    ctc: "",
  });

  useEffect(() => {
    if (!authUser?.userId || !isAdminRole(authUser.role)) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void (async () => {
        setLoading(true);
        const result = await getAdminApplicationsAction(
          authUser.userId,
          selectedJob === "all" ? null : selectedJob,
        );
        if (!result?.success) {
          setError(result?.error || "Failed to fetch applications");
        } else {
          setApplications(result.data || []);
          setJobs(result.jobs || []);
        }
        setLoading(false);
      })();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [authUser?.role, authUser?.userId, selectedJob]);

  const handleStatusChange = async (appId, newStatus) => {
    if (newStatus === "selected") {
      setCtcModal({ open: true, appId, ctc: "" });
      return;
    }

    setError("");
    const result = await updateApplicationStatusAction(
      authUser.userId,
      appId,
      newStatus,
    );
    if (result.success) {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === appId ? { ...app, status: newStatus } : app,
        ),
      );
    } else {
      setError(result.error);
    }
  };

  const handleSelectConfirm = async () => {
    setError("");
    const result = await updateApplicationStatusAction(
      authUser.userId,
      ctcModal.appId,
      "selected",
      ctcModal.ctc,
    );
    if (result.success) {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === ctcModal.appId ? { ...app, status: "selected" } : app,
        ),
      );
      setCtcModal({ open: false, appId: null, ctc: "" });
    } else {
      setError(result.error);
    }
  };

  const handleScheduleInterview = async () => {
    if (!interviewModal.app?.id) {
      setError("Invalid application selected for interview");
      return;
    }

    setError("");
    const result = await scheduleInterviewAction(authUser.userId, {
      applicationId: interviewModal.app.id,
      title: interviewModal.title,
      scheduledDate: interviewModal.scheduledDate,
      meetingLink: interviewModal.meetingLink,
      instructions: interviewModal.instructions,
    });

    if (!result?.success) {
      setError(result?.error || "Failed to schedule interview");
      return;
    }

    setInterviewModal({
      open: false,
      app: null,
      title: "",
      scheduledDate: "",
      meetingLink: "",
      instructions: "",
    });
  };

  if (!authUser || !isAdminRole(authUser.role)) {
    return <div className="p-4 text-red-600">Unauthorized</div>;
  }

  return (
    <div className="min-h-[82vh] p-2 sm:p-3 md:p-4 bg-gray-50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 sm:mb-4">
        <div>
          <h1 className="text-sm sm:text-base md:text-lg font-bold text-zinc-800">
            Applications & Offers
          </h1>
        </div>
        <select
          className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg w-full sm:w-auto"
          value={selectedJob}
          onChange={(e) => setSelectedJob(e.target.value)}
        >
          <option value="all">All Jobs</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.company} - {j.title}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-600 text-xs sm:text-sm mb-3">{error}</p>}

      {/* Mobile Card View */}
      <div className="md:hidden space-y-2 sm:space-y-3">
        {loading ? (
          <p className="p-4 text-xs sm:text-sm text-gray-500 bg-white rounded-lg">
            Loading...
          </p>
        ) : applications.length === 0 ? (
          <p className="p-4 text-xs sm:text-sm text-gray-500 bg-white rounded-lg">
            No applications found.
          </p>
        ) : (
          applications.map((app) => (
            <div
              key={app.id}
              className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Applicant</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                    {app.student?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {app.student?.email}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                    app.status === "selected"
                      ? "bg-green-100 text-green-800"
                      : app.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : app.status === "shortlisted"
                          ? "bg-purple-100 text-purple-800"
                          : app.status === "under-review"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {app.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-500">Job / Company</p>
                  <p className="text-xs sm:text-sm font-medium text-zinc-800 truncate">
                    {app.job?.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {app.job?.company}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Applied</p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {app.appliedAt}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <select
                  className="flex-1 border border-gray-300 p-1.5 sm:p-2 text-xs sm:text-sm rounded bg-white focus:ring-2 focus:ring-blue-500"
                  value={app.status}
                  onChange={(e) => handleStatusChange(app.id, e.target.value)}
                >
                  <option value="applied">Applied</option>
                  <option value="under-review">Under Review</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="selected">Selected (Offer)</option>
                  <option value="rejected">Rejected</option>
                </select>
                {app.status === "shortlisted" && (
                  <button
                    onClick={() =>
                      setInterviewModal({
                        open: true,
                        app,
                        title: "",
                        scheduledDate: "",
                        meetingLink: "",
                        instructions: "",
                      })
                    }
                    className="px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Schedule
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[75vh]">
          {loading ? (
            <p className="p-4 text-sm text-gray-500">Loading...</p>
          ) : applications.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No applications found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 sticky top-0">
                <tr>
                  <th className="p-3 text-left">Applicant</th>
                  <th className="p-3 text-left">Job / Company</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Update Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="p-3">
                      <div className="font-semibold text-gray-800 text-sm">
                        {app.student?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {app.student?.email}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-sm">
                        {app.job?.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {app.job?.company}
                      </div>
                    </td>
                    <td className="p-3 text-gray-600 text-sm">
                      {app.appliedAt}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          app.status === "selected"
                            ? "bg-green-100 text-green-800"
                            : app.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : app.status === "shortlisted"
                                ? "bg-purple-100 text-purple-800"
                                : app.status === "under-review"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {app.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 items-center">
                        <select
                          className="border border-gray-300 p-1 text-xs rounded text-gray-700 bg-white focus:ring-2 focus:ring-blue-500"
                          value={app.status}
                          onChange={(e) =>
                            handleStatusChange(app.id, e.target.value)
                          }
                        >
                          <option value="applied">Applied</option>
                          <option value="under-review">Under Review</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="selected">Selected (Offer)</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        {app.status === "shortlisted" && (
                          <button
                            onClick={() =>
                              setInterviewModal({
                                open: true,
                                app,
                                title: "",
                                scheduledDate: "",
                                meetingLink: "",
                                instructions: "",
                              })
                            }
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            Schedule
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {interviewModal?.open && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-bold mb-2">Schedule Interview</h3>
            <p className="text-xs text-gray-500 mb-4">
              Set up an interview for {interviewModal.app?.student?.name}.
            </p>
            <input
              type="text"
              placeholder="Interview Title (e.g. Technical Round 1)"
              value={interviewModal.title}
              onChange={(e) =>
                setInterviewModal((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              className="w-full border p-2 text-sm rounded mb-2 focus:ring-blue-500"
            />
            <input
              type="datetime-local"
              value={interviewModal.scheduledDate}
              onChange={(e) =>
                setInterviewModal((prev) => ({
                  ...prev,
                  scheduledDate: e.target.value,
                }))
              }
              className="w-full border p-2 text-sm rounded mb-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Meeting Link (optional)"
              value={interviewModal.meetingLink}
              onChange={(e) =>
                setInterviewModal((prev) => ({
                  ...prev,
                  meetingLink: e.target.value,
                }))
              }
              className="w-full border p-2 text-sm rounded mb-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Instructions (optional)"
              rows={2}
              value={interviewModal.instructions}
              onChange={(e) =>
                setInterviewModal((prev) => ({
                  ...prev,
                  instructions: e.target.value,
                }))
              }
              className="w-full border p-2 text-sm rounded mb-4 focus:ring-blue-500"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() =>
                  setInterviewModal({
                    open: false,
                    app: null,
                    title: "",
                    scheduledDate: "",
                    meetingLink: "",
                    instructions: "",
                  })
                }
                className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleInterview}
                disabled={
                  !interviewModal.title || !interviewModal.scheduledDate
                }
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {ctcModal.open && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-80">
            <h3 className="text-lg font-bold mb-2">Offer Details</h3>
            <p className="text-xs text-gray-500 mb-4">
              Provide CTC to extend an offer for this applicant.
            </p>
            <input
              type="text"
              placeholder="e.g. 12 LPA"
              value={ctcModal.ctc}
              onChange={(e) =>
                setCtcModal((prev) => ({ ...prev, ctc: e.target.value }))
              }
              className="w-full border p-2 text-sm rounded mb-4 focus:ring-blue-500"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() =>
                  setCtcModal({ open: false, appId: null, ctc: "" })
                }
                className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSelectConfirm}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Confirm & Offer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
