import "dotenv/config";
import cors from "cors";
import express from "express";
import { connectMongoDB, getDatabase } from "./config/mongodb.js";
import { COLLECTION_INDEXES } from "./models/collections.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";

const app = express();
const port = Number(process.env.PORT || 4100);
const allowedOrigins = (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || "http://localhost:5174,http://127.0.0.1:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ message: "Dental Appointment Training API is running." });
});

app.use("/api", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/patient", patientRoutes);

async function ensureIndexes() {
  const database = getDatabase();
  await Promise.all(
    Object.entries(COLLECTION_INDEXES).flatMap(([collectionName, indexes]) =>
      indexes.map(({ key, options }) => database.collection(collectionName).createIndex(key, options))
    )
  );
}

async function startServer() {
  await connectMongoDB();
  await ensureIndexes();
  app.listen(port, () => {
    console.log(`Backend running at http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
