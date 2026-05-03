"use server";

import mongoose from "mongoose";
import {
  BRANCH_VALUES,
  getAllowedYears,
  getBranchLabel,
  isValidProgram,
  normalizeBranch,
  normalizeProgram,
} from "@/lib/academics";
import { APP_ROLES, isAdminRole } from "@/lib/authRoles";
import { getStudentAttributes } from "@/lib/jobEligibility";
import { connectToDatabase } from "@/lib/mongodb";
import Profile from "@/models/Profile";
import User from "@/models/User";

function normalizeText(value) {
  return String(value || "").trim();
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

async function requireAdmin(userId) {
  const normalizedUserId = normalizeText(userId);
  if (!mongoose.Types.ObjectId.isValid(normalizedUserId)) {
    return { success: false, error: "Invalid user ID" };
  }

  const user = await User.findById(normalizedUserId).lean();
  if (!user || !isAdminRole(user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  return { success: true, user };
}

function mapStudentWithProfile(user, profile) {
  const attributes = getStudentAttributes(profile, user);

  return {
    id: String(user._id),
    name: user.name || "",
    email: user.email || "",
    branch: user.branch || "",
    branchLabel: user.branch ? getBranchLabel(user.branch) : "Unassigned",
    program: user.program || "",
    year: user.year ?? null,
    cgpa: attributes.cgpa,
    class12Percentage: attributes.class12Percentage,
    currentSemester: attributes.semester,
    phone: attributes.phone,
    isBanned: Boolean(user.isBanned),
    isDismissed: Boolean(user.isDismissed),
    isProfileVerified: Boolean(user.isProfileVerified),
    profileVerifiedAt: user.profileVerifiedAt
      ? new Date(user.profileVerifiedAt).toISOString()
      : null,
  };
}

export async function verifyStudentProfileAction(adminId, studentId) {
  try {
    await connectToDatabase();

    const adminResult = await requireAdmin(adminId);
    if (!adminResult.success) {
      return adminResult;
    }

    const normalizedStudentId = normalizeText(studentId);
    if (!mongoose.Types.ObjectId.isValid(normalizedStudentId)) {
      return { success: false, error: "Invalid student ID" };
    }

    const assignedBranch = normalizeBranch(adminResult.user?.branch);
    if (!BRANCH_VALUES.includes(assignedBranch)) {
      return {
        success: false,
        error:
          "No department assigned to this admin. Ask superadmin to assign a branch.",
      };
    }

    const student = await User.findOne({
      _id: normalizedStudentId,
      role: APP_ROLES.STUDENT,
      branch: assignedBranch,
    });

    if (!student) {
      return {
        success: false,
        error: "Student not found for this department",
      };
    }

    if (student.isProfileVerified) {
      return { success: true, message: "Student profile is already verified" };
    }

    student.isProfileVerified = true;
    student.profileVerifiedAt = new Date();
    student.profileVerifiedBy = adminResult.user._id;
    await student.save();

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to verify student profile",
    };
  }
}

export async function getAdminDepartmentStudentsAction(adminId, filters = {}) {
  try {
    await connectToDatabase();

    const adminResult = await requireAdmin(adminId);
    if (!adminResult.success) {
      return adminResult;
    }

    const assignedBranch = normalizeBranch(adminResult.user?.branch);
    if (!BRANCH_VALUES.includes(assignedBranch)) {
      return {
        success: false,
        error:
          "No department assigned to this admin. Ask superadmin to assign a branch.",
      };
    }

    const programFilter = normalizeProgram(filters?.program);
    const hasProgramFilter = isValidProgram(programFilter);

    const searchFilter = normalizeText(filters?.search).toLowerCase();
    const selectedYearFilter = parseYearFilter(filters?.year);

    const minCgpaFilter = toNullableNumber(filters?.minCgpa);
    const maxCgpaFilter = toNullableNumber(filters?.maxCgpa);
    const minClass12Filter = toNullableNumber(filters?.minClass12Percentage);
    const maxClass12Filter = toNullableNumber(filters?.maxClass12Percentage);

    const query = {
      role: APP_ROLES.STUDENT,
      branch: assignedBranch,
    };

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
      mapStudentWithProfile(
        student,
        profileByStudentId.get(String(student._id)),
      ),
    );

    const marksFilteredStudents = enrichedStudents.filter((student) => {
      const searchMatch =
        !searchFilter ||
        String(student.name || "")
          .toLowerCase()
          .includes(searchFilter) ||
        String(student.email || "")
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
        department: assignedBranch,
        departmentLabel: getBranchLabel(assignedBranch),
        students: yearFilteredStudents,
        yearTabs: Array.from(yearCounts.entries()).map(([year, count]) => ({
          year,
          count,
        })),
        totalStudents: yearFilteredStudents.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load department students",
    };
  }
}
