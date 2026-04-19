import mongoose from "mongoose";

const resetTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

// Automatically delete expired tokens
resetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ResetToken =
  mongoose.models.ResetToken || mongoose.model("ResetToken", resetTokenSchema);

export default ResetToken;
