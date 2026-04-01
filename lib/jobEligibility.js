function normalizeText(value) {
  return String(value || "").trim();
}

function toNumber(value) {
  const raw = normalizeText(value).replace(/,/g, "");
  if (!raw) {
    return null;
  }

  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function getClass12Percentage(profile) {
  const education = Array.isArray(profile?.education) ? profile.education : [];

  let best = null;
  for (const entry of education) {
    const qualification = normalizeText(entry?.qualification).toLowerCase();
    const scoreTypeText = normalizeText(entry?.scoreType).toLowerCase();
    const scoreTypeValue = toNumber(entry?.scoreType);
    const score = toNumber(entry?.score);
    const percentage = toNumber(entry?.percentage);
    const marksObtained = toNumber(entry?.marksObtained);
    const totalMarks = toNumber(entry?.totalMarks);

    if (!qualification) {
      continue;
    }

    if (
      qualification.includes("12") ||
      qualification.includes("xii") ||
      qualification.includes("hsc")
    ) {
      let resolvedPercentage = null;

      if (percentage !== null && percentage >= 0 && percentage <= 100) {
        resolvedPercentage = percentage;
      } else if (
        scoreTypeValue !== null &&
        scoreTypeValue >= 0 &&
        scoreTypeValue <= 100 &&
        (score === null || score > 100)
      ) {
        // Handles profiles where users put the actual percentage in scoreType.
        resolvedPercentage = scoreTypeValue;
      } else if (
        score !== null &&
        score >= 0 &&
        score <= 100 &&
        !scoreTypeText.includes("cgpa")
      ) {
        resolvedPercentage = score;
      } else if (
        marksObtained !== null &&
        totalMarks !== null &&
        totalMarks > 0
      ) {
        resolvedPercentage = (marksObtained / totalMarks) * 100;
      }

      if (resolvedPercentage !== null) {
        best =
          best === null
            ? resolvedPercentage
            : Math.max(best, resolvedPercentage);
      }
    }
  }

  return best;
}

function getPassingYear(profile) {
  const education = Array.isArray(profile?.education) ? profile.education : [];
  for (const entry of education) {
    const year = normalizeText(entry?.yearOfPassing);
    if (year) {
      return year;
    }
  }

  return "";
}

export function getStudentAttributes(profile, user) {
  const department = normalizeText(profile?.academic?.department);
  const cgpa = toNumber(profile?.academic?.cgpa);
  const semester = toNumber(profile?.academic?.currentSemester);
  const class12Percentage = getClass12Percentage(profile);

  return {
    name: normalizeText(profile?.basic?.name) || normalizeText(user?.name),
    email: normalizeText(profile?.basic?.email) || normalizeText(user?.email),
    phone: normalizeText(profile?.basic?.phone),
    address: normalizeText(profile?.basic?.address),
    department,
    cgpa,
    semester,
    year: getPassingYear(profile),
    class12Percentage,
  };
}

export function isStudentEligibleForJob(job, profile) {
  const attributes = getStudentAttributes(profile);
  const eligibility = job?.eligibility || {};

  const requiredDepartments = (eligibility.departments || [])
    .map((department) => normalizeText(department).toLowerCase())
    .filter(Boolean);

  if (requiredDepartments.length > 0) {
    if (!attributes.department) {
      return false;
    }

    const studentDepartment = attributes.department.toLowerCase();
    if (!requiredDepartments.includes(studentDepartment)) {
      return false;
    }
  }

  if (eligibility.minCgpa !== null && eligibility.minCgpa !== undefined) {
    if (attributes.cgpa === null || attributes.cgpa < eligibility.minCgpa) {
      return false;
    }
  }

  if (
    eligibility.minClass12Percentage !== null &&
    eligibility.minClass12Percentage !== undefined
  ) {
    if (
      attributes.class12Percentage === null ||
      attributes.class12Percentage < eligibility.minClass12Percentage
    ) {
      return false;
    }
  }

  if (
    eligibility.minSemester !== null &&
    eligibility.minSemester !== undefined
  ) {
    if (
      attributes.semester === null ||
      attributes.semester < eligibility.minSemester
    ) {
      return false;
    }
  }

  if (
    eligibility.maxSemester !== null &&
    eligibility.maxSemester !== undefined
  ) {
    if (
      attributes.semester === null ||
      attributes.semester > eligibility.maxSemester
    ) {
      return false;
    }
  }

  return true;
}
