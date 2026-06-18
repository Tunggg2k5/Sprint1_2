import { COLLECTIONS } from "../models/collections.js";
import { findById, findMany, findOne, insertOne, updateById, updateMany } from "./mongoRepository.js";
import { getCollection, toObjectId } from "../config/mongodb.js";

export function findUserByPhone(phone) {
  return findOne(COLLECTIONS.users, { phone });
}

export function findUsersByRole(role) {
  return findMany(COLLECTIONS.users, { role, status: "active" }, { sort: { createdAt: -1 } });
}

export function findUserById(userId) {
  return findById(COLLECTIONS.users, userId);
}

export function createUser(user) {
  return insertOne(COLLECTIONS.users, user);
}

export function updateUserProfile(userId, profile) {
  return updateById(COLLECTIONS.users, userId, profile);
}

export function updatePasswordHash(userId, passwordHash) {
  return updateById(COLLECTIONS.users, userId, { passwordHash });
}

export function findNotificationsByUser(userId) {
  return findMany(
    COLLECTIONS.notifications,
    { user: toObjectId(userId) },
    { sort: { createdAt: -1 }, limit: 50 }
  );
}

export function createNotification(notification) {
  return insertOne(COLLECTIONS.notifications, notification);
}

export function markNotificationRead(notificationId, userId) {
  return getCollection(COLLECTIONS.notifications).findOneAndUpdate(
    { _id: toObjectId(notificationId), user: toObjectId(userId) },
    { $set: { isRead: true, readAt: new Date(), updatedAt: new Date() } },
    { returnDocument: "after" }
  );
}

export function markAllNotificationsRead(userId) {
  return updateMany(
    COLLECTIONS.notifications,
    { user: toObjectId(userId), isRead: false },
    { isRead: true, readAt: new Date() }
  );
}
