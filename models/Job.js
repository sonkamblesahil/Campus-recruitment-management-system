import mongoose from "mongoose";

const jobEligibilitySchema = new mongoose.Schema(
  {
    departments: {
      type: [String],
      default: [],
    },
    minCgpa: {
      type: Number,
      default: null,
    },
    minClass12Percentage: {
      type: Number,
      default: null,
    },
    minSemester: {
      type: Number,
      default: null,
    },
    maxSemester: {
      type: Number,
      default: null,
    },
  },
  { _id: false },
);

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    packageCtc: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    eligibility: {
      type: jobEligibilitySchema,
      default: () => ({}),
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);

export default Job;
