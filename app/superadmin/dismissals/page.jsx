"use client";

import { useEffect, useMemo, useState } from "react";
import {
  dismissUserAction,
  getDismissedUsersAction,
  restoreDismissedUserAction,
  setDismissedUserBanAction,
  unbanStudentByEmailAction,
} from "../actions";

export default function SuperAdminDismissalsPage() {
  const [authUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const rawUser = localStorage.getItem("auth_user");
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(() => Boolean(authUser?.userId));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [manualDismissEmail, setManualDismissEmail] = useState("");
  const [manualDismissReason, setManualDismissReason] = useState("");
  const [studentUnbanEmail, setStudentUnbanEmail] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState("");

  const loadDismissedUsers = async (superAdminUserId) => {
    const result = await getDismissedUsersAction(superAdminUserId);
    if (!result?.success) {
      setError(result?.error || "Failed to load dismissed users");
      return;
    }

    setUsers(result.data || []);
  };

  useEffect(() => {
    if (!authUser?.userId) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void (async () => {
        await loadDismissedUsers(authUser.userId);
        setLoading(false);
      })();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [authUser?.userId]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return users;

    return users.filter((user) => {
      return (
        String(user.name || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(user.email || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(user.role || "")
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [searchTerm, users]);

  const handleRestore = async (targetUserId) => {
    if (!authUser?.userId || !targetUserId) return;

    setError("");
    setMessage("");
    setUpdatingUserId(targetUserId);

    const result = await restoreDismissedUserAction(
      authUser.userId,
      targetUserId,
    );
    if (!result?.success) {
      setError(result?.error || "Could not restore user");
      setUpdatingUserId("");
      return;
    }

    setUsers((prev) => prev.filter((user) => user.id !== targetUserId));
    setMessage("Dismissed user restored.");
    setUpdatingUserId("");
  };

  const handleToggleBan = async (targetUser) => {
    if (!authUser?.userId || !targetUser?.id) return;

    const shouldBan = !targetUser.isBanned;
    const reason = shouldBan
      ? window.prompt("Ban reason (optional):", targetUser.banReason || "") ||
        ""
      : "";

    setError("");
    setMessage("");
    setUpdatingUserId(targetUser.id);

    const result = await setDismissedUserBanAction(
      authUser.userId,
      targetUser.id,
      shouldBan,
      reason,
    );

    if (!result?.success) {
      setError(result?.error || "Could not update ban status");
      setUpdatingUserId("");
      return;
    }

    setUsers((prev) =>
      prev.map((user) => (user.id === targetUser.id ? result.data : user)),
    );
    setMessage(
      shouldBan ? "Dismissed user banned." : "Dismissed user unbanned.",
    );
    setUpdatingUserId("");
  };

  const handleManualDismiss = async () => {
    if (!authUser?.userId || !manualDismissEmail.trim()) {
      setError("Please provide a valid user email to dismiss");
      return;
    }

    const normalizedEmail = manualDismissEmail.trim().toLowerCase();

    setError("");
    setMessage("");
    setUpdatingUserId(normalizedEmail);

    const result = await dismissUserAction(
      authUser.userId,
      normalizedEmail,
      manualDismissReason,
    );

    if (!result?.success) {
      setError(result?.error || "Could not dismiss user");
      setUpdatingUserId("");
      return;
    }

    setUsers((prev) => [
      result.data,
      ...prev.filter((user) => user.id !== result.data.id),
    ]);
    setManualDismissEmail("");
    setManualDismissReason("");
    setMessage("User dismissed successfully.");
    setUpdatingUserId("");
  };

  const handleStudentUnbanByEmail = async () => {
    if (!authUser?.userId || !studentUnbanEmail.trim()) {
      setError("Please provide a valid student email to unban");
      return;
    }

    const normalizedEmail = studentUnbanEmail.trim().toLowerCase();

    setError("");
    setMessage("");
    setUpdatingUserId(`unban:${normalizedEmail}`);

    const result = await unbanStudentByEmailAction(
      authUser.userId,
      normalizedEmail,
    );

    if (!result?.success) {
      setError(result?.error || "Could not unban student");
      setUpdatingUserId("");
      return;
    }

    setUsers((prev) =>
      prev.map((user) => (user.id === result.data.id ? result.data : user)),
    );
    setStudentUnbanEmail("");
    setMessage("Student unbanned successfully.");
    setUpdatingUserId("");
  };

  if (!authUser || authUser.role !== "superadmin") {
    return <div className="p-4 text-sm text-red-600">Access Restricted</div>;
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-zinc-600">Loading dismissals...</div>
    );
  }

  return (
    <div className="h-full p-2">
      <h1 className="text-zinc-700 text-lg font-bold mb-2">
        Dismissals and Ban Controls
      </h1>
      {error ? <p className="text-sm text-red-600 mb-2">{error}</p> : null}
      {message ? (
        <p className="text-sm text-green-600 mb-2">{message}</p>
      ) : null}

      <div className="bg-white border border-gray-200 rounded-xl p-3 mb-3">
        <h2 className="text-sm font-semibold text-zinc-700 mb-2">
          Manual Dismiss User by Email
        </h2>
        <div className="flex flex-wrap gap-2">
          <input
            value={manualDismissEmail}
            onChange={(event) => setManualDismissEmail(event.target.value)}
            placeholder="User Email"
            className="border border-gray-300 rounded px-3 py-2 text-sm min-w-70"
          />
          <input
            value={manualDismissReason}
            onChange={(event) => setManualDismissReason(event.target.value)}
            placeholder="Dismissal reason"
            className="border border-gray-300 rounded px-3 py-2 text-sm min-w-70"
          />
          <button
            type="button"
            onClick={handleManualDismiss}
            disabled={
              updatingUserId === manualDismissEmail.trim().toLowerCase()
            }
            className="px-3 py-2 text-sm rounded bg-red-600 text-white disabled:opacity-60"
          >
            Dismiss User
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-3 mb-3">
        <h2 className="text-sm font-semibold text-zinc-700 mb-2">
          Unban Student by Email
        </h2>
        <div className="flex flex-wrap gap-2">
          <input
            value={studentUnbanEmail}
            onChange={(event) => setStudentUnbanEmail(event.target.value)}
            placeholder="Student Email"
            className="border border-gray-300 rounded px-3 py-2 text-sm min-w-70"
          />
          <button
            type="button"
            onClick={handleStudentUnbanByEmail}
            disabled={
              updatingUserId ===
              `unban:${studentUnbanEmail.trim().toLowerCase()}`
            }
            className="px-3 py-2 text-sm rounded bg-green-600 text-white disabled:opacity-60"
          >
            Unban Student
          </button>
        </div>
      </div>

      <input
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Search dismissed users"
        className="border border-gray-300 rounded px-3 py-2 text-sm mb-3 min-w-70"
      />

      <div className="bg-white border border-gray-200 rounded-xl h-[58vh] overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Dismissal Reason</th>
              <th className="text-left p-3">Ban State</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-t border-gray-200">
                <td className="p-3">
                  <p className="font-medium text-zinc-700">{user.name}</p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                </td>
                <td className="p-3 uppercase text-zinc-600">{user.role}</td>
                <td className="p-3 text-zinc-600">
                  {user.dismissalReason || "-"}
                </td>
                <td className="p-3">
                  {user.isBanned ? (
                    <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
                      Banned
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                      Not Banned
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleBan(user)}
                      disabled={updatingUserId === user.id}
                      className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700 disabled:opacity-60"
                    >
                      {user.isBanned ? "Unban" : "Ban"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRestore(user.id)}
                      disabled={updatingUserId === user.id}
                      className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 disabled:opacity-60"
                    >
                      Restore
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
