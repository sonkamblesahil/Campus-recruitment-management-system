"use server";

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Offer from "@/models/Offer";
import Application from "@/models/Application";

export async function getStudentOffersAction(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return { success: false, error: "Invalid user" };
  }

  await connectToDatabase();

  const offers = await Offer.find({ studentId: userId })
    .sort({ issuedAt: -1 })
    .lean();

  const mappedOffers = offers.map((offer) => ({
    id: String(offer._id),
    companyName: offer.companyName,
    jobTitle: offer.jobTitle,
    offeredCTC: offer.offeredCTC,
    status: offer.status,
    issuedAt: offer.issuedAt
      ? new Date(offer.issuedAt).toLocaleDateString()
      : null,
  }));

  return { success: true, data: mappedOffers };
}

export async function respondToOfferAction(userId, offerId, response) {
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(offerId)
  ) {
    return { success: false, error: "Invalid id" };
  }

  if (!["accepted", "declined"].includes(response)) {
    return { success: false, error: "Invalid response" };
  }

  await connectToDatabase();

  const offer = await Offer.findOne({ _id: offerId, studentId: userId });
  if (!offer) {
    return { success: false, error: "Offer not found" };
  }

  if (offer.status !== "pending") {
    return { success: false, error: "Offer already responded to." };
  }

  offer.status = response;
  offer.acceptedAt = response === "accepted" ? new Date() : null;
  await offer.save();

  // Optionally update application status as well
  await Application.findByIdAndUpdate(offer.applicationId, {
    status: response === "accepted" ? "selected" : "rejected",
  });

  return { success: true };
}
