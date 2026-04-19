"use server";

import mongoose from "mongoose";
import { APP_ROLES, isSuperAdminRole, normalizeRole } from "@/lib/authRoles";
import {
  BRANCH_OPTIONS,
  BRANCH_VALUES,
  getBranchLabel,
  getAllowedYears,
  isValidYearForProgram,
  normalizeBranch,
} from "@/lib/academics";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = normalizeText(value).toLowerCase();
  return normalized === "true";
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

export async function getSuperAdminOverviewAction(superAdminId) {
  await connectToDatabase();

  const authResult = await requireSuperAdmin(superAdminId);
  if (!authResult.success) {
    return authResult;
  }

  const [admins, students] = await Promise.all([
    User.find({ role: APP_ROLES.ADMIN }).lean(),
    User.find({ role: APP_ROLES.STUDENT }).lean(),
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
      adminsByBranch,
      studentsByBranch,
      branches: BRANCH_OPTIONS,
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

  admin.branch = normalizedBranch;
  await admin.save();

  return { success: true, data: mapUser(admin.toObject()) };
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

  admin.branch = undefined;
  await admin.save();

  return { success: true, data: mapUser(admin.toObject()) };
}

export async function getStudentManagementAction(superAdminId) {
  await connectToDatabase();

  const authResult = await requireSuperAdmin(superAdminId);
  if (!authResult.success) {
    return authResult;
  }

  const students = await User.find({ role: APP_ROLES.STUDENT })
    .sort({ createdAt: -1 })
    .lean();

  return {
    success: true,
    data: {
      students: students.map(mapUser),
      branches: BRANCH_OPTIONS,
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

  student.isBanned = true;
  student.banReason = normalizeText(reason);
  student.bannedAt = new Date();
  await student.save();

  return { success: true, data: mapUser(student.toObject()) };
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

  student.isBanned = false;
  student.banReason = "";
  student.bannedAt = null;
  await student.save();

  return { success: true, data: mapUser(student.toObject()) };
}

export async function dismissUserAction(superAdminId, targetUserId, reason) {
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
    return { success: false, error: "Superadmin cannot be dismissed" };
  }

  target.isDismissed = true;
  target.dismissalReason = normalizeText(reason);
  target.dismissedAt = new Date();
  target.dismissedBy = authResult.userId;
  target.isBanned = true;
  if (!target.banReason) {
    target.banReason = "Dismissed by superadmin";
  }
  target.bannedAt = target.bannedAt || new Date();
  await target.save();

  return { success: true, data: mapUser(target.toObject()) };
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

  target.isDismissed = false;
  target.dismissalReason = "";
  target.dismissedAt = null;
  target.dismissedBy = null;

  await target.save();

  return { success: true, data: mapUser(target.toObject()) };
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

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return { success: false, error: "Invalid student" };
  }

  const student = await User.findById(studentId);
  if (!student || normalizeRole(student.role) !== APP_ROLES.STUDENT) {
    return { success: false, error: "Student not found" };
  }

  const nextBranch = normalizeBranch(payload?.branch);
  const nextProgram = normalizeText(payload?.program).toLowerCase();
  const nextYear = Number.parseInt(String(payload?.year || ""), 10);

  if (!BRANCH_VALUES.includes(nextBranch)) {
    return { success: false, error: "Invalid branch" };
  }

  if (!["btech", "mtech"].includes(nextProgram)) {
    return { success: false, error: "Invalid program" };
  }

  if (!isValidYearForProgram(nextProgram, nextYear)) {
    const allowed = getAllowedYears(nextProgram).join(", ");
    return {
      success: false,
      error: `Year must be one of: ${allowed}`,
    };
  }

  student.branch = nextBranch;
  student.program = nextProgram;
  student.year = nextYear;
  await student.save();

  return { success: true, data: mapUser(student.toObject()) };
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

  return { success: true, data: mapUser(user.toObject()) };
}
