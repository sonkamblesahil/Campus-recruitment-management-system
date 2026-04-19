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
    <div className="h-full p-2 relative">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-zinc-700 text-lg font-bold">
          Applications & Offers
        </h1>
        <select
          className="p-1 px-3 text-sm border rounded"
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

      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

      <div className="h-[80vh] bg-white rounded-lg p-2 overflow-auto shadow">
        {loading ? (
          <p className="p-4 text-gray-500">Loading...</p>
        ) : applications.length === 0 ? (
          <p className="p-4 text-gray-500">No applications found.</p>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-100 text-gray-600 sticky top-0">
              <tr>
                <th className="p-3">Applicant</th>
                <th className="p-3">Job / Company</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Update Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-semibold text-gray-800">
                      {app.student?.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {app.student?.email}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold">{app.job?.title}</div>
                    <div className="text-xs text-gray-500">
                      {app.job?.company}
                    </div>
                  </td>
                  <td className="p-3 text-gray-600">{app.appliedAt}</td>
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
                    <select
                      className="border p-1 text-xs rounded text-gray-700 w-full max-w-30 focus:ring focus:ring-blue-500"
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
                        className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        Schedule Interview
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
