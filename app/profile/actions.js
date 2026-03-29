"use server";

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Profile from "@/models/Profile";
import User from "@/models/User";

function normalizeString(value) {
  return String(value || "").trim();
}

function cleanArray(items) {
  return (items || []).filter((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    return Object.values(item).some((value) => normalizeString(value) !== "");
  });
}

export async function getProfileAction(userId) {
  const normalizedUserId = normalizeString(userId);

  if (!mongoose.Types.ObjectId.isValid(normalizedUserId)) {
    return { success: false, error: "Invalid user" };
  }

  await connectToDatabase();

  const user = await User.findById(normalizedUserId).lean();
  if (!user) {
    return { success: false, error: "User not found" };
  }

  const existingProfile = await Profile.findOne({
    userId: normalizedUserId,
  }).lean();

  if (!existingProfile) {
    return {
      success: true,
      data: {
        basic: {
          name: user.name || "",
          email: user.email || "",
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
      },
    };
  }

  return {
    success: true,
    data: {
      basic: {
        name: existingProfile.basic?.name || user.name || "",
        email: existingProfile.basic?.email || user.email || "",
        phone: existingProfile.basic?.phone || "",
        address: existingProfile.basic?.address || "",
        linkedin: existingProfile.basic?.linkedin || "",
        portfolio: existingProfile.basic?.portfolio || "",
      },
      academic: {
        currentInstitute: existingProfile.academic?.currentInstitute || "",
        department: existingProfile.academic?.department || "",
        currentSemester: existingProfile.academic?.currentSemester || "",
        cgpa: existingProfile.academic?.cgpa || "",
      },
      semesterMarks: existingProfile.semesterMarks || [],
      education: existingProfile.education || [],
      experiences: existingProfile.experiences || [],
      projects: existingProfile.projects || [],
      skills: existingProfile.skills || [],
      certifications: existingProfile.certifications || [],
      achievements: existingProfile.achievements || [],
      extracurriculars: existingProfile.extracurriculars || [],
    },
  };
}

export async function saveProfileAction(userId, profileData) {
  const normalizedUserId = normalizeString(userId);

  if (!mongoose.Types.ObjectId.isValid(normalizedUserId)) {
    return { success: false, error: "Invalid user" };
  }

  await connectToDatabase();

  const user = await User.findById(normalizedUserId);
  if (!user) {
    return { success: false, error: "User not found" };
  }

  const normalizedData = {
    basic: {
      name: normalizeString(profileData?.basic?.name) || user.name || "",
      email:
        normalizeString(profileData?.basic?.email).toLowerCase() ||
        user.email ||
        "",
      phone: normalizeString(profileData?.basic?.phone),
      address: normalizeString(profileData?.basic?.address),
      linkedin: normalizeString(profileData?.basic?.linkedin),
      portfolio: normalizeString(profileData?.basic?.portfolio),
    },
    academic: {
      currentInstitute: normalizeString(
        profileData?.academic?.currentInstitute,
      ),
      department: normalizeString(profileData?.academic?.department),
      currentSemester: normalizeString(profileData?.academic?.currentSemester),
      cgpa: normalizeString(profileData?.academic?.cgpa),
    },
    semesterMarks: cleanArray(profileData?.semesterMarks).map((item) => ({
      semester: normalizeString(item.semester),
      marksObtained: normalizeString(item.marksObtained),
      totalMarks: normalizeString(item.totalMarks),
      percentage: normalizeString(item.percentage),
      cgpa: normalizeString(item.cgpa),
    })),
    education: cleanArray(profileData?.education).map((item) => ({
      qualification: normalizeString(item.qualification),
      institute: normalizeString(item.institute),
      boardOrUniversity: normalizeString(item.boardOrUniversity),
      yearOfPassing: normalizeString(item.yearOfPassing),
      scoreType: normalizeString(item.scoreType),
      score: normalizeString(item.score),
    })),
    experiences: cleanArray(profileData?.experiences).map((item) => ({
      type: item.type === "work" ? "work" : "internship",
      organization: normalizeString(item.organization),
      role: normalizeString(item.role),
      startDate: normalizeString(item.startDate),
      endDate: normalizeString(item.endDate),
      duration: normalizeString(item.duration),
      description: normalizeString(item.description),
    })),
    projects: cleanArray(profileData?.projects).map((item) => ({
      title: normalizeString(item.title),
      description: normalizeString(item.description),
      duration: normalizeString(item.duration),
      githubLink: normalizeString(item.githubLink),
      liveLink: normalizeString(item.liveLink),
      techStack: normalizeString(item.techStack),
    })),
    skills: (profileData?.skills || [])
      .map((skill) => normalizeString(skill))
      .filter((skill) => skill !== ""),
    certifications: cleanArray(profileData?.certifications).map((item) => ({
      title: normalizeString(item.title),
      organization: normalizeString(item.organization),
      description: normalizeString(item.description),
      issueDate: normalizeString(item.issueDate),
      credentialId: normalizeString(item.credentialId),
      credentialUrl: normalizeString(item.credentialUrl),
    })),
    achievements: cleanArray(profileData?.achievements).map((item) => ({
      title: normalizeString(item.title),
      description: normalizeString(item.description),
      date: normalizeString(item.date),
    })),
    extracurriculars: cleanArray(profileData?.extracurriculars).map((item) => ({
      title: normalizeString(item.title),
      clubName: normalizeString(item.clubName),
      role: normalizeString(item.role),
      description: normalizeString(item.description),
      duration: normalizeString(item.duration),
    })),
  };

  await Profile.findOneAndUpdate(
    { userId: normalizedUserId },
    { $set: { ...normalizedData, userId: normalizedUserId } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return { success: true };
}
