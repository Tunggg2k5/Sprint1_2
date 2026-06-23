import jwt from "jsonwebtoken";
import { env } from "../config/environment.js";
import * as userRepository from "../repositories/userRepository.js";
import { sendPasswordResetOtp } from "../utils/email.js";
import { generateOtp, hashOtp, otpExpiresAt } from "../utils/otp.js";
import { assertValidPassword, comparePassword, hashPassword } from "../utils/password.js";

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

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

export async function register(body) {
  const phone = normalizePhone(body.phone);
  if (!phone) throw createError("Số điện thoại là bắt buộc.");
  assertValidPassword(body.password);

  const existingUser = await userRepository.findUserByPhone(phone);
  if (existingUser) throw createError("Số điện thoại đã tồn tại.", 409);

  const suffix = phone.slice(-4) || "mới";
  const user = await userRepository.createUser({
    fullName: body.fullName?.trim() || `Bệnh nhân ${suffix}`,
    phone,
    email: "",
    role: "patient",
    status: "active",
    gender: body.gender || "unknown",
    address: body.address || "",
    bio: body.bio || "",
    avatarUrl: "",
    passwordHash: await hashPassword(body.password)
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

  const isValidPassword = await comparePassword(password, user.passwordHash);
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

  const email = normalizeEmail(body.email ?? currentUser.email ?? "");
  if (email) {
    const existingByEmail = await userRepository.findUserByEmail(email);
    if (existingByEmail && existingByEmail._id.toString() !== currentUser._id.toString()) {
      throw createError("Email đã được tài khoản khác sử dụng.", 409);
    }
  }

  const profile = {
    fullName: body.fullName,
    email,
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

  const isValidPassword = await comparePassword(body.currentPassword, user.passwordHash);
  if (!isValidPassword) {
    throw createError("Mật khẩu hiện tại không đúng.", 400);
  }

  assertValidPassword(body.newPassword);

  await userRepository.updatePasswordHash(userId, await hashPassword(body.newPassword));
  return { message: "Đã đổi mật khẩu." };
}

export async function requestPasswordReset(body) {
  const email = normalizeEmail(body.email);
  if (!email) throw createError("Email là bắt buộc.");

  const neutralMessage = "Nếu email tồn tại trong hệ thống, SmileCare sẽ gửi mã OTP đặt lại mật khẩu.";
  const user = await userRepository.findUserByEmail(email);
  if (!user || user.status !== "active") {
    return { message: neutralMessage };
  }

  const otp = generateOtp();
  await userRepository.createPasswordResetOtp({
    user: user._id,
    email,
    otpHash: hashOtp(otp),
    expiresAt: otpExpiresAt(env.PASSWORD_RESET_OTP_TTL_MINUTES),
    usedAt: null
  });

  const mail = await sendPasswordResetOtp({
    to: email,
    fullName: user.fullName,
    otp,
    expiresInMinutes: env.PASSWORD_RESET_OTP_TTL_MINUTES
  });

  return {
    message: neutralMessage,
    emailSent: mail.sent,
    ...(env.MAIL_DEV_RETURN_OTP ? { devOtp: otp } : {})
  };
}

export async function resetPasswordWithOtp(body) {
  const email = normalizeEmail(body.email);
  const otp = String(body.otp || "").trim();
  if (!email) throw createError("Email là bắt buộc.");
  if (!/^\d{6}$/.test(otp)) throw createError("OTP gồm 6 chữ số.");
  assertValidPassword(body.newPassword);

  const user = await userRepository.findUserByEmail(email);
  if (!user || user.status !== "active") {
    throw createError("Email hoặc OTP không hợp lệ.", 400);
  }

  const resetOtp = await userRepository.findUsablePasswordResetOtp({
    userId: user._id,
    email,
    otpHash: hashOtp(otp)
  });
  if (!resetOtp) throw createError("OTP không hợp lệ hoặc đã hết hạn.", 400);

  await userRepository.updatePasswordHash(user._id, await hashPassword(body.newPassword));
  await userRepository.markPasswordResetOtpUsed(resetOtp._id);
  await userRepository.expirePasswordResetOtps(user._id);

  return { message: "Đã đặt lại mật khẩu. Vui lòng đăng nhập bằng mật khẩu mới." };
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
