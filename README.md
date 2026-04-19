# Campus Recruitment Management System

Developer README for contributors and maintainers.

## 1. Project Overview

Campus Recruitment Management System (CRMS) is a Next.js App Router application for managing campus placements.

The application supports three roles:

- Superadmin
- Admin
- Student

Core capabilities include:

- Authentication (signup, login, forgot/reset password)
- Automatic superadmin bootstrap and enforcement
- Branch-constrained multi-admin governance
- Student branch/program/year onboarding constraints
- Student profile management
- Job creation and eligibility filtering
- Student job applications
- Admin application review and offer issuance
- Interview scheduling and status tracking
- Superadmin controls for admin assignment, ban, and dismiss/restore workflows
- Placement analytics dashboard
- Eligible student export to Excel

## 2. Tech Stack

- Framework: Next.js 16 (App Router)
- Runtime: React 19
- Database: MongoDB + Mongoose
- Styling: Tailwind CSS 4
- Icons/UI helpers: lucide-react, heroicons
- Spreadsheet export: xlsx
- Linting: ESLint 9 + eslint-config-next

## 3. Key Design Decisions

- Authentication state is currently stored in browser localStorage under auth_user.
- Route guarding is handled in the client shell.
- Role policy is superadmin/admin/student.
- Legacy recruiter values are normalized to admin.
- Student signup is constrained to a controlled branch list plus program/year rules.
- If an admin has an assigned branch, job/application/interview operations are restricted to that branch.
- Passwords are intentionally stored in plain text in this project (per project requirement).
- Password reset links are generated in-app and returned from server actions.
- Superadmin account is auto-seeded/normalized from constants in lib/superAdmin.js.

## 4. Repository Structure

High-level folders:

- app/: Next.js routes, pages, server actions, API routes
- components/: shared UI shell and navigation
- lib/: auth role helpers, MongoDB connection, eligibility logic
- models/: Mongoose schemas
- data/: static data (legacy/demo)
- public/: static assets

Important files:

- app/layout.js
- proxy.js
- lib/mongodb.js
- lib/authRoles.js
- lib/academics.js
- lib/superAdmin.js
- app/(auth)/actions.js
- app/admin/jobs/actions.js
- app/admin/applications/actions.js
- app/jobs/actions.js
- app/applications/actions.js
- app/interviews/actions.js
- app/offers/actions.js
- app/analytics/actions.js
- app/dashboard/actions.js
- app/superadmin/actions.js

## 5. Prerequisites

- Node.js 20+
- npm 10+
- MongoDB instance (local or cloud)

## 6. Getting Started

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables by creating .env in project root:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority
```

3. Start development server:

```bash
npm run dev
```

4. Open browser:

- http://localhost:3000

## 7. Available Scripts

- npm run dev: start dev server
- npm run build: production build
- npm run start: run production server
- npm run lint: lint the codebase

## 8. Environment Variables

Required:

- MONGODB_URI: Mongo connection string

Notes:

- Database name is currently fixed in code to campus-recruitment-management-system in lib/mongodb.js.
- If MONGODB_URI is missing, app throws a startup/runtime error in server actions.

## 9. Authentication and Authorization

### 9.1 Auth Flows

Implemented in app/(auth)/actions.js:

- signupAction(formData)
- loginAction(formData)
- signoutAction()
- requestPasswordResetAction(formData)
- validateResetTokenAction(token)
- resetPasswordAction(formData)

### 9.2 Role Helpers

Implemented in lib/authRoles.js:

- normalizeRole(value)
- isAdminRole(value)
- isStudentRole(value)
- isSuperAdminRole(value)
- isPrivilegedRole(value)
- APP_ROLES enum

### 9.3 Academic Domain Rules

Implemented in lib/academics.js:

- Allowed branches (fixed list of 10):
  - CSE
  - IT
  - ECE
  - EEE
  - MECH
  - CIVIL
  - CHEM
  - PROD
  - TEXT
  - INSTRU
- Allowed programs:
  - btech
  - mtech
- Year constraints:
  - btech: 1-4
  - mtech: 1-2

### 9.4 Superadmin Seed Account

Configured in lib/superAdmin.js and enforced during auth flows:

- Email: tnpsgg@gmail.com
- Password: 12345678
- Name: TNP Super Admin

### 9.5 Route Guarding

Guarding is done in components/AppShell.jsx:

- unauthenticated users are redirected to /login
- authenticated superadmins are restricted to /superadmin routes
- authenticated admins are restricted to admin-allowed routes
- students are blocked from /admin routes
- students are blocked from /superadmin routes
- auth pages include:
  - /login
  - /signup
  - /forgot-password
  - /reset-password

## 10. Data Model Summary

### User

- name, email, password, role
- role enum: superadmin, admin, student
- branch (required for students, optional for admins)
- program (required for students: btech/mtech)
- year (required for students, validated against program)
- account control fields:
  - isBanned, banReason, bannedAt
  - isDismissed, dismissalReason, dismissedAt, dismissedBy

### Profile

- one-to-one with userId
- basic, academic, education, semester marks, projects, skills, and more

### Job

- title, company, location, packageCtc, description
- eligibility rules
- createdBy admin
- active flag

### Application

- studentId, jobId, status
- unique index on (studentId, jobId)
- statuses:
  - applied
  - under-review
  - shortlisted
  - rejected
  - selected

### Interview

- applicationId, studentId, jobId, scheduledBy
- title, scheduledDate, meetingLink, instructions
- statuses:
  - scheduled
  - completed
  - cancelled
  - no-show

### Offer

- studentId, jobId, applicationId
- companyName, jobTitle, offeredCTC
- statuses:
  - pending
  - accepted
  - declined

### ResetToken

- userId, token, expiresAt
- TTL index auto-expires tokens

## 11. Server Action Map

### Student-facing

- app/jobs/actions.js
  - getEligibleJobsForStudentAction
  - applyToJobAction
- app/applications/actions.js
  - getStudentApplicationsAction
  - withdrawApplicationAction
- app/interviews/actions.js
  - getInterviewsAction
- app/offers/actions.js
  - getStudentOffersAction
  - respondToOfferAction
- app/profile/actions.js
  - getProfileAction
  - saveProfileAction
- app/dashboard/actions.js
  - getStudentDashboardAction

### Admin-facing

- app/admin/jobs/actions.js
  - createJobAction
  - updateJobAction
  - getAdminJobsAction
  - updateJobActiveStatusAction
  - getEligibleStudentsForJobAction
  - Department assignment constraints are enforced when admin has branch
- app/admin/applications/actions.js
  - getAdminApplicationsAction
  - updateApplicationStatusAction
  - Department assignment constraints are enforced when admin has branch
- app/interviews/actions.js
  - scheduleInterviewAction
  - updateInterviewStatusAction
  - scheduleInterviewAction enforces admin ownership and department constraints

### Superadmin-facing

- app/superadmin/actions.js
  - getSuperAdminOverviewAction
  - getAdminManagementAction
  - assignAdminBranchAction
  - clearAdminBranchAction
  - getStudentManagementAction
  - updateStudentAcademicAction
  - banStudentAction
  - unbanStudentAction
  - dismissUserAction
  - restoreDismissedUserAction
  - getDismissedUsersAction
  - setDismissedUserBanAction

### Analytics

- app/analytics/actions.js
  - getAnalyticsDataAction

## 12. API Routes

- app/api/admin/jobs/[jobId]/eligible/export/route.js
  - GET endpoint
  - validates admin ownership
  - exports eligible students to XLSX

## 13. Development Workflow

1. Pull latest changes.
2. Create a branch for your task.
3. Implement feature or fix.
4. Run validation:

```bash
npm run lint
npm run build
```

5. Commit only relevant files.

## 14. Common Contributor Notes

- Keep role checks centralized via lib/authRoles.js helpers.
- Preserve ObjectId validation in server actions before DB calls.
- Keep response shapes stable where UI already depends on them.
- Avoid breaking auth shell redirect logic in components/AppShell.jsx.
- For pages using useSearchParams, use Suspense wrappers as needed by Next.js build behavior.

## 15. Known Limitations

- No formal automated test suite yet.
- Auth is localStorage-based and client-enforced.
- Passwords are not hashed by design in this repository.
- Password reset does not send emails; reset URL is generated in app flow.
- Superadmin controls are currently implemented via dedicated pages, not a centralized audit/event trail.

## 16. Recommended Next Improvements

- Introduce secure session/cookie-based auth.
- Add password hashing (if project requirements allow in future).
- Add automated tests (unit + integration).
- Add centralized API/service layer for validation reuse.
- Add .env.example for onboarding consistency.
- Add audit logs for superadmin governance actions (ban/dismiss/branch assignment).

## 17. Quick Health Check

Before raising a PR, ensure:

```bash
npm run lint
npm run build
```

Both should pass with no errors.
