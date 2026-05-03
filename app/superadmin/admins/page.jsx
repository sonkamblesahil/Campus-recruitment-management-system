"use client";

import { useEffect, useMemo, useState } from "react";
import {
  assignAdminBranchAction,
  clearAdminBranchAction,
  dismissUserAction,
  getAdminManagementAction,
} from "../actions";

export default function SuperAdminAdminsPage() {
  const [authUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const rawUser = localStorage.getItem("auth_user");
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  });

  const [admins, setAdmins] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(() => Boolean(authUser?.userId));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [updatingAdminId, setUpdatingAdminId] = useState("");

  useEffect(() => {
    if (!authUser?.userId) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void (async () => {
        const result = await getAdminManagementAction(authUser.userId);
        if (!result?.success) {
          setError(result?.error || "Failed to load admins");
        } else {
          setAdmins(result.data.admins || []);
          setBranches(result.data.branches || []);
        }
        setLoading(false);
      })();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [authUser?.userId]);

  const filteredAdmins = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return admins;

    return admins.filter((admin) => {
      const branchMatch =
        branchFilter === "all" ||
        String(admin.branch || "").toUpperCase() === branchFilter;

      if (!branchMatch) {
        return false;
      }

      return (
        String(admin.name || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(admin.email || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(admin.branch || "")
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [admins, branchFilter, searchTerm]);

  const handleAssign = async (adminId, branch) => {
    if (!authUser?.userId || !adminId || !branch) return;

    setError("");
    setMessage("");
    setUpdatingAdminId(adminId);

    const result = await assignAdminBranchAction(
      authUser.userId,
      adminId,
      branch,
    );
    if (!result?.success) {
      setError(result?.error || "Could not assign branch");
      setUpdatingAdminId("");
      return;
    }

    setAdmins((prev) =>
      prev.map((admin) => (admin.id === adminId ? result.data : admin)),
    );
    setMessage("Admin branch assigned successfully.");
    setUpdatingAdminId("");
  };

  const handleClear = async (adminId) => {
    if (!authUser?.userId || !adminId) return;

    setError("");
    setMessage("");
    setUpdatingAdminId(adminId);

    const result = await clearAdminBranchAction(authUser.userId, adminId);
    if (!result?.success) {
      setError(result?.error || "Could not clear branch");
      setUpdatingAdminId("");
      return;
    }

    setAdmins((prev) =>
      prev.map((admin) => (admin.id === adminId ? result.data : admin)),
    );
    setMessage("Admin branch cleared.");
    setUpdatingAdminId("");
  };

  const handleDismiss = async (admin) => {
    if (!authUser?.userId || !admin?.email) return;

    const reason =
      window.prompt(
        "Dismissal reason for this admin:",
        admin.dismissalReason || "",
      ) || "";

    setError("");
    setMessage("");
    setUpdatingAdminId(admin.id);

    const result = await dismissUserAction(
      authUser.userId,
      admin.email,
      reason,
    );
    if (!result?.success) {
      setError(result?.error || "Could not dismiss admin");
      setUpdatingAdminId("");
      return;
    }

    setAdmins((prev) =>
      prev.map((item) => (item.id === admin.id ? result.data : item)),
    );
    setMessage("Admin dismissed.");
    setUpdatingAdminId("");
  };

  if (!authUser || authUser.role !== "superadmin") {
    return <div className="p-4 text-sm text-red-600">Access Restricted</div>;
  }

  if (loading) {
    return <div className="p-4 text-sm text-zinc-600">Loading admins...</div>;
  }

  return (
    <div className="min-h-[82vh] p-2 sm:p-3 md:p-4 bg-gray-50">
      <h1 className="text-sm sm:text-base md:text-lg font-bold text-zinc-800 mb-1 sm:mb-2">
        Admin Department Management
      </h1>
      {error ? (
        <p className="text-xs sm:text-sm text-red-600 mb-2">{error}</p>
      ) : null}
      {message ? (
        <p className="text-xs sm:text-sm text-green-600 mb-2">{message}</p>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-2 mb-3 sm:mb-4">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search admin by name/email/branch"
          className="flex-1 border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm"
        />
        <select
          value={branchFilter}
          onChange={(event) => setBranchFilter(event.target.value)}
          className="border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm w-full sm:w-auto"
        >
          <option value="all">All Branches</option>
          {branches.map((branch) => (
            <option key={branch.value} value={branch.value}>
              {branch.label}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-2 sm:space-y-3">
        {filteredAdmins.length === 0 ? (
          <p className="p-4 text-xs sm:text-sm text-zinc-500 bg-white rounded-lg">
            No admins found.
          </p>
        ) : (
          filteredAdmins.map((admin) => (
            <div
              key={admin.id}
              className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Admin Name</p>
                  <p className="text-xs sm:text-sm font-semibold text-zinc-800 truncate">
                    {admin.name}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {admin.email}
                  </p>
                </div>
                {admin.isDismissed ? (
                  <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700 font-semibold whitespace-nowrap">
                    Dismissed
                  </span>
                ) : admin.isBanned ? (
                  <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 font-semibold whitespace-nowrap">
                    Banned
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 font-semibold whitespace-nowrap">
                    Active
                  </span>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-500">Current Branch</p>
                <p className="text-xs sm:text-sm font-medium text-zinc-800">
                  {admin.branchLabel || "None"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-2">Assign Branch</p>
                <select
                  defaultValue=""
                  disabled={updatingAdminId === admin.id}
                  onChange={(event) => {
                    if (event.target.value) {
                      void handleAssign(admin.id, event.target.value);
                      event.target.value = "";
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs sm:text-sm"
                >
                  <option value="">Select branch</option>
                  {branches.map((branch) => (
                    <option key={branch.value} value={branch.value}>
                      {branch.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleClear(admin.id)}
                  disabled={updatingAdminId === admin.id || !admin.branch}
                  className="flex-1 px-2 py-2 text-xs sm:text-sm rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-medium disabled:opacity-60 transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleDismiss(admin)}
                  disabled={updatingAdminId === admin.id || admin.isDismissed}
                  className="flex-1 px-2 py-2 text-xs sm:text-sm rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 font-medium disabled:opacity-60 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[72vh]">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="text-left p-3 text-xs sm:text-sm">Admin</th>
                <th className="text-left p-3 text-xs sm:text-sm">Email</th>
                <th className="text-left p-3 text-xs sm:text-sm">
                  Current Branch
                </th>
                <th className="text-left p-3 text-xs sm:text-sm">Status</th>
                <th className="text-left p-3 text-xs sm:text-sm">
                  Assign Branch
                </th>
                <th className="text-left p-3 text-xs sm:text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map((admin) => (
                <tr
                  key={admin.id}
                  className="border-t border-gray-200 hover:bg-gray-50"
                >
                  <td className="p-3 font-medium text-zinc-700 text-xs sm:text-sm">
                    {admin.name}
                  </td>
                  <td className="p-3 text-zinc-600 text-xs sm:text-sm">
                    {admin.email}
                  </td>
                  <td className="p-3 text-zinc-600 text-xs sm:text-sm">
                    {admin.branchLabel}
                  </td>
                  <td className="p-3">
                    {admin.isDismissed ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700 font-semibold">
                        Dismissed
                      </span>
                    ) : admin.isBanned ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 font-semibold">
                        Banned
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 font-semibold">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <select
                      defaultValue=""
                      disabled={updatingAdminId === admin.id}
                      onChange={(event) => {
                        if (event.target.value) {
                          void handleAssign(admin.id, event.target.value);
                          event.target.value = "";
                        }
                      }}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-xs sm:text-sm"
                    >
                      <option value="">Select branch</option>
                      {branches.map((branch) => (
                        <option key={branch.value} value={branch.value}>
                          {branch.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => handleClear(admin.id)}
                        disabled={updatingAdminId === admin.id || !admin.branch}
                        className="px-2 py-1 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-medium disabled:opacity-60 transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDismiss(admin)}
                        disabled={
                          updatingAdminId === admin.id || admin.isDismissed
                        }
                        className="px-2 py-1 text-xs rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 font-medium disabled:opacity-60 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
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
