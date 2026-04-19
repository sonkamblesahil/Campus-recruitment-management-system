const ROLE_ADMIN = "admin";
const ROLE_STUDENT = "student";
const LEGACY_ROLE_RECRUITER = "recruiter";

export function normalizeRole(value) {
  const normalizedRole = String(value || "")
    .trim()
    .toLowerCase();

  // Keep backward compatibility: legacy recruiter accounts behave as admin.
  if (normalizedRole === LEGACY_ROLE_RECRUITER) {
    return ROLE_ADMIN;
  }

  return normalizedRole;
}

export function isAdminRole(value) {
  return normalizeRole(value) === ROLE_ADMIN;
}

export function isStudentRole(value) {
  return normalizeRole(value) === ROLE_STUDENT;
}

export const APP_ROLES = Object.freeze({
  ADMIN: ROLE_ADMIN,
  STUDENT: ROLE_STUDENT,
});
