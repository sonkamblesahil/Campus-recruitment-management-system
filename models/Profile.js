import mongoose from "mongoose";

const semesterMarkSchema = new mongoose.Schema(
  {
    semester: { type: String, trim: true },
    marksObtained: { type: String, trim: true },
    totalMarks: { type: String, trim: true },
    percentage: { type: String, trim: true },
    cgpa: { type: String, trim: true },
  },
  { _id: false },
);

const educationSchema = new mongoose.Schema(
  {
    qualification: { type: String, trim: true },
    institute: { type: String, trim: true },
    boardOrUniversity: { type: String, trim: true },
    yearOfPassing: { type: String, trim: true },
    scoreType: { type: String, trim: true },
    score: { type: String, trim: true },
  },
  { _id: false },
);

const experienceSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["internship", "work"], default: "internship" },
    organization: { type: String, trim: true },
    role: { type: String, trim: true },
    startDate: { type: String, trim: true },
    endDate: { type: String, trim: true },
    duration: { type: String, trim: true },
    description: { type: String, trim: true },
  },
  { _id: false },
);

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    duration: { type: String, trim: true },
    githubLink: { type: String, trim: true },
    liveLink: { type: String, trim: true },
    techStack: { type: String, trim: true },
  },
  { _id: false },
);

const certificationSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    organization: { type: String, trim: true },
    description: { type: String, trim: true },
    issueDate: { type: String, trim: true },
    credentialId: { type: String, trim: true },
    credentialUrl: { type: String, trim: true },
  },
  { _id: false },
);

const achievementSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    date: { type: String, trim: true },
  },
  { _id: false },
);

const extracurricularSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    clubName: { type: String, trim: true },
    role: { type: String, trim: true },
    description: { type: String, trim: true },
    duration: { type: String, trim: true },
  },
  { _id: false },
);

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    basic: {
      name: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, lowercase: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      address: { type: String, trim: true, default: "" },
      linkedin: { type: String, trim: true, default: "" },
      portfolio: { type: String, trim: true, default: "" },
    },
    academic: {
      currentInstitute: { type: String, trim: true, default: "" },
      department: { type: String, trim: true, default: "" },
      currentSemester: { type: String, trim: true, default: "" },
      cgpa: { type: String, trim: true, default: "" },
    },
    semesterMarks: {
      type: [semesterMarkSchema],
      default: [],
    },
    education: {
      type: [educationSchema],
      default: [],
    },
    experiences: {
      type: [experienceSchema],
      default: [],
    },
    projects: {
      type: [projectSchema],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    certifications: {
      type: [certificationSchema],
      default: [],
    },
    achievements: {
      type: [achievementSchema],
      default: [],
    },
    extracurriculars: {
      type: [extracurricularSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const Profile =
  mongoose.models.Profile || mongoose.model("Profile", profileSchema);

export default Profile;
