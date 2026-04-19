export const BRANCH_OPTIONS = Object.freeze([
  { value: "CSE", label: "Computer Science and Engineering (CSE)" },
  { value: "IT", label: "Information Technology (IT)" },
  { value: "ECE", label: "Electronics and Communication Engineering (ECE)" },
  { value: "EEE", label: "Electrical and Electronics Engineering (EEE)" },
  { value: "MECH", label: "Mechanical Engineering (MECH)" },
  { value: "CIVIL", label: "Civil Engineering (CIVIL)" },
  { value: "CHEM", label: "Chemical Engineering (CHEM)" },
  { value: "PROD", label: "Production Engineering (PROD)" },
  { value: "TEXT", label: "Textile Engineering (TEXT)" },
  { value: "INSTRU", label: "Instrumentation Engineering (INSTRU)" },
]);

export const BRANCH_VALUES = Object.freeze(
  BRANCH_OPTIONS.map((item) => item.value),
);

export const PROGRAM_OPTIONS = Object.freeze([
  { value: "btech", label: "B.Tech" },
  { value: "mtech", label: "M.Tech" },
]);

export const PROGRAM_VALUES = Object.freeze(
  PROGRAM_OPTIONS.map((item) => item.value),
);

export function normalizeBranch(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

export function normalizeProgram(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function isValidBranch(value) {
  return BRANCH_VALUES.includes(normalizeBranch(value));
}

export function isValidProgram(value) {
  return PROGRAM_VALUES.includes(normalizeProgram(value));
}

export function getAllowedYears(program) {
  const normalizedProgram = normalizeProgram(program);
  if (normalizedProgram === "mtech") {
    return [1, 2];
  }

  return [1, 2, 3, 4];
}

export function isValidYearForProgram(program, year) {
  const numericYear = Number.parseInt(String(year || ""), 10);
  if (!Number.isInteger(numericYear)) {
    return false;
  }

  return getAllowedYears(program).includes(numericYear);
}

export function getBranchLabel(value) {
  const normalized = normalizeBranch(value);
  const matched = BRANCH_OPTIONS.find((item) => item.value === normalized);
  return matched ? matched.label : normalized;
}
