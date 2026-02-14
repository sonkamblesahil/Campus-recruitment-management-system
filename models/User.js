import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
      default: "student",
    },

    phone: {
      type: String,
      required: true,
    },

    skills: {
      type: [String],
      default: [],
    },

    github: {
      type: String,
      default: "",
    },

    linkedin: {
      type: String,
      default: "",
    },

    address: {
      firstLine: {
        type: String,
        default: "",
      },
      city: {
        type: String,
        default: "",
      },
      state: {
        type: String,
        default: "",
      },
      pincode: {
        type: String,
        default: "",
      },
    },


    role: {
      type: String,
      required: true,
      enum: ["student", "admin"],
      default: "student",
    },

    education: {
      type: [educationSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("User", userSchema);
