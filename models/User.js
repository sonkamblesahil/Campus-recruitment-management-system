import mongoose from "mongoose";
import { APP_ROLES, normalizeRole } from "@/lib/authRoles";
import {
  BRANCH_VALUES,
  PROGRAM_VALUES,
  isValidYearForProgram,
  normalizeBranch,
  normalizeProgram,
} from "@/lib/academics";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: [APP_ROLES.SUPERADMIN, APP_ROLES.ADMIN, APP_ROLES.STUDENT],
      set: normalizeRole,
      required: true,
      default: APP_ROLES.STUDENT,
      lowercase: true,
      trim: true,
    },
    branch: {
      type: String,
      set: (value) => {
        const normalized = normalizeBranch(value);
        return normalized || undefined;
      },
      validate: {
        validator: (value) => !value || BRANCH_VALUES.includes(value),
        message: "Please provide a valid branch",
      },
      required: function requiredBranch() {
        return normalizeRole(this.role) === APP_ROLES.STUDENT;
      },
      trim: true,
      index: true,
    },
    program: {
      type: String,
      enum: PROGRAM_VALUES,
      set: normalizeProgram,
      required: function requiredProgram() {
        return normalizeRole(this.role) === APP_ROLES.STUDENT;
      },
      lowercase: true,
      trim: true,
      index: true,
    },
    year: {
      type: Number,
      required: function requiredYear() {
        return normalizeRole(this.role) === APP_ROLES.STUDENT;
      },
      validate: {
        validator: function validateYear(value) {
          if (value === null || value === undefined) {
            return normalizeRole(this.role) !== APP_ROLES.STUDENT;
          }

          return isValidYearForProgram(this.program, value);
        },
        message: "Please provide a valid year for the selected program",
      },
      min: 1,
      max: 4,
      index: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
      index: true,
    },
    banReason: {
      type: String,
      trim: true,
      default: "",
    },
    bannedAt: {
      type: Date,
      default: null,
    },
    isDismissed: {
      type: Boolean,
      default: false,
      index: true,
    },
    dismissalReason: {
      type: String,
      trim: true,
      default: "",
    },
    dismissedAt: {
      type: Date,
      default: null,
    },
    dismissedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
