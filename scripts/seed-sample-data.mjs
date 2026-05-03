import mongoose from "mongoose";
import {
  demoAdmins,
  demoApplications,
  demoAuditLogs,
  demoInterviews,
  demoJobs,
  demoOffers,
  demoStudents,
  demoSuperAdmin,
} from "../data/sampleData.js";

const MONGODB_URI = process.env.MONGODB_URI?.trim();
const DB_NAME = "campus-recruitment-management-system";

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not configured in environment variables");
}

function resolve(map, key, label) {
  const value = map.get(key);
  if (!value) {
    throw new Error(`Missing ${label} reference: ${key}`);
  }
  return value;
}

function daysBeforeNow(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function stableJson(value) {
  const keys =
    value && typeof value === "object" ? Object.keys(value).sort() : [];
  return JSON.stringify(value, keys);
}

async function upsertOne(collection, filter, document) {
  const { _id, ...rest } = document;
  const update = { $set: rest };

  if (_id) {
    update.$setOnInsert = { _id };
  }

  await collection.updateOne(filter, update, { upsert: true });
}

async function insertIfMissing(collection, filter, document) {
  const existing = await collection.findOne(filter, { projection: { _id: 1 } });
  if (existing) {
    return false;
  }

  await collection.insertOne(document);
  return true;
}

async function main() {
  await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });

  const db = mongoose.connection.db;
  const userIdMap = new Map();

  userIdMap.set(demoSuperAdmin.key, new mongoose.Types.ObjectId());
  for (const admin of demoAdmins) {
    userIdMap.set(admin.key, new mongoose.Types.ObjectId());
  }
  for (const student of demoStudents) {
    userIdMap.set(student.key, new mongoose.Types.ObjectId());
  }

  const users = [
    {
      _id: resolve(userIdMap, demoSuperAdmin.key, "user"),
      name: demoSuperAdmin.name,
      email: demoSuperAdmin.email,
      password: demoSuperAdmin.password,
      role: demoSuperAdmin.role,
      isProfileVerified: true,
      isBanned: false,
      banReason: "",
      bannedAt: null,
      isDismissed: false,
      dismissalReason: "",
      dismissedAt: null,
      dismissedBy: null,
      createdAt: daysBeforeNow(40),
      updatedAt: daysBeforeNow(3),
    },
    ...demoAdmins.map((admin, index) => ({
      _id: resolve(userIdMap, admin.key, "user"),
      name: admin.name,
      email: admin.email,
      password: admin.password,
      role: admin.role,
      branch: admin.branch || undefined,
      isProfileVerified: true,
      isBanned: Boolean(admin.isBanned),
      banReason: admin.banReason || "",
      bannedAt: admin.bannedAt || null,
      isDismissed: Boolean(admin.isDismissed),
      dismissalReason: admin.dismissalReason || "",
      dismissedAt: admin.dismissalReason
        ? admin.dismissedAt || daysBeforeNow(23 - index)
        : admin.dismissedAt || null,
      dismissedBy: admin.dismissedByKey
        ? resolve(userIdMap, admin.dismissedByKey, "user")
        : null,
      createdAt: daysBeforeNow(35 - index),
      updatedAt: daysBeforeNow(2 + index),
    })),
    ...demoStudents.map((student, index) => ({
      _id: resolve(userIdMap, student.key, "user"),
      name: student.name,
      email: student.email,
      password: student.password,
      role: student.role,
      branch: student.branch,
      program: student.program,
      year: student.year,
      isProfileVerified: Boolean(student.isProfileVerified),
      profileVerifiedAt: student.profileVerifiedAt || null,
      profileVerifiedBy: student.profileVerifiedByKey
        ? resolve(userIdMap, student.profileVerifiedByKey, "user")
        : null,
      isBanned: Boolean(student.isBanned),
      banReason: student.banReason || "",
      bannedAt: student.bannedAt || null,
      isDismissed: Boolean(student.isDismissed),
      dismissalReason: student.dismissalReason || "",
      dismissedAt: student.dismissedAt || null,
      dismissedBy: student.dismissedByKey
        ? resolve(userIdMap, student.dismissedByKey, "user")
        : null,
      createdAt: daysBeforeNow(30 - index),
      updatedAt: daysBeforeNow(index),
    })),
  ];

  const usersCollection = db.collection("users");
  for (const user of users) {
    await upsertOne(
      usersCollection,
      { email: normalizeEmail(user.email) },
      user,
    );
  }

  const profiles = demoStudents.map((student, index) => ({
    _id: new mongoose.Types.ObjectId(),
    userId: resolve(userIdMap, student.key, "user"),
    ...student.profile,
    createdAt: daysBeforeNow(25 - index),
    updatedAt: daysBeforeNow(index),
  }));

  const profilesCollection = db.collection("profiles");
  for (const profile of profiles) {
    await upsertOne(profilesCollection, { userId: profile.userId }, profile);
  }

  const jobIdMap = new Map();
  for (const job of demoJobs) {
    jobIdMap.set(job.key, new mongoose.Types.ObjectId());
  }

  const jobs = demoJobs.map((job, index) => ({
    _id: resolve(jobIdMap, job.key, "job"),
    title: job.title,
    company: job.company,
    location: job.location,
    packageCtc: job.packageCtc,
    description: job.description,
    eligibility: job.eligibility,
    createdBy: resolve(userIdMap, job.createdByKey, "user"),
    active: Boolean(job.active),
    createdAt: job.createdAt || daysBeforeNow(20 - index),
    updatedAt: job.updatedAt || daysBeforeNow(10 - index),
  }));

  const jobsCollection = db.collection("jobs");
  for (const job of jobs) {
    await upsertOne(
      jobsCollection,
      { title: job.title, company: job.company, createdBy: job.createdBy },
      job,
    );
  }

  const applicationIdMap = new Map();
  for (const application of demoApplications) {
    applicationIdMap.set(application.key, new mongoose.Types.ObjectId());
  }

  const applications = demoApplications.map((application, index) => ({
    _id: resolve(applicationIdMap, application.key, "application"),
    studentId: resolve(userIdMap, application.studentKey, "user"),
    jobId: resolve(jobIdMap, application.jobKey, "job"),
    status: application.status,
    resumeUrl: application.resumeUrl,
    coverLetter: application.coverLetter,
    appliedAt: application.appliedAt || daysBeforeNow(14 - index),
    reviewNotes: application.reviewNotes,
    createdAt: application.appliedAt || daysBeforeNow(14 - index),
    updatedAt: daysBeforeNow(index),
  }));

  const applicationsCollection = db.collection("applications");
  for (const application of applications) {
    await upsertOne(
      applicationsCollection,
      { studentId: application.studentId, jobId: application.jobId },
      application,
    );
  }

  const offers = demoOffers.map((offer, index) => ({
    _id: new mongoose.Types.ObjectId(),
    studentId: resolve(userIdMap, offer.studentKey, "user"),
    jobId: resolve(jobIdMap, offer.jobKey, "job"),
    applicationId: resolve(
      applicationIdMap,
      offer.applicationKey,
      "application",
    ),
    companyName: offer.companyName,
    jobTitle: offer.jobTitle,
    offeredCTC: offer.offeredCTC,
    status: offer.status,
    offerLetterUrl: offer.offerLetterUrl,
    issuedAt: offer.issuedAt || daysBeforeNow(6 - index),
    acceptedAt: offer.acceptedAt || null,
    createdAt: offer.issuedAt || daysBeforeNow(6 - index),
    updatedAt: offer.acceptedAt || offer.issuedAt || daysBeforeNow(6 - index),
  }));

  const offersCollection = db.collection("offers");
  for (const offer of offers) {
    await upsertOne(
      offersCollection,
      { applicationId: offer.applicationId },
      offer,
    );
  }

  const interviews = demoInterviews.map((interview, index) => ({
    _id: new mongoose.Types.ObjectId(),
    applicationId: resolve(
      applicationIdMap,
      interview.applicationKey,
      "application",
    ),
    studentId: resolve(userIdMap, interview.studentKey, "user"),
    jobId: resolve(jobIdMap, interview.jobKey, "job"),
    scheduledBy: resolve(userIdMap, interview.scheduledByKey, "user"),
    title: interview.title,
    scheduledDate: interview.scheduledDate,
    meetingLink: interview.meetingLink,
    instructions: interview.instructions,
    status: interview.status,
    feedback: interview.feedback,
    createdAt: interview.scheduledDate || daysBeforeNow(5 - index),
    updatedAt: interview.scheduledDate || daysBeforeNow(5 - index),
  }));

  const interviewsCollection = db.collection("interviews");
  for (const interview of interviews) {
    await upsertOne(
      interviewsCollection,
      { applicationId: interview.applicationId },
      interview,
    );
  }

  const auditLogs = demoAuditLogs.map((log, index) => ({
    _id: new mongoose.Types.ObjectId(),
    actorId: resolve(userIdMap, log.actorKey, "user"),
    actorName:
      log.actorKey === "superadmin"
        ? demoSuperAdmin.name
        : demoAdmins.find((admin) => admin.key === log.actorKey)?.name ||
          demoStudents.find((student) => student.key === log.actorKey)?.name ||
          "Unknown",
    actorEmail:
      log.actorKey === "superadmin"
        ? demoSuperAdmin.email
        : demoAdmins.find((admin) => admin.key === log.actorKey)?.email ||
          demoStudents.find((student) => student.key === log.actorKey)?.email ||
          "",
    actorRole:
      log.actorKey === "superadmin"
        ? "superadmin"
        : demoAdmins.some((admin) => admin.key === log.actorKey)
          ? "admin"
          : "student",
    action: log.action,
    actionLabel: log.actionLabel,
    targetUserId: log.targetKey
      ? resolve(userIdMap, log.targetKey, "user")
      : null,
    targetName: log.targetKey
      ? demoAdmins.find((admin) => admin.key === log.targetKey)?.name ||
        demoStudents.find((student) => student.key === log.targetKey)?.name ||
        (log.targetKey === "superadmin" ? demoSuperAdmin.name : "")
      : "",
    targetEmail: log.targetKey
      ? demoAdmins.find((admin) => admin.key === log.targetKey)?.email ||
        demoStudents.find((student) => student.key === log.targetKey)?.email ||
        (log.targetKey === "superadmin" ? demoSuperAdmin.email : "")
      : "",
    targetRole: log.targetKey
      ? log.targetKey === "superadmin"
        ? "superadmin"
        : demoAdmins.some((admin) => admin.key === log.targetKey)
          ? "admin"
          : "student"
      : "",
    severity: log.severity,
    details: log.details,
    createdAt: log.createdAt || daysBeforeNow(12 - index),
    updatedAt: log.createdAt || daysBeforeNow(12 - index),
  }));

  const auditLogsCollection = db.collection("auditlogs");
  for (const auditLog of auditLogs) {
    await insertIfMissing(
      auditLogsCollection,
      {
        actorId: auditLog.actorId,
        action: auditLog.action,
        targetUserId: auditLog.targetUserId,
        actionLabel: auditLog.actionLabel,
        severity: auditLog.severity,
        detailsKey: stableJson(auditLog.details),
      },
      auditLog,
    );
  }

  console.log("Seed completed successfully.");
  console.log({
    users: users.length,
    profiles: profiles.length,
    jobs: jobs.length,
    applications: applications.length,
    interviews: interviews.length,
    offers: offers.length,
    auditLogs: auditLogs.length,
  });

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
