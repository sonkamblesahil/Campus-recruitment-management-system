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
      <div className="bg-slate-900 text-white flex flex-col justify-center px-4 sm:px-8 lg:px-16 py-8 sm:py-0">
        <div className="max-w-lg mx-auto w-full">
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-600 flex items-center justify-center shrink-0">
              <GraduationCap className="text-white w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base lg:text-lg xl:text-xl font-bold leading-tight">
                Shri Guru Gobind Singhji Institute of Engineering and Technology
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                TPO Cell SGGSIE&T
              </p>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-5 leading-tight">
            Campus Recruitment <br /> Management System
          </h2>

          <p className="text-sm sm:text-base lg:text-lg text-gray-300 leading-relaxed">
            Create your account to manage your placement profile and track every
            stage of recruitment.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-gray-100 px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-sm bg-white p-4 sm:p-6 shadow-md border border-gray-200 rounded-lg">
          <h3 className="text-xl sm:text-2xl font-semibold text-center mb-4 sm:mb-6">
            Create Account
          </h3>

          {error && (
            <p className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-xs sm:text-sm text-red-700 rounded">
              {error}
            </p>
          )}

          <form className="form-container" action={handleSubmit}>
            <div>
              <label className="text-xs sm:text-sm font-medium flex items-center gap-2 mb-2">
                <User className="w-4 h-4" /> Full Name
              </label>
              <input
                name="name"
                type="text"
                placeholder="Enter your full name"
                className="text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4" /> Email
              </label>
              <input
                name="email"
                type="email"
                placeholder="student@gmail.com"
                className="text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4" /> Password
              </label>
              <input
                name="password"
                type="password"
                placeholder="Enter your password"
                className="text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium flex items-center gap-2 mb-2">
                <User className="w-4 h-4" /> User Type
              </label>
              <select
                name="role"
                defaultValue="student"
                onChange={(event) => setSelectedRole(event.target.value)}
                className="text-xs sm:text-sm"
                required
              >
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium flex items-center gap-2 mb-2">
                <User className="w-4 h-4" /> Branch / Department
              </label>
              <select
                name="branch"
                defaultValue=""
                className="text-xs sm:text-sm"
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
                  <label className="text-xs sm:text-sm font-medium flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" /> Program
                  </label>
                  <select
                    name="program"
                    value={selectedProgram}
                    onChange={(event) => setSelectedProgram(event.target.value)}
                    className="text-xs sm:text-sm"
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
