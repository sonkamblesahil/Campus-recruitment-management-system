import mongoose from "mongoose";
import { APP_ROLES, normalizeRole } from "@/lib/authRoles";

export const AUDIT_SEVERITY = {
  INFO: "info",
  WARNING: "warning",
  CRITICAL: "critical",
};

export const GOVERNANCE_ACTIONS = {
  ADMIN_BRANCH_ASSIGNED: "admin-branch-assigned",
  ADMIN_BRANCH_CLEARED: "admin-branch-cleared",
  STUDENT_BANNED: "student-banned",
  STUDENT_UNBANNED: "student-unbanned",
  USER_DISMISSED: "user-dismissed",
  USER_RESTORED: "user-restored",
  STUDENT_ACADEMIC_UPDATED: "student-academic-updated",
  DISMISSED_USER_BAN_UPDATED: "dismissed-user-ban-updated",
  JOB_DETAILS_UPDATED: "job-details-updated",
  JOB_STATUS_UPDATED: "job-status-updated",
};

export const GOVERNANCE_ACTION_OPTIONS = [
  {
    value: GOVERNANCE_ACTIONS.ADMIN_BRANCH_ASSIGNED,
    label: "Admin Branch Assigned",
  },
  {
    value: GOVERNANCE_ACTIONS.ADMIN_BRANCH_CLEARED,
    label: "Admin Branch Cleared",
  },
  {
    value: GOVERNANCE_ACTIONS.STUDENT_BANNED,
    label: "Student Banned",
  },
  {
    value: GOVERNANCE_ACTIONS.STUDENT_UNBANNED,
    label: "Student Unbanned",
  },
  {
    value: GOVERNANCE_ACTIONS.USER_DISMISSED,
    label: "User Dismissed",
  },
  {
    value: GOVERNANCE_ACTIONS.USER_RESTORED,
    label: "Dismissed User Restored",
  },
  {
    value: GOVERNANCE_ACTIONS.STUDENT_ACADEMIC_UPDATED,
    label: "Student Academic Updated",
  },
  {
    value: GOVERNANCE_ACTIONS.DISMISSED_USER_BAN_UPDATED,
    label: "Dismissed User Ban Updated",
  },
  {
    value: GOVERNANCE_ACTIONS.JOB_DETAILS_UPDATED,
    label: "Job Details Updated",
  },
  {
    value: GOVERNANCE_ACTIONS.JOB_STATUS_UPDATED,
    label: "Job Status Updated",
  },
];

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actorName: {
      type: String,
      trim: true,
      default: "",
    },
    actorEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    actorRole: {
      type: String,
      enum: [APP_ROLES.SUPERADMIN, APP_ROLES.ADMIN, APP_ROLES.STUDENT],
      set: normalizeRole,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    action: {
      type: String,
      enum: Object.values(GOVERNANCE_ACTIONS),
      required: true,
      index: true,
      trim: true,
    },
    actionLabel: {
      type: String,
      required: true,
      trim: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },
    targetName: {
      type: String,
      trim: true,
      default: "",
    },
    targetEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    targetRole: {
      type: String,
      enum: [APP_ROLES.SUPERADMIN, APP_ROLES.ADMIN, APP_ROLES.STUDENT, ""],
      set: (value) => {
        const normalized = normalizeRole(value);
        return normalized || "";
      },
      default: "",
      trim: true,
    },
    severity: {
      type: String,
      enum: Object.values(AUDIT_SEVERITY),
      default: AUDIT_SEVERITY.INFO,
      index: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

auditLogSchema.index({ createdAt: -1, action: 1, severity: 1 });

const AuditLog =
  mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
