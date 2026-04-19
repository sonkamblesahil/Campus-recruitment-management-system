import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      index: true,
    },
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
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    meetingLink: {
      type: String,
      trim: true,
    },
    instructions: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "no-show"],
      default: "scheduled",
    },
    feedback: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Interview =
  mongoose.models.Interview || mongoose.model("Interview", interviewSchema);

export default Interview;
