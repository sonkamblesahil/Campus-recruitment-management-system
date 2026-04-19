"use client";

import { ArrowRight, GraduationCap, Lock } from "lucide-react";
import { resetPasswordAction, validateResetTokenAction } from "../actions";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = String(searchParams.get("token") || "").trim();

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError("Reset token is missing.");
        setIsTokenValid(false);
        setIsValidating(false);
        return;
      }

      const result = await validateResetTokenAction(token);
      if (!result?.success) {
        setError(result?.error || "Invalid or expired reset token.");
        setIsTokenValid(false);
      } else {
        setError("");
        setIsTokenValid(true);
      }
      setIsValidating(false);
    }

    validateToken();
  }, [token]);

  const handleSubmit = async (formData) => {
    setError("");
    setMessage("");
    setIsLoading(true);

    const result = await resetPasswordAction(formData);

    if (!result?.success) {
      setError(result?.error || "Could not reset password.");
      setIsLoading(false);
      return;
    }

    setMessage("Password updated successfully. Redirecting to login...");
    setIsLoading(false);
    setTimeout(() => {
      router.push("/login");
    }, 1000);
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
            Set New Password
          </h2>

          <p className="text-base lg:text-lg text-gray-300 leading-relaxed">
            Choose a new password for your account to continue to the portal.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-gray-100 px-6 py-8">
        <div className="w-full max-w-sm bg-white p-6 shadow-md border border-gray-200">
          <h3 className="text-2xl font-semibold text-center mb-6">
            Update Password
          </h3>

          {isValidating ? (
            <p className="text-sm text-zinc-600">Validating reset token...</p>
          ) : (
            <>
              {error && (
                <p className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              {message && (
                <p className="mb-4 border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {message}
                </p>
              )}

              {isTokenValid ? (
                <form className="space-y-4" action={handleSubmit}>
                  <input name="token" type="hidden" value={token} />

                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-1">
                      <Lock className="w-4 h-4" /> New Password
                    </label>
                    <input
                      name="password"
                      type="password"
                      placeholder="Enter new password"
                      className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-1">
                      <Lock className="w-4 h-4" /> Confirm Password
                    </label>
                    <input
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 transition flex items-center justify-center gap-2"
                  >
                    {isLoading ? "Updating..." : "Update Password"}
                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>
              ) : (
                <p className="text-sm text-zinc-600">
                  Request a new reset link to continue.
                </p>
              )}
            </>
          )}

          <p className="text-sm text-gray-500 text-center mt-4">
            {isTokenValid ? "Back to" : "Go to"}{" "}
            <Link
              href={isTokenValid ? "/login" : "/forgot-password"}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {isTokenValid ? "Login" : "Forgot Password"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-sm text-zinc-600">Loading reset page...</div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
