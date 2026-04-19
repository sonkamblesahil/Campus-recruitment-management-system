"use server";

import mongoose from "mongoose";
import { isStudentRole } from "@/lib/authRoles";
import { connectToDatabase } from "@/lib/mongodb";
import Application from "@/models/Application";
import Interview from "@/models/Interview";
import Job from "@/models/Job";
import Offer from "@/models/Offer";
import User from "@/models/User";

function mapApplicationStatus(status) {
  return String(status || "applied").toLowerCase();
}

export async function getStudentDashboardAction(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return { success: false, error: "Invalid user" };
  }

  await connectToDatabase();

  const student = await User.findById(userId).lean();
  if (!student || !isStudentRole(student.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const applications = await Application.find({ studentId: userId })
    .populate({
      path: "jobId",
      select: "title company",
      model: Job,
    })
    .sort({ appliedAt: -1 })
    .lean();

  const offers = await Offer.find({ studentId: userId }).lean();

  const interviews = await Interview.find({ studentId: userId })
    .populate({
      path: "jobId",
      select: "title company",
      model: Job,
    })
    .sort({ scheduledDate: 1 })
    .lean();

  const summary = {
    totalApplications: applications.length,
    underReview: 0,
    shortlisted: 0,
    rejected: 0,
    selected: 0,
    offersPending: 0,
    offersAccepted: 0,
    upcomingInterviews: 0,
  };

  for (const application of applications) {
    const status = mapApplicationStatus(application.status);
    if (status === "under-review") {
      summary.underReview += 1;
    } else if (status === "shortlisted") {
      summary.shortlisted += 1;
    } else if (status === "rejected") {
      summary.rejected += 1;
    } else if (status === "selected") {
      summary.selected += 1;
    }
  }

  for (const offer of offers) {
    const status = String(offer.status || "pending").toLowerCase();
    if (status === "pending") {
      summary.offersPending += 1;
    } else if (status === "accepted") {
      summary.offersAccepted += 1;
    }
  }

  const now = Date.now();
  const upcomingInterviews = interviews.filter((interview) => {
    if (!interview?.scheduledDate) {
      return false;
    }

    if (String(interview.status || "scheduled").toLowerCase() !== "scheduled") {
      return false;
    }

    return new Date(interview.scheduledDate).getTime() >= now;
  });

  summary.upcomingInterviews = upcomingInterviews.length;

  return {
    success: true,
    data: {
      summary,
      recentApplications: applications.slice(0, 8).map((application) => ({
        id: String(application._id),
        status: mapApplicationStatus(application.status),
        appliedAt: application.appliedAt
          ? new Date(application.appliedAt).toLocaleDateString()
          : "-",
        job: application.jobId
          ? {
              title: application.jobId.title || "-",
              company: application.jobId.company || "-",
            }
          : {
              title: "-",
              company: "-",
            },
      })),
      upcomingInterviews: upcomingInterviews.slice(0, 5).map((interview) => ({
        id: String(interview._id),
        title: interview.title || "Interview",
        date: interview.scheduledDate
          ? new Date(interview.scheduledDate).toLocaleString()
          : "-",
        meetingLink: interview.meetingLink || "",
        job: interview.jobId
          ? {
              title: interview.jobId.title || "-",
              company: interview.jobId.company || "-",
            }
          : {
              title: "-",
              company: "-",
            },
      })),
    },
  };
}
