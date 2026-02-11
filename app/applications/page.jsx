export default function Applications() {
  const applications = [
    { id: 1, company: "Google", position: "Software Engineer", status: "Selected" },
    { id: 2, company: "Facebook", position: "Data Scientist", status: "Rejected" },
    { id: 3, company: "Amazon", position: "Product Manager", status: "Pending" },

  ];

  const getStatusBadge = (status) => {
    const badges = {
      Selected: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Pending: 'bg-orange-100 text-orange-800'
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${badges[status] || ''}`;
  };

  return (
    <div className='bg-gray-400 h-full p-2'>
      <h1 className="text-zinc-600 text-base font-bold">Your Applications</h1>
      <div className='h-[82vh] rounded-2xl flex items-center justify-center bg-white mt-2 overflow-hidden'>
        <div className='w-full h-full p-4 overflow-x-auto'>
          <table className='w-full min-w-100 text-left' role="table">
            <thead>
              <tr>
                <th className='border-b-2 border-gray-300 p-2' role="columnheader">Company</th>
                <th className='border-b-2 border-gray-300 p-2' role="columnheader">Position</th>
                <th className='border-b-2 border-gray-300 p-2' role="columnheader">Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} role="row">
                  <td className='border-b border-gray-300 p-2'>{app.company}</td>
                  <td className='border-b border-gray-300 p-2'>{app.position}</td>
                  <td className='border-b border-gray-300 p-2'>
                    <span className={getStatusBadge(app.status)}>{app.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
