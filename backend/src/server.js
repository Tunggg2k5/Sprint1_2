import express from "express";
import helmet from "helmet";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { corsMiddleware } from "./config/cors.js";
import { env } from "./config/environment.js";
import { connectMongoDB } from "./config/mongodb.js";
import patientRoutes from "./routes/patientRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import receptionRoutes from "./routes/receptionRoutes.js";

export const app = express();

app.use(helmet());
app.use(corsMiddleware);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ message: "Dental Appointment Training API is running." });
});

app.use("/api", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/reception", receptionRoutes);

async function startServer() {
  await connectMongoDB();
  return app.listen(env.PORT);
}

if (process.env.NODE_ENV !== "test") {
  try {
    await startServer();
  } catch (_error) {
    process.exit(1);
  }
}
