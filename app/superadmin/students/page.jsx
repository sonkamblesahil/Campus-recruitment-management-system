"use client";

import { BRANCH_OPTIONS, PROGRAM_OPTIONS } from "@/lib/academics";
import { useEffect, useMemo, useState } from "react";
import {
  banStudentAction,
  dismissUserAction,
  getStudentManagementAction,
  unbanStudentAction,
} from "../actions";

function escapeCsvValue(value) {
  const raw = String(value ?? "");
  if (raw.includes(",") || raw.includes("\n") || raw.includes('"')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function toStudentsCsv(students) {
  const header = [
    "Name",
    "Email",
    "Branch",
    "Program",
    "Year",
    "CGPA",
    "Class XII %",
    "Status",
  ];

  const rows = students.map((student) => {
    const status = student.isDismissed
      ? "Dismissed"
      : student.isBanned
        ? "Banned"
        : "Active";

    return [
      student.name || "",
      student.email || "",
      student.branchLabel || student.branch || "",
      (student.program || "").toUpperCase(),
      student.year ?? "",
      student.cgpa !== null && student.cgpa !== undefined
        ? student.cgpa.toFixed(2)
        : "",
      student.class12Percentage !== null &&
      student.class12Percentage !== undefined
        ? student.class12Percentage.toFixed(2)
        : "",
      status,
    ];
  });

  return [header, ...rows]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\n");
}

export default function SuperAdminStudentsPage() {
  const [authUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const rawUser = localStorage.getItem("auth_user");
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  });

  const [students, setStudents] = useState([]);
  const [yearTabs, setYearTabs] = useState([]);
  const [loading, setLoading] = useState(() => Boolean(authUser?.userId));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [minCgpa, setMinCgpa] = useState("");
  const [maxCgpa, setMaxCgpa] = useState("");
  const [minClass12, setMinClass12] = useState("");
  const [maxClass12, setMaxClass12] = useState("");
  const [updatingStudentId, setUpdatingStudentId] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (!authUser?.userId) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void (async () => {
        setLoading(true);

        const result = await getStudentManagementAction(authUser.userId, {
          search: searchTerm,
          branch: branchFilter,
          program: programFilter,
          year: yearFilter,
          minCgpa,
          maxCgpa,
          minClass12Percentage: minClass12,
          maxClass12Percentage: maxClass12,
        });

        if (!result?.success) {
          setError(result?.error || "Failed to load students");
          setStudents([]);
          setYearTabs([]);
        } else {
          setStudents(result.data?.students || []);
          setYearTabs(result.data?.yearTabs || []);
          setError("");
        }

        setLoading(false);
      })();
    }, 120);

    return () => clearTimeout(timeoutId);
  }, [
    authUser?.userId,
    branchFilter,
    maxCgpa,
    maxClass12,
    minCgpa,
    minClass12,
    programFilter,
    refreshToken,
    searchTerm,
    yearFilter,
  ]);

  const refreshStudents = () => {
    setRefreshToken((prev) => prev + 1);
  };

  const handleBanToggle = async (student, shouldBan) => {
    if (!authUser?.userId) return;

    const reason = shouldBan
      ? window.prompt(
          "Provide ban reason (optional):",
          student.banReason || "",
        ) || ""
      : "";

    setError("");
    setMessage("");
    setUpdatingStudentId(student.id);

    const result = shouldBan
      ? await banStudentAction(authUser.userId, student.id, reason)
      : await unbanStudentAction(authUser.userId, student.id);

    if (!result?.success) {
      setError(result?.error || "Could not update ban status");
      setUpdatingStudentId("");
      return;
    }

    setMessage(shouldBan ? "Student banned." : "Student unbanned.");
    setUpdatingStudentId("");
    refreshStudents();
  };

  const handleDismiss = async (student) => {
    if (!authUser?.userId || !student?.email) return;

    const reason =
      window.prompt(
        "Dismissal reason for this student:",
        student.dismissalReason || "",
      ) || "";

    setError("");
    setMessage("");
    setUpdatingStudentId(student.id);

    const result = await dismissUserAction(
      authUser.userId,
      student.email,
      reason,
    );
    if (!result?.success) {
      setError(result?.error || "Could not dismiss student");
      setUpdatingStudentId("");
      return;
    }

    setMessage("Student dismissed.");
    setUpdatingStudentId("");
    refreshStudents();
  };

  const handleExportCsv = () => {
    const csvContent = toStudentsCsv(students);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");

    link.href = url;
    link.download = `students-current-view-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!authUser || authUser.role !== "superadmin") {
    return <div className="p-4 text-sm text-red-600">Access Restricted</div>;
  }

  if (loading) {
    return <div className="p-4 text-sm text-zinc-600">Loading students...</div>;
  }

  return (
    <div className="h-full p-2">
      <h1 className="text-zinc-700 text-lg font-bold mb-2">
        Student Management
      </h1>
      <p className="text-xs text-zinc-500 mb-2">
        Student details are read-only in this view.
      </p>
      {error ? <p className="text-sm text-red-600 mb-2">{error}</p> : null}
      {message ? (
        <p className="text-sm text-green-600 mb-2">{message}</p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-3">
        <input
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setYearFilter("all");
          }}
          placeholder="Search name/email/branch"
          className="border border-gray-300 rounded px-3 py-2 text-sm md:col-span-2"
        />

        <select
          value={branchFilter}
          onChange={(event) => {
            setBranchFilter(event.target.value);
            setYearFilter("all");
          }}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="all">All Branches</option>
          {BRANCH_OPTIONS.map((branch) => (
            <option key={branch.value} value={branch.value}>
              {branch.label}
            </option>
          ))}
        </select>

        <select
          value={programFilter}
          onChange={(event) => {
            setProgramFilter(event.target.value);
            setYearFilter("all");
          }}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="all">All Programs</option>
          {PROGRAM_OPTIONS.map((program) => (
            <option key={program.value} value={program.value}>
              {program.label}
            </option>
          ))}
        </select>

        <input
          value={minCgpa}
          onChange={(event) => {
            setMinCgpa(event.target.value);
            setYearFilter("all");
          }}
          placeholder="Min CGPA"
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        />

        <input
          value={maxCgpa}
          onChange={(event) => {
            setMaxCgpa(event.target.value);
            setYearFilter("all");
          }}
          placeholder="Max CGPA"
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        />

        <input
          value={minClass12}
          onChange={(event) => {
            setMinClass12(event.target.value);
            setYearFilter("all");
          }}
          placeholder="Min Class XII %"
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        />

        <input
          value={maxClass12}
          onChange={(event) => {
            setMaxClass12(event.target.value);
            setYearFilter("all");
          }}
          placeholder="Max Class XII %"
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-xs text-zinc-500">
          {students.length} students in current view
        </p>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={students.length === 0}
          className="px-3 py-2 text-xs rounded bg-zinc-800 text-white disabled:opacity-60"
        >
          Export Current View CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={() => setYearFilter("all")}
          className={`px-3 py-1 text-xs rounded-full border ${
            yearFilter === "all"
              ? "bg-zinc-800 text-white border-zinc-800"
              : "bg-white text-zinc-700 border-zinc-300"
          }`}
        >
          All Years
        </button>
        {yearTabs.map((tab) => (
          <button
            key={String(tab.year)}
            type="button"
            onClick={() => setYearFilter(String(tab.year))}
            className={`px-3 py-1 text-xs rounded-full border ${
              yearFilter === String(tab.year)
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-zinc-700 border-zinc-300"
            }`}
          >
            Year {tab.year} ({tab.count})
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl h-[68vh] overflow-auto">
        {students.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">
            No students found for the selected filters.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="text-left p-3">Student</th>
                <th className="text-left p-3">Branch</th>
                <th className="text-left p-3">Program</th>
                <th className="text-left p-3">Year</th>
                <th className="text-left p-3">CGPA</th>
                <th className="text-left p-3">Class XII %</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                return (
                  <tr key={student.id} className="border-t border-gray-200">
                    <td className="p-3">
                      <p className="font-medium text-zinc-700">
                        {student.name}
                      </p>
                      <p className="text-xs text-zinc-500">{student.email}</p>
                    </td>
                    <td className="p-3">
                      <span className="text-zinc-600">
                        {student.branchLabel}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-zinc-600 uppercase">
                        {student.program || "-"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-zinc-600">
                        {student.year ? `Year ${student.year}` : "-"}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-600">
                      {student.cgpa !== null && student.cgpa !== undefined
                        ? student.cgpa.toFixed(2)
                        : "-"}
                    </td>
                    <td className="p-3 text-zinc-600">
                      {student.class12Percentage !== null &&
                      student.class12Percentage !== undefined
                        ? student.class12Percentage.toFixed(2)
                        : "-"}
                    </td>
                    <td className="p-3">
                      {student.isDismissed ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                          Dismissed
                        </span>
                      ) : student.isBanned ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
                          Banned
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {student.isBanned ? (
                          <button
                            type="button"
                            onClick={() => handleBanToggle(student, false)}
                            disabled={updatingStudentId === student.id}
                            className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 disabled:opacity-60"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleBanToggle(student, true)}
                            disabled={updatingStudentId === student.id}
                            className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 disabled:opacity-60"
                          >
                            Ban
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDismiss(student)}
                          disabled={
                            updatingStudentId === student.id ||
                            student.isDismissed
                          }
                          className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700 disabled:opacity-60"
                        >
                          Dismiss
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
