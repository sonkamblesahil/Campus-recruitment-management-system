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
  }, [admins, searchTerm]);

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
    if (!authUser?.userId || !admin?.id) return;

    const reason =
      window.prompt(
        "Dismissal reason for this admin:",
        admin.dismissalReason || "",
      ) || "";

    setError("");
    setMessage("");
    setUpdatingAdminId(admin.id);

    const result = await dismissUserAction(authUser.userId, admin.id, reason);
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
    <div className="h-full p-2">
      <h1 className="text-zinc-700 text-lg font-bold mb-2">
        Admin Department Management
      </h1>
      {error ? <p className="text-sm text-red-600 mb-2">{error}</p> : null}
      {message ? (
        <p className="text-sm text-green-600 mb-2">{message}</p>
      ) : null}

      <input
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Search admin by name/email/branch"
        className="border border-gray-300 rounded px-3 py-2 text-sm mb-3 min-w-70"
      />

      <div className="bg-white border border-gray-200 rounded-xl h-[72vh] overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="text-left p-3">Admin</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Current Branch</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Assign Branch</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.map((admin) => (
              <tr key={admin.id} className="border-t border-gray-200">
                <td className="p-3 font-medium text-zinc-700">{admin.name}</td>
                <td className="p-3 text-zinc-600">{admin.email}</td>
                <td className="p-3 text-zinc-600">{admin.branchLabel}</td>
                <td className="p-3">
                  {admin.isDismissed ? (
                    <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                      Dismissed
                    </span>
                  ) : admin.isBanned ? (
                    <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
                      Banned
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
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
                    className="border border-gray-300 rounded px-2 py-1"
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
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleClear(admin.id)}
                      disabled={updatingAdminId === admin.id || !admin.branch}
                      className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-60"
                    >
                      Clear Branch
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDismiss(admin)}
                      disabled={
                        updatingAdminId === admin.id || admin.isDismissed
                      }
                      className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-60"
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
  );
}
