import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["applied", "under-review", "shortlisted", "rejected", "selected"],
      default: "applied",
      index: true,
    },
    resumeUrl: {
      type: String,
      trim: true,
    },
    coverLetter: {
      type: String,
      trim: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    reviewNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Ensure a student can only apply once to a specific job
applicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });

const Application =
  mongoose.models.Application ||
  mongoose.model("Application", applicationSchema);

export default Application;
