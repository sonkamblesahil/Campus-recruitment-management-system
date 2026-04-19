import mongoose from "mongoose";
import * as XLSX from "xlsx";
import { isAdminRole } from "@/lib/authRoles";
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

export async function GET(request, context) {
  const params = await context.params;
  const jobId = normalizeText(params?.jobId);
  const adminId = normalizeText(request.nextUrl.searchParams.get("adminId"));

  if (
    !mongoose.Types.ObjectId.isValid(jobId) ||
    !mongoose.Types.ObjectId.isValid(adminId)
  ) {
    return new Response("Invalid request", { status: 400 });
  }

  await connectToDatabase();

  const admin = await User.findById(adminId).lean();
  if (!admin || !isAdminRole(admin.role)) {
    return new Response("Unauthorized", { status: 403 });
  }

  const job = await Job.findById(jobId).lean();
  if (!job) {
    return new Response("Job not found", { status: 404 });
  }

  if (String(job.createdBy) !== String(admin._id)) {
    return new Response("Unauthorized", { status: 403 });
  }

  const students = await User.find({ role: { $regex: /^student$/i } }).lean();
  const studentIds = students.map((student) => student._id);
  const profiles = await Profile.find({ userId: { $in: studentIds } }).lean();
  const profileMap = new Map(
    profiles.map((profile) => [String(profile.userId), profile]),
  );

  const rows = students
    .map((student) => {
      const profile = profileMap.get(String(student._id));
      if (!profile || !isStudentEligibleForJob(job, profile)) {
        return null;
      }

      const attributes = getStudentAttributes(profile, student);
      return {
        Name: attributes.name,
        Email: attributes.email,
        MobileNo: attributes.phone,
        Department: attributes.department,
        CGPA: attributes.cgpa ?? "",
        Year: attributes.year,
        Address: attributes.address,
      };
    })
    .filter(Boolean);

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "EligibleStudents");

  const fileBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  return new Response(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=eligible-students-${jobId}.xlsx`,
      "Cache-Control": "no-store",
    },
  });
}
