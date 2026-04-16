"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createJobAction,
  getAdminJobsAction,
  getEligibleStudentsForJobAction,
  updateJobAction,
} from "./actions";

const emptyForm = {
  title: "",
  company: "",
  location: "",
  packageCtc: "",
  description: "",
  departments: "",
  minCgpa: "",
  minClass12Percentage: "",
  minSemester: "",
  maxSemester: "",
};

function buildFormFromJob(job) {
  return {
    title: job.title || "",
    company: job.company || "",
    location: job.location || "",
    packageCtc: job.packageCtc || "",
    description: job.description || "",
    departments: (job.eligibility?.departments || []).join(", "),
    minCgpa:
      job.eligibility?.minCgpa === null ||
      job.eligibility?.minCgpa === undefined
        ? ""
        : String(job.eligibility.minCgpa),
    minClass12Percentage:
      job.eligibility?.minClass12Percentage === null ||
      job.eligibility?.minClass12Percentage === undefined
        ? ""
        : String(job.eligibility.minClass12Percentage),
    minSemester:
      job.eligibility?.minSemester === null ||
      job.eligibility?.minSemester === undefined
        ? ""
        : String(job.eligibility.minSemester),
    maxSemester:
      job.eligibility?.maxSemester === null ||
      job.eligibility?.maxSemester === undefined
        ? ""
        : String(job.eligibility.maxSemester),
  };
}

export default function AdminJobsPage() {
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
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) || null,
    [jobs, selectedJobId],
  );

  async function loadJobs(adminId) {
    setLoadingJobs(true);
    const result = await getAdminJobsAction(adminId);

    if (!result?.success) {
      setError(result?.error || "Failed to load jobs");
      setLoadingJobs(false);
      return;
    }

    setJobs(result.data || []);
    setLoadingJobs(false);
  }

  useEffect(() => {
    if (
      !authUser?.userId ||
      !["admin", "recruiter"].includes(authUser.role || "")
    ) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void loadJobs(authUser.userId);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [authUser?.role, authUser?.userId]);

  if (!authUser) {
    return <div className="p-4 text-sm text-zinc-600">Loading...</div>;
  }

  if (!["admin", "recruiter"].includes(authUser.role || "")) {
    return (
      <div className="p-4 text-sm text-red-600">
        You are not allowed to access this page.
      </div>
    );
  }

  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    const result = await createJobAction(authUser.userId, form);
    if (!result?.success) {
      setError(result?.error || "Failed to create job");
      setSaving(false);
      return;
    }

    setMessage("Job created successfully.");
    setForm(emptyForm);
    setSelectedJobId(result.data.id);
    await loadJobs(authUser.userId);
    setSaving(false);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!selectedJobId) {
      setError("Select a job to update");
      return;
    }

    setError("");
    setMessage("");
    setSaving(true);

    const result = await updateJobAction(authUser.userId, selectedJobId, form);
    if (!result?.success) {
      setError(result?.error || "Failed to update job");
      setSaving(false);
      return;
    }

    setMessage("Job updated successfully.");
    await loadJobs(authUser.userId);
    setSaving(false);
  };

  const handleLoadStudents = async () => {
    if (!selectedJobId) {
      setError("Select a job to fetch eligible students");
      return;
    }

    setLoadingStudents(true);
    setError("");
    setMessage("");

    const result = await getEligibleStudentsForJobAction(
      authUser.userId,
      selectedJobId,
    );

    if (!result?.success) {
      setError(result?.error || "Failed to fetch students");
      setLoadingStudents(false);
      return;
    }

    setStudents(result.data || []);
    setMessage(`Found ${result.data?.length || 0} eligible students.`);
    setLoadingStudents(false);
  };

  return (
    <div className="h-full p-3 rounded-2xl">
      <h1 className="text-zinc-700 text-lg font-bold">
        {authUser.role === "recruiter"
          ? "Recruiter Job Management"
          : "Admin Job Management"}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-[82vh] mt-3">
        <section className="bg-white rounded-2xl p-3 overflow-y-auto">
          <h2 className="text-sm font-semibold text-zinc-700 mb-2">
            Your Jobs
          </h2>

          {loadingJobs ? (
            <p className="text-sm text-zinc-500">Loading jobs...</p>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-zinc-500">No jobs created yet.</p>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => {
                    setSelectedJobId(job.id);
                    setForm(buildFormFromJob(job));
                    setStudents([]);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    selectedJobId === job.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <p className="text-sm font-semibold text-zinc-700">
                    {job.title}
                  </p>
                  <p className="text-xs text-zinc-500">{job.company}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl p-3 overflow-y-auto lg:col-span-2">
          <h2 className="text-sm font-semibold text-zinc-700 mb-2">
            {selectedJobId ? "Update Job" : "Create Job"}
          </h2>

          {error ? (
            <p className="mb-2 text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="mb-2 text-sm text-green-700 border border-green-200 bg-green-50 px-3 py-2 rounded-lg">
              {message}
            </p>
          ) : null}

          <form className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              placeholder="Job Title"
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
            <input
              placeholder="Company"
              value={form.company}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, company: event.target.value }))
              }
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
            <input
              placeholder="Location"
              value={form.location}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, location: event.target.value }))
              }
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Package (e.g. 10 LPA)"
              value={form.packageCtc}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, packageCtc: event.target.value }))
              }
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Job Description"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              className="md:col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-24"
            />

            <input
              placeholder="Eligible Departments (comma separated)"
              value={form.departments}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  departments: event.target.value,
                }))
              }
              className="md:col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Minimum CGPA"
              value={form.minCgpa}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, minCgpa: event.target.value }))
              }
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Minimum 12th %"
              value={form.minClass12Percentage}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  minClass12Percentage: event.target.value,
                }))
              }
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Minimum Semester"
              value={form.minSemester}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  minSemester: event.target.value,
                }))
              }
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Maximum Semester"
              value={form.maxSemester}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  maxSemester: event.target.value,
                }))
              }
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />

            <div className="md:col-span-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:bg-blue-300"
              >
                {saving ? "Saving..." : "Create Job"}
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={saving || !selectedJobId}
                className="bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm disabled:bg-zinc-400"
              >
                {saving ? "Saving..." : "Update Selected Job"}
              </button>
              <button
                type="button"
                onClick={handleLoadStudents}
                disabled={loadingStudents || !selectedJobId}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm disabled:bg-emerald-300"
              >
                {loadingStudents ? "Loading..." : "Get Eligible Students"}
              </button>
              <a
                href={
                  selectedJobId
                    ? `/api/admin/jobs/${selectedJobId}/eligible/export?adminId=${authUser.userId}`
                    : "#"
                }
                className={`px-4 py-2 rounded-lg text-sm ${
                  selectedJobId
                    ? "bg-amber-500 text-white"
                    : "bg-amber-200 text-amber-700 pointer-events-none"
                }`}
              >
                Download Excel
              </a>
            </div>
          </form>

          <div className="mt-4 border-t border-gray-200 pt-3">
            <h3 className="text-sm font-semibold text-zinc-700 mb-2">
              Eligible Students
            </h3>

            {students.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No students loaded yet. Select a job and click Get Eligible
                Students.
              </p>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 text-zinc-700">
                    <tr>
                      <th className="text-left px-3 py-2">Name</th>
                      <th className="text-left px-3 py-2">Email</th>
                      <th className="text-left px-3 py-2">Mobile</th>
                      <th className="text-left px-3 py-2">Dept</th>
                      <th className="text-left px-3 py-2">CGPA</th>
                      <th className="text-left px-3 py-2">Year</th>
                      <th className="text-left px-3 py-2">Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr
                        key={student.userId}
                        className="border-t border-gray-200"
                      >
                        <td className="px-3 py-2">{student.name}</td>
                        <td className="px-3 py-2">{student.email}</td>
                        <td className="px-3 py-2">{student.mobileNo}</td>
                        <td className="px-3 py-2">{student.dept}</td>
                        <td className="px-3 py-2">{student.cgpa ?? ""}</td>
                        <td className="px-3 py-2">{student.year}</td>
                        <td className="px-3 py-2">{student.address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
