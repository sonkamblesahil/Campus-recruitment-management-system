"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function signupAction(formData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "").trim();

  if (!name || !email || !password) {
    redirect("/auth/signup?error=All%20fields%20are%20required");
  }

  await connectToDatabase();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    redirect("/auth/signup?error=Email%20already%20registered");
  }

  const user = await User.create({ name, email, password });

  const cookieStore = await cookies();
  cookieStore.set("auth_user", String(user._id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/dashboard");
}

export async function loginAction(formData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "").trim();

  if (!email || !password) {
    redirect("/auth/login?error=Email%20and%20password%20are%20required");
  }

  await connectToDatabase();

  const user = await User.findOne({ email, password });
  if (!user) {
    redirect("/auth/login?error=Invalid%20credentials");
  }

  const cookieStore = await cookies();
  cookieStore.set("auth_user", String(user._id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/dashboard");
}

export async function signoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_user");
  redirect("/auth/login");
}
