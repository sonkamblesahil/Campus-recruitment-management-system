import Link from "next/link";
export default function StudentDashboard() {
  return (
    <div className="p-4 space-y-3">
      {/* Student Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Welcome Back!</h1>
            <p className="text-lg">Rahul Sharma</p>
            <p className="text-blue-100 text-sm">CSE Final Year</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center self-start sm:self-auto">
            <span className="text-xl font-bold">RS</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl shadow-sm border border-white/50">
          <p className="text-sm font-medium text-gray-700 mb-2">Applied Jobs</p>
          <p className="text-2xl font-bold text-gray-900">12</p>
          <p className="text-sm text-green-600 mt-1">3 responses</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl shadow-sm border border-white/50">
          <p className="text-sm font-medium text-gray-700 mb-2">Interviews</p>
          <p className="text-2xl font-bold text-gray-900">2</p>
          <p className="text-sm text-orange-600 mt-1">Tomorrow 10AM</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl shadow-sm border border-white/50">
          <p className="text-sm font-medium text-gray-700 mb-2">Offers</p>
          <p className="text-2xl font-bold text-gray-900">1</p>
          <p className="text-sm text-blue-600 mt-1">Pending</p>
        </div>
      </div>

      {/* Actions & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link 
              href="/jobs" 
              className="block p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all"
            >
              <h4 className="font-medium text-gray-900 mb-1">Find Jobs</h4>
              <p className="text-sm text-gray-600">Browse opportunities</p>
            </Link>
            <Link 
              href="/applications" 
              className="block p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all"
            >
              <h4 className="font-medium text-gray-900 mb-1">My Applications</h4>
              <p className="text-sm text-gray-600">Track progress</p>
            </Link>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Applications</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-medium">SE</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Software Engineer</p>
                  <p className="text-xs text-gray-500">TCS • 2h ago</p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-medium">DA</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Data Analyst</p>
                  <p className="text-xs text-gray-500">Accenture • 1d ago</p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Interview</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
