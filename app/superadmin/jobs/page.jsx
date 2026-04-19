"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getSuperAdminJobsOverviewAction,
  getSuperAdminJobStudentsAction,
  updateSuperAdminJobAction,
  updateSuperAdminJobActiveStatusAction,
} from "../actions";

const emptySummary = {
  totalJobs: 0,
  activeJobs: 0,
  inactiveJobs: 0,
  totalApplications: 0,
  totalShortlisted: 0,
  totalSelected: 0,
  totalOffered: 0,
  totalAccepted: 0,
};

const emptyJobForm = {
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

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value || 0));
}

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

function escapeCsvValue(value) {
  const raw = String(value ?? "");
  if (raw.includes(",") || raw.includes("\n") || raw.includes('"')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function toApplicantsCsv(rows) {
  const header = [
    "Name",
    "Email",
    "Branch",
    "Program",
    "Year",
    "Application Status",
    "Offer Status",
    "Offered CTC",
    "Applied At",
    "Offer Issued At",
    "Accepted At",
  ];

  const lines = rows.map((item) => [
    item.name || "",
    item.email || "",
    item.branchLabel || item.branch || "",
    (item.program || "").toUpperCase(),
    item.year ?? "",
    item.applicationStatus || "",
    item.offerStatus || "",
    item.offeredCtc || "",
    formatDateTime(item.appliedAt),
    formatDateTime(item.offerIssuedAt),
    formatDateTime(item.acceptedAt),
  ]);

  return [header, ...lines]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\n");
}

function buildFormFromJob(job) {
  if (!job) {
    return emptyJobForm;
  }

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

function getApplicationBadgeClass(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "selected") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (normalized === "shortlisted") {
    return "bg-blue-100 text-blue-700";
  }
  if (normalized === "under-review") {
    return "bg-amber-100 text-amber-700";
  }
  if (normalized === "rejected") {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-zinc-100 text-zinc-700";
}

function getOfferBadgeClass(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "accepted") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (normalized === "pending") {
    return "bg-amber-100 text-amber-700";
  }
  if (normalized === "declined") {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-zinc-100 text-zinc-700";
}

export default function SuperAdminJobsPage() {
  const [authUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const rawUser = localStorage.getItem("auth_user");
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  });

  const [jobs, setJobs] = useState([]);
  const [branches, setBranches] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [loadingJobs, setLoadingJobs] = useState(() =>
    Boolean(authUser?.userId),
  );
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [searchFilter, setSearchFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");

  const [selectedJobId, setSelectedJobId] = useState("");
  const [jobForm, setJobForm] = useState(emptyJobForm);
  const selectedJobIdRef = useRef("");

  const [applicants, setApplicants] = useState([]);
  const [funnel, setFunnel] = useState({
    applied: 0,
    selected: 0,
    offered: 0,
    accepted: 0,
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) || null,
    [jobs, selectedJobId],
  );

  useEffect(() => {
    selectedJobIdRef.current = selectedJobId;
  }, [selectedJobId]);

  const loadApplicants = useCallback(
    async (jobId) => {
      if (!authUser?.userId || !jobId) {
        setApplicants([]);
        setFunnel({ applied: 0, selected: 0, offered: 0, accepted: 0 });
        return;
      }

      setLoadingApplicants(true);
      const result = await getSuperAdminJobStudentsAction(
        authUser.userId,
        jobId,
      );

      if (!result?.success) {
        setError(result?.error || "Failed to load applicants");
        setApplicants([]);
        setFunnel({ applied: 0, selected: 0, offered: 0, accepted: 0 });
        setLoadingApplicants(false);
        return;
      }

      setError("");
      setApplicants(result.data?.students || []);
      setFunnel(
        result.data?.funnel || {
          applied: 0,
          selected: 0,
          offered: 0,
          accepted: 0,
        },
      );
      setLoadingApplicants(false);
    },
    [authUser],
  );

  const loadJobs = useCallback(async () => {
    if (!authUser?.userId) {
      return;
    }

    setLoadingJobs(true);
    const result = await getSuperAdminJobsOverviewAction(authUser.userId, {
      search: searchFilter,
      branch: branchFilter,
      active: activeFilter,
    });

    if (!result?.success) {
      setError(result?.error || "Failed to load jobs overview");
      setJobs([]);
      setBranches([]);
      setSummary(emptySummary);
      setSelectedJobId("");
      setJobForm(emptyJobForm);
      setApplicants([]);
      setFunnel({ applied: 0, selected: 0, offered: 0, accepted: 0 });
      setLoadingJobs(false);
      return;
    }

    const nextJobs = result.data?.jobs || [];
    setError("");
    setJobs(nextJobs);
    setBranches(result.data?.branches || []);
    setSummary(result.data?.summary || emptySummary);

    const currentSelectedId = selectedJobIdRef.current;
    const nextSelectedId =
      currentSelectedId && nextJobs.some((job) => job.id === currentSelectedId)
        ? currentSelectedId
        : nextJobs[0]?.id || "";

    setSelectedJobId(nextSelectedId);
    const selectedForForm =
      nextJobs.find((job) => job.id === nextSelectedId) || null;
    setJobForm(buildFormFromJob(selectedForForm));
    setLoadingJobs(false);
    await loadApplicants(nextSelectedId);
  }, [activeFilter, authUser, branchFilter, loadApplicants, searchFilter]);

  useEffect(() => {
    if (!authUser?.userId) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void loadJobs();
    }, 140);

    return () => clearTimeout(timeoutId);
  }, [authUser?.userId, loadJobs]);

  const handleSaveJob = async (event) => {
    event.preventDefault();
    if (!authUser?.userId || !selectedJob?.id) {
      return;
    }

    setSavingJob(true);
    setError("");
    setMessage("");

    const result = await updateSuperAdminJobAction(
      authUser.userId,
      selectedJob.id,
      jobForm,
    );

    if (!result?.success) {
      setError(result?.error || "Could not update job details");
      setSavingJob(false);
      return;
    }

    setMessage("Job details updated successfully.");
    await loadJobs();
    await loadApplicants(selectedJob.id);
    setSavingJob(false);
  };

  const handleToggleJobStatus = async () => {
    if (!authUser?.userId || !selectedJob?.id) {
      return;
    }

    setUpdatingStatus(true);
    setError("");
    setMessage("");

    const nextActive = !selectedJob.active;
    const result = await updateSuperAdminJobActiveStatusAction(
      authUser.userId,
      selectedJob.id,
      nextActive,
    );

    if (!result?.success) {
      setError(result?.error || "Could not update job status");
      setUpdatingStatus(false);
      return;
    }

    setMessage(nextActive ? "Job activated." : "Job deactivated.");
    await loadJobs();
    await loadApplicants(selectedJob.id);
    setUpdatingStatus(false);
  };

  const handleExportApplicants = () => {
    const csv = toApplicantsCsv(applicants);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");

    link.href = url;
    link.download = `job-applicants-${selectedJob?.company || "job"}-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!authUser || authUser.role !== "superadmin") {
    return <div className="p-4 text-sm text-red-600">Access Restricted</div>;
  }

  if (loadingJobs) {
    return (
      <div className="p-4 text-sm text-zinc-600">
        Loading jobs intelligence...
      </div>
    );
  }

  return (
    <div className="h-full p-2">
      <h1 className="text-lg font-semibold text-zinc-800">Jobs Intelligence</h1>
      <p className="text-sm text-zinc-500 mt-1">
        View all posted jobs, track funnel counts, and edit job details.
      </p>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      {message ? (
        <p className="mt-2 text-sm text-green-600">{message}</p>
      ) : null}

      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        <div className="bg-white border border-zinc-200 rounded-lg px-2.5 py-2">
          <p className="text-[11px] text-zinc-500">Jobs</p>
          <p className="text-base font-semibold text-zinc-800">
            {formatNumber(summary.totalJobs)}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg px-2.5 py-2">
          <p className="text-[11px] text-zinc-500">Active</p>
          <p className="text-base font-semibold text-zinc-800">
            {formatNumber(summary.activeJobs)}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg px-2.5 py-2">
          <p className="text-[11px] text-zinc-500">Inactive</p>
          <p className="text-base font-semibold text-zinc-800">
            {formatNumber(summary.inactiveJobs)}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg px-2.5 py-2">
          <p className="text-[11px] text-zinc-500">Applications</p>
          <p className="text-base font-semibold text-zinc-800">
            {formatNumber(summary.totalApplications)}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg px-2.5 py-2">
          <p className="text-[11px] text-zinc-500">Shortlisted</p>
          <p className="text-base font-semibold text-zinc-800">
            {formatNumber(summary.totalShortlisted)}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg px-2.5 py-2">
          <p className="text-[11px] text-zinc-500">Selected</p>
          <p className="text-base font-semibold text-zinc-800">
            {formatNumber(summary.totalSelected)}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg px-2.5 py-2">
          <p className="text-[11px] text-zinc-500">Offered</p>
          <p className="text-base font-semibold text-zinc-800">
            {formatNumber(summary.totalOffered)}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg px-2.5 py-2">
          <p className="text-[11px] text-zinc-500">Accepted</p>
          <p className="text-base font-semibold text-zinc-800">
            {formatNumber(summary.totalAccepted)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3">
        <input
          value={searchFilter}
          onChange={(event) => setSearchFilter(event.target.value)}
          placeholder="Search title, company, poster"
          className="md:col-span-2 border border-gray-300 rounded px-2.5 py-2 text-sm"
        />

        <select
          value={branchFilter}
          onChange={(event) => setBranchFilter(event.target.value)}
          className="border border-gray-300 rounded px-2.5 py-2 text-sm"
        >
          <option value="all">All Departments</option>
          {branches.map((branch) => (
            <option key={branch.value} value={branch.value}>
              {branch.label}
            </option>
          ))}
        </select>

        <select
          value={activeFilter}
          onChange={(event) => setActiveFilter(event.target.value)}
          className="border border-gray-300 rounded px-2.5 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-2 mt-3 h-[74vh]">
        <section className="bg-white border border-gray-200 rounded-lg p-2 overflow-y-auto xl:col-span-2">
          <h2 className="text-sm font-semibold text-zinc-700 mb-2">
            Published Jobs
          </h2>

          {jobs.length === 0 ? (
            <p className="text-sm text-zinc-500">No jobs found.</p>
          ) : (
            <div className="space-y-1.5">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => {
                    setSelectedJobId(job.id);
                    setJobForm(buildFormFromJob(job));
                    void loadApplicants(job.id);
                  }}
                  className={`w-full text-left rounded border px-2.5 py-2 transition ${
                    selectedJobId === job.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-zinc-200 bg-white hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-800 truncate">
                      {job.title}
                    </p>
                    <span className="text-[10px] text-zinc-500">
                      {job.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 mt-0.5">{job.company}</p>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Applied {formatNumber(job.metrics.applications)} | Selected{" "}
                    {formatNumber(job.metrics.selected)} | Accepted{" "}
                    {formatNumber(job.metrics.accepted)}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1 truncate">
                    By {job.createdBy?.name || "Unknown"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white border border-gray-200 rounded-lg p-2 overflow-y-auto xl:col-span-3">
          {!selectedJob ? (
            <p className="text-sm text-zinc-500">
              Select a job to view details.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-800">
                    {selectedJob.title}
                  </h2>
                  <p className="text-xs text-zinc-600">{selectedJob.company}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Posted by {selectedJob.createdBy?.name || "Unknown"} (
                    {selectedJob.createdBy?.email || "-"})
                  </p>
                </div>

                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => void loadApplicants(selectedJob.id)}
                    disabled={loadingApplicants}
                    className="px-2.5 py-1.5 text-xs rounded bg-zinc-800 text-white disabled:opacity-60"
                  >
                    {loadingApplicants ? "Refreshing..." : "Refresh"}
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleJobStatus}
                    disabled={updatingStatus}
                    className="px-2.5 py-1.5 text-xs rounded bg-zinc-700 text-white disabled:opacity-60"
                  >
                    {updatingStatus
                      ? "Updating..."
                      : selectedJob.active
                        ? "Set Inactive"
                        : "Set Active"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 mb-3">
                <div className="border border-zinc-200 rounded px-2 py-1.5">
                  <p className="text-[11px] text-zinc-500">Applied</p>
                  <p className="text-sm font-semibold text-zinc-800">
                    {formatNumber(funnel.applied)}
                  </p>
                </div>
                <div className="border border-zinc-200 rounded px-2 py-1.5">
                  <p className="text-[11px] text-zinc-500">Selected</p>
                  <p className="text-sm font-semibold text-zinc-800">
                    {formatNumber(funnel.selected)}
                  </p>
                </div>
                <div className="border border-zinc-200 rounded px-2 py-1.5">
                  <p className="text-[11px] text-zinc-500">Offered</p>
                  <p className="text-sm font-semibold text-zinc-800">
                    {formatNumber(funnel.offered)}
                  </p>
                </div>
                <div className="border border-zinc-200 rounded px-2 py-1.5">
                  <p className="text-[11px] text-zinc-500">Accepted</p>
                  <p className="text-sm font-semibold text-zinc-800">
                    {formatNumber(funnel.accepted)}
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleSaveJob}
                className="grid grid-cols-1 md:grid-cols-2 gap-1.5 mb-3"
              >
                <input
                  placeholder="Job Title"
                  value={jobForm.title}
                  onChange={(event) =>
                    setJobForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  className="border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                  required
                />
                <input
                  placeholder="Company"
                  value={jobForm.company}
                  onChange={(event) =>
                    setJobForm((prev) => ({
                      ...prev,
                      company: event.target.value,
                    }))
                  }
                  className="border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                  required
                />
                <input
                  placeholder="Location"
                  value={jobForm.location}
                  onChange={(event) =>
                    setJobForm((prev) => ({
                      ...prev,
                      location: event.target.value,
                    }))
                  }
                  className="border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                />
                <input
                  placeholder="Package"
                  value={jobForm.packageCtc}
                  onChange={(event) =>
                    setJobForm((prev) => ({
                      ...prev,
                      packageCtc: event.target.value,
                    }))
                  }
                  className="border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                />
                <textarea
                  placeholder="Job Description"
                  value={jobForm.description}
                  onChange={(event) =>
                    setJobForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  className="md:col-span-2 border border-gray-300 rounded px-2.5 py-1.5 text-sm min-h-16"
                />
                <input
                  placeholder="Eligible Departments (CSE, IT, ECE)"
                  value={jobForm.departments}
                  onChange={(event) =>
                    setJobForm((prev) => ({
                      ...prev,
                      departments: event.target.value,
                    }))
                  }
                  className="md:col-span-2 border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                />
                <input
                  placeholder="Min CGPA"
                  value={jobForm.minCgpa}
                  onChange={(event) =>
                    setJobForm((prev) => ({
                      ...prev,
                      minCgpa: event.target.value,
                    }))
                  }
                  className="border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                />
                <input
                  placeholder="Min Class XII %"
                  value={jobForm.minClass12Percentage}
                  onChange={(event) =>
                    setJobForm((prev) => ({
                      ...prev,
                      minClass12Percentage: event.target.value,
                    }))
                  }
                  className="border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                />
                <input
                  placeholder="Min Semester"
                  value={jobForm.minSemester}
                  onChange={(event) =>
                    setJobForm((prev) => ({
                      ...prev,
                      minSemester: event.target.value,
                    }))
                  }
                  className="border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                />
                <input
                  placeholder="Max Semester"
                  value={jobForm.maxSemester}
                  onChange={(event) =>
                    setJobForm((prev) => ({
                      ...prev,
                      maxSemester: event.target.value,
                    }))
                  }
                  className="border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                />

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={savingJob}
                    className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white disabled:opacity-60"
                  >
                    {savingJob ? "Saving..." : "Save Job"}
                  </button>
                </div>
              </form>

              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <h3 className="text-sm font-semibold text-zinc-700">
                  Applicants
                </h3>
                <button
                  type="button"
                  onClick={handleExportApplicants}
                  disabled={applicants.length === 0}
                  className="px-2.5 py-1.5 text-xs rounded bg-zinc-800 text-white disabled:opacity-60"
                >
                  Export CSV
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg max-h-[38vh] overflow-auto">
                {loadingApplicants ? (
                  <p className="p-2 text-sm text-zinc-500">
                    Loading applicants...
                  </p>
                ) : applicants.length === 0 ? (
                  <p className="p-2 text-sm text-zinc-500">
                    No applicants found.
                  </p>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="text-left p-2">Student</th>
                        <th className="text-left p-2">Branch</th>
                        <th className="text-left p-2">Program/Year</th>
                        <th className="text-left p-2">Application</th>
                        <th className="text-left p-2">Offer</th>
                        <th className="text-left p-2">Dates</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applicants.map((student) => (
                        <tr
                          key={student.applicationId}
                          className="border-t border-gray-200 align-top"
                        >
                          <td className="p-2">
                            <p className="font-medium text-zinc-700">
                              {student.name}
                            </p>
                            <p className="text-[11px] text-zinc-500">
                              {student.email || "-"}
                            </p>
                          </td>
                          <td className="p-2 text-zinc-600">
                            {student.branchLabel}
                          </td>
                          <td className="p-2 text-zinc-600">
                            {(student.program || "-").toUpperCase()} /{" "}
                            {student.year || "-"}
                          </td>
                          <td className="p-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${getApplicationBadgeClass(student.applicationStatus)}`}
                            >
                              {student.applicationStatus || "-"}
                            </span>
                          </td>
                          <td className="p-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${getOfferBadgeClass(student.offerStatus)}`}
                            >
                              {student.offerStatus || "-"}
                            </span>
                            {student.offeredCtc ? (
                              <p className="text-[10px] text-zinc-500 mt-0.5">
                                CTC: {student.offeredCtc}
                              </p>
                            ) : null}
                          </td>
                          <td className="p-2 text-[10px] text-zinc-500">
                            <p>Applied: {formatDateTime(student.appliedAt)}</p>
                            <p>
                              Offer: {formatDateTime(student.offerIssuedAt)}
                            </p>
                            <p>
                              Accepted: {formatDateTime(student.acceptedAt)}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
