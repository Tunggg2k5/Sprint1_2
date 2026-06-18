import { getCollection, toObjectId } from "../config/mongodb.js";

function withTimestamps(data, isNew = false) {
  const now = new Date();
  return {
    ...data,
    updatedAt: now,
    ...(isNew ? { createdAt: now } : {})
  };
}

export function findOne(collectionName, query) {
  return getCollection(collectionName).findOne(query);
}

export function findById(collectionName, id) {
  return getCollection(collectionName).findOne({ _id: toObjectId(id) });
}

export function findMany(collectionName, query = {}, options = {}) {
  return getCollection(collectionName).find(query).sort(options.sort || {}).limit(options.limit || 0).toArray();
}

export async function insertOne(collectionName, data) {
  const document = withTimestamps(data, true);
  const result = await getCollection(collectionName).insertOne(document);
  return { ...document, _id: result.insertedId };
}

export async function updateById(collectionName, id, data) {
  const result = await getCollection(collectionName).findOneAndUpdate(
    { _id: toObjectId(id) },
    { $set: withTimestamps(data) },
    { returnDocument: "after" }
  );
  return result;
}

export function updateMany(collectionName, query, data) {
  return getCollection(collectionName).updateMany(query, { $set: withTimestamps(data) });
}

export function deleteById(collectionName, id) {
  return getCollection(collectionName).deleteOne({ _id: toObjectId(id) });
}
