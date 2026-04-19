"use server";

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { isStudentEligibleForJob } from "@/lib/jobEligibility";
import Job from "@/models/Job";
import Profile from "@/models/Profile";
import User from "@/models/User";
import Application from "@/models/Application";

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeRole(value) {
  return normalizeText(value).toLowerCase();
}

function mapJob(job) {
  return {
    id: String(job._id),
    title: job.title || "",
    company: job.company || "",
    location: job.location || "",
    packageCtc: job.packageCtc || "",
    description: job.description || "",
    eligibility: {
      departments: job.eligibility?.departments || [],
      minCgpa: job.eligibility?.minCgpa ?? null,
      minClass12Percentage: job.eligibility?.minClass12Percentage ?? null,
      minSemester: job.eligibility?.minSemester ?? null,
      maxSemester: job.eligibility?.maxSemester ?? null,
    },
    createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
  };
}

export async function getEligibleJobsForStudentAction(userId) {
  const normalizedUserId = normalizeText(userId);
  if (!mongoose.Types.ObjectId.isValid(normalizedUserId)) {
    return { success: false, error: "Invalid user" };
  }

  await connectToDatabase();

  const student = await User.findById(normalizedUserId).lean();
  if (!student || normalizeRole(student.role) !== "student") {
    return { success: false, error: "Unauthorized" };
  }

  const profile = await Profile.findOne({ userId: normalizedUserId }).lean();
  if (!profile) {
    return {
      success: true,
      data: [],
      message: "Complete your profile to see matching jobs.",
    };
  }

  const jobs = await Job.find({ active: true }).sort({ createdAt: -1 }).lean();
  const eligibleJobs = jobs.filter((job) =>
    isStudentEligibleForJob(job, profile),
  );

  // Fetch applications to mark which jobs the student has already applied for
  const applications = await Application.find({
    studentId: normalizedUserId,
  }).lean();
  const appliedJobIds = new Set(applications.map((app) => String(app.jobId)));

  const mappedJobs = eligibleJobs.map((job) => ({
    ...mapJob(job),
    hasApplied: appliedJobIds.has(String(job._id)),
  }));

  return { success: true, data: mappedJobs };
}

export async function applyToJobAction(userId, jobId) {
  const normalizedUserId = normalizeText(userId);
  const normalizedJobId = normalizeText(jobId);

  if (
    !mongoose.Types.ObjectId.isValid(normalizedUserId) ||
    !mongoose.Types.ObjectId.isValid(normalizedJobId)
  ) {
    return { success: false, error: "Invalid user or job id" };
  }

  await connectToDatabase();

  const student = await User.findById(normalizedUserId).lean();
  if (!student || normalizeRole(student.role) !== "student") {
    return { success: false, error: "Unauthorized" };
  }

  const job = await Job.findById(normalizedJobId).lean();
  if (!job || !job.active) {
    return { success: false, error: "Job is not available" };
  }

  const existingApp = await Application.findOne({
    studentId: normalizedUserId,
    jobId: normalizedJobId,
  }).lean();
  if (existingApp) {
    return { success: false, error: "You have already applied for this job" };
  }

  try {
    await Application.create({
      studentId: normalizedUserId,
      jobId: normalizedJobId,
      status: "applied",
    });
    return { success: true };
  } catch (error) {
    console.error("Error applying to job:", error);
    return { success: false, error: "Application failed" };
  }
}
