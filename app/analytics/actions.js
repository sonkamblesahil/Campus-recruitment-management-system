"use server";

import { connectToDatabase } from "@/lib/mongodb";
import Job from "@/models/Job";
import Application from "@/models/Application";
import Offer from "@/models/Offer";
import User from "@/models/User";

export async function getAnalyticsDataAction() {
  await connectToDatabase();

  const totalStudents = await User.countDocuments({ role: "student" });
  const totalJobs = await Job.countDocuments({ active: true });
  const totalApplications = await Application.countDocuments();
  const totalOffers = await Offer.countDocuments();
  const acceptedOffers = await Offer.countDocuments({ status: "accepted" });

  const recentJobsCursor = await Job.find({ active: true })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // Highest CTC
  const offersWithCTC = await Offer.find({}).lean();
  let maxCTC = 0;
  offersWithCTC.forEach((offer) => {
    const num = parseInt(String(offer.offeredCTC).replace(/\D/g, ""));
    if (num > maxCTC) maxCTC = num;
  });

  return {
    success: true,
    data: {
      totalStudents,
      totalJobs,
      totalApplications,
      totalOffers,
      acceptedOffers,
      maxCTC: maxCTC > 0 ? maxCTC + " LPA" : "N/A",
      recentJobs: recentJobsCursor.map((j) => ({
        id: String(j._id),
        title: j.title,
        company: j.company,
      })),
    },
  };
}
