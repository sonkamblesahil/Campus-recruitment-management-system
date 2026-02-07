"use client";

export default function OffersPage() {
  const offers = [
    {
      id: 1,
      company: "Google",
      position: "Software Engineer",
      salary: "$140k",
      location: "Remote",
      description:
        "Work on scalable distributed systems, improve search infrastructure, and collaborate with cross-functional teams.",
    },
    {
      id: 2,
      company: "Facebook",
      position: "Data Scientist",
      salary: "$160k",
      location: "San Francisco",
      description:
        "Analyze large-scale user data, build predictive models, and support product decision-making with insights.",
    },
    {
      id: 3,
      company: "Amazon",
      position: "Product Manager",
      salary: "$155k",
      location: "Seattle",
      description:
        "Own end-to-end product lifecycle, define roadmaps, and work closely with engineering and business teams.",
    },
  ];

  const handleAccept = (id) => {
    console.log(`Accepted offer ${id}`);
  };

  const handleReject = (id) => {
    console.log(`Rejected offer ${id}`);
  };

  return (
    <div className="bg-gray-400 h-full p-2">
      <h1 className="text-zinc-600 text-base font-bold">Your Offers</h1>

      <div className="h-[82vh] rounded-2xl bg-white mt-2 overflow-auto">
        <div className="w-full p-4">
          <ul className="w-full list-none p-0" role="table" aria-label="Job offers table">

            {/* Header */}
            <li className="flex bg-gray-50 border-b-2 border-gray-300">
              <span className="flex-1 p-2 font-bold border-r border-gray-300">
                Company
              </span>
              <span className="flex-1 p-2 font-bold border-r border-gray-300">
                Position
              </span>
              <span className="w-24 p-2 font-bold border-r border-gray-300">
                Salary
              </span>
              <span className="flex-1 p-2 font-bold border-r border-gray-300">
                Location
              </span>
              <span className="flex-1 p-2 font-bold">
                Actions
              </span>
            </li>

            {/* Rows */}
            {offers.map((offer) => (
              <li key={offer.id} className="border-b border-gray-300">

                {/* Main row */}
                <div className="flex items-center hover:bg-gray-50">
                  <span className="flex-1 p-2 border-r border-gray-300 font-medium">
                    {offer.company}
                  </span>
                  <span className="flex-1 p-2 border-r border-gray-300">
                    {offer.position}
                  </span>
                  <span className="w-24 p-2 border-r border-gray-300 font-semibold text-green-700">
                    {offer.salary}
                  </span>
                  <span className="flex-1 p-2 border-r border-gray-300 text-gray-600">
                    {offer.location}
                  </span>
                  <span className="flex-1 p-2 flex gap-2 justify-end">
                    <button
                      onClick={() => handleAccept(offer.id)}
                      className="px-4 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(offer.id)}
                      className="px-4 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                    >
                      Reject
                    </button>
                  </span>
                </div>

                {/* Description row */}
                <div className="bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  <span className="font-medium text-gray-600">
                    Description:
                  </span>{" "}
                  {offer.description}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
