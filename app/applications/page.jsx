"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getStudentApplicationsAction,
  withdrawApplicationAction,
} from "./actions";

export default function Applications() {
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

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [withdrawingId, setWithdrawingId] = useState("");

  useEffect(() => {
    async function loadApplications() {
      if (!authUser?.userId) {
        setLoading(false);
        return;
      }

      const result = await getStudentApplicationsAction(authUser.userId);
      if (!result?.success) {
        setError(result?.error || "Unable to load applications.");
      } else {
        setApplications(result.data || []);
      }
      setLoading(false);
    }

    loadApplications();
  }, [authUser]);

  const getStatusBadge = (rawStatus) => {
    const status = String(rawStatus || "applied").toLowerCase();

    const badges = {
      applied: "bg-blue-100 text-blue-800",
      "under-review": "bg-yellow-100 text-yellow-800",
      shortlisted: "bg-purple-100 text-purple-800",
      rejected: "bg-red-100 text-red-800",
      selected: "bg-green-100 text-green-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (rawStatus) => {
    const labels = {
      applied: "Applied",
      "under-review": "Under Review",
      shortlisted: "Shortlisted",
      rejected: "Rejected",
      selected: "Selected",
    };
    return labels[String(rawStatus).toLowerCase()] || String(rawStatus);
  };

  const canWithdraw = (rawStatus) => {
    const status = String(rawStatus || "").toLowerCase();
    return ["applied", "under-review", "shortlisted"].includes(status);
  };

  const filteredApplications = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return applications.filter((application) => {
      const status = String(application.status || "").toLowerCase();
      const statusMatch = statusFilter === "all" || status === statusFilter;

      const company = String(application.job?.company || "").toLowerCase();
      const title = String(application.job?.title || "").toLowerCase();
      const searchMatch =
        normalizedSearch === "" ||
        company.includes(normalizedSearch) ||
        title.includes(normalizedSearch);

      return statusMatch && searchMatch;
    });
  }, [applications, searchTerm, statusFilter]);

  const handleWithdraw = async (applicationId) => {
    if (!authUser?.userId || !applicationId) {
      return;
    }

    if (
      !window.confirm("Are you sure you want to withdraw this application?")
    ) {
      return;
    }

    setError("");
    setMessage("");
    setWithdrawingId(applicationId);

    const result = await withdrawApplicationAction(
      authUser.userId,
      applicationId,
    );
    if (!result?.success) {
      setError(result?.error || "Could not withdraw application.");
      setWithdrawingId("");
      return;
    }

    setApplications((prev) => prev.filter((app) => app.id !== applicationId));
    setMessage("Application withdrawn successfully.");
    setWithdrawingId("");
  };

  const handleExportCsv = () => {
    const header = ["Date Applied", "Company", "Position", "Status"];
    const rows = filteredApplications.map((app) => [
      app.appliedAt || "",
      app.job?.company || "Unknown Company",
      app.job?.title || "Unknown Position",
      getStatusLabel(app.status),
    ]);

    const escapeCsv = (value) => {
      const stringValue = String(value || "");
      const escaped = stringValue.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "applications.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!authUser || authUser.role !== "student") {
    return <div className="p-4 text-sm text-red-600">Access Restricted</div>;
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-zinc-600">Loading applications...</div>
    );
  }

  return (
    <div className="bg-gray-200 h-full p-2">
      <h1 className="text-zinc-600 text-base font-bold">Your Applications</h1>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {message && <p className="text-xs text-green-600 mt-1">{message}</p>}
      <div className="h-[82vh] rounded-2xl flex bg-white mt-2 overflow-hidden items-start">
        <div className="w-full h-full p-4 overflow-x-auto">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by company or role"
              className="border border-gray-300 rounded px-3 py-1.5 text-sm min-w-55"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="applied">Applied</option>
              <option value="under-review">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="selected">Selected</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              type="button"
              onClick={handleExportCsv}
              className="bg-emerald-600 text-white text-sm px-3 py-1.5 rounded hover:bg-emerald-700"
            >
              Export CSV
            </button>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
              No applications found for the selected filters.
            </div>
          ) : (
            <table className="w-full min-w-100 text-left" role="table">
              <thead>
                <tr>
                  <th
                    className="border-b-2 border-gray-300 p-2"
                    role="columnheader"
                  >
                    Date Applied
                  </th>
                  <th
                    className="border-b-2 border-gray-300 p-2"
                    role="columnheader"
                  >
                    Company
                  </th>
                  <th
                    className="border-b-2 border-gray-300 p-2"
                    role="columnheader"
                  >
                    Position
                  </th>
                  <th
                    className="border-b-2 border-gray-300 p-2"
                    role="columnheader"
                  >
                    Status
                  </th>
                  <th
                    className="border-b-2 border-gray-300 p-2"
                    role="columnheader"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => (
                  <tr key={app.id} role="row">
                    <td className="border-b border-gray-300 p-2 text-sm text-zinc-600">
                      {app.appliedAt}
                    </td>
                    <td className="border-b border-gray-300 p-2 font-medium">
                      {app.job?.company || "Unknown Company"}
                    </td>
                    <td className="border-b border-gray-300 p-2 text-sm text-zinc-700">
                      {app.job?.title || "Unknown Position"}
                    </td>
                    <td className="border-b border-gray-300 p-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(app.status)}`}
                      >
                        {getStatusLabel(app.status)}
                      </span>
                    </td>
                    <td className="border-b border-gray-300 p-2">
                      {canWithdraw(app.status) ? (
                        <button
                          type="button"
                          onClick={() => handleWithdraw(app.id)}
                          disabled={withdrawingId === app.id}
                          className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-60"
                        >
                          {withdrawingId === app.id
                            ? "Withdrawing..."
                            : "Withdraw"}
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-400">No action</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
