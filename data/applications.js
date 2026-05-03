import { demoApplications } from "./sampleData.js";

export const applications = demoApplications.map((application, index) => ({
  id: index + 1,
  company: application.company,
  position: application.position,
  status:
    application.status === "under-review"
      ? "Under Review"
      : application.status.charAt(0).toUpperCase() +
        application.status.slice(1),
}));
