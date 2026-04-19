"use server";

import mongoose from "mongoose";
import { isAdminRole, isStudentRole } from "@/lib/authRoles";
import { connectToDatabase } from "@/lib/mongodb";
import Interview from "@/models/Interview";
import Application from "@/models/Application";
import User from "@/models/User";
import Job from "@/models/Job";

export async function getInterviewsAction(userId, role) {
  await connectToDatabase();

  let query = {};
  if (isStudentRole(role)) {
    query = { studentId: userId };
  } else if (isAdminRole(role)) {
    query = { scheduledBy: userId };
  } else {
    return { success: false, error: "Unauthorized" };
  }

  const interviews = await Interview.find(query)
    .populate({ path: "studentId", select: "name email", model: User })
    .populate({ path: "jobId", select: "title company", model: Job })
    .sort({ scheduledDate: 1 })
    .lean();

  const mapped = interviews.map((inv) => ({
    id: String(inv._id),
    title: inv.title,
    date: new Date(inv.scheduledDate).toLocaleString(),
    meetingLink: inv.meetingLink,
    instructions: inv.instructions,
    status: inv.status,
    student: inv.studentId
      ? { name: inv.studentId.name, email: inv.studentId.email }
      : null,
    job: inv.jobId
      ? { title: inv.jobId.title, company: inv.jobId.company }
      : null,
  }));

  return { success: true, data: mapped };
}

export async function scheduleInterviewAction(adminId, payload) {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(adminId))
    return { success: false, error: "Invalid user" };
  const admin = await User.findById(adminId).lean();
  if (!admin || !isAdminRole(admin.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const { applicationId, title, scheduledDate, meetingLink, instructions } =
    payload;

  const app = await Application.findById(applicationId).populate("jobId");
  if (!app) return { success: false, error: "Application not found" };

  const interview = await Interview.create({
    applicationId: app._id,
    studentId: app.studentId,
    jobId: app.jobId._id,
    scheduledBy: adminId,
    title: String(title).trim(),
    scheduledDate: new Date(scheduledDate),
    meetingLink: String(meetingLink || "").trim(),
    instructions: String(instructions || "").trim(),
    status: "scheduled",
  });

  return { success: true, interviewId: String(interview._id) };
}

export async function updateInterviewStatusAction(
  adminId,
  interviewId,
  nextStatus,
  feedback = "",
) {
  await connectToDatabase();

  if (
    !mongoose.Types.ObjectId.isValid(adminId) ||
    !mongoose.Types.ObjectId.isValid(interviewId)
  ) {
    return { success: false, error: "Invalid request" };
  }

  const admin = await User.findById(adminId).lean();
  if (!admin || !isAdminRole(admin.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const normalizedStatus = String(nextStatus || "")
    .trim()
    .toLowerCase();
  const validStatuses = ["scheduled", "completed", "cancelled", "no-show"];
  if (!validStatuses.includes(normalizedStatus)) {
    return { success: false, error: "Invalid interview status" };
  }

  const interview = await Interview.findById(interviewId);
  if (!interview) {
    return { success: false, error: "Interview not found" };
  }

  if (String(interview.scheduledBy) !== String(admin._id)) {
    return { success: false, error: "Unauthorized" };
  }

  interview.status = normalizedStatus;
  interview.feedback = String(feedback || "").trim();
  await interview.save();

  return { success: true };
}
