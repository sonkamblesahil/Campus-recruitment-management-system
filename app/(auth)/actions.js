"use server";

import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function signupAction(formData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "").trim();
  const role = String(formData.get("role") || "")
    .trim()
    .toLowerCase();
  const allowedRoles = ["admin", "student"];

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

  return {
    success: true,
    userId: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function loginAction(formData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "").trim();

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
    role: user.role,
  };
}

export async function signoutAction() {
  return { success: true };
}
