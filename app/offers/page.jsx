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
    <div className="bg-gray-50 min-h-[82vh] p-2 sm:p-3 md:p-4">
      <h1 className="text-sm sm:text-base md:text-lg font-bold text-zinc-800 mb-3 sm:mb-4">
        Your Offers
      </h1>
      {error && <p className="text-xs sm:text-sm text-red-500 mb-2">{error}</p>}

      {/* Mobile Card View */}
      <div className="md:hidden space-y-2 sm:space-y-3">
        {offers.length === 0 ? (
          <div className="flex items-center justify-center p-4 text-xs sm:text-sm text-zinc-500 bg-white rounded-lg">
            You have no offers at this time.
          </div>
        ) : (
          offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Company</p>
                  <p className="text-xs sm:text-sm font-semibold text-zinc-800 truncate">
                    {offer.companyName}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    offer.status === "accepted"
                      ? "bg-green-100 text-green-800"
                      : offer.status === "declined"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                </span>
              </div>

              <div className="flex justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Position</p>
                  <p className="text-xs sm:text-sm font-medium text-zinc-800 truncate">
                    {offer.jobTitle}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">CTC</p>
                  <p className="text-xs sm:text-sm font-semibold text-green-700">
                    {offer.offeredCTC}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500">Date Issued</p>
                <p className="text-xs sm:text-sm text-zinc-700">
                  {offer.issuedAt}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                {offer.status === "pending" ? (
                  <>
                    <button
                      onClick={() => handleRespond(offer.id, "accepted")}
                      className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespond(offer.id, "declined")}
                      className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors"
                    >
                      Decline
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-zinc-400 italic">
                    No action needed
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-300">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Position
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-20">
                  CTC
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Date Issued
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {offers.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    You have no offers at this time.
                  </td>
                </tr>
              ) : (
                offers.map((offer) => (
                  <tr
                    key={offer.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-zinc-800">
                      {offer.companyName}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-700">
                      {offer.jobTitle}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-700">
                      {offer.offeredCTC}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {offer.issuedAt}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
                    </td>
                    <td className="px-4 py-3 text-center">
                      {offer.status === "pending" ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleRespond(offer.id, "accepted")}
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRespond(offer.id, "declined")}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">
                          No action needed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
