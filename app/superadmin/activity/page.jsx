"use client";

import { useEffect, useMemo, useState } from "react";
import { getGovernanceActivityAction } from "../actions";

const LAST_DAYS_OPTIONS = [7, 30, 90, 180, 365];

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
}

function toTitleCase(value) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "-";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getSeverityClass(severity) {
  if (severity === "critical") {
    return "bg-red-100 text-red-700";
  }

  if (severity === "warning") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-blue-100 text-blue-700";
}

function summarizeDetails(details) {
  try {
    // Handle null/undefined
    if (!details) {
      return "-";
    }

    // If it's already a string, use it directly
    if (typeof details === "string") {
      const trimmed = details.trim();
      if (!trimmed) return "-";
      if (trimmed.length <= 140) return trimmed;
      return `${trimmed.slice(0, 137)}...`;
    }

    // Format object to human-readable key-value pairs
    if (typeof details === "object") {
      const pairs = Object.entries(details || {})
        .filter(
          ([key, value]) =>
            key !== "jobId" && value !== null && value !== undefined,
        )
        .map(([key, value]) => {
          // Format the value
          let formattedValue = value;
          if (typeof value === "object") {
            formattedValue = JSON.stringify(value);
          }
          return `${key}: ${formattedValue}`;
        });

      if (pairs.length === 0) {
        return "-";
      }

      const result = pairs.join(", ");
      if (result.length <= 140) {
        return result;
      }

      return `${result.slice(0, 137)}...`;
    }

    // Fallback for other types
    const serialized = String(details);
    if (!serialized || serialized === "[object Object]") {
      return "-";
    }

    if (serialized.length <= 140) {
      return serialized;
    }

    return `${serialized.slice(0, 137)}...`;
  } catch {
    return "-";
  }
}

function escapeCsvValue(value) {
  const raw = String(value ?? "");
  if (raw.includes(",") || raw.includes("\n") || raw.includes('"')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function toCsv(logs) {
  const header = [
    "Timestamp",
    "Action",
    "Severity",
    "Actor Name",
    "Actor Email",
    "Actor Role",
    "Target Name",
    "Target Email",
    "Target Role",
    "Details",
  ];

  const lines = logs.map((log) => [
    formatDateTime(log.createdAt),
    log.actionLabel || log.action,
    log.severity,
    log.actor?.name || "",
    log.actor?.email || "",
    log.actor?.role || "",
    log.target?.name || "",
    log.target?.email || "",
    log.target?.role || "",
    JSON.stringify(log.details || {}),
  ]);

  return [header, ...lines]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\n");
}

export default function SuperAdminActivityPage() {
  const [authUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const rawUser = localStorage.getItem("auth_user");
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  });

  const [logs, setLogs] = useState([]);
  const [actionOptions, setActionOptions] = useState([]);
  const [severityOptions, setSeverityOptions] = useState([]);
  const [loading, setLoading] = useState(() => Boolean(authUser?.userId));
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [lastDays, setLastDays] = useState("30");

  useEffect(() => {
    if (!authUser?.userId) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void (async () => {
        setLoading(true);

        const result = await getGovernanceActivityAction(authUser.userId, {
          search: searchTerm,
          action: actionFilter,
          severity: severityFilter,
          lastDays,
          limit: 300,
        });

        if (!result?.success) {
          setError(result?.error || "Failed to load governance activity");
          setLogs([]);
        } else {
          setError("");
          setLogs(result.data?.logs || []);
          setActionOptions(result.data?.actionOptions || []);
          setSeverityOptions(result.data?.severityOptions || []);
        }

        setLoading(false);
      })();
    }, 140);

    return () => clearTimeout(timeoutId);
  }, [actionFilter, authUser?.userId, lastDays, searchTerm, severityFilter]);

  const summary = useMemo(() => {
    return logs.reduce(
      (accumulator, log) => {
        accumulator.total += 1;
        if (log.severity === "critical") {
          accumulator.critical += 1;
        } else if (log.severity === "warning") {
          accumulator.warning += 1;
        } else {
          accumulator.info += 1;
        }

        return accumulator;
      },
      { total: 0, info: 0, warning: 0, critical: 0 },
    );
  }, [logs]);

  const handleExportCsv = () => {
    const csv = toCsv(logs);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");

    link.href = url;
    link.download = `governance-activity-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!authUser || authUser.role !== "superadmin") {
    return <div className="p-4 text-sm text-red-600">Access Restricted</div>;
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-zinc-600">Loading activity logs...</div>
    );
  }

  return (
    <div className="min-h-[82vh] p-2 sm:p-3 md:p-4 bg-gray-50">
      <h1 className="text-sm sm:text-base md:text-lg font-bold text-zinc-800 mb-2 sm:mb-3">
        Governance Activity Logs
      </h1>

      {error ? (
        <p className="text-xs sm:text-sm text-red-600 mb-2">{error}</p>
      ) : null}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3">
          <p className="text-xs sm:text-sm text-zinc-500">Total Events</p>
          <p className="text-base sm:text-lg md:text-xl font-bold text-zinc-700 mt-1">
            {summary.total}
          </p>
        </div>
        <div className="bg-white border border-blue-200 rounded-lg p-2 sm:p-3">
          <p className="text-xs sm:text-sm text-blue-600">Info</p>
          <p className="text-base sm:text-lg md:text-xl font-bold text-blue-700 mt-1">
            {summary.info}
          </p>
        </div>
        <div className="bg-white border border-amber-200 rounded-lg p-2 sm:p-3">
          <p className="text-xs sm:text-sm text-amber-600">Warning</p>
          <p className="text-base sm:text-lg md:text-xl font-bold text-amber-700 mt-1">
            {summary.warning}
          </p>
        </div>
        <div className="bg-white border border-red-200 rounded-lg p-2 sm:p-3">
          <p className="text-xs sm:text-sm text-red-600">Critical</p>
          <p className="text-base sm:text-lg md:text-xl font-bold text-red-700 mt-1">
            {summary.critical}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search actor, target, or action"
          className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          <select
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            className="border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm"
          >
            <option value="all">All Actions</option>
            {actionOptions.map((action) => (
              <option key={action.value} value={action.value}>
                {action.label}
              </option>
            ))}
          </select>

          <select
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value)}
            className="border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm"
          >
            <option value="all">All Severity</option>
            {severityOptions.map((severity) => (
              <option key={severity.value} value={severity.value}>
                {severity.label}
              </option>
            ))}
          </select>

          <select
            value={lastDays}
            onChange={(event) => setLastDays(event.target.value)}
            className="border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm"
          >
            {LAST_DAYS_OPTIONS.map((dayOption) => (
              <option key={String(dayOption)} value={String(dayOption)}>
                Last {dayOption} days
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={logs.length === 0}
            className="px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-lg bg-zinc-800 text-white font-medium hover:bg-zinc-700 disabled:opacity-60 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-2 sm:space-y-3">
        {logs.length === 0 ? (
          <p className="p-4 text-xs sm:text-sm text-zinc-500 bg-white rounded-lg">
            No governance events found.
          </p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Timestamp</p>
                  <p className="text-xs sm:text-sm font-medium text-zinc-800">
                    {formatDateTime(log.createdAt)}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getSeverityClass(log.severity)}`}
                >
                  {toTitleCase(log.severity)}
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-500">Action</p>
                <p className="text-xs sm:text-sm font-semibold text-zinc-800">
                  {log.actionLabel || log.action}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-500">Actor</p>
                  <p className="text-xs font-medium text-zinc-800 truncate">
                    {log.actor?.name || "-"}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {log.actor?.email || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Target</p>
                  <p className="text-xs font-medium text-zinc-800 truncate">
                    {log.target?.name || "-"}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {log.target?.email || "-"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500">Details</p>
                <p className="text-xs text-zinc-600 break-words">
                  {summarizeDetails(log.details)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[60vh]">
          {logs.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500">
              No governance events found.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="text-left p-3 text-xs sm:text-sm">
                    Timestamp
                  </th>
                  <th className="text-left p-3 text-xs sm:text-sm">Action</th>
                  <th className="text-left p-3 text-xs sm:text-sm">Severity</th>
                  <th className="text-left p-3 text-xs sm:text-sm">Actor</th>
                  <th className="text-left p-3 text-xs sm:text-sm">Target</th>
                  <th className="text-left p-3 text-xs sm:text-sm">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-t border-gray-200 hover:bg-gray-50 align-top"
                  >
                    <td className="p-3 text-zinc-600 whitespace-nowrap text-xs sm:text-sm">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="p-3 text-zinc-700 font-medium text-xs sm:text-sm">
                      {log.actionLabel || log.action}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getSeverityClass(log.severity)}`}
                      >
                        {toTitleCase(log.severity)}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-600 text-xs sm:text-sm">
                      <p>{log.actor?.name || "-"}</p>
                      <p className="text-xs text-zinc-500">
                        {log.actor?.email || "-"}
                      </p>
                    </td>
                    <td className="p-3 text-zinc-600 text-xs sm:text-sm">
                      <p>{log.target?.name || "-"}</p>
                      <p className="text-xs text-zinc-500">
                        {log.target?.email || "-"}
                      </p>
                    </td>
                    <td className="p-3 text-zinc-500 text-xs sm:text-sm max-w-sm break-words">
                      {summarizeDetails(log.details)}
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
