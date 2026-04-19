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
  const serialized = JSON.stringify(details || {});
  if (!serialized || serialized === "{}") {
    return "-";
  }

  if (serialized.length <= 140) {
    return serialized;
  }

  return `${serialized.slice(0, 137)}...`;
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
    <div className="h-full p-2">
      <h1 className="text-zinc-700 text-lg font-bold mb-2">
        Governance Activity Logs
      </h1>

      {error ? <p className="text-sm text-red-600 mb-2">{error}</p> : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-xs text-zinc-500">Total Events</p>
          <p className="text-xl font-bold text-zinc-700">{summary.total}</p>
        </div>
        <div className="bg-white border border-blue-200 rounded-xl p-3">
          <p className="text-xs text-blue-600">Info</p>
          <p className="text-xl font-bold text-blue-700">{summary.info}</p>
        </div>
        <div className="bg-white border border-amber-200 rounded-xl p-3">
          <p className="text-xs text-amber-600">Warning</p>
          <p className="text-xl font-bold text-amber-700">{summary.warning}</p>
        </div>
        <div className="bg-white border border-red-200 rounded-xl p-3">
          <p className="text-xs text-red-600">Critical</p>
          <p className="text-xl font-bold text-red-700">{summary.critical}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search actor, target, or action"
          className="border border-gray-300 rounded px-3 py-2 text-sm min-w-75"
        />

        <select
          value={actionFilter}
          onChange={(event) => setActionFilter(event.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
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
          className="border border-gray-300 rounded px-3 py-2 text-sm"
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
          className="border border-gray-300 rounded px-3 py-2 text-sm"
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
          className="px-3 py-2 text-sm rounded bg-zinc-800 text-white disabled:opacity-60"
        >
          Export CSV
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl h-[60vh] overflow-auto">
        {logs.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">
            No governance events found for selected filters.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="text-left p-3">Timestamp</th>
                <th className="text-left p-3">Action</th>
                <th className="text-left p-3">Severity</th>
                <th className="text-left p-3">Actor</th>
                <th className="text-left p-3">Target</th>
                <th className="text-left p-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-gray-200 align-top">
                  <td className="p-3 text-zinc-600 whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="p-3 text-zinc-700 font-medium">
                    {log.actionLabel || log.action}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getSeverityClass(log.severity)}`}
                    >
                      {toTitleCase(log.severity)}
                    </span>
                  </td>
                  <td className="p-3 text-zinc-600">
                    <p>{log.actor?.name || "-"}</p>
                    <p className="text-xs text-zinc-500">
                      {log.actor?.email || "-"}
                    </p>
                    <p className="text-xs text-zinc-400 uppercase">
                      {log.actor?.role || "-"}
                    </p>
                  </td>
                  <td className="p-3 text-zinc-600">
                    <p>{log.target?.name || "-"}</p>
                    <p className="text-xs text-zinc-500">
                      {log.target?.email || "-"}
                    </p>
                    <p className="text-xs text-zinc-400 uppercase">
                      {log.target?.role || "-"}
                    </p>
                  </td>
                  <td className="p-3 text-zinc-500 max-w-sm wrap-break-word">
                    {summarizeDetails(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
