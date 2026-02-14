import mongoose from "mongoose";

const eligibilityCriteriaSchema = new mongoose.Schema(
  {
    cgpa: {
      type: Number,
      min: 0,
      max: 10,
    },

    tenthPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },

    twelfthPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },

    numberOfBacklogs: {
      type: Number,
      min: 0,
      default: 0,
    },

    branches: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

export default eligibilityCriteriaSchema;
