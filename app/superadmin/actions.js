"use server";

import mongoose from "mongoose";
import { APP_ROLES, isSuperAdminRole, normalizeRole } from "@/lib/authRoles";
import {
  BRANCH_OPTIONS,
  BRANCH_VALUES,
  getBranchLabel,
  getAllowedYears,
  isValidProgram,
  isValidYearForProgram,
  normalizeBranch,
  normalizeProgram,
} from "@/lib/academics";
import { getStudentAttributes } from "@/lib/jobEligibility";
import { connectToDatabase } from "@/lib/mongodb";
import AuditLog, {
  AUDIT_SEVERITY,
  GOVERNANCE_ACTION_OPTIONS,
  GOVERNANCE_ACTIONS,
} from "@/models/AuditLog";
import Application from "@/models/Application";
import Job from "@/models/Job";
import Offer from "@/models/Offer";
import Profile from "@/models/Profile";
import User from "@/models/User";

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function isValidEmailAddress(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = normalizeText(value).toLowerCase();
  return normalized === "true";
}

function toNullableNumber(value) {
  const raw = normalizeText(value).replace(/,/g, "");
  if (!raw) {
    return null;
  }

  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseYearFilter(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized || normalized === "all") {
    return null;
  }

  const parsed = Number.parseInt(normalized, 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function inRange(value, min, max) {
  if (min === null && max === null) {
    return true;
  }

  if (value === null || value === undefined) {
    return false;
  }

  if (min !== null && value < min) {
    return false;
  }

  if (max !== null && value > max) {
    return false;
  }

  return true;
}

async function requireSuperAdmin(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return { success: false, error: "Invalid user" };
  }

  const user = await User.findById(userId).lean();
  if (!user || !isSuperAdminRole(user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  return { success: true, userId: String(user._id), user };
}

const governanceActionLabelByValue = new Map(
  GOVERNANCE_ACTION_OPTIONS.map((option) => [option.value, option.label]),
);

const governanceSeverityOptions = [
  { value: AUDIT_SEVERITY.INFO, label: "Info" },
  { value: AUDIT_SEVERITY.WARNING, label: "Warning" },
  { value: AUDIT_SEVERITY.CRITICAL, label: "Critical" },
];

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toSafeDetails(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value;
}

function toPositiveInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(normalizeText(value), 10);
  if (!Number.isInteger(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
}

function mapAuditLog(log) {
  return {
    id: String(log._id),
    action: log.action,
    actionLabel:
      log.actionLabel || governanceActionLabelByValue.get(log.action),
    severity: log.severity || AUDIT_SEVERITY.INFO,
    actor: {
      id: log.actorId ? String(log.actorId) : "",
      name: log.actorName || "Unknown",
      email: log.actorEmail || "",
      role: normalizeRole(log.actorRole),
    },
    target: {
      id: log.targetUserId ? String(log.targetUserId) : "",
      name: log.targetName || "",
      email: log.targetEmail || "",
      role: normalizeRole(log.targetRole),
    },
    details: toSafeDetails(log.details),
    createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : null,
  };
}

async function createGovernanceLogEntry({
  actor,
  action,
  targetUser,
  severity,
  details,
}) {
  const actorId = actor?._id || actor?.id;
  if (!actorId || !mongoose.Types.ObjectId.isValid(String(actorId))) {
    return;
  }

  const actorRole = normalizeRole(actor?.role) || APP_ROLES.SUPERADMIN;
  const actionLabel = governanceActionLabelByValue.get(action) || action;
  const normalizedTargetRole = normalizeRole(targetUser?.role);
  const targetUserId = targetUser?._id || targetUser?.id;
  const targetUserIdValue =
    targetUserId && mongoose.Types.ObjectId.isValid(String(targetUserId))
      ? targetUserId
      : null;

  try {
    await AuditLog.create({
      actorId,
      actorName: normalizeText(actor?.name),
      actorEmail: normalizeText(actor?.email).toLowerCase(),
      actorRole,
      action,
      actionLabel,
      targetUserId: targetUserIdValue,
      targetName: normalizeText(targetUser?.name),
      targetEmail: normalizeText(targetUser?.email).toLowerCase(),
      targetRole: normalizedTargetRole || "",
      severity: severity || AUDIT_SEVERITY.INFO,
      details: toSafeDetails(details),
    });
  } catch (error) {
    console.error("Failed to write governance audit log", error);
  }
}

function mapUser(user) {
  return {
    id: String(user._id),
    name: user.name || "",
    email: user.email || "",
    role: normalizeRole(user.role),
    branch: user.branch || "",
    branchLabel: user.branch ? getBranchLabel(user.branch) : "Unassigned",
    program: user.program || "",
    year: user.year ?? null,
    isBanned: Boolean(user.isBanned),
    banReason: user.banReason || "",
    isDismissed: Boolean(user.isDismissed),
    dismissalReason: user.dismissalReason || "",
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
  };
}

function mapStudentWithProfile(user, profile) {
  const baseUser = mapUser(user);
  const attributes = getStudentAttributes(profile, user);

  return {
    ...baseUser,
    cgpa: attributes.cgpa,
    class12Percentage: attributes.class12Percentage,
    currentSemester: attributes.semester,
    phone: attributes.phone,
    address: attributes.address,
  };
}

function normalizeDepartmentList(value) {
  const values = Array.isArray(value)
    ? value
    : normalizeText(value)
        .split(",")
        .map((item) => normalizeText(item));

  const uniqueDepartments = new Set();
  values.forEach((entry) => {
    const normalized = normalizeBranch(entry);
    if (BRANCH_VALUES.includes(normalized)) {
      uniqueDepartments.add(normalized);
    }
  });

  return Array.from(uniqueDepartments);
}

function buildSuperAdminJobPayload(payload) {
  return {
    title: normalizeText(payload?.title),
    company: normalizeText(payload?.company),
    location: normalizeText(payload?.location),
    packageCtc: normalizeText(payload?.packageCtc),
    description: normalizeText(payload?.description),
    eligibility: {
      departments: normalizeDepartmentList(payload?.departments),
      minCgpa: toNullableNumber(payload?.minCgpa),
      minClass12Percentage: toNullableNumber(payload?.minClass12Percentage),
      minSemester: toNullableNumber(payload?.minSemester),
      maxSemester: toNullableNumber(payload?.maxSemester),
    },
  };
}

function createEmptyJobStats() {
  return {
    applications: 0,
    shortlisted: 0,
    selected: 0,
    offered: 0,
    accepted: 0,
    declined: 0,
    pendingOffers: 0,
    uniqueApplicantCount: 0,
    uniqueApplicants: new Set(),
  };
}

function mapSuperAdminJob(job, stats = createEmptyJobStats()) {
  const publisherRaw =
    job?.createdBy && typeof job.createdBy === "object" ? job.createdBy : null;
  const publisherId = publisherRaw?._id || job?.createdBy || "";

  return {
    id: String(job._id),
    title: job.title || "",
    company: job.company || "",
    location: job.location || "",
    packageCtc: job.packageCtc || "",
    description: job.description || "",
    active: Boolean(job.active),
    createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
    updatedAt: job.updatedAt ? new Date(job.updatedAt).toISOString() : null,
    eligibility: {
      departments: job.eligibility?.departments || [],
      minCgpa: job.eligibility?.minCgpa ?? null,
      minClass12Percentage: job.eligibility?.minClass12Percentage ?? null,
      minSemester: job.eligibility?.minSemester ?? null,
      maxSemester: job.eligibility?.maxSemester ?? null,
    },
    createdBy: {
      id: publisherId ? String(publisherId) : "",
      name: publisherRaw?.name || "Unknown",
      email: publisherRaw?.email || "",
      branch: publisherRaw?.branch || "",
      branchLabel: publisherRaw?.branch
        ? getBranchLabel(publisherRaw.branch)
        : "Unassigned",
    },
    metrics: {
      applications: stats.applications || 0,
      shortlisted: stats.shortlisted || 0,
      selected: stats.selected || 0,
      offered: stats.offered || 0,
      accepted: stats.accepted || 0,
      declined: stats.declined || 0,
      pendingOffers: stats.pendingOffers || 0,
      uniqueApplicantCount: stats.uniqueApplicantCount || 0,
    },
  };
}

function computeJobsSummary(mappedJobs) {
  return mappedJobs.reduce(
    (accumulator, job) => {
      accumulator.totalJobs += 1;
      if (job.active) {
        accumulator.activeJobs += 1;
      } else {
        accumulator.inactiveJobs += 1;
      }
      accumulator.totalApplications += job.metrics.applications;
      accumulator.totalShortlisted += job.metrics.shortlisted;
      accumulator.totalSelected += job.metrics.selected;
      accumulator.totalOffered += job.metrics.offered;
      accumulator.totalAccepted += job.metrics.accepted;
      return accumulator;
    },
    {
      totalJobs: 0,
      activeJobs: 0,
      inactiveJobs: 0,
      totalApplications: 0,
      totalShortlisted: 0,
      totalSelected: 0,
      totalOffered: 0,
      totalAccepted: 0,
    },
  );
}

export async function getSuperAdminOverviewAction(superAdminId) {
  await connectToDatabase();

  const authResult = await requireSuperAdmin(superAdminId);
  if (!authResult.success) {
    return authResult;
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    admins,
    students,
    governanceEventsLast7Days,
    criticalActionsLast7Days,
  ] = await Promise.all([
    User.find({ role: APP_ROLES.ADMIN }).lean(),
    User.find({ role: APP_ROLES.STUDENT }).lean(),
    AuditLog.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    AuditLog.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
      severity: AUDIT_SEVERITY.CRITICAL,
    }),
  ]);

  const adminsByBranch = BRANCH_VALUES.map((branch) => ({
    branch,
    branchLabel: getBranchLabel(branch),
    count: admins.filter((admin) => normalizeBranch(admin.branch) === branch)
      .length,
  }));

  const studentsByBranch = BRANCH_VALUES.map((branch) => ({
    branch,
    branchLabel: getBranchLabel(branch),
    count: students.filter(
      (student) => normalizeBranch(student.branch) === branch,
    ).length,
  }));

  const bannedUsers = students.filter((student) => student.isBanned).length;
  const dismissedUsers = students.filter(
    (student) => student.isDismissed,
  ).length;

  return {
    success: true,
    data: {
      totalAdmins: admins.length,
      totalStudents: students.length,
      bannedUsers,
      dismissedUsers,
      governanceEventsLast7Days,
      criticalActionsLast7Days,
      adminsByBranch,
      studentsByBranch,
      branches: BRANCH_OPTIONS,
    },
  };
}

export async function getSuperAdminJobsOverviewAction(
  superAdminId,
  filters = {},
) {
  await connectToDatabase();

  const authResult = await requireSuperAdmin(superAdminId);
  if (!authResult.success) {
    return authResult;
  }

  const branchFilter = normalizeBranch(filters?.branch);
  const hasBranchFilter = BRANCH_VALUES.includes(branchFilter);

  const activeFilter = normalizeText(filters?.active).toLowerCase();
  const searchFilter = normalizeText(filters?.search).toLowerCase();

  const query = {};
  if (activeFilter === "active") {
    query.active = true;
  } else if (activeFilter === "inactive") {
    query.active = false;
  }

  if (hasBranchFilter) {
    query["eligibility.departments"] = branchFilter;
  }

  const jobs = await Job.find(query)
    .populate({
      path: "createdBy",
      select: "name email role branch",
      model: User,
    })
    .sort({ createdAt: -1 })
    .lean();

  const filteredJobs = searchFilter
    ? jobs.filter((job) => {
        const haystack = [
          job.title,
          job.company,
          job.location,
          job.packageCtc,
          job.description,
          job.createdBy?.name,
          job.createdBy?.email,
          ...(job.eligibility?.departments || []),
        ]
          .map((value) => String(value || "").toLowerCase())
          .join(" ");

        return haystack.includes(searchFilter);
      })
    : jobs;

  const jobIds = filteredJobs.map((job) => job._id);
  if (jobIds.length === 0) {
    return {
      success: true,
      data: {
        jobs: [],
        branches: BRANCH_OPTIONS,
        summary: computeJobsSummary([]),
      },
    };
  }

  const [applications, offers] = await Promise.all([
    Application.find({ jobId: { $in: jobIds } })
      .select("jobId studentId status")
      .lean(),
    Offer.find({ jobId: { $in: jobIds } })
      .select("jobId status")
      .lean(),
  ]);

  const statsByJobId = new Map();

  const ensureStats = (jobId) => {
    const key = String(jobId);
    if (!statsByJobId.has(key)) {
      statsByJobId.set(key, createEmptyJobStats());
    }
    return statsByJobId.get(key);
  };

  applications.forEach((application) => {
    const stats = ensureStats(application.jobId);
    stats.applications += 1;
    stats.uniqueApplicants.add(String(application.studentId));

    const status = normalizeText(application.status).toLowerCase();
    if (status === "shortlisted") {
      stats.shortlisted += 1;
    }
    if (status === "selected") {
      stats.selected += 1;
    }
  });

  offers.forEach((offer) => {
    const stats = ensureStats(offer.jobId);
    stats.offered += 1;

    const status = normalizeText(offer.status).toLowerCase();
    if (status === "accepted") {
      stats.accepted += 1;
    } else if (status === "declined") {
      stats.declined += 1;
    } else {
      stats.pendingOffers += 1;
    }
  });

  const mappedJobs = filteredJobs.map((job) => {
    const stats = statsByJobId.get(String(job._id)) || createEmptyJobStats();
    stats.uniqueApplicantCount = stats.uniqueApplicants.size;
    return mapSuperAdminJob(job, stats);
  });

  return {
    success: true,
    data: {
      jobs: mappedJobs,
      branches: BRANCH_OPTIONS,
      summary: computeJobsSummary(mappedJobs),
    },
  };
}

export async function getSuperAdminJobStudentsAction(superAdminId, jobId) {
  await connectToDatabase();

  const authResult = await requireSuperAdmin(superAdminId);
  if (!authResult.success) {
    return authResult;
  }

  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    return { success: false, error: "Invalid job" };
  }

  const job = await Job.findById(jobId)
    .populate({
      path: "createdBy",
      select: "name email role branch",
      model: User,
    })
    .lean();

  if (!job) {
    return { success: false, error: "Job not found" };
  }

  const [applications, offers] = await Promise.all([
    Application.find({ jobId }).sort({ appliedAt: -1, createdAt: -1 }).lean(),
    Offer.find({ jobId }).sort({ issuedAt: -1 }).lean(),
  ]);

  const studentIds = new Set();
  applications.forEach((application) => {
    studentIds.add(String(application.studentId));
  });
  offers.forEach((offer) => {
    studentIds.add(String(offer.studentId));
  });

  const students =
    studentIds.size > 0
      ? await User.find({ _id: { $in: Array.from(studentIds) } })
          .select("name email branch program year")
          .lean()
      : [];

  const studentById = new Map(
    students.map((student) => [String(student._id), student]),
  );

  const offerByApplicationId = new Map(
    offers
      .filter((offer) => offer.applicationId)
      .map((offer) => [String(offer.applicationId), offer]),
  );
  const offerByStudentId = new Map(
    offers.map((offer) => [String(offer.studentId), offer]),
  );

  const applicants = applications.map((application) => {
    const student = studentById.get(String(application.studentId));
    const offer =
      offerByApplicationId.get(String(application._id)) ||
      offerByStudentId.get(String(application.studentId));

    return {
      applicationId: String(application._id),
      studentId: String(application.studentId),
      name: student?.name || "Unknown",
      email: student?.email || "",
      branch: student?.branch || "",
      branchLabel: student?.branch
        ? getBranchLabel(student.branch)
        : "Unassigned",
      program: student?.program || "",
      year: student?.year ?? null,
      applicationStatus: normalizeText(application.status).toLowerCase() || "-",
      appliedAt: application.appliedAt
        ? new Date(application.appliedAt).toISOString()
        : null,
      offerStatus: offer
        ? normalizeText(offer.status).toLowerCase() || "pending"
        : "not-offered",
      offeredCtc: offer?.offeredCTC || "",
      offerIssuedAt: offer?.issuedAt
        ? new Date(offer.issuedAt).toISOString()
        : null,
      acceptedAt: offer?.acceptedAt
        ? new Date(offer.acceptedAt).toISOString()
        : null,
    };
  });

  const selectedCount = applications.filter(
    (application) =>
      normalizeText(application.status).toLowerCase() === "selected",
  ).length;
  const acceptedCount = offers.filter(
    (offer) => normalizeText(offer.status).toLowerCase() === "accepted",
  ).length;

  const stats = createEmptyJobStats();
  stats.applications = applications.length;
  stats.selected = selectedCount;
  stats.offered = offers.length;
  stats.accepted = acceptedCount;
  stats.uniqueApplicantCount = new Set(
    applicants.map((item) => item.studentId),
  ).size;

  return {
    success: true,
    data: {
      job: mapSuperAdminJob(job, stats),
      students: applicants,
      funnel: {
        applied: applications.length,
        selected: selectedCount,
        offered: offers.length,
        accepted: acceptedCount,
      },
    },
  };
}

export async function updateSuperAdminJobAction(superAdminId, jobId, payload) {
  await connectToDatabase();

  const authResult = await requireSuperAdmin(superAdminId);
  if (!authResult.success) {
    return authResult;
  }

  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    return { success: false, error: "Invalid job" };
  }

  const job = await Job.findById(jobId);
  if (!job) {
    return { success: false, error: "Job not found" };
  }

  const nextPayload = buildSuperAdminJobPayload(payload);
  if (!nextPayload.title || !nextPayload.company) {
    return {
      success: false,
      error: "Job title and company are required",
    };
  }

  if (
    nextPayload.eligibility.minSemester !== null &&
    nextPayload.eligibility.maxSemester !== null &&
    nextPayload.eligibility.minSemester > nextPayload.eligibility.maxSemester
  ) {
    return {
      success: false,
      error: "Minimum semester cannot be greater than maximum semester",
    };
  }

  const previousState = {
    title: job.title || "",
    company: job.company || "",
    location: job.location || "",
    packageCtc: job.packageCtc || "",
    description: job.description || "",
    active: Boolean(job.active),
    eligibility: {
      departments: job.eligibility?.departments || [],
      minCgpa: job.eligibility?.minCgpa ?? null,
      minClass12Percentage: job.eligibility?.minClass12Percentage ?? null,
      minSemester: job.eligibility?.minSemester ?? null,
      maxSemester: job.eligibility?.maxSemester ?? null,
    },
  };

  job.title = nextPayload.title;
  job.company = nextPayload.company;
  job.location = nextPayload.location;
  job.packageCtc = nextPayload.packageCtc;
  job.description = nextPayload.description;
  job.eligibility = nextPayload.eligibility;
  await job.save();

  const updatedJob = await Job.findById(jobId)
    .populate({
      path: "createdBy",
      select: "name email role branch",
      model: User,
    })
    .lean();

  const publisherTarget = updatedJob?.createdBy || null;
  await createGovernanceLogEntry({
    actor: authResult.user,
    action: GOVERNANCE_ACTIONS.JOB_DETAILS_UPDATED,
    targetUser: publisherTarget,
    severity: AUDIT_SEVERITY.INFO,
    details: {
      jobId: String(jobId),
      previousState,
      nextState: {
        title: updatedJob?.title || "",
        company: updatedJob?.company || "",
        location: updatedJob?.location || "",
        packageCtc: updatedJob?.packageCtc || "",
        description: updatedJob?.description || "",
        active: Boolean(updatedJob?.active),
        eligibility: {
          departments: updatedJob?.eligibility?.departments || [],
          minCgpa: updatedJob?.eligibility?.minCgpa ?? null,
          minClass12Percentage:
            updatedJob?.eligibility?.minClass12Percentage ?? null,
          minSemester: updatedJob?.eligibility?.minSemester ?? null,
          maxSemester: updatedJob?.eligibility?.maxSemester ?? null,
        },
      },
    },
  });

  return {
    success: true,
    data: mapSuperAdminJob(updatedJob || job.toObject(), createEmptyJobStats()),
  };
}

export async function updateSuperAdminJobActiveStatusAction(
  superAdminId,
  jobId,
  shouldActivate,
) {
  await connectToDatabase();

  const authResult = await requireSuperAdmin(superAdminId);
  if (!authResult.success) {
    return authResult;
  }

  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    return { success: false, error: "Invalid job" };
  }

  const parsedStatus = normalizeBoolean(shouldActivate);
  if (typeof parsedStatus !== "boolean") {
    return { success: false, error: "Invalid status" };
  }

  const job = await Job.findById(jobId);
  if (!job) {
    return { success: false, error: "Job not found" };
  }

  const previousActive = Boolean(job.active);
  job.active = parsedStatus;
  await job.save();

  const updatedJob = await Job.findById(jobId)
    .populate({
      path: "createdBy",
      select: "name email role branch",
      model: User,
    })
    .lean();

  await createGovernanceLogEntry({
    actor: authResult.user,
    action: GOVERNANCE_ACTIONS.JOB_STATUS_UPDATED,
    targetUser: updatedJob?.createdBy || null,
    severity: parsedStatus ? AUDIT_SEVERITY.INFO : AUDIT_SEVERITY.WARNING,
    details: {
      jobId: String(jobId),
      title: updatedJob?.title || "",
      company: updatedJob?.company || "",
      previousActive,
      nextActive: parsedStatus,
    },
  });

  return {
    success: true,
    data: mapSuperAdminJob(updatedJob || job.toObject(), createEmptyJobStats()),
  };
}

export async function getGovernanceActivityAction(superAdminId, filters = {}) {
  await connectToDatabase();

  const authResult = await requireSuperAdmin(superAdminId);
  if (!authResult.success) {
    return authResult;
  }

  const actionFilter = normalizeText(filters?.action);
  const severityFilter = normalizeText(filters?.severity).toLowerCase();
  const searchFilter = normalizeText(filters?.search);
  const lastDays = toPositiveInteger(filters?.lastDays, 30, 1, 365);
  const limit = toPositiveInteger(filters?.limit, 200, 20, 500);

  const query = {};

  if (Object.values(GOVERNANCE_ACTIONS).includes(actionFilter)) {
    query.action = actionFilter;
  }

  if (Object.values(AUDIT_SEVERITY).includes(severityFilter)) {
    query.severity = severityFilter;
  }

  if (lastDays > 0) {
    query.createdAt = {
      $gte: new Date(Date.now() - lastDays * 24 * 60 * 60 * 1000),
    };
  }

  if (searchFilter) {
    const searchRegex = new RegExp(escapeRegExp(searchFilter), "i");
    query.$or = [
      { actorName: searchRegex },
      { actorEmail: searchRegex },
      { targetName: searchRegex },
      { targetEmail: searchRegex },
      { actionLabel: searchRegex },
    ];
  }

  const logs = await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return {
    success: true,
    data: {
      logs: logs.map(mapAuditLog),
      actionOptions: GOVERNANCE_ACTION_OPTIONS,
      severityOptions: governanceSeverityOptions,
      totalReturned: logs.length,
    },
  };
}

export async function getAdminManagementAction(superAdminId) {
  await connectToDatabase();

  const authResult = await requireSuperAdmin(superAdminId);
  if (!authResult.success) {
    return authResult;
  }

  const admins = await User.find({ role: APP_ROLES.ADMIN })
    .sort({ createdAt: -1 })
    .lean();

  return {
    success: true,
    data: {
      admins: admins.map(mapUser),
      branches: BRANCH_OPTIONS,
    },
  };
}

export async function assignAdminBranchAction(superAdminId, adminId, branch) {
  await connectToDatabase();

  const authResult = await requireSuperAdmin(superAdminId);
  if (!authResult.success) {
    return authResult;
  }

  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    return { success: false, error: "Invalid admin" };
  }

  const normalizedBranch = normalizeBranch(branch);
  if (!BRANCH_VALUES.includes(normalizedBranch)) {
    return { success: false, error: "Invalid branch" };
  }

  const admin = await User.findById(adminId);
  if (!admin || normalizeRole(admin.role) !== APP_ROLES.ADMIN) {
    return { success: false, error: "Admin not found" };
  }

  const previousBranch = normalizeBranch(admin.branch) || null;
  admin.branch = normalizedBranch;
  await admin.save();

  const updatedAdmin = admin.toObject();
  await createGovernanceLogEntry({
    actor: authResult.user,
    action: GOVERNANCE_ACTIONS.ADMIN_BRANCH_ASSIGNED,
    targetUser: updatedAdmin,
    severity: AUDIT_SEVERITY.INFO,
    details: {
      previousBranch,
      nextBranch: normalizedBranch,
    },
  });

  return { success: true, data: mapUser(updatedAdmin) };
}

export async function clearAdminBranchAction(superAdminId, adminId) {
  await connectToDatabase();

  const authResult = await requireSuperAdmin(superAdminId);
  if (!authResult.success) {
    return authResult;
  }

  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    return { success: false, error: "Invalid admin" };
  }

  const admin = await User.findById(adminId);
  if (!admin || normalizeRole(admin.role) !== APP_ROLES.ADMIN) {
    return { success: false, error: "Admin not found" };
  }

  const previousBranch = normalizeBranch(admin.branch) || null;
  admin.branch = undefined;
  await admin.save();

  const updatedAdmin = admin.toObject();
  await createGovernanceLogEntry({
    actor: authResult.user,
    action: GOVERNANCE_ACTIONS.ADMIN_BRANCH_CLEARED,
    targetUser: updatedAdmin,
    severity: AUDIT_SEVERITY.INFO,
    details: {
      previousBranch,
      nextBranch: null,
    },
  });

  return { success: true, data: mapUser(updatedAdmin) };
}

export async function getStudentManagementAction(superAdminId, filters = {}) {
  await connectToDatabase();

  const authResult = await requireSuperAdmin(superAdminId);
  if (!authResult.success) {
    return authResult;
  }

  const branchFilter = normalizeBranch(filters?.branch);
  const hasBranchFilter = BRANCH_VALUES.includes(branchFilter);

  const programFilter = normalizeProgram(filters?.program);
  const hasProgramFilter = isValidProgram(programFilter);

  const searchFilter = normalizeText(filters?.search).toLowerCase();
  const selectedYearFilter = parseYearFilter(filters?.year);

  const minCgpaFilter = toNullableNumber(filters?.minCgpa);
  const maxCgpaFilter = toNullableNumber(filters?.maxCgpa);
  const minClass12Filter = toNullableNumber(filters?.minClass12Percentage);
  const maxClass12Filter = toNullableNumber(filters?.maxClass12Percentage);

  const query = { role: APP_ROLES.STUDENT };
  if (hasBranchFilter) {
    query.branch = branchFilter;
  }
  if (hasProgramFilter) {
    query.program = programFilter;
  }

  const students = await User.find(query).sort({ createdAt: -1 }).lean();

  const studentIds = students.map((student) => student._id);
  const profiles = await Profile.find({ userId: { $in: studentIds } }).lean();
  const profileByStudentId = new Map(
    profiles.map((profile) => [String(profile.userId), profile]),
  );

  const enrichedStudents = students.map((student) =>
    mapStudentWithProfile(student, profileByStudentId.get(String(student._id))),
  );

  const marksFilteredStudents = enrichedStudents.filter((student) => {
    const searchMatch =
      !searchFilter ||
      String(student.name || "")
        .toLowerCase()
        .includes(searchFilter) ||
      String(student.email || "")
        .toLowerCase()
        .includes(searchFilter) ||
      String(student.branch || "")
        .toLowerCase()
        .includes(searchFilter);

    if (!searchMatch) {
      return false;
    }

    if (!inRange(student.cgpa, minCgpaFilter, maxCgpaFilter)) {
      return false;
    }

    if (
      !inRange(student.class12Percentage, minClass12Filter, maxClass12Filter)
    ) {
      return false;
    }

    return true;
  });

  const candidateYears = hasProgramFilter
    ? getAllowedYears(programFilter)
    : [1, 2, 3, 4];
  const yearCounts = new Map(candidateYears.map((year) => [year, 0]));

  marksFilteredStudents.forEach((student) => {
    const yearValue = Number.parseInt(String(student.year || ""), 10);
    if (Number.isInteger(yearValue) && yearCounts.has(yearValue)) {
      yearCounts.set(yearValue, (yearCounts.get(yearValue) || 0) + 1);
    }
  });

  const yearFilteredStudents =
    selectedYearFilter === null
      ? marksFilteredStudents
      : marksFilteredStudents.filter(
          (student) =>
            Number.parseInt(String(student.year || ""), 10) ===
            selectedYearFilter,
        );

  return {
    success: true,
    data: {
      students: yearFilteredStudents,
      branches: BRANCH_OPTIONS,
      yearTabs: Array.from(yearCounts.entries()).map(([year, count]) => ({
        year,
        count,
      })),
      totalStudents: yearFilteredStudents.length,
    },
  };
}

export async function banStudentAction(superAdminId, studentId, reason) {
  await connectToDatabase();

  const authResult = await requireSuperAdmin(superAdminId);
  if (!authResult.success) {
    return authResult;
  }

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return { success: false, error: "Invalid student" };
  }

  const student = await User.findById(studentId);
  if (!student || normalizeRole(student.role) !== APP_ROLES.STUDENT) {
    return { success: false, error: "Student not found" };
  }

  const previousState = {
    isBanned: Boolean(student.isBanned),
    banReason: student.banReason || "",
  };
  const normalizedReason = normalizeText(reason);

  student.isBanned = true;
  student.banReason = normalizedReason;
  student.bannedAt = new Date();
  await student.save();

  const updatedStudent = student.toObject();
  await createGovernanceLogEntry({
    actor: authResult.user,
    action: GOVERNANCE_ACTIONS.STUDENT_BANNED,
    targetUser: updatedStudent,
    severity: AUDIT_SEVERITY.WARNING,
    details: {
      previousState,
      nextState: {
        isBanned: true,
        banReason: updatedStudent.banReason || "",
      },
    },
  });

  return { success: true, data: mapUser(updatedStudent) };
}

export async function unbanStudentAction(superAdminId, studentId) {
  await connectToDatabase();

  const authResult = await requireSuperAdmin(superAdminId);
  if (!authResult.success) {
    return authResult;
  }

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return { success: false, error: "Invalid student" };
  }

  const student = await User.findById(studentId);
  if (!student || normalizeRole(student.role) !== APP_ROLES.STUDENT) {
    return { success: false, error: "Student not found" };
  }

  const previousState = {
    isBanned: Boolean(student.isBanned),
    banReason: student.banReason || "",
  };

  student.isBanned = false;
  student.banReason = "";
  student.bannedAt = null;
  await student.save();

  const updatedStudent = student.toObject();
  await createGovernanceLogEntry({
    actor: authResult.user,
    action: GOVERNANCE_ACTIONS.STUDENT_UNBANNED,
    targetUser: updatedStudent,
    severity: AUDIT_SEVERITY.INFO,
    details: {
      previousState,
      nextState: {
        isBanned: false,
        banReason: "",
      },
    },
  });

  return { success: true, data: mapUser(updatedStudent) };
}

export async function unbanStudentByEmailAction(superAdminId, studentEmail) {
  await connectToDatabase();

  const authResult = await requireSuperAdmin(superAdminId);
  if (!authResult.success) {
    return authResult;
  }

  const normalizedStudentEmail = normalizeEmail(studentEmail);
  if (!isValidEmailAddress(normalizedStudentEmail)) {
    return { success: false, error: "Invalid student email" };
  }

  const student = await User.findOne({ email: normalizedStudentEmail });
  if (!student || normalizeRole(student.role) !== APP_ROLES.STUDENT) {
    return { success: false, error: "Student not found" };
  }

  const previousState = {
    isBanned: Boolean(student.isBanned),
    banReason: student.banReason || "",
  };

  student.isBanned = false;
  student.banReason = "";
  student.bannedAt = null;
  await student.save();

  const updatedStudent = student.toObject();
  await createGovernanceLogEntry({
    actor: authResult.user,
    action: GOVERNANCE_ACTIONS.STUDENT_UNBANNED,
    targetUser: updatedStudent,
    severity: AUDIT_SEVERITY.INFO,
    details: {
      previousState,
      nextState: {
        isBanned: false,
        banReason: "",
      },
      lookupEmail: normalizedStudentEmail,
    },
  });

  return { success: true, data: mapUser(updatedStudent) };
}

export async function dismissUserAction(superAdminId, targetEmail, reason) {
  await connectToDatabase();

  const authResult = await requireSuperAdmin(superAdminId);
  if (!authResult.success) {
    return authResult;
  }

  const normalizedTargetEmail = normalizeEmail(targetEmail);
  if (!isValidEmailAddress(normalizedTargetEmail)) {
    return { success: false, error: "Invalid user email" };
  }

  const target = await User.findOne({ email: normalizedTargetEmail });
  if (!target) {
    return { success: false, error: "User not found" };
  }

  if (isSuperAdminRole(target.role)) {
    return { success: false, error: "Superadmin cannot be dismissed" };
  }

  const previousState = {
    isDismissed: Boolean(target.isDismissed),
    dismissalReason: target.dismissalReason || "",
    isBanned: Boolean(target.isBanned),
    banReason: target.banReason || "",
  };
  const normalizedReason = normalizeText(reason);

  target.isDismissed = true;
  target.dismissalReason = normalizedReason;
  target.dismissedAt = new Date();
  target.dismissedBy = authResult.userId;
  target.isBanned = true;
  if (!target.banReason) {
    target.banReason = "Dismissed by superadmin";
  }
  target.bannedAt = target.bannedAt || new Date();
  await target.save();

  const updatedTarget = target.toObject();
  await createGovernanceLogEntry({
    actor: authResult.user,
    action: GOVERNANCE_ACTIONS.USER_DISMISSED,
    targetUser: updatedTarget,
    severity: AUDIT_SEVERITY.CRITICAL,
    details: {
      previousState,
      nextState: {
        isDismissed: true,
        dismissalReason: updatedTarget.dismissalReason || "",
        isBanned: true,
        banReason: updatedTarget.banReason || "",
      },
      lookupEmail: normalizedTargetEmail,
    },
  });

  return { success: true, data: mapUser(updatedTarget) };
}

export async function restoreDismissedUserAction(superAdminId, targetUserId) {
  await connectToDatabase();

  const authResult = await requireSuperAdmin(superAdminId);
  if (!authResult.success) {
    return authResult;
  }

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return { success: false, error: "Invalid user" };
  }

  const target = await User.findById(targetUserId);
  if (!target) {
    return { success: false, error: "User not found" };
  }

  if (isSuperAdminRole(target.role)) {
    return { success: false, error: "Superadmin cannot be restored here" };
  }

  const previousState = {
    isDismissed: Boolean(target.isDismissed),
    dismissalReason: target.dismissalReason || "",
  };

  target.isDismissed = false;
  target.dismissalReason = "";
  target.dismissedAt = null;
  target.dismissedBy = null;

  await target.save();

  const updatedTarget = target.toObject();
  await createGovernanceLogEntry({
    actor: authResult.user,
    action: GOVERNANCE_ACTIONS.USER_RESTORED,
    targetUser: updatedTarget,
    severity: AUDIT_SEVERITY.WARNING,
    details: {
      previousState,
      nextState: {
        isDismissed: false,
        dismissalReason: "",
      },
    },
  });

  return { success: true, data: mapUser(updatedTarget) };
}

export async function updateStudentAcademicAction(
  superAdminId,
  studentId,
  payload,
) {
  await connectToDatabase();

  const authResult = await requireSuperAdmin(superAdminId);
  if (!authResult.success) {
    return authResult;
  }

  void studentId;
  void payload;

  return {
    success: false,
    error:
      "Student detail editing is disabled. Superadmin has read-only access to student details.",
  };
}

export async function getDismissedUsersAction(superAdminId) {
  await connectToDatabase();

  const authResult = await requireSuperAdmin(superAdminId);
  if (!authResult.success) {
    return authResult;
  }

  const users = await User.find({ isDismissed: true })
    .sort({ dismissedAt: -1 })
    .lean();

  return { success: true, data: users.map(mapUser) };
}

export async function setDismissedUserBanAction(
  superAdminId,
  targetUserId,
  shouldBan,
  reason,
) {
  await connectToDatabase();

  const authResult = await requireSuperAdmin(superAdminId);
  if (!authResult.success) {
    return authResult;
  }

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return { success: false, error: "Invalid user" };
  }

  const user = await User.findById(targetUserId);
  if (!user || !user.isDismissed) {
    return { success: false, error: "Dismissed user not found" };
  }

  const previousState = {
    isBanned: Boolean(user.isBanned),
    banReason: user.banReason || "",
  };

  user.isBanned = normalizeBoolean(shouldBan);
  if (user.isBanned) {
    user.banReason =
      normalizeText(reason) || user.banReason || "Banned by superadmin";
    user.bannedAt = user.bannedAt || new Date();
  } else {
    user.banReason = "";
    user.bannedAt = null;
  }

  await user.save();

  const updatedUser = user.toObject();
  await createGovernanceLogEntry({
    actor: authResult.user,
    action: GOVERNANCE_ACTIONS.DISMISSED_USER_BAN_UPDATED,
    targetUser: updatedUser,
    severity: updatedUser.isBanned
      ? AUDIT_SEVERITY.WARNING
      : AUDIT_SEVERITY.INFO,
    details: {
      previousState,
      nextState: {
        isBanned: Boolean(updatedUser.isBanned),
        banReason: updatedUser.banReason || "",
      },
    },
  });

  return { success: true, data: mapUser(updatedUser) };
}
