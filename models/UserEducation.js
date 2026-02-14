import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema(
  {
    semester: {
      type: Number,
      required: true,
      min: 1,
    },
    marks: {
      type: Number,
      required: false,
    },
    sgpa: {
      type: Number,
      min: 0,
      max: 10,
    },
  },
  { _id: false }
);

const educationSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      required: true,
      enum: [
        "school",
        "high_school",
        "college",
        "mtech",
        "phd",
      ],
    },

    educationType: {
      type: String,
      enum: ["full_time", "part_time"],
      default: "full_time",
    },

    instituteName: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      default: "",
    },

    branch: {
      type: String,
      default: "",
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    // ===== School / High School =====
    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },

    grade: {
      type: String, // A, A+, B, etc.
      default: "",
    },

    gradingSystem: {
      type: String,
      enum: ["percentage", "grade", "cgpa"],
    },

    // ===== College / MTech / PhD =====
    cgpa: {
      type: Number,
      min: 0,
      max: 10,
    },

    semesters: {
      type: [semesterSchema],
      default: [],
    },
  },
  { _id: false }
);
