import * as publicRepository from "../repositories/publicRepository.js";
import { createError } from "./authService.js";

export async function getBootstrap() {
  const [services, dentists, rooms, reviews, clinic] = await Promise.all([
    publicRepository.findActiveServices(),
    publicRepository.findActiveDentists(),
    publicRepository.findActiveRooms(),
    publicRepository.findLatestReviews(),
    publicRepository.findPublicClinic()
  ]);

  return {
    services,
    dentists: dentists.map(stripPrivateUserFields),
    rooms,
    reviews,
    clinic: clinic || {}
  };
}

export async function createConsultation(body) {
  if (!body.fullName?.trim()) throw createError("Họ và tên là bắt buộc.");
  if (!body.phone?.trim()) throw createError("Số điện thoại là bắt buộc.");

  await publicRepository.createConsultation({
    fullName: body.fullName.trim(),
    phone: String(body.phone).replace(/\s/g, ""),
    service: body.service || null,
    message: body.message || "",
    status: "new"
  });

  return { message: "Đã ghi nhận yêu cầu tư vấn." };
}

function stripPrivateUserFields(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}
