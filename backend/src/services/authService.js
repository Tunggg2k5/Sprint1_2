import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as userRepository from "../repositories/userRepository.js";

const jwtSecret = process.env.JWT_SECRET || "training-secret-change-me";
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";

export function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });
}

function normalizePhone(phone = "") {
  return String(phone).replace(/\s/g, "");
}

export async function register(body) {
  const phone = normalizePhone(body.phone);
  if (!phone) throw createError("Số điện thoại là bắt buộc.");
  if (!body.password || body.password.length < 8) {
    throw createError("Mật khẩu phải có ít nhất 8 ký tự.");
  }

  const existingUser = await userRepository.findUserByPhone(phone);
  if (existingUser) throw createError("Số điện thoại đã tồn tại.", 409);

  const suffix = phone.slice(-4) || "mới";
  const user = await userRepository.createUser({
    fullName: body.fullName?.trim() || `Bệnh nhân ${suffix}`,
    phone,
    role: "patient",
    status: "active",
    gender: body.gender || "unknown",
    address: body.address || "",
    bio: body.bio || "",
    avatarUrl: "",
    passwordHash: await bcrypt.hash(body.password, 10)
  });

  await userRepository.createNotification({
    user: user._id,
    title: "Chào mừng đến với SmileCare",
    message: "Tài khoản bệnh nhân của bạn đã được tạo thành công.",
    isRead: false
  });

  return {
    message: "Đăng ký thành công. Vui lòng đăng nhập.",
    user: sanitizeUser(user)
  };
}

export async function login({ phone, password }) {
  const user = await userRepository.findUserByPhone(normalizePhone(phone));
  if (!user || user.status !== "active") {
    throw createError("Số điện thoại hoặc mật khẩu không đúng.", 401);
  }

  const isValidPassword = await bcrypt.compare(password || "", user.passwordHash);
  if (!isValidPassword) {
    throw createError("Số điện thoại hoặc mật khẩu không đúng.", 401);
  }

  return {
    token: signToken(user),
    user: sanitizeUser(user)
  };
}

export function logout() {
  return { message: "Đã đăng xuất." };
}

export async function getCurrentUser(userId) {
  const user = await userRepository.findUserById(userId);
  if (!user) throw createError("Không tìm thấy người dùng.", 404);
  return sanitizeUser(user);
}

export async function updateProfile(userId, body) {
  const currentUser = await userRepository.findUserById(userId);
  if (!currentUser) throw createError("Không tìm thấy người dùng.", 404);

  const phone = normalizePhone(body.phone || currentUser.phone);
  const existingByPhone = await userRepository.findUserByPhone(phone);
  if (existingByPhone && existingByPhone._id.toString() !== currentUser._id.toString()) {
    throw createError("Số điện thoại đã được tài khoản khác sử dụng.", 409);
  }

  const profile = {
    fullName: body.fullName,
    phone,
    gender: body.gender || "unknown",
    address: body.address || "",
    bio: body.bio || "",
    avatarUrl: body.avatarUrl ?? currentUser.avatarUrl ?? ""
  };

  if (!profile.fullName?.trim()) {
    throw createError("Họ tên là bắt buộc.");
  }

  const user = await userRepository.updateUserProfile(userId, profile);
  return sanitizeUser(user);
}

export async function changePassword(userId, body) {
  const user = await userRepository.findUserById(userId);
  if (!user) throw createError("Không tìm thấy người dùng.", 404);

  const isValidPassword = await bcrypt.compare(body.currentPassword || "", user.passwordHash);
  if (!isValidPassword) {
    throw createError("Mật khẩu hiện tại không đúng.", 400);
  }

  if (!body.newPassword || body.newPassword.length < 8) {
    throw createError("Mật khẩu mới phải có ít nhất 8 ký tự.", 400);
  }

  await userRepository.updatePasswordHash(userId, await bcrypt.hash(body.newPassword, 10));
  return { message: "Đã đổi mật khẩu." };
}

export function getNotifications(userId) {
  return userRepository.findNotificationsByUser(userId);
}

export async function markNotificationRead(notificationId, userId) {
  const notification = await userRepository.markNotificationRead(notificationId, userId);
  if (!notification) throw createError("Không tìm thấy thông báo.", 404);
  return notification;
}

export async function markAllNotificationsRead(userId) {
  await userRepository.markAllNotificationsRead(userId);
  return userRepository.findNotificationsByUser(userId);
}

export async function verifyToken(token) {
  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = await userRepository.findUserById(payload.sub);
    if (!user || user.status !== "active") throw createError("Token không hợp lệ.", 401);
    return sanitizeUser(user);
  } catch (_error) {
    throw createError("Bạn cần đăng nhập.", 401);
  }
}
