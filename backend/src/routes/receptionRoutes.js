import { Router } from "express";
import * as receptionController from "../controllers/receptionController.js";
import { requireAuth, requireReceptionist } from "./authMiddleware.js";

const router = Router();

router.use(requireAuth, requireReceptionist);

router.get("/dashboard", receptionController.getDashboard);
router.get("/patients", receptionController.getPatients);
router.post("/patients", receptionController.createPatient);
router.patch("/patients/:id/reset-password", receptionController.resetPatientPassword);

router.post("/appointments", receptionController.createAppointment);
router.patch("/appointments/:id/schedule", receptionController.scheduleAppointment);
router.patch("/appointments/:id/status", receptionController.updateAppointmentStatus);
router.post("/appointments/:id/invoice", receptionController.createInvoice);
router.patch("/appointments/:id/payment", receptionController.processPayment);

router.get("/consultations", receptionController.getConsultations);
router.patch("/consultations/:id", receptionController.updateConsultation);
router.delete("/consultations/:id", receptionController.deleteConsultation);

router.get("/rooms", receptionController.getRooms);
router.patch("/rooms/:id/status", receptionController.updateRoomStatus);

export default router;
