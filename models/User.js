import mongoose from "mongoose";
import { APP_ROLES, normalizeRole } from "@/lib/authRoles";

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
      enum: [APP_ROLES.ADMIN, APP_ROLES.STUDENT],
      set: normalizeRole,
      required: true,
      default: APP_ROLES.STUDENT,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
