"use server";

import { randomUUID } from "crypto";
import { APP_ROLES, normalizeRole } from "@/lib/authRoles";
import {
  isValidBranch,
  isValidProgram,
  isValidYearForProgram,
  normalizeBranch,
  normalizeProgram,
} from "@/lib/academics";
import { connectToDatabase } from "@/lib/mongodb";
import {
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_NAME,
  SUPER_ADMIN_PASSWORD,
} from "@/lib/superAdmin";
import ResetToken from "@/models/ResetToken";
import User from "@/models/User";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizePassword(value) {
  return String(value || "").trim();
}

function normalizeYear(value) {
  const parsedYear = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsedYear)) {
    return null;
  }

  return parsedYear;
}

async function ensureSuperAdminAccount() {
  await User.findOneAndUpdate(
    { email: SUPER_ADMIN_EMAIL },
    {
      $setOnInsert: {
        email: SUPER_ADMIN_EMAIL,
      },
      $set: {
        name: SUPER_ADMIN_NAME,
        password: SUPER_ADMIN_PASSWORD,
        role: APP_ROLES.SUPERADMIN,
        isBanned: false,
        banReason: "",
        bannedAt: null,
        isDismissed: false,
        dismissalReason: "",
        dismissedAt: null,
        dismissedBy: null,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  );
}

export async function signupAction(formData) {
  const name = String(formData.get("name") || "").trim();
  const email = normalizeEmail(formData.get("email"));
  const password = normalizePassword(formData.get("password"));
  const role = normalizeRole(formData.get("role"));
  const branch = normalizeBranch(formData.get("branch"));
  const program = normalizeProgram(formData.get("program"));
  const year = normalizeYear(formData.get("year"));
  const allowedRoles = [APP_ROLES.ADMIN, APP_ROLES.STUDENT];

  if (!name || !email || !password || !role) {
    return { success: false, error: "All fields are required" };
  }

  if (!allowedRoles.includes(role)) {
    return { success: false, error: "Please select a valid user type" };
  }

  if (email === SUPER_ADMIN_EMAIL) {
    return {
      success: false,
      error: "This email is reserved for superadmin access",
    };
  }

  if (role === APP_ROLES.STUDENT) {
    if (!isValidBranch(branch)) {
      return { success: false, error: "Please select a valid branch" };
    }

    if (!isValidProgram(program)) {
      return { success: false, error: "Please select a valid program" };
    }

    if (!isValidYearForProgram(program, year)) {
      return { success: false, error: "Please select a valid year" };
    }
  }

  if (role === APP_ROLES.ADMIN && branch && !isValidBranch(branch)) {
    return { success: false, error: "Please select a valid branch" };
  }

  await connectToDatabase();
  await ensureSuperAdminAccount();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return { success: false, error: "Email already registered" };
  }

  const userPayload = { name, email, password, role };
  if (role === APP_ROLES.STUDENT) {
    userPayload.branch = branch;
    userPayload.program = program;
    userPayload.year = year;
  }

  if (role === APP_ROLES.ADMIN && branch) {
    userPayload.branch = branch;
  }

  const user = await User.create(userPayload);

  // If student, create an empty profile
  if (role === APP_ROLES.STUDENT) {
    const Profile = (await import("@/models/Profile")).default;
    await Profile.create({
      userId: user._id,
      basic: { name, email },
      academic: {
        department: branch,
      },
    });
  }

  return {
    success: true,
    userId: String(user._id),
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role),
    branch: user.branch || "",
    program: user.program || "",
    year: user.year || null,
  };
}

export async function loginAction(formData) {
  const email = normalizeEmail(formData.get("email"));
  const password = normalizePassword(formData.get("password"));

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  await connectToDatabase();
  await ensureSuperAdminAccount();

  const user = await User.findOne({ email, password });
  if (!user) {
    return { success: false, error: "Invalid credentials" };
  }

  if (user.isDismissed) {
    return {
      success: false,
      error: "Your account has been dismissed. Contact the superadmin.",
    };
  }

  if (user.isBanned) {
    return {
      success: false,
      error: user.banReason
        ? `Your account is banned: ${user.banReason}`
        : "Your account is banned. Contact the superadmin.",
    };
  }

  return {
    success: true,
    userId: String(user._id),
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role),
    branch: user.branch || "",
    program: user.program || "",
    year: user.year || null,
  };
}

export async function signoutAction() {
  return { success: true };
}

export async function requestPasswordResetAction(formData) {
  const email = normalizeEmail(formData.get("email"));

  if (!email) {
    return { success: false, error: "Email is required" };
  }

  await connectToDatabase();

  const user = await User.findOne({ email }).lean();

  // Keep response generic to avoid user enumeration.
  if (!user) {
    return {
      success: true,
      message:
        "If this email exists in our records, a reset link has been generated.",
    };
  }

  const token = randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await ResetToken.deleteMany({ userId: user._id });
  await ResetToken.create({
    userId: user._id,
    token,
    expiresAt,
  });

  return {
    success: true,
    message:
      "If this email exists in our records, a reset link has been generated.",
    resetUrl: `/reset-password?token=${token}`,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function validateResetTokenAction(token) {
  const normalizedToken = String(token || "").trim();
  if (!normalizedToken) {
    return { success: false, error: "Invalid reset token" };
  }

  await connectToDatabase();

  const resetToken = await ResetToken.findOne({
    token: normalizedToken,
  }).lean();
  if (!resetToken) {
    return { success: false, error: "Invalid or expired reset token" };
  }

  if (new Date(resetToken.expiresAt).getTime() <= Date.now()) {
    await ResetToken.deleteOne({ _id: resetToken._id });
    return { success: false, error: "Invalid or expired reset token" };
  }

  const user = await User.findById(resetToken.userId).lean();
  if (!user) {
    await ResetToken.deleteOne({ _id: resetToken._id });
    return { success: false, error: "Invalid or expired reset token" };
  }

  return {
    success: true,
    email: user.email,
  };
}

export async function resetPasswordAction(formData) {
  const token = String(formData.get("token") || "").trim();
  const password = normalizePassword(formData.get("password"));
  const confirmPassword = normalizePassword(formData.get("confirmPassword"));

  if (!token || !password || !confirmPassword) {
    return { success: false, error: "All fields are required" };
  }

  if (password.length < 4) {
    return { success: false, error: "Password must be at least 4 characters" };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match" };
  }

  await connectToDatabase();

  const resetToken = await ResetToken.findOne({ token });
  if (!resetToken || new Date(resetToken.expiresAt).getTime() <= Date.now()) {
    if (resetToken) {
      await ResetToken.deleteOne({ _id: resetToken._id });
    }
    return { success: false, error: "Invalid or expired reset token" };
  }

  const user = await User.findById(resetToken.userId);
  if (!user) {
    await ResetToken.deleteOne({ _id: resetToken._id });
    return { success: false, error: "Invalid or expired reset token" };
  }

  // Intentionally keep plaintext password storage per project requirement.
  user.password = password;
  await user.save();

  await ResetToken.deleteMany({ userId: user._id });

  return { success: true };
}
