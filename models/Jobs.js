import mongoose from "mongoose";
import eligibilityCriteriaSchema from "./eligibilityCriteriaSchema.js";

const jobsSchema = new mongoose.Schema(
  {
    jobTitle: {
      type: String,
      required: true,
    },

    jobRole: {
      type: String,
    },

    postingDate: {
      type: Date,
      default: Date.now,
    },

    jobDescription: {
      type: String,
      required: true,
    },

    package: {
      type: Number,
    },

    numberOfApplicants: {
      type: Number,
      default: 0,
    },

    jobLocation: {
      type: String,
      required: true,
    },

    numberOfOpenings: {
      type: Number,
      default: 1,
    },

    eligibility: {
      type: eligibilityCriteriaSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Job", jobsSchema);
