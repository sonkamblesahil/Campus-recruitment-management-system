"use client";

import { useEffect, useState } from "react";
import { getAnalyticsDataAction } from "./actions";
import { Briefcase, FileText, Gift, TrendingUp, Users } from "lucide-react";

function StatCard({ title, value, icon: Icon, colorClass }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm">
      <div className={`p-3 rounded-full ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState({
    totalStudents: 0,
    totalJobs: 0,
    totalApplications: 0,
    totalOffers: 0,
    acceptedOffers: 0,
    maxCTC: "N/A",
    recentJobs: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [authUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const rawUser = localStorage.getItem("auth_user");
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    async function loadData() {
      const result = await getAnalyticsDataAction();
      if (!result?.success) {
        setError("Failed to load analytics");
      } else {
        setData(result.data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-sm text-zinc-600">
        Loading placement analytics...
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="h-full p-2 bg-gray-200">
      <h1 className="text-zinc-700 text-lg font-bold mb-4">
        Placement Analytics Dashboard
      </h1>

      <div className="h-[80vh] overflow-y-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Registered Students"
            value={data.totalStudents}
            icon={Users}
            colorClass="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Active Jobs"
            value={data.totalJobs}
            icon={Briefcase}
            colorClass="bg-indigo-100 text-indigo-600"
          />
          <StatCard
            title="Total Applications"
            value={data.totalApplications}
            icon={FileText}
            colorClass="bg-amber-100 text-amber-600"
          />
          <StatCard
            title="Offers Extended"
            value={data.totalOffers}
            icon={Gift}
            colorClass="bg-purple-100 text-purple-600"
          />
          <StatCard
            title="Offers Accepted"
            value={data.acceptedOffers}
            icon={TrendingUp}
            colorClass="bg-green-100 text-green-600"
          />
          <StatCard
            title="Highest CTC"
            value={data.maxCTC}
            icon={TrendingUp}
            colorClass="bg-emerald-100 text-emerald-600"
          />
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-4">
            Recently Posted Jobs
          </h2>
          {data.recentJobs.length === 0 ? (
            <p className="text-sm text-gray-500">No jobs posted recently.</p>
          ) : (
            <ul className="space-y-3">
              {data.recentJobs.map((job) => (
                <li
                  key={job.id}
                  className="p-4 bg-gray-50 rounded-lg flex items-center justify-between border border-gray-100 hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-bold text-gray-800 text-base">
                      {job.title}
                    </p>
                    <p className="text-sm text-gray-600 font-medium">
                      {job.company}
                    </p>
                  </div>
                  <div className="text-xs bg-white border border-gray-200 px-3 py-1 rounded-full text-gray-600 shadow-sm">
                    Just added
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
