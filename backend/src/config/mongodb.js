import { MongoClient, ObjectId } from "mongodb";
import { env } from "./environment.js";

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
  return database;
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
