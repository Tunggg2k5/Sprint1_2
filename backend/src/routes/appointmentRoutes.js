import { Router } from "express";
import * as appointmentController from "../controllers/appointmentController.js";
import { requireAuth, requirePatient } from "./authMiddleware.js";

const router = Router();

router.use(requireAuth, requirePatient);
router.post("/", appointmentController.createAppointment);
router.patch("/:id/cancel", appointmentController.cancelAppointment);
router.patch("/:id/reschedule", appointmentController.rescheduleAppointment);

export default router;
