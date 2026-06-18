import { MongoClient, ObjectId } from "mongodb";
import { env } from "./environment.js";
import { COLLECTION_INDEXES } from "../models/collections.js";

let client;
let database;

export async function connectMongoDB(uri = env.MONGODB_URI) {
  if (!uri) {
    throw new Error("Thiếu chuỗi kết nối MongoDB.");
  }

  if (database) {
    return database;
  }

  client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000
  });
  await client.connect();
  database = client.db();
  await ensureIndexes(database);
  return database;
}

async function ensureIndexes(db) {
  await Promise.all(
    Object.entries(COLLECTION_INDEXES).flatMap(([collectionName, indexes]) =>
      indexes.map(async ({ key, options }) => {
        try {
          await db.collection(collectionName).createIndex(key, options);
        } catch (error) {
          if (![85, 86].includes(error.code)) throw error;
        }
      })
    )
  );
}

export function getDatabase() {
  if (!database) {
    throw new Error("MongoDB chưa được kết nối.");
  }
  return database;
}

export function getCollection(name) {
  return getDatabase().collection(name);
}

export function toObjectId(value) {
  if (value instanceof ObjectId) return value;
  if (typeof value === "string" && ObjectId.isValid(value)) return new ObjectId(value);
  return value;
}

export function isObjectId(value) {
  return value instanceof ObjectId || (typeof value === "string" && ObjectId.isValid(value));
}

export async function closeMongoDB() {
  if (client) {
    await client.close();
  }
  client = undefined;
  database = undefined;
}
