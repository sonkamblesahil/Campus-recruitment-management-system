"use client";
import { useEffect, useState } from "react";
import { getStudentOffersAction, respondToOfferAction } from "./actions";

export default function OffersPage() {
  const [authUser] = useState(() => {
    if (typeof window === "undefined") {
      return null;
    }
    try {
      const rawUser = localStorage.getItem("auth_user");
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  });

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOffers() {
      if (!authUser?.userId) {
        setLoading(false);
        return;
      }

      const result = await getStudentOffersAction(authUser.userId);
      if (!result?.success) {
        setError(result?.error || "Unable to load offers.");
      } else {
        setOffers(result.data || []);
      }
      setLoading(false);
    }

    loadOffers();
  }, [authUser]);

  const handleRespond = async (id, responseStatus) => {
    if (!authUser?.userId) return;

    const result = await respondToOfferAction(
      authUser.userId,
      id,
      responseStatus,
    );
    if (result.success) {
      setOffers((prevOffers) =>
        prevOffers.map((o) =>
          o.id === id ? { ...o, status: responseStatus } : o,
        ),
      );
    } else {
      setError(result.error || "Failed to respond to offer.");
    }
  };

  if (!authUser || authUser.role !== "student") {
    return <div className="p-4 text-sm text-red-600">Access Restricted</div>;
  }

  if (loading) {
    return <div className="p-4 text-sm text-zinc-600">Loading offers...</div>;
  }

  return (
    <div className="bg-gray-200 h-full p-2">
      <h1 className="text-zinc-600 text-base font-bold">Your Offers</h1>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      <div className="h-[82vh] rounded-2xl bg-white mt-2 overflow-auto">
        <div className="w-full p-4">
          <ul
            className="w-full list-none p-0"
            role="table"
            aria-label="Job offers table"
          >
            {offers.length === 0 ? (
              <div className="flex items-center justify-center p-4 text-sm text-zinc-500">
                You have no offers at this time.
              </div>
            ) : (
              <>
                <li className="flex bg-gray-50 border-b-2 border-gray-300">
                  <span className="flex-1 p-2 font-bold border-r border-gray-300">
                    Company
                  </span>
                  <span className="flex-1 p-2 font-bold border-r border-gray-300">
                    Position
                  </span>
                  <span className="w-24 p-2 font-bold border-r border-gray-300">
                    CTC
                  </span>
                  <span className="flex-1 p-2 font-bold border-r border-gray-300">
                    Date Issued
                  </span>
                  <span className="flex-1 p-2 font-bold text-center border-r border-gray-300">
                    Status
                  </span>
                  <span className="flex-1 p-2 font-bold text-center">
                    Actions
                  </span>
                </li>

                {/* Rows */}
                {offers.map((offer) => (
                  <li key={offer.id} className="border-b border-gray-300">
                    <div className="flex items-center hover:bg-gray-50">
                      <span className="flex-1 p-2 border-r border-gray-300 font-medium">
                        {offer.companyName}
                      </span>
                      <span className="flex-1 p-2 border-r border-gray-300">
                        {offer.jobTitle}
                      </span>
                      <span className="w-24 p-2 border-r border-gray-300 font-semibold text-green-700">
                        {offer.offeredCTC}
                      </span>
                      <span className="flex-1 p-2 border-r border-gray-300 text-gray-600">
                        {offer.issuedAt}
                      </span>
                      <span className="flex-1 p-2 text-center border-r border-gray-300 font-medium">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            offer.status === "accepted"
                              ? "bg-green-100 text-green-800"
                              : offer.status === "declined"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {offer.status.charAt(0).toUpperCase() +
                            offer.status.slice(1)}
                        </span>
                      </span>
                      <span className="flex-1 p-2 flex gap-2 justify-center">
                        {offer.status === "pending" ? (
                          <>
                            <button
                              onClick={() =>
                                handleRespond(offer.id, "accepted")
                              }
                              className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() =>
                                handleRespond(offer.id, "declined")
                              }
                              className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                            >
                              Decline
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-zinc-400 italic">
                            No action needed
                          </span>
                        )}
                      </span>
                    </div>
                  </li>
                ))}
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
