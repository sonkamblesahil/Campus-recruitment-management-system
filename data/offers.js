import { demoOffers } from "./sampleData.js";

export const offers = demoOffers.map((offer, index) => ({
  id: index + 1,
  company: offer.company,
  position: offer.position,
  salary: offer.salary,
  location: offer.location,
  description: `${offer.companyName} offer for ${offer.jobTitle} at ${offer.salary} in ${offer.location}.`,
}));
