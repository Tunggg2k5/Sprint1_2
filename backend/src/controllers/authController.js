import * as authService from "../services/authService.js";

function sendError(res, error) {
  res.status(error.statusCode || 500).json({ message: error.message || "Lỗi hệ thống." });
}

export async function login(req, res) {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
}

export async function register(req, res) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    sendError(res, error);
  }
}

export async function logout(_req, res) {
  res.json(authService.logout());
}

export async function getMe(req, res) {
  try {
    const user = await authService.getCurrentUser(req.user._id);
    res.json({ user });
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateProfile(req, res) {
  try {
    const user = await authService.updateProfile(req.user._id, req.body);
    res.json({ user });
  } catch (error) {
    sendError(res, error);
  }
}

export async function changePassword(req, res) {
  try {
    const result = await authService.changePassword(req.user._id, req.body);
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
}

export async function requestPasswordReset(req, res) {
  try {
    const result = await authService.requestPasswordReset(req.body);
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
}

export async function resetPasswordWithOtp(req, res) {
  try {
    const result = await authService.resetPasswordWithOtp(req.body);
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
}

export async function getNotifications(req, res) {
  try {
    const notifications = await authService.getNotifications(req.user._id);
    res.json({ notifications });
  } catch (error) {
    sendError(res, error);
  }
}

export async function markNotificationRead(req, res) {
  try {
    const notification = await authService.markNotificationRead(req.params.id, req.user._id);
    res.json({ notification });
  } catch (error) {
    sendError(res, error);
  }
}

export async function markAllNotificationsRead(req, res) {
  try {
    const notifications = await authService.markAllNotificationsRead(req.user._id);
    res.json({ notifications });
  } catch (error) {
    sendError(res, error);
  }
}
