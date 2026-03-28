"use client";
import React, { useState } from "react";
import {
  analyticsStats,
  companyStudents,
  analyticsYears,
  analyticsTabs,
} from "../../data/analytics";

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("yearly");
  const stats = analyticsStats;
  const years = analyticsYears;
  const tabs = analyticsTabs;

  return (
    <div className="bg-gray-200 h-full p-2">
      <h1 className="text-zinc-600 text-base font-bold mb-4">
        Placement Analytics
      </h1>
      <div className="h-[82vh] rounded-2xl bg-white overflow-hidden">
        {/* Tabs */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 overflow-x-auto whitespace-nowrap">
          <div className="inline-flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? "bg-white shadow-sm text-zinc-700 border-2 border-gray-300"
                    : "text-zinc-500 hover:bg-white hover:text-zinc-700"
                }`}
              >
                {tab === "yearly" && "Yearly Stats"}
                {tab === "companies" && "Company-wise"}
                {tab === "departments" && "Department-wise"}
                {tab === "domains" && "Domain-wise"}
                {tab === "company-students" && "Company Distribution"}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100%-80px)]">
          {activeTab === "yearly" && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-6">
                Yearly Placement Statistics
              </h3>
              <div className="grid md:grid-cols-4 gap-6">
                {stats.yearly.map((year, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 p-6 rounded-xl border border-gray-200"
                  >
                    <h4 className="font-bold text-2xl text-zinc-700">
                      {year.placed}
                    </h4>
                    <p className="text-sm text-gray-600">{year.year}</p>
                    <p className="text-3xl font-bold text-green-600">
                      {year.rate}
                    </p>
                    <p className="text-sm text-gray-500">
                      of {year.total} placed
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "companies" && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-6">Company-wise Analytics</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Top Companies List */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="font-bold text-lg mb-6">
                    Top Companies by Offers
                  </h4>
                  <div className="space-y-4">
                    {stats.companies.map((company, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm"
                      >
                        <div>
                          <div className="font-bold text-gray-900">
                            {company.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {company.domain}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-2xl text-zinc-700">
                            {company.count}
                          </div>
                          <div className="text-xs text-gray-500">
                            Total offers
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Yearly breakdown for companies */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="font-bold text-lg mb-6">
                    Yearly Company Distribution
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-3 text-left font-bold">Company</th>
                          {years.map((year) => (
                            <th
                              key={year}
                              className="p-3 text-center font-bold"
                            >
                              {year}
                            </th>
                          ))}
                          <th className="p-3 text-right font-bold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.companies.map((company, i) => (
                          <tr key={i} className="border-b hover:bg-white">
                            <td className="p-3 font-semibold">
                              {company.name}
                            </td>
                            {years.map((year, y) => (
                              <td
                                key={year}
                                className="p-3 text-center font-mono bg-gray-100 rounded"
                              >
                                {company.yearly[y] || 0}
                              </td>
                            ))}
                            <td className="p-3 font-bold text-right text-zinc-700">
                              {company.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "departments" && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-6">
                Department-wise Analytics
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {stats.departments.map((dept, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 p-6 rounded-xl text-center border border-gray-200"
                  >
                    <h4 className="font-bold text-lg mb-2">{dept.dept}</h4>
                    <div className="text-3xl font-bold text-zinc-700 mb-1">
                      {dept.placed}/{dept.total}
                    </div>
                    <div className="text-xl font-bold text-green-600">
                      {dept.rate}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "domains" && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-6">
                Domain-wise Distribution
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="font-bold text-lg mb-4">Domain Breakdown</h4>
                  <div className="space-y-3">
                    {stats.domains.map((domain, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center p-3 bg-white rounded-lg"
                      >
                        <span className="font-semibold">{domain.domain}</span>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-zinc-700">
                            {domain.placed}
                          </div>
                          <div className="text-sm text-gray-600">
                            {domain.rate}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl grid place-items-center border border-gray-200">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-zinc-700">74%</div>
                    <p className="text-lg font-semibold text-gray-700">
                      Overall Placement Rate
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "company-students" && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-6">Students per Company</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(companyStudents).map(([company, students]) => (
                  <div
                    key={company}
                    className="bg-gray-50 p-6 rounded-xl border border-gray-200"
                  >
                    <h4 className="font-bold text-lg mb-4 text-zinc-700">
                      {company}
                    </h4>
                    <div className="space-y-2">
                      {students.map((student, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-2 bg-white rounded-lg hover:bg-gray-100"
                        >
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-zinc-600">
                              S
                            </span>
                          </div>
                          <span className="font-medium">{student}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
