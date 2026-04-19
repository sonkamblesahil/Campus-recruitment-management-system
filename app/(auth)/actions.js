"use server";

import { randomUUID } from "crypto";
import { APP_ROLES, normalizeRole } from "@/lib/authRoles";
import { connectToDatabase } from "@/lib/mongodb";
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

export async function signupAction(formData) {
  const name = String(formData.get("name") || "").trim();
  const email = normalizeEmail(formData.get("email"));
  const password = normalizePassword(formData.get("password"));
  const role = normalizeRole(formData.get("role"));
  const allowedRoles = [APP_ROLES.ADMIN, APP_ROLES.STUDENT];

  if (!name || !email || !password || !role) {
    return { success: false, error: "All fields are required" };
  }

  if (!allowedRoles.includes(role)) {
    return { success: false, error: "Please select a valid user type" };
  }

  await connectToDatabase();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return { success: false, error: "Email already registered" };
  }

  const user = await User.create({ name, email, password, role });

  // If student, create an empty profile
  if (role === APP_ROLES.STUDENT) {
    const Profile = (await import("@/models/Profile")).default;
    await Profile.create({
      userId: user._id,
      basic: { name, email },
    });
  }

  return {
    success: true,
    userId: String(user._id),
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role),
  };
}

export async function loginAction(formData) {
  const email = normalizeEmail(formData.get("email"));
  const password = normalizePassword(formData.get("password"));

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  await connectToDatabase();

  const user = await User.findOne({ email, password });
  if (!user) {
    return { success: false, error: "Invalid credentials" };
  }

  return {
    success: true,
    userId: String(user._id),
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role),
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
