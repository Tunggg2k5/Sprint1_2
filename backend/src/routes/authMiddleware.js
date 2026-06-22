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

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      res.status(403).json({ message: "Tai khoan khong co quyen su dung chuc nang nay." });
      return;
    }
    next();
  };
}

export const requirePatient = requireRole("patient");
export const requireReceptionist = requireRole("receptionist");
