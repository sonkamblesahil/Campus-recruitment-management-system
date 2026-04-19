"use client";

import { ArrowRight, GraduationCap, Lock, Mail, User } from "lucide-react";
import { signupAction } from "../actions";
import {
  BRANCH_OPTIONS,
  PROGRAM_OPTIONS,
  getAllowedYears,
} from "@/lib/academics";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function SignupPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("student");
  const [selectedProgram, setSelectedProgram] = useState("btech");
  const router = useRouter();

  const allowedYears = useMemo(
    () => getAllowedYears(selectedProgram),
    [selectedProgram],
  );

  const handleSubmit = async (formData) => {
    setError("");
    setIsLoading(true);

    const result = await signupAction(formData);

    if (!result?.success) {
      setError(result?.error || "Signup failed");
      setIsLoading(false);
      return;
    }

    if (result.role === "student" && !result.isProfileVerified) {
      window.alert(
        "Your account is created, but your department admin must verify your profile before you can login.",
      );
      setIsLoading(false);
      router.push("/login");
      return;
    }

    localStorage.setItem(
      "auth_user",
      JSON.stringify({
        userId: result.userId,
        name: result.name,
        email: result.email,
        role: result.role,
        branch: result.branch,
        program: result.program,
        year: result.year,
        isProfileVerified: result.isProfileVerified,
      }),
    );
    window.dispatchEvent(new Event("auth-user-changed"));

    if (result.role === "superadmin") {
      router.push("/superadmin");
      return;
    }

    if (result.role === "admin") {
      router.push("/admin/jobs");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="bg-slate-900 text-white flex flex-col justify-center px-8 lg:px-16">
        <div className="max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-indigo-600 flex items-center justify-center shrink-0">
              <GraduationCap className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-bold leading-snug">
                Shri Guru Gobind Singhji Institute of Engineering and Technology
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">TPO Cell SGGSIE&T</p>
            </div>
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold mb-5 leading-tight">
            Campus Recruitment <br /> Management System
          </h2>

          <p className="text-base lg:text-lg text-gray-300 leading-relaxed">
            Create your account to manage your placement profile and track every
            stage of recruitment.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-gray-100 px-6 py-8">
        <div className="w-full max-w-sm bg-white p-6 shadow-md border border-gray-200">
          <h3 className="text-2xl font-semibold text-center mb-6">
            Create Account
          </h3>

          {error && (
            <p className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <form className="space-y-4" action={handleSubmit}>
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-1">
                <User className="w-4 h-4" /> Full Name
              </label>
              <input
                name="name"
                type="text"
                placeholder="Enter your full name"
                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4" /> Email
              </label>
              <input
                name="email"
                type="email"
                placeholder="student@gmail.com"
                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4" /> Password
              </label>
              <input
                name="password"
                type="password"
                placeholder="Enter your password"
                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-1">
                <User className="w-4 h-4" /> User Type
              </label>
              <select
                name="role"
                defaultValue="student"
                onChange={(event) => setSelectedRole(event.target.value)}
                className="w-full border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-1">
                <User className="w-4 h-4" /> Branch / Department
              </label>
              <select
                name="branch"
                defaultValue=""
                className="w-full border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required={selectedRole === "student"}
              >
                <option value="">Select Branch</option>
                {BRANCH_OPTIONS.map((branch) => (
                  <option key={branch.value} value={branch.value}>
                    {branch.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedRole === "student" ? (
              <>
                <div>
                  <label className="text-sm font-medium flex items-center gap-2 mb-1">
                    <User className="w-4 h-4" /> Program
                  </label>
                  <select
                    name="program"
                    value={selectedProgram}
                    onChange={(event) => setSelectedProgram(event.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    {PROGRAM_OPTIONS.map((program) => (
                      <option key={program.value} value={program.value}>
                        {program.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-2 mb-1">
                    <User className="w-4 h-4" /> Year
                  </label>
                  <select
                    name="year"
                    defaultValue=""
                    className="w-full border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select Year</option>
                    {allowedYears.map((year) => (
                      <option key={String(year)} value={String(year)}>
                        Year {year}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 transition flex items-center justify-center gap-2"
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-4">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
