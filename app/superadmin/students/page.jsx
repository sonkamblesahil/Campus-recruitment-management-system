"use client";

import {
  BRANCH_OPTIONS,
  PROGRAM_OPTIONS,
  getAllowedYears,
} from "@/lib/academics";
import { useEffect, useMemo, useState } from "react";
import {
  banStudentAction,
  dismissUserAction,
  getStudentManagementAction,
  unbanStudentAction,
  updateStudentAcademicAction,
} from "../actions";

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
  const [loading, setLoading] = useState(() => Boolean(authUser?.userId));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [activeEditStudentId, setActiveEditStudentId] = useState("");
  const [editPayload, setEditPayload] = useState({
    branch: "",
    program: "btech",
    year: "1",
  });
  const [updatingStudentId, setUpdatingStudentId] = useState("");

  useEffect(() => {
    if (!authUser?.userId) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void (async () => {
        const result = await getStudentManagementAction(authUser.userId);
        if (!result?.success) {
          setError(result?.error || "Failed to load students");
        } else {
          setStudents(result.data.students || []);
        }
        setLoading(false);
      })();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [authUser?.userId]);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const searchMatch =
        normalizedSearch === "" ||
        String(student.name || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(student.email || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(student.branch || "")
          .toLowerCase()
          .includes(normalizedSearch);

      const branchMatch =
        branchFilter === "all" ||
        String(student.branch || "").toUpperCase() === branchFilter;

      return searchMatch && branchMatch;
    });
  }, [branchFilter, searchTerm, students]);

  const allowedYears = useMemo(
    () => getAllowedYears(editPayload.program),
    [editPayload.program],
  );

  const startEdit = (student) => {
    setActiveEditStudentId(student.id);
    setEditPayload({
      branch: student.branch || "",
      program: student.program || "btech",
      year: String(student.year || 1),
    });
    setError("");
    setMessage("");
  };

  const cancelEdit = () => {
    setActiveEditStudentId("");
  };

  const saveEdit = async () => {
    if (!authUser?.userId || !activeEditStudentId) return;

    setError("");
    setMessage("");
    setUpdatingStudentId(activeEditStudentId);

    const result = await updateStudentAcademicAction(
      authUser.userId,
      activeEditStudentId,
      {
        branch: editPayload.branch,
        program: editPayload.program,
        year: editPayload.year,
      },
    );

    if (!result?.success) {
      setError(result?.error || "Failed to update student academic details");
      setUpdatingStudentId("");
      return;
    }

    setStudents((prev) =>
      prev.map((student) =>
        student.id === activeEditStudentId ? result.data : student,
      ),
    );
    setMessage("Student academic details updated.");
    setUpdatingStudentId("");
    setActiveEditStudentId("");
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

    setStudents((prev) =>
      prev.map((item) => (item.id === student.id ? result.data : item)),
    );
    setMessage(shouldBan ? "Student banned." : "Student unbanned.");
    setUpdatingStudentId("");
  };

  const handleDismiss = async (student) => {
    if (!authUser?.userId || !student?.id) return;

    const reason =
      window.prompt(
        "Dismissal reason for this student:",
        student.dismissalReason || "",
      ) || "";

    setError("");
    setMessage("");
    setUpdatingStudentId(student.id);

    const result = await dismissUserAction(authUser.userId, student.id, reason);
    if (!result?.success) {
      setError(result?.error || "Could not dismiss student");
      setUpdatingStudentId("");
      return;
    }

    setStudents((prev) =>
      prev.map((item) => (item.id === student.id ? result.data : item)),
    );
    setMessage("Student dismissed.");
    setUpdatingStudentId("");
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
      {error ? <p className="text-sm text-red-600 mb-2">{error}</p> : null}
      {message ? (
        <p className="text-sm text-green-600 mb-2">{message}</p>
      ) : null}

      <div className="flex flex-wrap gap-2 mb-3">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search student by name/email/branch"
          className="border border-gray-300 rounded px-3 py-2 text-sm min-w-70"
        />
        <select
          value={branchFilter}
          onChange={(event) => setBranchFilter(event.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="all">All Branches</option>
          {BRANCH_OPTIONS.map((branch) => (
            <option key={branch.value} value={branch.value}>
              {branch.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl h-[72vh] overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="text-left p-3">Student</th>
              <th className="text-left p-3">Branch</th>
              <th className="text-left p-3">Program</th>
              <th className="text-left p-3">Year</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => {
              const isEditing = activeEditStudentId === student.id;

              return (
                <tr key={student.id} className="border-t border-gray-200">
                  <td className="p-3">
                    <p className="font-medium text-zinc-700">{student.name}</p>
                    <p className="text-xs text-zinc-500">{student.email}</p>
                  </td>
                  <td className="p-3">
                    {isEditing ? (
                      <select
                        value={editPayload.branch}
                        onChange={(event) =>
                          setEditPayload((prev) => ({
                            ...prev,
                            branch: event.target.value,
                          }))
                        }
                        className="border border-gray-300 rounded px-2 py-1"
                      >
                        {BRANCH_OPTIONS.map((branch) => (
                          <option key={branch.value} value={branch.value}>
                            {branch.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-zinc-600">
                        {student.branchLabel}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {isEditing ? (
                      <select
                        value={editPayload.program}
                        onChange={(event) =>
                          setEditPayload((prev) => ({
                            ...prev,
                            program: event.target.value,
                            year: "1",
                          }))
                        }
                        className="border border-gray-300 rounded px-2 py-1"
                      >
                        {PROGRAM_OPTIONS.map((program) => (
                          <option key={program.value} value={program.value}>
                            {program.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-zinc-600 uppercase">
                        {student.program || "-"}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {isEditing ? (
                      <select
                        value={editPayload.year}
                        onChange={(event) =>
                          setEditPayload((prev) => ({
                            ...prev,
                            year: event.target.value,
                          }))
                        }
                        className="border border-gray-300 rounded px-2 py-1"
                      >
                        {allowedYears.map((year) => (
                          <option key={String(year)} value={String(year)}>
                            Year {year}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-zinc-600">
                        {student.year ? `Year ${student.year}` : "-"}
                      </span>
                    )}
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
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={saveEdit}
                            disabled={updatingStudentId === student.id}
                            className="px-2 py-1 text-xs rounded bg-blue-600 text-white disabled:opacity-60"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-2 py-1 text-xs rounded bg-gray-200 text-zinc-700"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(student)}
                          className="px-2 py-1 text-xs rounded bg-indigo-100 text-indigo-700"
                        >
                          Edit Academic
                        </button>
                      )}

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
      </div>
    </div>
  );
}
