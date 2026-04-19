import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
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
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    offeredCTC: {
      type: String,
      trim: true,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
      index: true,
    },
    offerLetterUrl: {
      type: String,
      trim: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

const Offer = mongoose.models.Offer || mongoose.model("Offer", offerSchema);

export default Offer;
