import { demoJobs } from "./sampleData.js";

export const jobs = demoJobs.map((job, index) => ({
  id: index + 1,
  company: job.company,
  role: job.title,
  location: job.location,
  package: job.packageCtc,
  applicants: job.applicantCount,
  eligibility: `CGPA >= ${job.eligibility.minCgpa.toFixed(1)}`,
  description: job.description,
  hiringProcess: job.hiringProcess,
  companyDetails: job.companyDetails,
  tpoContact: job.tpoContact,
}));
