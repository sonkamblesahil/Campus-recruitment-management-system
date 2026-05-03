"use client";

import { PROGRAM_OPTIONS } from "@/lib/academics";
import { isAdminRole } from "@/lib/authRoles";
import { useEffect, useState } from "react";
import {
  getAdminDepartmentStudentsAction,
  verifyStudentProfileAction,
} from "./actions";

export default function AdminDepartmentStudentsPage() {
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
  const [departmentLabel, setDepartmentLabel] = useState("");
  const [loading, setLoading] = useState(() =>
    Boolean(authUser?.userId && isAdminRole(authUser?.role || "")),
  );
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [minCgpa, setMinCgpa] = useState("");
  const [maxCgpa, setMaxCgpa] = useState("");
  const [minClass12, setMinClass12] = useState("");
  const [maxClass12, setMaxClass12] = useState("");

  const handleVerifyStudent = async (studentId) => {
    if (!authUser?.userId) {
      setError("Unauthorized");
      return;
    }

    setError("");
    const result = await verifyStudentProfileAction(authUser.userId, studentId);

    if (!result?.success) {
      setError(result?.error || "Failed to verify student profile");
      return;
    }

    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? {
              ...student,
              isProfileVerified: true,
              profileVerifiedAt: new Date().toISOString(),
            }
          : student,
      ),
    );
  };

  useEffect(() => {
    if (!authUser?.userId || !isAdminRole(authUser.role || "")) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError("");

        const result = await getAdminDepartmentStudentsAction(authUser.userId, {
          search: searchTerm,
          program: programFilter,
          year: yearFilter,
          minCgpa,
          maxCgpa,
          minClass12Percentage: minClass12,
          maxClass12Percentage: maxClass12,
        });

        if (!result?.success) {
          setError(result?.error || "Failed to load department students");
          setStudents([]);
          setYearTabs([]);
          setDepartmentLabel("");
        } else {
          setStudents(result.data?.students || []);
          setYearTabs(result.data?.yearTabs || []);
          setDepartmentLabel(result.data?.departmentLabel || "");
        }

        setLoading(false);
      })();
    }, 120);

    return () => clearTimeout(timeoutId);
  }, [
    authUser?.role,
    authUser?.userId,
    maxCgpa,
    maxClass12,
    minCgpa,
    minClass12,
    programFilter,
    searchTerm,
    yearFilter,
  ]);

  if (!authUser || !isAdminRole(authUser.role || "")) {
    return <div className="p-4 text-sm text-red-600">Unauthorized</div>;
  }

  return (
    <div className="h-full p-2">
      <h1 className="text-zinc-700 text-lg font-bold mb-1">
        Department Student Directory
      </h1>
      <p className="text-xs text-zinc-500 mb-1">
        Student details are view-only here, but admins can verify profiles.
      </p>
      <p className="text-xs text-zinc-600 mb-3">
        {departmentLabel
          ? `Assigned Department: ${departmentLabel}`
          : "Department is not assigned"}
      </p>

      {error ? <p className="text-sm text-red-600 mb-2">{error}</p> : null}

      <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-3">
        <input
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setYearFilter("all");
          }}
          placeholder="Search name/email"
          className="border border-gray-300 rounded px-3 py-2 text-sm md:col-span-2"
        />

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

      <div className="bg-white border border-gray-200 rounded-xl h-[70vh] overflow-auto">
        {loading ? (
          <p className="p-4 text-sm text-zinc-600">Loading students...</p>
        ) : students.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">
            No students found for the selected filters.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="text-left p-3">Student</th>
                <th className="text-left p-3">Program / Year</th>
                <th className="text-left p-3">CGPA</th>
                <th className="text-left p-3">Class XII %</th>
                <th className="text-left p-3">Semester</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-t border-gray-200">
                  <td className="p-3">
                    <p className="font-medium text-zinc-700">{student.name}</p>
                    <p className="text-xs text-zinc-500">{student.email}</p>
                    <p className="text-xs text-zinc-500">
                      {student.phone || "No phone"}
                    </p>
                  </td>
                  <td className="p-3 text-zinc-600 uppercase">
                    {student.program || "-"} /{" "}
                    {student.year ? `Year ${student.year}` : "-"}
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
                  <td className="p-3 text-zinc-600">
                    {student.currentSemester !== null &&
                    student.currentSemester !== undefined
                      ? student.currentSemester
                      : "-"}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      {student.isDismissed ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700 inline-flex w-fit">
                          Dismissed
                        </span>
                      ) : student.isBanned ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 inline-flex w-fit">
                          Banned
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 inline-flex w-fit">
                          Active
                        </span>
                      )}

                      {student.isProfileVerified ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 inline-flex w-fit">
                          Verified
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700 inline-flex w-fit">
                            Not Verified
                          </span>
                          <button
                            type="button"
                            onClick={() => handleVerifyStudent(student.id)}
                            className="px-2 py-1 rounded-full text-xs bg-zinc-800 text-white inline-flex w-fit hover:bg-zinc-700"
                          >
                            Verify Profile
                          </button>
                        </div>
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
  );
}
