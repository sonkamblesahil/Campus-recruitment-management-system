"use server";

import mongoose from "mongoose";
import { isAdminRole } from "@/lib/authRoles";
import { normalizeBranch } from "@/lib/academics";
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

function parseBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = normalizeText(value).toLowerCase();
  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return null;
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
    .map((part) => normalizeBranch(part))
    .filter(Boolean);
}

async function requireAdmin(userId) {
  const normalizedUserId = normalizeText(userId);
  if (!mongoose.Types.ObjectId.isValid(normalizedUserId)) {
    return { success: false, error: "Invalid user ID" };
  }

  const user = await User.findById(normalizedUserId).lean();
  if (!user || !isAdminRole(user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  return { success: true, userId: normalizedUserId, user };
}

function buildJobPayload(payload, adminUser) {
  const adminBranch = normalizeBranch(adminUser?.branch);
  const departments = adminBranch
    ? [adminBranch]
    : normalizeDepartments(payload?.departments);

  return {
    title: normalizeText(payload?.title),
    company: normalizeText(payload?.company),
    location: normalizeText(payload?.location),
    packageCtc: normalizeText(payload?.packageCtc),
    description: normalizeText(payload?.description),
    eligibility: {
      departments,
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

export async function createJobAction(userId, payload) {
  await connectToDatabase();

  const adminResult = await requireAdmin(userId);
  if (!adminResult.success) {
    return adminResult;
  }

  const jobPayload = buildJobPayload(payload, adminResult.user);

  if (!jobPayload.title || !jobPayload.company) {
    return { success: false, error: "Job title and company are required" };
  }

  const created = await Job.create({
    ...jobPayload,
    createdBy: adminResult.userId,
  });

  return { success: true, data: mapJob(created.toObject()) };
}

export async function updateJobAction(userId, jobId, payload) {
  await connectToDatabase();

  const adminResult = await requireAdmin(userId);
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

  const jobPayload = buildJobPayload(payload, adminResult.user);
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

export async function getAdminJobsAction(userId) {
  await connectToDatabase();

  const adminResult = await requireAdmin(userId);
  if (!adminResult.success) {
    return adminResult;
  }

  const jobs = await Job.find({ createdBy: adminResult.userId })
    .sort({ createdAt: -1 })
    .lean();

  return { success: true, data: jobs.map(mapJob) };
}

export async function getEligibleStudentsForJobAction(userId, jobId) {
  await connectToDatabase();

  const adminResult = await requireAdmin(userId);
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

  const adminBranch = normalizeBranch(adminResult.user?.branch);
  if (adminBranch) {
    const jobBranches = (job.eligibility?.departments || []).map((dept) =>
      normalizeBranch(dept),
    );
    if (!jobBranches.includes(adminBranch)) {
      return {
        success: false,
        error: "Unauthorized for this department job",
      };
    }
  }

  const studentQuery = { role: { $regex: /^student$/i } };
  if (adminBranch) {
    studentQuery.branch = adminBranch;
  }

  const students = await User.find(studentQuery).lean();
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

export async function updateJobActiveStatusAction(userId, jobId, nextActive) {
  await connectToDatabase();

  const adminResult = await requireAdmin(userId);
  if (!adminResult.success) {
    return adminResult;
  }

  const normalizedJobId = normalizeText(jobId);
  if (!mongoose.Types.ObjectId.isValid(normalizedJobId)) {
    return { success: false, error: "Invalid job" };
  }

  const parsedStatus = parseBoolean(nextActive);
  if (parsedStatus === null) {
    return { success: false, error: "Invalid status" };
  }

  const job = await Job.findById(normalizedJobId);
  if (!job) {
    return { success: false, error: "Job not found" };
  }

  if (String(job.createdBy) !== adminResult.userId) {
    return { success: false, error: "You can only update your own jobs" };
  }

  job.active = parsedStatus;
  await job.save();

  return { success: true, data: mapJob(job.toObject()) };
}
