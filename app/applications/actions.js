"use server";

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Application from "@/models/Application";
import Interview from "@/models/Interview";
import Job from "@/models/Job";
import Offer from "@/models/Offer";

export async function getStudentApplicationsAction(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return { success: false, error: "Invalid user" };
  }

  await connectToDatabase();

  const applications = await Application.find({ studentId: userId })
    .populate({
      path: "jobId",
      select: "title company location packageCtc",
      model: Job,
    })
    .sort({ appliedAt: -1 })
    .lean();

  const mappedApplications = applications.map((app) => ({
    id: String(app._id),
    status: app.status,
    appliedAt: app.appliedAt
      ? new Date(app.appliedAt).toLocaleDateString()
      : null,
    job: app.jobId
      ? {
          id: String(app.jobId._id),
          title: app.jobId.title,
          company: app.jobId.company,
          location: app.jobId.location,
          packageCtc: app.jobId.packageCtc,
        }
      : null,
  }));

  return { success: true, data: mappedApplications };
}

export async function withdrawApplicationAction(userId, applicationId) {
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(applicationId)
  ) {
    return { success: false, error: "Invalid request" };
  }

  await connectToDatabase();

  const application = await Application.findOne({
    _id: applicationId,
    studentId: userId,
  }).lean();

  if (!application) {
    return { success: false, error: "Application not found" };
  }

  const status = String(application.status || "applied").toLowerCase();
  if (["selected", "rejected"].includes(status)) {
    return {
      success: false,
      error: "This application can no longer be withdrawn",
    };
  }

  await Application.deleteOne({ _id: applicationId, studentId: userId });
  await Interview.deleteMany({ applicationId });
  await Offer.deleteMany({ applicationId });

  return { success: true };
}
