"use client";

import { useEffect, useMemo, useState } from "react";
import { getEligibleJobsForStudentAction, applyToJobAction } from "./actions";

export default function JobListingPage() {
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
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [applying, setApplying] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [applicationFilter, setApplicationFilter] = useState("all");

  useEffect(() => {
    async function loadJobs() {
      if (!authUser?.userId || authUser?.role !== "student") {
        setLoading(false);
        return;
      }

      const result = await getEligibleJobsForStudentAction(authUser.userId);
      if (!result?.success) {
        setMessage(result?.error || "Unable to load jobs");
        setLoading(false);
        return;
      }

      setJobs(result.data || []);
      setSelectedJob(result.data?.[0] || null);
      setMessage(result.message || "");
      setLoading(false);
    }

    loadJobs();
  }, [authUser]);

  const handleApply = async () => {
    if (!authUser?.userId || !activeSelectedJob) return;

    setApplying(true);
    setMessage("");

    const result = await applyToJobAction(
      authUser.userId,
      activeSelectedJob.id,
    );
    if (result.success) {
      // Opt to reflect instantly locally instead of reloading everything
      setSelectedJob((prev) =>
        prev ? { ...prev, hasApplied: true } : activeSelectedJob,
      );
      setJobs((prevJobs) =>
        prevJobs.map((j) =>
          j.id === activeSelectedJob.id ? { ...j, hasApplied: true } : j,
        ),
      );
      setMessage("Application submitted successfully!");
    } else {
      setMessage(result.error || "Failed to apply.");
    }
    setApplying(false);
  };

  const filteredJobs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return jobs.filter((job) => {
      const filterMatch =
        applicationFilter === "all" ||
        (applicationFilter === "applied" && job.hasApplied) ||
        (applicationFilter === "not-applied" && !job.hasApplied);

      const searchMatch =
        normalizedSearch === "" ||
        String(job.title || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(job.company || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(job.location || "")
          .toLowerCase()
          .includes(normalizedSearch);

      return filterMatch && searchMatch;
    });
  }, [applicationFilter, jobs, searchTerm]);

  const activeSelectedJob =
    filteredJobs.find((job) => job.id === selectedJob?.id) ||
    filteredJobs[0] ||
    null;

  if (loading) {
    return <div className="p-4 text-sm text-zinc-600">Loading jobs...</div>;
  }

  if (!authUser || authUser.role !== "student") {
    return (
      <div className="p-4 text-sm text-red-600">
        Job listing is available only for students.
      </div>
    );
  }

  return (
    <div className="h-full p-2 sm:p-3 md:p-2 rounded-2xl">
      <h1 className="text-zinc-600 text-sm sm:text-base font-bold">
        Eligible Jobs
      </h1>
      {message ? <p className="text-xs text-zinc-500 mt-1">{message}</p> : null}

      <div className="min-h-[82vh] rounded-2xl flex flex-col lg:flex-row bg-gray-50 md:bg-gray-200 mt-2 gap-2">
        {/* ================= LEFT: JOB LIST ================= */}
        <div className="lg:w-1/3 bg-white rounded-2xl p-2 sm:p-3 overflow-y-auto min-h-64 lg:min-h-0">
          <h2 className="text-zinc-600 text-xs sm:text-sm font-bold mb-2">
            Job Openings
          </h2>

          <div className="space-y-2 mb-3">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search jobs..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm"
            />
            <select
              value={applicationFilter}
              onChange={(event) => setApplicationFilter(event.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm"
            >
              <option value="all">All Jobs</option>
              <option value="not-applied">Not Applied</option>
              <option value="applied">Applied</option>
            </select>
            <p className="text-xs text-zinc-500">
              Showing {filteredJobs.length} of {jobs.length}
            </p>
          </div>

          {filteredJobs.length === 0 ? (
            <p className="text-xs sm:text-sm text-zinc-500">No jobs found.</p>
          ) : (
            <div className="space-y-2">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`p-2 sm:p-3 rounded-lg cursor-pointer border transition ${
                    selectedJob?.id === job.id
                      ? "bg-blue-50 border-blue-400"
                      : "bg-gray-100 border-transparent hover:bg-gray-200"
                  }`}
                >
                  <p className="font-semibold text-xs sm:text-sm text-zinc-700 truncate">
                    {job.company}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">{job.title}</p>
                  <p className="text-xs text-zinc-500">{job.packageCtc}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= RIGHT: JOB DETAILS ================= */}
        <div className="lg:w-2/3 bg-white rounded-2xl p-3 sm:p-4 flex flex-col overflow-hidden">
          {!activeSelectedJob ? (
            <div className="flex-1 flex items-center justify-center text-zinc-400 text-xs sm:text-sm">
              Select a job to view details
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-2">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-zinc-700 line-clamp-2">
                    {activeSelectedJob.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-600 line-clamp-1">
                    {activeSelectedJob.company} • {activeSelectedJob.location}
                  </p>
                  <p className="text-xs sm:text-sm text-zinc-600">
                    Package: {activeSelectedJob.packageCtc}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-xs sm:text-sm text-zinc-700">
                    Job Description
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 line-clamp-3 sm:line-clamp-none">
                    {activeSelectedJob.description}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-xs sm:text-sm text-zinc-700">
                    Eligibility
                  </h3>
                  <div className="text-xs sm:text-sm text-zinc-600 space-y-1">
                    <p>
                      Departments:{" "}
                      {activeSelectedJob.eligibility?.departments?.join(", ") ||
                        "Any"}
                    </p>
                    <p>
                      Min CGPA:{" "}
                      {activeSelectedJob.eligibility?.minCgpa ?? "N/A"}
                    </p>
                    <p>
                      Min 12th %:{" "}
                      {activeSelectedJob.eligibility?.minClass12Percentage ??
                        "N/A"}
                    </p>
                    <p>
                      Semester:{" "}
                      {activeSelectedJob.eligibility?.minSemester ?? "N/A"} -{" "}
                      {activeSelectedJob.eligibility?.maxSemester ?? "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                <button
                  onClick={handleApply}
                  disabled={applying || activeSelectedJob.hasApplied}
                  className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm text-white font-medium transition-colors ${
                    activeSelectedJob.hasApplied
                      ? "bg-green-600 cursor-not-allowed"
                      : applying
                        ? "bg-blue-400 cursor-wait"
                        : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {activeSelectedJob.hasApplied
                    ? "✓ Applied"
                    : applying
                      ? "Applying..."
                      : "Apply"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
