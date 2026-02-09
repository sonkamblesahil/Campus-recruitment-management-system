'use client';
import React, { useState } from 'react';

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('yearly');

  const stats = {
    yearly: [
      { year: '2025', placed: 245, total: 320, rate: '76.6%' },
      { year: '2024', placed: 210, total: 300, rate: '70.0%' },
      { year: '2023', placed: 198, total: 295, rate: '67.1%' }
    ],
    companies: [
      { name: 'Google', count: 18, domain: 'SWE', yearly: [6, 8, 4] },
      { name: 'Microsoft', count: 15, domain: 'SWE', yearly: [5, 6, 4] },
      { name: 'Goldman Sachs', count: 12, domain: 'Finance', yearly: [4, 5, 3] },
      { name: 'Amazon', count: 10, domain: 'SWE', yearly: [3, 4, 3] }
    ],
    departments: [
      { dept: 'CSE', placed: 89, total: 120, rate: '74.2%' },
      { dept: 'ECE', placed: 67, total: 95, rate: '70.5%' },
      { dept: 'ME', placed: 45, total: 68, rate: '66.2%' }
    ],
    domains: [
      { domain: 'Software', placed: 156, total: 210, rate: '74.3%' },
      { domain: 'Finance', placed: 34, total: 45, rate: '75.6%' },
      { domain: 'Consulting', placed: 28, total: 38, rate: '73.7%' }
    ]
  };

  const companyStudents = {
    'Google': ['Rahul Sharma', 'Priya Singh', 'Amit Patel'],
    'Microsoft': ['Neha Gupta', 'Vikram Joshi', 'Sneha Rao'],
    'Goldman Sachs': ['Arjun Mehta', 'Divya Reddy']
  };

  const years = ['2025', '2024', '2023'];

  const tabs = ['yearly', 'companies', 'departments', 'domains', 'company-students'];

  return (
    <div className='bg-gray-400 h-full p-2'>
      <h1 className="text-zinc-600 text-base font-bold mb-4">Placement Analytics</h1>
      <div className='h-[82vh] rounded-2xl bg-white overflow-hidden'>
        
        {/* Tabs */}
        <div className="px-6 py-4 bg-gray-100 border-b overflow-x-auto whitespace-nowrap">
          <div className="inline-flex gap-2">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? 'bg-white shadow-sm text-indigo-600 border-2 border-indigo-500'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                }`}
              >
                {tab === 'yearly' && 'Yearly Stats'}
                {tab === 'companies' && 'Company-wise'}
                {tab === 'departments' && 'Department-wise'}
                {tab === 'domains' && 'Domain-wise'}
                {tab === 'company-students' && 'Company Distribution'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100%-80px)]">
          {activeTab === 'yearly' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-6">Yearly Placement Statistics</h3>
              <div className="grid md:grid-cols-4 gap-6">
                {stats.yearly.map((year, i) => (
                  <div key={i} className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border-l-4 border-indigo-500">
                    <h4 className="font-bold text-2xl text-indigo-700">{year.placed}</h4>
                    <p className="text-sm text-gray-600">{year.year}</p>
                    <p className="text-3xl font-bold text-green-600">{year.rate}</p>
                    <p className="text-sm text-gray-500">of {year.total} placed</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'companies' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-6">Company-wise Analytics</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Top Companies List */}
                <div className="bg-emerald-50 p-6 rounded-xl">
                  <h4 className="font-bold text-lg mb-6">Top Companies by Offers</h4>
                  <div className="space-y-4">
                    {stats.companies.map((company, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm">
                        <div>
                          <div className="font-bold text-gray-900">{company.name}</div>
                          <div className="text-sm text-gray-500">{company.domain}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-2xl text-emerald-600">{company.count}</div>
                          <div className="text-xs text-gray-500">Total offers</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Yearly breakdown for companies */}
                <div className="bg-blue-50 p-6 rounded-xl">
                  <h4 className="font-bold text-lg mb-6">Yearly Company Distribution</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-blue-100">
                        <tr>
                          <th className="p-3 text-left font-bold">Company</th>
                          {years.map(year => (
                            <th key={year} className="p-3 text-center font-bold">{year}</th>
                          ))}
                          <th className="p-3 text-right font-bold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.companies.map((company, i) => (
                          <tr key={i} className="border-b hover:bg-white">
                            <td className="p-3 font-semibold">{company.name}</td>
                            {years.map((year, y) => (
                              <td key={year} className="p-3 text-center font-mono bg-blue-50 rounded">
                                {company.yearly[y] || 0}
                              </td>
                            ))}
                            <td className="p-3 font-bold text-right text-blue-600">{company.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'departments' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-6">Department-wise Analytics</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {stats.departments.map((dept, i) => (
                  <div key={i} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl text-center">
                    <h4 className="font-bold text-lg mb-2">{dept.dept}</h4>
                    <div className="text-3xl font-bold text-blue-600 mb-1">{dept.placed}/{dept.total}</div>
                    <div className="text-xl font-bold text-green-600">{dept.rate}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'domains' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-6">Domain-wise Distribution</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-orange-50 p-6 rounded-xl">
                  <h4 className="font-bold text-lg mb-4">Domain Breakdown</h4>
                  <div className="space-y-3">
                    {stats.domains.map((domain, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="font-semibold">{domain.domain}</span>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-orange-600">{domain.placed}</div>
                          <div className="text-sm text-gray-600">{domain.rate}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-green-50 p-6 rounded-xl grid place-items-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">74%</div>
                    <p className="text-lg font-semibold text-gray-700">Overall Placement Rate</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'company-students' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-6">Students per Company</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(companyStudents).map(([company, students]) => (
                  <div key={company} className="bg-gray-50 p-6 rounded-xl border-l-4 border-indigo-500">
                    <h4 className="font-bold text-lg mb-4 text-indigo-700">{company}</h4>
                    <div className="space-y-2">
                      {students.map((student, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 bg-white rounded-lg hover:bg-gray-100">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-indigo-600">S</span>
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
