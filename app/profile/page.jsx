"use client";

import { BRANCH_OPTIONS } from "@/lib/academics";
import { useEffect, useMemo, useState } from "react";
import { getProfileAction, saveProfileAction } from "./actions";

const QUALIFICATION_OPTIONS = [
  "10th",
  "12th",
  "Diploma",
  "B.Tech",
  "M.Tech",
  "PhD",
  "Other",
];

const EMPTY_PROFILE = {
  basic: {
    name: "",
    email: "",
    phone: "",
    address: "",
    linkedin: "",
    portfolio: "",
  },
  academic: {
    currentInstitute: "",
    department: "",
    currentSemester: "",
    cgpa: "",
  },
  semesterMarks: [],
  education: [],
  experiences: [],
  projects: [],
  skills: [],
  certifications: [],
  achievements: [],
  extracurriculars: [],
};

const newSemesterRow = () => ({
  semester: "",
  marksObtained: "",
  totalMarks: "",
  percentage: "",
  cgpa: "",
});

const newEducationRow = () => ({
  qualification: "",
  institute: "",
  boardOrUniversity: "",
  yearOfPassing: "",
  scoreType: "",
  score: "",
});

const newExperienceRow = () => ({
  type: "internship",
  organization: "",
  role: "",
  startDate: "",
  endDate: "",
  duration: "",
  description: "",
});

const newProjectRow = () => ({
  title: "",
  description: "",
  duration: "",
  githubLink: "",
  liveLink: "",
  techStack: "",
});

const newCertificationRow = () => ({
  title: "",
  organization: "",
  description: "",
  issueDate: "",
  credentialId: "",
  credentialUrl: "",
});

const newAchievementRow = () => ({
  title: "",
  description: "",
  date: "",
});

const newExtracurricularRow = () => ({
  title: "",
  clubName: "",
  role: "",
  description: "",
  duration: "",
});

const cloneProfile = (profile) => JSON.parse(JSON.stringify(profile));

function Section({ title, action, children }) {
  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-2 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  editable,
  type = "text",
  placeholder,
}) {
  return (
    <label className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-center text-sm">
      <span className="text-gray-600">{label}</span>
      {editable ? (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="md:col-span-3 border border-gray-300 rounded px-3 py-2"
        />
      ) : (
        <span className="md:col-span-3 text-gray-800 wrap-break-word">
          {value || "-"}
        </span>
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  editable,
  options,
  placeholder,
}) {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <label className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-center text-sm">
      <span className="text-gray-600">{label}</span>
      {editable ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="md:col-span-3 border border-gray-300 rounded px-3 py-2 bg-white"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <span className="md:col-span-3 text-gray-800 wrap-break-word">
          {selectedOption?.label || value || "-"}
        </span>
      )}
    </label>
  );
}

function TextAreaField({ label, value, onChange, editable, placeholder }) {
  return (
    <label className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-start text-sm">
      <span className="text-gray-600 md:pt-2">{label}</span>
      {editable ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={3}
          className="md:col-span-3 border border-gray-300 rounded px-3 py-2"
        />
      ) : (
        <span className="md:col-span-3 text-gray-800 whitespace-pre-wrap wrap-break-word">
          {value || "-"}
        </span>
      )}
    </label>
  );
}

function Block({ title, editable, onRemove, children }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-3 relative">
      {title && <p className="font-medium text-gray-700">{title}</p>}
      {editable && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-3 right-3 text-xs text-red-500"
        >
          Remove
        </button>
      )}
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("basic");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState(cloneProfile(EMPTY_PROFILE));
  const [savedSnapshot, setSavedSnapshot] = useState(
    cloneProfile(EMPTY_PROFILE),
  );

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");
      setMessage("");

      try {
        const rawUser = localStorage.getItem("auth_user");
        if (!rawUser) {
          setError("Please login to view your profile.");
          setLoading(false);
          return;
        }

        const parsedUser = JSON.parse(rawUser);
        const authUserId = String(parsedUser?.userId || "").trim();

        if (!authUserId) {
          setError("User session not found. Please login again.");
          setLoading(false);
          return;
        }

        setUserId(authUserId);

        const result = await getProfileAction(authUserId);
        if (!result?.success) {
          setError(result?.error || "Could not load profile");
          setLoading(false);
          return;
        }

        const nextProfile = {
          ...cloneProfile(EMPTY_PROFILE),
          ...result.data,
          basic: {
            ...EMPTY_PROFILE.basic,
            ...result.data?.basic,
          },
          academic: {
            ...EMPTY_PROFILE.academic,
            ...result.data?.academic,
          },
        };

        setProfile(nextProfile);
        setSavedSnapshot(cloneProfile(nextProfile));
      } catch {
        setError("Something went wrong while loading profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const tabs = useMemo(
    () => [
      { id: "basic", label: "Basic Details" },
      { id: "academic", label: "Academic + Semester Marks" },
      { id: "education", label: "Education History" },
      { id: "experience", label: "Internships & Work" },
      { id: "projects", label: "Projects" },
      { id: "skills", label: "Skills" },
      { id: "certifications", label: "Certificates" },
      { id: "achievements", label: "Achievements" },
      { id: "extracurriculars", label: "Extracurricular" },
    ],
    [],
  );

  const updateBasic = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      basic: {
        ...prev.basic,
        [field]: value,
      },
    }));
  };

  const updateAcademic = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      academic: {
        ...prev.academic,
        [field]: value,
      },
    }));
  };

  const updateArrayItem = (section, index, field, value) => {
    setProfile((prev) => {
      const next = [...prev[section]];
      next[index] = {
        ...next[index],
        [field]: value,
      };

      return {
        ...prev,
        [section]: next,
      };
    });
  };

  const addArrayItem = (section, rowFactory) => {
    setProfile((prev) => ({
      ...prev,
      [section]: [...prev[section], rowFactory()],
    }));
  };

  const removeArrayItem = (section, index) => {
    setProfile((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, rowIndex) => rowIndex !== index),
    }));
  };

  const updateSkill = (index, value) => {
    setProfile((prev) => {
      const nextSkills = [...prev.skills];
      nextSkills[index] = value;

      return {
        ...prev,
        skills: nextSkills,
      };
    });
  };

  const addSkill = () => {
    setProfile((prev) => ({
      ...prev,
      skills: [...prev.skills, ""],
    }));
  };

  const removeSkill = (index) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, skillIndex) => skillIndex !== index),
    }));
  };

  const handleSave = async () => {
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const result = await saveProfileAction(userId, profile);
      if (!result?.success) {
        setError(result?.error || "Could not save profile");
        return;
      }

      setSavedSnapshot(cloneProfile(profile));
      setIsEditing(false);
      setMessage("Profile saved successfully.");
    } catch {
      setError("Something went wrong while saving profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setProfile(cloneProfile(savedSnapshot));
    setIsEditing(false);
    setMessage("");
    setError("");
  };

  if (loading) {
    return (
      <div className="bg-gray-200 h-full p-3">
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-600">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-200 h-full p-2">
      <h1 className="text-zinc-600 text-base font-bold mb-2">
        Welcome {profile.basic.name || "User"}
      </h1>

      {error && (
        <p className="mb-2 border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm rounded">
          {error}
        </p>
      )}

      {message && (
        <p className="mb-2 border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm rounded">
          {message}
        </p>
      )}

      <div className="bg-white rounded-xl h-[82vh] flex overflow-hidden mt-2 border border-gray-200">
        <aside className="w-72 border-r bg-gray-50 p-3 space-y-1 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-4 py-3 text-sm rounded-lg ${
                activeTab === tab.id
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </aside>

        <main className="flex-1 p-5 overflow-y-auto">
          <div className="mb-4 flex items-center justify-end gap-2">
            {isEditing && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="text-sm px-3 py-1.5 border border-gray-300 rounded text-gray-700"
              >
                Cancel
              </button>
            )}
            {isEditing ? (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="text-sm px-4 py-1.5 rounded bg-indigo-600 text-white disabled:bg-indigo-400"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setError("");
                  setIsEditing(true);
                }}
                className="text-sm px-4 py-1.5 rounded bg-indigo-600 text-white"
              >
                Edit Profile
              </button>
            )}
          </div>

          {activeTab === "basic" && (
            <Section title="Basic Details">
              <Field
                label="Full Name"
                value={profile.basic.name}
                onChange={(value) => updateBasic("name", value)}
                editable={isEditing}
              />
              <Field
                label="Email"
                value={profile.basic.email}
                onChange={(value) => updateBasic("email", value)}
                editable={isEditing}
                type="email"
              />
              <Field
                label="Phone"
                value={profile.basic.phone}
                onChange={(value) => updateBasic("phone", value)}
                editable={isEditing}
              />
              <TextAreaField
                label="Address"
                value={profile.basic.address}
                onChange={(value) => updateBasic("address", value)}
                editable={isEditing}
              />
              <Field
                label="LinkedIn"
                value={profile.basic.linkedin}
                onChange={(value) => updateBasic("linkedin", value)}
                editable={isEditing}
                placeholder="https://linkedin.com/in/..."
              />
              <Field
                label="Portfolio"
                value={profile.basic.portfolio}
                onChange={(value) => updateBasic("portfolio", value)}
                editable={isEditing}
                placeholder="https://your-portfolio.com"
              />
            </Section>
          )}

          {activeTab === "academic" && (
            <div className="space-y-6">
              <Section title="Current Academic Details">
                <Field
                  label="Current Institute"
                  value={profile.academic.currentInstitute}
                  onChange={(value) =>
                    updateAcademic("currentInstitute", value)
                  }
                  editable={isEditing}
                />
                <SelectField
                  label="Department"
                  value={profile.academic.department}
                  onChange={(value) => updateAcademic("department", value)}
                  editable={isEditing}
                  options={BRANCH_OPTIONS}
                  placeholder="Select Department"
                />
                <Field
                  label="Current Semester"
                  value={profile.academic.currentSemester}
                  onChange={(value) => updateAcademic("currentSemester", value)}
                  editable={isEditing}
                />
                <Field
                  label="Current CGPA"
                  value={profile.academic.cgpa}
                  onChange={(value) => updateAcademic("cgpa", value)}
                  editable={isEditing}
                />
              </Section>

              <Section
                title="Semester Marks (Table)"
                action={
                  isEditing && (
                    <button
                      type="button"
                      onClick={() =>
                        addArrayItem("semesterMarks", newSemesterRow)
                      }
                      className="text-sm text-green-600"
                    >
                      + Add Semester
                    </button>
                  )
                }
              >
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="text-left px-3 py-2">Semester</th>
                        <th className="text-left px-3 py-2">Marks Obtained</th>
                        <th className="text-left px-3 py-2">Total Marks</th>
                        <th className="text-left px-3 py-2">Percentage</th>
                        <th className="text-left px-3 py-2">CGPA</th>
                        {isEditing && (
                          <th className="text-left px-3 py-2">Action</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {profile.semesterMarks.length === 0 && (
                        <tr>
                          <td
                            colSpan={isEditing ? 6 : 5}
                            className="px-3 py-4 text-center text-gray-500"
                          >
                            No semester rows added yet.
                          </td>
                        </tr>
                      )}
                      {profile.semesterMarks.map((row, index) => (
                        <tr
                          key={`sem-${index}`}
                          className="border-t border-gray-100"
                        >
                          {[
                            "semester",
                            "marksObtained",
                            "totalMarks",
                            "percentage",
                            "cgpa",
                          ].map((field) => (
                            <td key={field} className="px-3 py-2 align-top">
                              {isEditing ? (
                                <input
                                  value={row[field] || ""}
                                  onChange={(event) =>
                                    updateArrayItem(
                                      "semesterMarks",
                                      index,
                                      field,
                                      event.target.value,
                                    )
                                  }
                                  className="w-full border border-gray-300 rounded px-2 py-1"
                                />
                              ) : (
                                <span>{row[field] || "-"}</span>
                              )}
                            </td>
                          ))}
                          {isEditing && (
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                className="text-xs text-red-500"
                                onClick={() =>
                                  removeArrayItem("semesterMarks", index)
                                }
                              >
                                Remove
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            </div>
          )}

          {activeTab === "education" && (
            <Section
              title="Past Education History"
              action={
                isEditing && (
                  <button
                    type="button"
                    onClick={() => addArrayItem("education", newEducationRow)}
                    className="text-sm text-green-600"
                  >
                    + Add Education
                  </button>
                )
              }
            >
              <div className="space-y-4">
                {profile.education.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No education records added.
                  </p>
                )}
                {profile.education.map((item, index) => (
                  <Block
                    key={`edu-${index}`}
                    title={`Education ${index + 1}`}
                    editable={isEditing}
                    onRemove={() => removeArrayItem("education", index)}
                  >
                    <label className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-center text-sm">
                      <span className="text-gray-600">Qualification</span>
                      {isEditing ? (
                        <select
                          value={item.qualification || ""}
                          onChange={(event) =>
                            updateArrayItem(
                              "education",
                              index,
                              "qualification",
                              event.target.value,
                            )
                          }
                          className="md:col-span-3 border border-gray-300 rounded px-3 py-2"
                        >
                          <option value="">Select Qualification</option>
                          {QUALIFICATION_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="md:col-span-3">
                          {item.qualification || "-"}
                        </span>
                      )}
                    </label>

                    <Field
                      label="Institute Name"
                      value={item.institute || ""}
                      onChange={(value) =>
                        updateArrayItem("education", index, "institute", value)
                      }
                      editable={isEditing}
                    />
                    <Field
                      label="Board/University"
                      value={item.boardOrUniversity || ""}
                      onChange={(value) =>
                        updateArrayItem(
                          "education",
                          index,
                          "boardOrUniversity",
                          value,
                        )
                      }
                      editable={isEditing}
                    />
                    <Field
                      label="Year Of Passing"
                      value={item.yearOfPassing || ""}
                      onChange={(value) =>
                        updateArrayItem(
                          "education",
                          index,
                          "yearOfPassing",
                          value,
                        )
                      }
                      editable={isEditing}
                    />
                    <Field
                      label="Score Type"
                      value={item.scoreType || ""}
                      onChange={(value) =>
                        updateArrayItem("education", index, "scoreType", value)
                      }
                      editable={isEditing}
                      placeholder="Marks / Percentage / CGPA"
                    />
                    <Field
                      label="Score"
                      value={item.score || ""}
                      onChange={(value) =>
                        updateArrayItem("education", index, "score", value)
                      }
                      editable={isEditing}
                    />
                  </Block>
                ))}
              </div>
            </Section>
          )}

          {activeTab === "experience" && (
            <Section
              title="Internship & Work Experience"
              action={
                isEditing && (
                  <button
                    type="button"
                    onClick={() =>
                      addArrayItem("experiences", newExperienceRow)
                    }
                    className="text-sm text-green-600"
                  >
                    + Add Experience
                  </button>
                )
              }
            >
              <div className="space-y-4">
                {profile.experiences.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No experience records added.
                  </p>
                )}
                {profile.experiences.map((item, index) => (
                  <Block
                    key={`exp-${index}`}
                    title={`Experience ${index + 1}`}
                    editable={isEditing}
                    onRemove={() => removeArrayItem("experiences", index)}
                  >
                    <label className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-center text-sm">
                      <span className="text-gray-600">Type</span>
                      {isEditing ? (
                        <select
                          value={item.type || "internship"}
                          onChange={(event) =>
                            updateArrayItem(
                              "experiences",
                              index,
                              "type",
                              event.target.value,
                            )
                          }
                          className="md:col-span-3 border border-gray-300 rounded px-3 py-2"
                        >
                          <option value="internship">Internship</option>
                          <option value="work">Work Experience</option>
                        </select>
                      ) : (
                        <span className="md:col-span-3">
                          {item.type === "work"
                            ? "Work Experience"
                            : "Internship"}
                        </span>
                      )}
                    </label>

                    <Field
                      label="Organization"
                      value={item.organization || ""}
                      onChange={(value) =>
                        updateArrayItem(
                          "experiences",
                          index,
                          "organization",
                          value,
                        )
                      }
                      editable={isEditing}
                    />
                    <Field
                      label="Role"
                      value={item.role || ""}
                      onChange={(value) =>
                        updateArrayItem("experiences", index, "role", value)
                      }
                      editable={isEditing}
                    />
                    <Field
                      label="Start Date"
                      value={item.startDate || ""}
                      onChange={(value) =>
                        updateArrayItem(
                          "experiences",
                          index,
                          "startDate",
                          value,
                        )
                      }
                      editable={isEditing}
                    />
                    <Field
                      label="End Date"
                      value={item.endDate || ""}
                      onChange={(value) =>
                        updateArrayItem("experiences", index, "endDate", value)
                      }
                      editable={isEditing}
                    />
                    <Field
                      label="Duration"
                      value={item.duration || ""}
                      onChange={(value) =>
                        updateArrayItem("experiences", index, "duration", value)
                      }
                      editable={isEditing}
                    />
                    <TextAreaField
                      label="Description"
                      value={item.description || ""}
                      onChange={(value) =>
                        updateArrayItem(
                          "experiences",
                          index,
                          "description",
                          value,
                        )
                      }
                      editable={isEditing}
                    />
                  </Block>
                ))}
              </div>
            </Section>
          )}

          {activeTab === "projects" && (
            <Section
              title="Projects"
              action={
                isEditing && (
                  <button
                    type="button"
                    onClick={() => addArrayItem("projects", newProjectRow)}
                    className="text-sm text-green-600"
                  >
                    + Add Project
                  </button>
                )
              }
            >
              <div className="space-y-4">
                {profile.projects.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No project records added.
                  </p>
                )}
                {profile.projects.map((item, index) => (
                  <Block
                    key={`proj-${index}`}
                    title={`Project ${index + 1}`}
                    editable={isEditing}
                    onRemove={() => removeArrayItem("projects", index)}
                  >
                    <Field
                      label="Project Title"
                      value={item.title || ""}
                      onChange={(value) =>
                        updateArrayItem("projects", index, "title", value)
                      }
                      editable={isEditing}
                    />
                    <TextAreaField
                      label="Description"
                      value={item.description || ""}
                      onChange={(value) =>
                        updateArrayItem("projects", index, "description", value)
                      }
                      editable={isEditing}
                    />
                    <Field
                      label="Duration"
                      value={item.duration || ""}
                      onChange={(value) =>
                        updateArrayItem("projects", index, "duration", value)
                      }
                      editable={isEditing}
                    />
                    <Field
                      label="GitHub Link"
                      value={item.githubLink || ""}
                      onChange={(value) =>
                        updateArrayItem("projects", index, "githubLink", value)
                      }
                      editable={isEditing}
                    />
                    <Field
                      label="Live Link"
                      value={item.liveLink || ""}
                      onChange={(value) =>
                        updateArrayItem("projects", index, "liveLink", value)
                      }
                      editable={isEditing}
                    />
                    <Field
                      label="Tech Stack"
                      value={item.techStack || ""}
                      onChange={(value) =>
                        updateArrayItem("projects", index, "techStack", value)
                      }
                      editable={isEditing}
                      placeholder="React, Node.js, MongoDB"
                    />
                  </Block>
                ))}
              </div>
            </Section>
          )}

          {activeTab === "skills" && (
            <Section
              title="Skills"
              action={
                isEditing && (
                  <button
                    type="button"
                    onClick={addSkill}
                    className="text-sm text-green-600"
                  >
                    + Add Skill
                  </button>
                )
              }
            >
              <div className="border border-gray-200 rounded-lg p-3 h-56 overflow-y-auto bg-gray-50 space-y-2">
                {profile.skills.length === 0 && (
                  <p className="text-sm text-gray-500">No skills added.</p>
                )}
                {profile.skills.map((skill, index) => (
                  <div
                    key={`skill-${index}`}
                    className="flex items-center gap-2"
                  >
                    {isEditing ? (
                      <input
                        value={skill || ""}
                        onChange={(event) =>
                          updateSkill(index, event.target.value)
                        }
                        className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm"
                        placeholder="Add a skill"
                      />
                    ) : (
                      <div className="flex-1 text-sm border border-gray-200 bg-white rounded px-3 py-1.5">
                        {skill || "-"}
                      </div>
                    )}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="text-xs text-red-500"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {activeTab === "certifications" && (
            <Section
              title="Certificates"
              action={
                isEditing && (
                  <button
                    type="button"
                    onClick={() =>
                      addArrayItem("certifications", newCertificationRow)
                    }
                    className="text-sm text-green-600"
                  >
                    + Add Certificate
                  </button>
                )
              }
            >
              <div className="space-y-4">
                {profile.certifications.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No certificates added.
                  </p>
                )}
                {profile.certifications.map((item, index) => (
                  <Block
                    key={`cert-${index}`}
                    title={`Certificate ${index + 1}`}
                    editable={isEditing}
                    onRemove={() => removeArrayItem("certifications", index)}
                  >
                    <Field
                      label="Title"
                      value={item.title || ""}
                      onChange={(value) =>
                        updateArrayItem("certifications", index, "title", value)
                      }
                      editable={isEditing}
                    />
                    <Field
                      label="Organization"
                      value={item.organization || ""}
                      onChange={(value) =>
                        updateArrayItem(
                          "certifications",
                          index,
                          "organization",
                          value,
                        )
                      }
                      editable={isEditing}
                    />
                    <Field
                      label="Issue Date"
                      value={item.issueDate || ""}
                      onChange={(value) =>
                        updateArrayItem(
                          "certifications",
                          index,
                          "issueDate",
                          value,
                        )
                      }
                      editable={isEditing}
                    />
                    <Field
                      label="Credential ID"
                      value={item.credentialId || ""}
                      onChange={(value) =>
                        updateArrayItem(
                          "certifications",
                          index,
                          "credentialId",
                          value,
                        )
                      }
                      editable={isEditing}
                    />
                    <Field
                      label="Credential URL"
                      value={item.credentialUrl || ""}
                      onChange={(value) =>
                        updateArrayItem(
                          "certifications",
                          index,
                          "credentialUrl",
                          value,
                        )
                      }
                      editable={isEditing}
                    />
                    <TextAreaField
                      label="Description"
                      value={item.description || ""}
                      onChange={(value) =>
                        updateArrayItem(
                          "certifications",
                          index,
                          "description",
                          value,
                        )
                      }
                      editable={isEditing}
                    />
                  </Block>
                ))}
              </div>
            </Section>
          )}

          {activeTab === "achievements" && (
            <Section
              title="Achievements"
              action={
                isEditing && (
                  <button
                    type="button"
                    onClick={() =>
                      addArrayItem("achievements", newAchievementRow)
                    }
                    className="text-sm text-green-600"
                  >
                    + Add Achievement
                  </button>
                )
              }
            >
              <div className="space-y-4">
                {profile.achievements.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No achievements added.
                  </p>
                )}
                {profile.achievements.map((item, index) => (
                  <Block
                    key={`ach-${index}`}
                    title={`Achievement ${index + 1}`}
                    editable={isEditing}
                    onRemove={() => removeArrayItem("achievements", index)}
                  >
                    <Field
                      label="Title"
                      value={item.title || ""}
                      onChange={(value) =>
                        updateArrayItem("achievements", index, "title", value)
                      }
                      editable={isEditing}
                    />
                    <Field
                      label="Date"
                      value={item.date || ""}
                      onChange={(value) =>
                        updateArrayItem("achievements", index, "date", value)
                      }
                      editable={isEditing}
                    />
                    <TextAreaField
                      label="Description"
                      value={item.description || ""}
                      onChange={(value) =>
                        updateArrayItem(
                          "achievements",
                          index,
                          "description",
                          value,
                        )
                      }
                      editable={isEditing}
                    />
                  </Block>
                ))}
              </div>
            </Section>
          )}

          {activeTab === "extracurriculars" && (
            <Section
              title="Extracurricular Activities"
              action={
                isEditing && (
                  <button
                    type="button"
                    onClick={() =>
                      addArrayItem("extracurriculars", newExtracurricularRow)
                    }
                    className="text-sm text-green-600"
                  >
                    + Add Activity
                  </button>
                )
              }
            >
              <div className="space-y-4">
                {profile.extracurriculars.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No extracurricular activities added.
                  </p>
                )}
                {profile.extracurriculars.map((item, index) => (
                  <Block
                    key={`extra-${index}`}
                    title={`Activity ${index + 1}`}
                    editable={isEditing}
                    onRemove={() => removeArrayItem("extracurriculars", index)}
                  >
                    <Field
                      label="Title"
                      value={item.title || ""}
                      onChange={(value) =>
                        updateArrayItem(
                          "extracurriculars",
                          index,
                          "title",
                          value,
                        )
                      }
                      editable={isEditing}
                    />
                    <Field
                      label="Club/Organization"
                      value={item.clubName || ""}
                      onChange={(value) =>
                        updateArrayItem(
                          "extracurriculars",
                          index,
                          "clubName",
                          value,
                        )
                      }
                      editable={isEditing}
                    />
                    <Field
                      label="Role"
                      value={item.role || ""}
                      onChange={(value) =>
                        updateArrayItem(
                          "extracurriculars",
                          index,
                          "role",
                          value,
                        )
                      }
                      editable={isEditing}
                    />
                    <Field
                      label="Duration"
                      value={item.duration || ""}
                      onChange={(value) =>
                        updateArrayItem(
                          "extracurriculars",
                          index,
                          "duration",
                          value,
                        )
                      }
                      editable={isEditing}
                    />
                    <TextAreaField
                      label="Description"
                      value={item.description || ""}
                      onChange={(value) =>
                        updateArrayItem(
                          "extracurriculars",
                          index,
                          "description",
                          value,
                        )
                      }
                      editable={isEditing}
                    />
                  </Block>
                ))}
              </div>
            </Section>
          )}
        </main>
      </div>
    </div>
  );
}
