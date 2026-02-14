import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
    },

    companyDescription: {
      type: String,
      required: true,
    },

    jobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Company", companySchema);
