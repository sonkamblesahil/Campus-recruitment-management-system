export default function Applications() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
      <div className="space-y-4">
        <div className="bg-white/80 p-6 rounded-xl shadow-sm border border-white/50 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-medium text-sm">SE</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Software Engineer - TCS</p>
              <p className="text-sm text-gray-600">Applied 2 days ago</p>
            </div>
          </div>
          <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Interview Scheduled</span>
        </div>
      </div>
    </div>
  );
}
