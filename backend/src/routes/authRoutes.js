import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { requireAuth } from "./authMiddleware.js";

const router = Router();

router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/logout", authController.logout);
router.post("/forgot-password/request-otp", authController.requestPasswordReset);
router.post("/forgot-password/reset", authController.resetPasswordWithOtp);
router.get("/me", requireAuth, authController.getMe);
router.patch("/me", requireAuth, authController.updateProfile);
router.patch("/change-password", requireAuth, authController.changePassword);
router.get("/notifications", requireAuth, authController.getNotifications);
router.patch("/notifications/read-all", requireAuth, authController.markAllNotificationsRead);
router.patch("/notifications/:id/read", requireAuth, authController.markNotificationRead);

export default router;
