"use client";

import { useState } from "react";

const jobs = [
  {
    id: 1,
    company: "TCS",
    role: "Software Engineer",
    location: "Pune",
    package: "7 LPA",
    applicants: 124,
    eligibility: "CGPA ≥ 7.0",
    description:
      "Looking for Software Engineers with strong knowledge of DSA, OOPS, DBMS, and web technologies.",
    hiringProcess: [
      "Online Aptitude Test",
      "Technical Interview",
      "HR Interview",
    ],
    companyDetails:
      "Tata Consultancy Services is a global IT services, consulting, and business solutions organization.",
    tpoContact: {
      name: "Dr. R. Kulkarni",
      email: "tpo.tcs@sggs.ac.in",
      phone: "+91 98765 43210",
    },
  },
  {
    id: 2,
    company: "Infosys",
    role: "System Engineer",
    location: "Bangalore",
    package: "6.5 LPA",
    applicants: 98,
    eligibility: "CGPA ≥ 6.5",
    description:
      "System Engineer role involving application development, testing, deployment, and support.",
    hiringProcess: [
      "Online Assessment",
      "Technical Interview",
      "Managerial Round",
      "HR Discussion",
    ],
    companyDetails:
      "Infosys is a multinational IT company providing consulting, technology, and outsourcing services.",
    tpoContact: {
      name: "Prof. S. Patil",
      email: "tpo.infosys@sggs.ac.in",
      phone: "+91 91234 56789",
    },
  },
  {
    id: 3,
    company: "Deloitte",
    role: "Analyst",
    location: "Hyderabad",
    package: "8 LPA",
    applicants: 76,
    eligibility: "CGPA ≥ 7.5",
    description:
      "Analyst role focused on consulting, data analysis, and business strategy.",
    hiringProcess: [
      "Aptitude + Case Study",
      "Technical Interview",
      "Partner Interview",
    ],
    companyDetails:
      "Deloitte is a global professional services firm offering audit, consulting, and advisory services.",
    tpoContact: {
      name: "Dr. A. Deshmukh",
      email: "tpo.deloitte@sggs.ac.in",
      phone: "+91 99887 66554",
    },
  },
];

export default function JobListingPage() {
  const [selectedJob, setSelectedJob] = useState(null);

  return (
    <div className="h-full p-2 rounded-2xl">
      <h1 className="text-zinc-600 text-base font-bold">
        All Jobs
      </h1>

      <div className="h-[82vh] rounded-2xl flex bg-gray-200 mt-2 gap-2">

        {/* ================= LEFT: JOB LIST ================= */}
        <div className="w-1/3 bg-white rounded-2xl p-2 overflow-y-auto">
          <h2 className="text-zinc-600 text-sm font-bold mb-2">
            Job Openings
          </h2>

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
                <p className="text-xs text-zinc-500">
                  {job.role}
                </p>
                <p className="text-xs text-zinc-500">
                  Package: {job.package}
                </p>
                <p className="text-xs text-zinc-500">
                  Applicants: {job.applicants}
                </p>
              </div>
            ))}
          </div>
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
                    {selectedJob.role}
                  </h2>
                  <p className="text-sm text-zinc-600">
                    {selectedJob.company} • {selectedJob.location}
                  </p>
                  <p className="text-sm text-zinc-600">
                    Package: {selectedJob.package}
                  </p>
                  <p className="text-sm text-zinc-600">
                    Applicants: {selectedJob.applicants}
                  </p>
                  <p className="text-sm text-zinc-600">
                    Eligibility: {selectedJob.eligibility}
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
                  <h3 className="font-semibold text-zinc-700">
                    Hiring Process
                  </h3>
                  <ul className="list-disc ml-5 text-sm text-zinc-600">
                    {selectedJob.hiringProcess.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-zinc-700">
                    Company Details
                  </h3>
                  <p className="text-sm text-zinc-600">
                    {selectedJob.companyDetails}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-zinc-700">
                    TPO Contact
                  </h3>
                  <p className="text-sm text-zinc-600">
                    {selectedJob.tpoContact.name}
                  </p>
                  <p className="text-sm text-zinc-600">
                    {selectedJob.tpoContact.email}
                  </p>
                  <p className="text-sm text-zinc-600">
                    {selectedJob.tpoContact.phone}
                  </p>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                  Apply
                </button>
                <button className="bg-gray-300 text-zinc-700 px-4 py-2 rounded-lg text-sm">
                  Not Interested
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

/* ================= AMP DISABLED ================= */
export const config = {
  amp: false,
};
