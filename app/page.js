"use client"

import { GraduationCap, Mail, Lock, User, ArrowRight } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"


export default function Page() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
  const handleSubmit = (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate authentication delay
    setTimeout(() => {
      setIsLoading(false)
      router.push("/homepage")
    }, 1000)
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

      {/* LEFT */}
      <div className="bg-slate-900 text-white flex flex-col justify-center px-8 lg:px-16">
        <div className="max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <GraduationCap className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-bold leading-snug">Shri Guru Gobind Singhji Institute of Engineering and Technology</h1>
              <p className="text-sm text-gray-400 mt-0.5">TPO Cell SGGSIE&T</p>
            </div>
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold mb-5 leading-tight">
            Campus Recruitment <br /> Management System
          </h2>

          <p className="text-base lg:text-lg text-gray-300 leading-relaxed">
            A centralized platform to manage student placements, recruiter
            coordination, job postings, and application tracking efficiently.
          </p>

          <ul className="mt-6 space-y-2.5 text-sm lg:text-base text-gray-400">
            <li>• Student & recruiter dashboards</li>
            <li>• Job & application tracking</li>
            <li>• Secure role-based access</li>
          </ul>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center justify-center bg-gray-100 px-6 py-8">
        <div className="w-full max-w-sm bg-white p-6 rounded-xl shadow-md">
          {/* Toggle Tabs */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                !isSignUp 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                isSignUp 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign Up
            </button>
          </div>

          <h3 className="text-2xl font-semibold text-center mb-6">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h3>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Name field - only for signup */}
            {isSignUp && (
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-1">
                  <User className="w-4 h-4" /> Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4" /> Email
              </label>
              <input
                type="email"
                placeholder="student@gmail.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4" /> Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

           

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  {isSignUp ? "Creating Account..." : "Signing In..."}
                </>
              ) : (
                <>
                  {isSignUp ? "Create Account" : "Login"} 
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch prompt */}
          <p className="text-sm text-gray-500 text-center mt-4">
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <button 
                  onClick={() => setIsSignUp(false)} 
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Login
                </button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <button 
                  onClick={() => setIsSignUp(true)} 
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Sign Up
                </button>
              </>
            )}
          </p>

          <div className="text-xs text-gray-500 text-center mt-6 pt-4 border-t border-gray-200">
            <p>© {new Date().getFullYear()} SGGSIE&T - TPO Cell</p>
            <p className="mt-1">Developed by <span className="font-medium text-indigo-600">sahilsonkamble</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
