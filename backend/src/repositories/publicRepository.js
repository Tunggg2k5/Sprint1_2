import { getCollection } from "../config/mongodb.js";
import { COLLECTIONS } from "../models/collections.js";
import { findMany, findOne, insertOne } from "./mongoRepository.js";

export function findActiveServices() {
  return findMany(COLLECTIONS.services, { isActive: true, seedKey: "training-seed" }, { sort: { createdAt: -1 } });
}

export function findActiveDentists() {
  return findMany(COLLECTIONS.users, { role: "dentist", status: "active", seedKey: "training-seed" }, { sort: { createdAt: -1 } });
}

export function findActiveRooms() {
  return findMany(COLLECTIONS.rooms, { isActive: true, seedKey: "training-seed" }, { sort: { name: 1 } });
}

export function findLatestReviews() {
  return findMany(COLLECTIONS.reviews, { seedKey: "training-seed" }, { sort: { createdAt: -1 }, limit: 12 });
}

export function findPublicClinic() {
  return findOne(COLLECTIONS.clinicSettings, { key: "public" });
}

export function createConsultation(data) {
  return insertOne(COLLECTIONS.consultations, data);
}

export async function upsertPublicClinic(data) {
  return getCollection(COLLECTIONS.clinicSettings).findOneAndUpdate(
    { key: "public" },
    { $set: { ...data, key: "public", updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true, returnDocument: "after" }
  );
}
