"use server";

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import {
  getStudentAttributes,
  isStudentEligibleForJob,
} from "@/lib/jobEligibility";
import Job from "@/models/Job";
import Profile from "@/models/Profile";
import User from "@/models/User";

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeRole(value) {
  return normalizeText(value).toLowerCase();
}

function toNumber(value) {
  const raw = normalizeText(value).replace(/,/g, "");
  if (!raw) {
    return null;
  }

  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDepartments(value) {
  return normalizeText(value)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

async function requireJobManager(userId) {
  const normalizedUserId = normalizeText(userId);
  if (!mongoose.Types.ObjectId.isValid(normalizedUserId)) {
    return { success: false, error: "Invalid user" };
  }

  const user = await User.findById(normalizedUserId).lean();
  if (!user || !["admin", "recruiter"].includes(normalizeRole(user.role))) {
    return { success: false, error: "Unauthorized" };
  }

  return { success: true, userId: normalizedUserId, user };
}

function buildJobPayload(payload) {
  return {
    title: normalizeText(payload?.title),
    company: normalizeText(payload?.company),
    location: normalizeText(payload?.location),
    packageCtc: normalizeText(payload?.packageCtc),
    description: normalizeText(payload?.description),
    eligibility: {
      departments: normalizeDepartments(payload?.departments),
      minCgpa: toNumber(payload?.minCgpa),
      minClass12Percentage: toNumber(payload?.minClass12Percentage),
      minSemester: toNumber(payload?.minSemester),
      maxSemester: toNumber(payload?.maxSemester),
    },
  };
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
    active: Boolean(job.active),
    createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
  };
}

export async function createJobAction(adminId, payload) {
  await connectToDatabase();

  const adminResult = await requireJobManager(adminId);
  if (!adminResult.success) {
    return adminResult;
  }

  const jobPayload = buildJobPayload(payload);

  if (!jobPayload.title || !jobPayload.company) {
    return { success: false, error: "Job title and company are required" };
  }

  const created = await Job.create({
    ...jobPayload,
    createdBy: adminResult.userId,
  });

  return { success: true, data: mapJob(created.toObject()) };
}

export async function updateJobAction(adminId, jobId, payload) {
  await connectToDatabase();

  const adminResult = await requireJobManager(adminId);
  if (!adminResult.success) {
    return adminResult;
  }

  const normalizedJobId = normalizeText(jobId);
  if (!mongoose.Types.ObjectId.isValid(normalizedJobId)) {
    return { success: false, error: "Invalid job" };
  }

  const existingJob = await Job.findById(normalizedJobId);
  if (!existingJob) {
    return { success: false, error: "Job not found" };
  }

  if (String(existingJob.createdBy) !== adminResult.userId) {
    return { success: false, error: "You can only update your own jobs" };
  }

  const jobPayload = buildJobPayload(payload);
  if (!jobPayload.title || !jobPayload.company) {
    return { success: false, error: "Job title and company are required" };
  }

  existingJob.title = jobPayload.title;
  existingJob.company = jobPayload.company;
  existingJob.location = jobPayload.location;
  existingJob.packageCtc = jobPayload.packageCtc;
  existingJob.description = jobPayload.description;
  existingJob.eligibility = jobPayload.eligibility;
  await existingJob.save();

  return { success: true, data: mapJob(existingJob.toObject()) };
}

export async function getAdminJobsAction(adminId) {
  await connectToDatabase();

  const adminResult = await requireJobManager(adminId);
  if (!adminResult.success) {
    return adminResult;
  }

  const jobs = await Job.find({ createdBy: adminResult.userId })
    .sort({ createdAt: -1 })
    .lean();

  return { success: true, data: jobs.map(mapJob) };
}

export async function getEligibleStudentsForJobAction(adminId, jobId) {
  await connectToDatabase();

  const adminResult = await requireJobManager(adminId);
  if (!adminResult.success) {
    return adminResult;
  }

  const normalizedJobId = normalizeText(jobId);
  if (!mongoose.Types.ObjectId.isValid(normalizedJobId)) {
    return { success: false, error: "Invalid job" };
  }

  const job = await Job.findById(normalizedJobId).lean();
  if (!job) {
    return { success: false, error: "Job not found" };
  }

  if (String(job.createdBy) !== adminResult.userId) {
    return { success: false, error: "Unauthorized" };
  }

  const students = await User.find({ role: { $regex: /^student$/i } }).lean();
  const studentIds = students.map((student) => student._id);
  const profiles = await Profile.find({ userId: { $in: studentIds } }).lean();
  const profileMap = new Map(
    profiles.map((profile) => [String(profile.userId), profile]),
  );

  const eligible = students
    .map((student) => {
      const profile = profileMap.get(String(student._id));
      if (!profile || !isStudentEligibleForJob(job, profile)) {
        return null;
      }

      const attributes = getStudentAttributes(profile, student);
      return {
        userId: String(student._id),
        name: attributes.name,
        email: attributes.email,
        mobileNo: attributes.phone,
        dept: attributes.department,
        cgpa: attributes.cgpa,
        year: attributes.year,
        address: attributes.address,
      };
    })
    .filter(Boolean);

  return { success: true, data: eligible };
}
