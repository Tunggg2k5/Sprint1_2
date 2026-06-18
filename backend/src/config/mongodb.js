import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dental_appointment_training";

let client;
let database;

// Kết nối MongoDB bằng native driver, không dùng Mongoose.
export async function connectMongoDB() {
  if (database) return database;

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

export function getCollection(collectionName) {
  return getDatabase().collection(collectionName);
}

export function toObjectId(value) {
  if (value instanceof ObjectId) return value;
  if (typeof value === "string" && ObjectId.isValid(value)) return new ObjectId(value);
  return value;
}

export async function closeMongoDB() {
  if (client) await client.close();
  client = undefined;
  database = undefined;
}
