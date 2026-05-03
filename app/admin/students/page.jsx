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
    <div className="min-h-[82vh] p-2 sm:p-3 md:p-4 bg-gray-50">
      <h1 className="text-sm sm:text-base md:text-lg font-bold text-zinc-800 mb-1 sm:mb-2">
        Department Student Directory
      </h1>
      <p className="text-xs sm:text-sm text-zinc-500 mb-1 sm:mb-2">
        Student details are view-only here, but admins can verify profiles.
      </p>
      <p className="text-xs sm:text-sm text-zinc-600 mb-3 sm:mb-4">
        {departmentLabel
          ? `Assigned Department: ${departmentLabel}`
          : "Department is not assigned"}
      </p>

      {error ? (
        <p className="text-xs sm:text-sm text-red-600 mb-2">{error}</p>
      ) : null}

      {/* Mobile Filters */}
      <div className="md:hidden space-y-2 mb-3 sm:mb-4">
        <input
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setYearFilter("all");
          }}
          placeholder="Search name/email"
          className="w-full border border-gray-300 rounded px-3 py-2 text-xs sm:text-sm"
        />

        <div className="grid grid-cols-2 gap-2">
          <select
            value={programFilter}
            onChange={(event) => {
              setProgramFilter(event.target.value);
              setYearFilter("all");
            }}
            className="border border-gray-300 rounded px-2 sm:px-3 py-2 text-xs sm:text-sm"
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
            className="border border-gray-300 rounded px-2 sm:px-3 py-2 text-xs sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            value={maxCgpa}
            onChange={(event) => {
              setMaxCgpa(event.target.value);
              setYearFilter("all");
            }}
            placeholder="Max CGPA"
            className="border border-gray-300 rounded px-2 sm:px-3 py-2 text-xs sm:text-sm"
          />

          <input
            value={minClass12}
            onChange={(event) => {
              setMinClass12(event.target.value);
              setYearFilter("all");
            }}
            placeholder="Min Class XII %"
            className="border border-gray-300 rounded px-2 sm:px-3 py-2 text-xs sm:text-sm"
          />
        </div>

        <input
          value={maxClass12}
          onChange={(event) => {
            setMaxClass12(event.target.value);
            setYearFilter("all");
          }}
          placeholder="Max Class XII %"
          className="w-full border border-gray-300 rounded px-2 sm:px-3 py-2 text-xs sm:text-sm"
        />
      </div>

      {/* Desktop Filters */}
      <div className="hidden md:grid md:grid-cols-6 gap-2 mb-3">
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

      {/* Year Tabs */}
      <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => setYearFilter("all")}
          className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full border whitespace-nowrap transition-colors ${
            yearFilter === "all"
              ? "bg-zinc-800 text-white border-zinc-800"
              : "bg-white text-zinc-700 border-zinc-300 hover:bg-gray-50"
          }`}
        >
          All Years
        </button>
        {yearTabs.map((tab) => (
          <button
            key={String(tab.year)}
            type="button"
            onClick={() => setYearFilter(String(tab.year))}
            className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full border whitespace-nowrap transition-colors ${
              yearFilter === String(tab.year)
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-zinc-700 border-zinc-300 hover:bg-gray-50"
            }`}
          >
            Year {tab.year} ({tab.count})
          </button>
        ))}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-2 sm:space-y-3">
        {loading ? (
          <p className="p-4 text-xs sm:text-sm text-zinc-600 bg-white rounded-lg">
            Loading students...
          </p>
        ) : students.length === 0 ? (
          <p className="p-4 text-xs sm:text-sm text-zinc-500 bg-white rounded-lg">
            No students found for the selected filters.
          </p>
        ) : (
          students.map((student) => (
            <div
              key={student.id}
              className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3"
            >
              <div>
                <p className="text-xs text-gray-500">Student</p>
                <p className="text-xs sm:text-sm font-semibold text-zinc-800">
                  {student.name}
                </p>
                <p className="text-xs text-zinc-600">{student.email}</p>
                <p className="text-xs text-zinc-600">
                  {student.phone || "No phone"}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-500">Program</p>
                  <p className="text-xs sm:text-sm font-medium text-zinc-800 uppercase">
                    {student.program || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">CGPA</p>
                  <p className="text-xs sm:text-sm font-medium text-zinc-800">
                    {student.cgpa !== null && student.cgpa !== undefined
                      ? student.cgpa.toFixed(2)
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Year</p>
                  <p className="text-xs sm:text-sm font-medium text-zinc-800">
                    {student.year ? `Yr ${student.year}` : "-"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs sm:text-sm">
                <div>
                  <p className="text-xs text-gray-500">Class XII %</p>
                  <p className="font-medium text-zinc-800">
                    {student.class12Percentage !== null &&
                    student.class12Percentage !== undefined
                      ? student.class12Percentage.toFixed(2)
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Semester</p>
                  <p className="font-medium text-zinc-800">
                    {student.currentSemester !== null &&
                    student.currentSemester !== undefined
                      ? student.currentSemester
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                {student.isDismissed ? (
                  <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700 font-semibold">
                    Dismissed
                  </span>
                ) : student.isBanned ? (
                  <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 font-semibold">
                    Banned
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 font-semibold">
                    Active
                  </span>
                )}

                {student.isProfileVerified ? (
                  <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 font-semibold">
                    Verified
                  </span>
                ) : (
                  <>
                    <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700 font-semibold">
                      Not Verified
                    </span>
                    <button
                      type="button"
                      onClick={() => handleVerifyStudent(student.id)}
                      className="px-2 py-1 rounded-full text-xs bg-zinc-800 text-white font-semibold hover:bg-zinc-700 transition-colors"
                    >
                      Verify
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh]">
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
                  <tr
                    key={student.id}
                    className="border-t border-gray-200 hover:bg-gray-50"
                  >
                    <td className="p-3">
                      <p className="font-medium text-zinc-700">
                        {student.name}
                      </p>
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
                          <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700 inline-flex w-fit font-semibold">
                            Dismissed
                          </span>
                        ) : student.isBanned ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 inline-flex w-fit font-semibold">
                            Banned
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 inline-flex w-fit font-semibold">
                            Active
                          </span>
                        )}

                        {student.isProfileVerified ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 inline-flex w-fit font-semibold">
                            Verified
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700 inline-flex w-fit font-semibold">
                              Not Verified
                            </span>
                            <button
                              type="button"
                              onClick={() => handleVerifyStudent(student.id)}
                              className="px-2 py-1 rounded-full text-xs bg-zinc-800 text-white inline-flex w-fit hover:bg-zinc-700 font-semibold transition-colors"
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
    </div>
  );
}
