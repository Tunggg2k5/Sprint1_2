import * as authService from "../services/authService.js";

export async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    req.user = await authService.verifyToken(token);
    next();
  } catch (error) {
    res.status(error.statusCode || 401).json({ message: error.message });
  }
}

export function requirePatient(req, res, next) {
  if (req.user?.role !== "patient") {
    res.status(403).json({ message: "Chỉ tài khoản bệnh nhân được sử dụng chức năng này." });
    return;
  }
  next();
}
