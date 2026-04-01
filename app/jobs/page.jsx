"use client";

import { useEffect, useState } from "react";
import { getEligibleJobsForStudentAction } from "./actions";

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
    <div className="h-full p-2 rounded-2xl">
      <h1 className="text-zinc-600 text-base font-bold">Eligible Jobs</h1>
      {message ? <p className="text-xs text-zinc-500 mt-1">{message}</p> : null}

      <div className="h-[82vh] rounded-2xl flex bg-gray-200 mt-2 gap-2">
        {/* ================= LEFT: JOB LIST ================= */}
        <div className="w-1/3 bg-white rounded-2xl p-2 overflow-y-auto">
          <h2 className="text-zinc-600 text-sm font-bold mb-2">Job Openings</h2>

          {jobs.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No jobs match your profile right now.
            </p>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`p-3 rounded-lg cursor-pointer border transition ${
                    selectedJob?.id === job.id
                      ? "bg-blue-50 border-blue-400"
                      : "bg-gray-100 border-transparent hover:bg-gray-200"
                  }`}
                >
                  <p className="font-semibold text-sm text-zinc-700">
                    {job.company}
                  </p>
                  <p className="text-xs text-zinc-500">{job.title}</p>
                  <p className="text-xs text-zinc-500">
                    Package: {job.packageCtc}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= RIGHT: JOB DETAILS ================= */}
        <div className="w-2/3 bg-white rounded-2xl p-4 flex flex-col">
          {!selectedJob ? (
            <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
              Select a job to view full details
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-zinc-700">
                    {selectedJob.title}
                  </h2>
                  <p className="text-sm text-zinc-600">
                    {selectedJob.company} • {selectedJob.location}
                  </p>
                  <p className="text-sm text-zinc-600">
                    Package: {selectedJob.packageCtc}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-zinc-700">
                    Job Description
                  </h3>
                  <p className="text-sm text-zinc-600">
                    {selectedJob.description}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-zinc-700">Eligibility</h3>
                  <p className="text-sm text-zinc-600">
                    Departments:{" "}
                    {selectedJob.eligibility?.departments?.join(", ") || "Any"}
                  </p>
                  <p className="text-sm text-zinc-600">
                    Min CGPA: {selectedJob.eligibility?.minCgpa ?? "N/A"}
                  </p>
                  <p className="text-sm text-zinc-600">
                    Min 12th %:{" "}
                    {selectedJob.eligibility?.minClass12Percentage ?? "N/A"}
                  </p>
                  <p className="text-sm text-zinc-600">
                    Semester Range:{" "}
                    {selectedJob.eligibility?.minSemester ?? "N/A"} -{" "}
                    {selectedJob.eligibility?.maxSemester ?? "N/A"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                  Apply
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const config = {
  amp: false,
};
