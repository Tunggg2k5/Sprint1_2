import { Router } from "express";
import * as publicController from "../controllers/publicController.js";

const router = Router();

router.get("/bootstrap", publicController.getBootstrap);
router.post("/consultations", publicController.createConsultation);

export default router;
