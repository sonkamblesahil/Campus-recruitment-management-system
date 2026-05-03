# Campus Recruitment Management System Documentation

## 1. Overview

This document summarizes the project structure, the main server action/API surfaces, the request and response shapes used by the app, the filtering logic applied in the UI and actions, and how data is handled end to end.

The application is a Next.js App Router system for campus placement management with three roles:

- Superadmin
- Admin
- Student

## 2. Folder Structure

```text
app/
  (auth)/
    actions.js
    forgot-password/page.jsx
    login/page.jsx
    reset-password/page.jsx
    signup/page.jsx
  admin/
    applications/
      actions.js
      page.jsx
    jobs/
      actions.js
      page.jsx
    students/
      actions.js
      page.jsx
  analytics/
    actions.js
    page.jsx
  api/
    admin/
      jobs/[jobId]/eligible/export/route.js
  applications/
    actions.js
    page.jsx
  dashboard/
    actions.js
    page.jsx
  interviews/
    actions.js
    page.jsx
  jobs/
    actions.js
    page.jsx
  offers/
    actions.js
    page.jsx
  profile/
    actions.js
    page.jsx
  superadmin/
    actions.js
    page.jsx
    activity/page.jsx
    admins/page.jsx
    dismissals/page.jsx
    jobs/page.jsx
    students/page.jsx
components/
  AppShell.jsx
  ConditionalNavbar.jsx
  NavBar.jsx
  SideBar.jsx

data/
  analytics.js
  applications.js
  jobs.js
  offers.js

lib/
  academics.js
  authRoles.js
  jobEligibility.js
  mongodb.js
  superAdmin.js

models/
  Application.js
  AuditLog.js
  Interview.js
  Job.js
  Offer.js
  Profile.js
  ResetToken.js
  User.js
```

## 3. Main Data Flow

1. The client reads the signed-in user from `localStorage.auth_user`.
2. `components/AppShell.jsx` guards routes and redirects users based on role.
3. Pages call server actions for data loading and updates.
4. Server actions connect to MongoDB through `lib/mongodb.js`.
5. Data is stored in Mongoose models and returned in UI-friendly mapped shapes.

## 4. API Surface

The project mainly uses Next.js server actions. There is one explicit HTTP route under `app/api/...`, but most data operations are handled by server action functions.

### 4.1 Authentication Actions

File: `app/(auth)/actions.js`

- `signupAction(formData)`
- `loginAction(formData)`
- `signoutAction()`
- `requestPasswordResetAction(formData)`
- `validateResetTokenAction(token)`
- `resetPasswordAction(formData)`

### 4.2 Student Job Actions

File: `app/jobs/actions.js`

- `getEligibleJobsForStudentAction(userId)`
- `applyToJobAction(userId, jobId)`

### 4.3 Student Applications Actions

File: `app/applications/actions.js`

- `getStudentApplicationsAction(userId)`
- `withdrawApplicationAction(userId, applicationId)`

### 4.4 Student Dashboard Actions

File: `app/dashboard/actions.js`

- `getStudentDashboardAction(userId)`

### 4.5 Student Offers Actions

File: `app/offers/actions.js`

- `getStudentOffersAction(userId)`
- `respondToOfferAction(userId, offerId, response)`

### 4.6 Student Profile Actions

File: `app/profile/actions.js`

- `getProfileAction(userId)`
- `saveProfileAction(userId, profileData)`

### 4.7 Interview Actions

File: `app/interviews/actions.js`

- `getInterviewsAction(userId, role)`
- `scheduleInterviewAction(adminId, payload)`
- `updateInterviewStatusAction(adminId, interviewId, nextStatus, feedback)`

### 4.8 Admin Job Actions

File: `app/admin/jobs/actions.js`

- `createJobAction(userId, payload)`
- `updateJobAction(userId, jobId, payload)`
- `getAdminJobsAction(userId)`
- `getEligibleStudentsForJobAction(userId, jobId)`
- `updateJobActiveStatusAction(userId, jobId, nextActive)`

### 4.9 Admin Application Actions

File: `app/admin/applications/actions.js`

- `getAdminApplicationsAction(userId, jobId = null)`
- `updateApplicationStatusAction(adminId, applicationId, newStatus, ctc = "0 LPA")`

### 4.10 Analytics Actions

File: `app/analytics/actions.js`

- `getAnalyticsDataAction()`

### 4.11 Superadmin Actions

File: `app/superadmin/actions.js`

- Student management actions
- Admin management actions
- Dismissal and ban actions
- Governance activity actions
- Superadmin job overview actions
- Superadmin student academic update actions

### 4.12 Export Route

File: `app/api/admin/jobs/[jobId]/eligible/export/route.js`

- HTTP method: `GET`
- Purpose: export eligible students for a job as spreadsheet/Excel data

## 5. Request and Response Structures

This section documents the common payloads and return shapes used by the project.

### 5.1 Authentication

#### `signupAction(formData)`

Expected form fields:

```json
{
  "name": "Aarav Sharma",
  "email": "aarav.sharma@demo.in",
  "password": "Student@123",
  "role": "student",
  "branch": "CSE",
  "program": "btech",
  "year": "4"
}
```

Typical response:

```json
{
  "success": true,
  "userId": "...",
  "name": "Aarav Sharma",
  "email": "aarav.sharma@demo.in",
  "role": "student",
  "branch": "CSE",
  "program": "btech",
  "year": 4,
  "isProfileVerified": false
}
```

#### `loginAction(formData)`

Expected form fields:

```json
{
  "email": "aarav.sharma@demo.in",
  "password": "Student@123"
}
```

Typical success response:

```json
{
  "success": true,
  "userId": "...",
  "name": "Aarav Sharma",
  "email": "aarav.sharma@demo.in",
  "role": "student",
  "branch": "CSE",
  "program": "btech",
  "year": 4,
  "isProfileVerified": true
}
```

Typical failure response:

```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

#### `requestPasswordResetAction(formData)`

Expected form fields:

```json
{
  "email": "aarav.sharma@demo.in"
}
```

Typical response:

```json
{
  "success": true,
  "message": "If this email exists in our records, a reset link has been generated.",
  "resetUrl": "/reset-password?token=...",
  "expiresAt": "2026-04-25T12:00:00.000Z"
}
```

### 5.2 Job Listing and Application

#### `getEligibleJobsForStudentAction(userId)`

Response shape:

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "Software Developer",
      "company": "Zoho",
      "location": "Chennai",
      "packageCtc": "11 LPA",
      "description": "...",
      "eligibility": {
        "departments": ["CSE", "IT"],
        "minCgpa": 8,
        "minClass12Percentage": 80,
        "minSemester": 4,
        "maxSemester": 8
      },
      "createdAt": "2026-04-01T00:00:00.000Z",
      "hasApplied": true
    }
  ]
}
```

#### `applyToJobAction(userId, jobId)`

Response examples:

```json
{
  "success": true
}
```

```json
{
  "success": false,
  "error": "You have already applied for this job"
}
```

### 5.3 Applications

#### `getStudentApplicationsAction(userId)`

Response shape:

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "status": "shortlisted",
      "appliedAt": "25/04/2026",
      "job": {
        "title": "Backend Engineer",
        "company": "Razorpay"
      }
    }
  ]
}
```

#### `withdrawApplicationAction(userId, applicationId)`

Typical response:

```json
{
  "success": true
}
```

### 5.4 Dashboard

#### `getStudentDashboardAction(userId)`

Response shape:

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalApplications": 6,
      "underReview": 1,
      "shortlisted": 2,
      "rejected": 1,
      "selected": 1,
      "offersPending": 1,
      "offersAccepted": 1,
      "upcomingInterviews": 2
    },
    "recentApplications": [
      {
        "id": "...",
        "status": "selected",
        "appliedAt": "20/04/2026",
        "job": {
          "title": "Backend Engineer",
          "company": "Razorpay"
        }
      }
    ],
    "upcomingInterviews": [
      {
        "id": "...",
        "title": "Final Technical Interview",
        "date": "27/04/2026, 10:00 AM",
        "meetingLink": "https://...",
        "job": {
          "title": "Backend Engineer",
          "company": "Razorpay"
        }
      }
    ]
  }
}
```

### 5.5 Offers

#### `getStudentOffersAction(userId)`

Response shape:

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "companyName": "Razorpay",
      "jobTitle": "Backend Engineer",
      "offeredCTC": "18 LPA",
      "status": "accepted",
      "issuedAt": "18/04/2026"
    }
  ]
}
```

#### `respondToOfferAction(userId, offerId, response)`

Response examples:

```json
{
  "success": true
}
```

```json
{
  "success": false,
  "error": "Offer already responded to."
}
```

### 5.6 Profile

#### `getProfileAction(userId)`

Response shape:

```json
{
  "success": true,
  "data": {
    "basic": {
      "name": "Aarav Sharma",
      "email": "aarav.sharma@demo.in",
      "phone": "9876543210",
      "address": "Nagpur, Maharashtra, India",
      "linkedin": "https://linkedin.com/in/aaravsharma-demo",
      "portfolio": "https://aaravsharma.dev"
    },
    "academic": {
      "currentInstitute": "S. G. G. S. Institute of Engineering and Technology, Nanded",
      "department": "CSE",
      "currentSemester": "8",
      "cgpa": "9.12"
    },
    "semesterMarks": [],
    "education": [],
    "experiences": [],
    "projects": [],
    "skills": [],
    "certifications": [],
    "achievements": [],
    "extracurriculars": []
  }
}
```

#### `saveProfileAction(userId, profileData)`

Expected body shape:

```json
{
  "basic": {
    "name": "Aarav Sharma",
    "email": "aarav.sharma@demo.in",
    "phone": "9876543210",
    "address": "Nagpur",
    "linkedin": "https://linkedin.com/in/aaravsharma-demo",
    "portfolio": "https://aaravsharma.dev"
  },
  "academic": {
    "currentInstitute": "S. G. G. S. Institute of Engineering and Technology, Nanded",
    "department": "CSE",
    "currentSemester": "8",
    "cgpa": "9.12"
  },
  "semesterMarks": [],
  "education": [],
  "experiences": [],
  "projects": [],
  "skills": [],
  "certifications": [],
  "achievements": [],
  "extracurriculars": []
}
```

Typical response:

```json
{
  "success": true
}
```

### 5.7 Interviews

#### `scheduleInterviewAction(adminId, payload)`

Expected body shape:

```json
{
  "applicationId": "...",
  "title": "Final Technical Interview",
  "scheduledDate": "2026-04-27T10:00:00.000Z",
  "meetingLink": "https://meet.example.com/aarav-razorpay",
  "instructions": "Prepare a walkthrough of backend scaling and auth design."
}
```

Typical response:

```json
{
  "success": true,
  "interviewId": "..."
}
```

#### `updateInterviewStatusAction(adminId, interviewId, nextStatus, feedback)`

Typical response:

```json
{
  "success": true
}
```

### 5.8 Admin Jobs

#### `createJobAction(userId, payload)`

Expected body shape:

```json
{
  "title": "Software Developer",
  "company": "Zoho",
  "location": "Chennai",
  "packageCtc": "11 LPA",
  "description": "Build customer-facing SaaS products.",
  "departments": "CSE, IT",
  "minCgpa": "8",
  "minClass12Percentage": "80",
  "minSemester": "4",
  "maxSemester": "8"
}
```

Typical response:

```json
{
  "success": true,
  "data": {
    "id": "...",
    "title": "Software Developer",
    "company": "Zoho",
    "location": "Chennai",
    "packageCtc": "11 LPA",
    "description": "Build customer-facing SaaS products.",
    "eligibility": {
      "departments": ["CSE", "IT"],
      "minCgpa": 8,
      "minClass12Percentage": 80,
      "minSemester": 4,
      "maxSemester": 8
    },
    "active": true,
    "createdAt": "2026-04-01T00:00:00.000Z"
  }
}
```

#### `updateJobAction(userId, jobId, payload)`

Same body structure as `createJobAction`.

#### `getAdminJobsAction(userId)`

Response shape:

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "Associate Software Engineer",
      "company": "Tata Consultancy Services",
      "location": "Pune",
      "active": true
    }
  ]
}
```

### 5.9 Admin Applications

#### `getAdminApplicationsAction(userId, jobId = null)`

Response shape:

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "student": {
        "id": "...",
        "name": "Aarav Sharma",
        "email": "aarav.sharma@demo.in"
      },
      "job": {
        "id": "...",
        "title": "Backend Engineer",
        "company": "Razorpay"
      },
      "status": "selected",
      "appliedAt": "25/04/2026"
    }
  ],
  "jobs": [
    {
      "id": "...",
      "title": "Backend Engineer",
      "company": "Razorpay"
    }
  ]
}
```

#### `updateApplicationStatusAction(adminId, applicationId, newStatus, ctc)`

Expected values:

- `newStatus`: `applied`, `under-review`, `shortlisted`, `rejected`, `selected`
- `ctc`: text like `18 LPA`

Typical response:

```json
{
  "success": true
}
```

### 5.10 Analytics

#### `getAnalyticsDataAction()`

Response shape:

```json
{
  "success": true,
  "data": {
    "totalStudents": 12,
    "totalJobs": 12,
    "totalApplications": 25,
    "totalOffers": 6,
    "acceptedOffers": 2,
    "maxCTC": "22 LPA",
    "recentJobs": [
      {
        "id": "...",
        "title": "Data Analyst",
        "company": "Swiggy"
      }
    ]
  }
}
```

### 5.11 Export Route

#### `GET /api/admin/jobs/[jobId]/eligible/export`

Purpose:

- exports eligible student data for a job
- returns spreadsheet-friendly data based on the admin's department access and the job eligibility rules

## 6. Filtering Logic

### 6.1 Route and Role Filtering

Handled in `components/AppShell.jsx`.

Rules:

- Unauthenticated users are redirected to `/login`.
- Auth pages are `/`, `/login`, `/signup`, `/forgot-password`, and `/reset-password`.
- Superadmins are redirected to `/superadmin` unless they are already on a superadmin route.
- Admins are redirected to `/admin/jobs` unless they are on an admin route or shared route.
- Students are redirected away from `/admin` and `/superadmin` paths.

### 6.2 Job Filtering

Handled in `app/jobs/page.jsx`.

Logic:

- Search matches job title, company, or location.
- Toggle filters allow all jobs, applied jobs, or not-applied jobs.
- Jobs are only shown if they are eligible for the student's profile.
- `hasApplied` is computed from student applications.

### 6.3 Applications Filtering

Handled in `app/applications/page.jsx`.

Logic:

- Search matches company name or job title.
- Status filter matches one of:
  - applied
  - under-review
  - shortlisted
  - selected
  - rejected
- Withdraw is allowed only for `applied`, `under-review`, and `shortlisted` statuses.

### 6.4 Interviews Filtering

Handled in `app/interviews/page.jsx`.

Logic:

- Search matches interview title, company, job role, or candidate name.
- Status filter matches scheduled, completed, cancelled, or no-show.
- Admins can update interview status; students can only view their own interviews.

### 6.5 Admin Job and Student Filtering

Handled in admin and superadmin pages.

Logic:

- Admins only see jobs they created.
- If an admin has a branch, job and student operations are restricted to that branch.
- Superadmin student filters support search, branch, program, year, CGPA range, and class XII percentage range.
- Superadmin job filters support search, branch, and active/inactive status.

### 6.6 Governance Activity Filtering

Handled in `app/superadmin/activity/page.jsx`.

Logic:

- Search matches actor, target, or action fields.
- Action filter narrows logs to one governance action.
- Severity filter narrows logs to info, warning, or critical.
- `lastDays` limits the time window to recent activity.

## 7. Data Handling

### 7.1 Authentication State

- Auth state is stored in `localStorage` under `auth_user`.
- `AppShell.jsx` listens to both the browser `storage` event and a custom `auth-user-changed` event.
- The custom event keeps same-tab UI components in sync after login or logout.

### 7.2 MongoDB Access

- `lib/mongodb.js` owns the shared database connection.
- The connection uses the fixed database name `campus-recruitment-management-system`.
- Server actions import the relevant Mongoose model and query MongoDB directly.

### 7.3 Model Mapping

- Mongoose models define the persistent schema.
- Server actions typically transform raw Mongo documents into UI-safe objects.
- Dates are often converted to ISO strings or locale strings before returning to the UI.

### 7.4 Profile Handling

- Student sign-up creates a profile shell automatically.
- The profile page loads the existing profile if available, otherwise it falls back to user metadata.
- Saving the profile upserts nested sections like education, projects, skills, and certifications.

### 7.5 Job Eligibility Handling

- `lib/jobEligibility.js` computes student eligibility from branch, CGPA, class XII percentage, semester, and program-based rules.
- `getEligibleJobsForStudentAction` filters active jobs through that eligibility check.
- `getEligibleStudentsForJobAction` filters student profiles against the job rules before showing eligible candidates.

## 8. Notes

- Passwords are stored in plain text in this project by design.
- Most state changes use server actions rather than public REST endpoints.
- The app is optimized around role-based dashboards rather than a general API layer.
