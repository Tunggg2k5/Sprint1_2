import { getCollection } from "../config/mongodb.js";
import { COLLECTIONS } from "../models/collections.js";
import { insertOne } from "./mongoRepository.js";

const userPublicProjection = {
  fullName: 1,
  email: 1,
  phone: 1,
  avatar: 1,
  avatarUrl: 1,
  yearsOfExperience: 1,
  bio: 1,
  licenseNo: 1,
  role: 1,
  status: 1,
  createdAt: 1
};

export function findActiveServices() {
  return getCollection(COLLECTIONS.services).find({ isActive: true }).sort({ name: 1 }).toArray();
}

export async function findActiveDentists() {
  const users = await getCollection(COLLECTIONS.users)
    .find({ role: "dentist", status: "active" })
    .project(userPublicProjection)
    .sort({ fullName: 1 })
    .toArray();

  if (!users.length) return [];

  const profiles = await getCollection(COLLECTIONS.dentists)
    .find({ user: { $in: users.map((user) => user._id) }, status: "active" })
    .toArray();
  const profileMap = new Map(profiles.map((profile) => [profile.user?.toString(), profile]));

  return users.map((user) => {
    const profile = profileMap.get(user._id.toString());
    return {
      ...user,
      yearsOfExperience: Number(user.yearsOfExperience || profile?.experienceYears || 0),
      qualification: profile?.qualification || "Bác sĩ Răng Hàm Mặt",
      bio: user.bio || profile?.description || "",
      description: profile?.description || user.bio || ""
    };
  });
}

export async function findActiveRooms() {
  const rooms = await getCollection(COLLECTIONS.rooms)
    .find({ isActive: true })
    .sort({ name: 1 })
    .toArray();

  await populateById(rooms, "assignedDentist", COLLECTIONS.users, {
    fullName: 1,
    avatarUrl: 1,
    yearsOfExperience: 1,
    bio: 1,
    phone: 1
  });
  await populateById(rooms, "assignedNurse", COLLECTIONS.users, {
    fullName: 1,
    phone: 1
  });

  return rooms;
}

export async function findLatestReviews() {
  const reviews = await getCollection(COLLECTIONS.reviews)
    .find({ comment: { $exists: true, $ne: "" } })
    .sort({ createdAt: -1 })
    .limit(12)
    .toArray();

  await populateById(reviews, "patient", COLLECTIONS.users, { fullName: 1 });
  await populateById(reviews, "service", COLLECTIONS.services, { name: 1 });
  await populateById(reviews, "dentist", COLLECTIONS.users, { fullName: 1 });

  return reviews;
}

export async function findPublicClinic() {
  const [clinic, receptionist] = await Promise.all([
    getCollection(COLLECTIONS.clinicSettings).findOne({ key: "public" }),
    getCollection(COLLECTIONS.users)
      .find({ role: "receptionist", status: "active" })
      .project({ fullName: 1, phone: 1 })
      .sort({ phone: 1 })
      .limit(1)
      .next()
  ]);

  return {
    ...(clinic || {}),
    receptionist: receptionist || clinic?.receptionist || null,
    receptionistPhone: receptionist?.phone || clinic?.receptionistPhone || ""
  };
}

export function createConsultation(data) {
  return insertOne(COLLECTIONS.consultations, data);
}

async function populateById(documents, path, collectionName, projection) {
  const ids = [...new Set(documents.map((document) => document[path]).filter(Boolean).map((id) => id.toString()))];
  if (!ids.length) return;

  const objectIds = documents.map((document) => document[path]).filter(Boolean);
  const relatedDocuments = await getCollection(collectionName)
    .find({ _id: { $in: objectIds } })
    .project(projection)
    .toArray();
  const relatedMap = new Map(relatedDocuments.map((document) => [document._id.toString(), document]));

  documents.forEach((document) => {
    const related = relatedMap.get(document[path]?.toString());
    if (related) document[path] = related;
  });
}
