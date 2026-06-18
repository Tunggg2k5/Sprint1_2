import { Router } from "express";
import * as patientController from "../controllers/patientController.js";
import { requireAuth, requirePatient } from "./authMiddleware.js";

const router = Router();

router.use(requireAuth, requirePatient);
router.get("/dashboard", patientController.getDashboard);
router.post("/reviews", patientController.submitReview);

export default router;
