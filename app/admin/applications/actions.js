"use server";

import mongoose from "mongoose";
import { isAdminRole } from "@/lib/authRoles";
import { connectToDatabase } from "@/lib/mongodb";
import Job from "@/models/Job";
import Application from "@/models/Application";
import User from "@/models/User";
import Offer from "@/models/Offer";

function normalizeText(value) {
  return String(value || "").trim();
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

export async function getAdminApplicationsAction(userId, jobId = null) {
  await connectToDatabase();
  const adminResult = await requireAdmin(userId);
  if (!adminResult.success) return adminResult;

  // Find all jobs created by this admin
  const jobsQuery = { createdBy: adminResult.userId };
  if (jobId) {
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return { success: false, error: "Invalid job ID" };
    }
    jobsQuery._id = jobId;
  }
  const jobs = await Job.find(jobsQuery).select("_id title company").lean();
  const jobIds = jobs.map((j) => j._id);

  // Find all applications for these jobs
  const applications = await Application.find({ jobId: { $in: jobIds } })
    .populate({ path: "studentId", select: "name email", model: User })
    .populate({ path: "jobId", select: "title company", model: Job })
    .sort({ appliedAt: -1 })
    .lean();

  const mappedData = applications.map((app) => ({
    id: String(app._id),
    student: app.studentId
      ? {
          id: String(app.studentId._id),
          name: app.studentId.name,
          email: app.studentId.email,
        }
      : null,
    job: app.jobId
      ? {
          id: String(app.jobId._id),
          title: app.jobId.title,
          company: app.jobId.company,
        }
      : null,
    status: app.status,
    appliedAt: app.appliedAt
      ? new Date(app.appliedAt).toLocaleDateString()
      : null,
  }));

  return {
    success: true,
    data: mappedData,
    jobs: jobs.map((j) => ({
      id: String(j._id),
      title: j.title,
      company: j.company,
    })),
  };
}

export async function updateApplicationStatusAction(
  adminId,
  applicationId,
  newStatus,
  ctc = "0 LPA",
) {
  await connectToDatabase();
  const adminResult = await requireAdmin(adminId);
  if (!adminResult.success) return adminResult;

  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    return { success: false, error: "Invalid application ID" };
  }

  const validStatuses = [
    "applied",
    "under-review",
    "shortlisted",
    "rejected",
    "selected",
  ];
  if (!validStatuses.includes(newStatus)) {
    return { success: false, error: "Invalid status" };
  }

  const application =
    await Application.findById(applicationId).populate("jobId");
  if (!application) {
    return { success: false, error: "Application not found" };
  }

  if (String(application.jobId.createdBy) !== adminResult.userId) {
    return {
      success: false,
      error: "Unauthorized. You did not post this job.",
    };
  }

  application.status = newStatus;
  await application.save();

  // If selected, automatically generate an Offer
  if (newStatus === "selected") {
    const existingOffer = await Offer.findOne({
      applicationId: application._id,
    });
    if (!existingOffer) {
      await Offer.create({
        studentId: application.studentId,
        jobId: application.jobId._id,
        applicationId: application._id,
        companyName: application.jobId.company,
        jobTitle: application.jobId.title,
        offeredCTC: ctc || application.jobId.packageCtc || "TBD",
        status: "pending",
      });
    }
  }

  return { success: true };
}
