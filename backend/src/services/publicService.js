import * as publicRepository from "../repositories/publicRepository.js";
import { assertRequired, assertValidPhone } from "../utils/validation.js";

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
  const fullName = String(body.fullName || "").trim();
  assertRequired(fullName, "Họ và tên");
  const phone = assertValidPhone(body.phone);

  await publicRepository.createConsultation({
    fullName,
    phone,
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
