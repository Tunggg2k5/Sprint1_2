import { toObjectId } from "../config/mongodb.js";
import * as patientRepository from "../repositories/patientRepository.js";
import * as userRepository from "../repositories/userRepository.js";
import { createError, sanitizeUser } from "./authService.js";

const lockedStatuses = new Set(["cancelled", "completed", "no_show"]);

function maxBookingDate() {
  const today = new Date();
  const max = new Date(today);
  max.setMonth(max.getMonth() + 1);
  max.setHours(23, 59, 59, 999);
  return max;
}

function normalizeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw createError("Ngày đặt lịch không hợp lệ.");
  if (date > maxBookingDate()) throw createError("Chỉ được đặt lịch trước tối đa 1 tháng.");
  return date;
}

function roomDentist(room) {
  return room?.assignedDentist || null;
}

export async function createAppointment(patient, body) {
  if (!body.serviceId) throw createError("Dịch vụ là bắt buộc.");
  const service = await patientRepository.findServiceById(body.serviceId);
  if (!service || service.isActive === false) throw createError("Không tìm thấy dịch vụ.");

  const startAt = normalizeDate(body.startAt || `${body.date}T08:00:00+07:00`);
  const room = body.roomId ? await patientRepository.findRoomById(body.roomId) : null;
  const dentist = roomDentist(room);

  const appointment = await patientRepository.createAppointment({
    patient: toObjectId(patient._id),
    patientInfo: minimalUser(patient),
    service: serviceSnapshot(service),
    room: room ? roomSnapshot(room) : null,
    dentist: dentist ? minimalUser(dentist) : null,
    dentistPreference: body.dentistPreference || (dentist ? "selected" : "random"),
    startAt,
    date: body.date || startAt.toISOString().slice(0, 10),
    patientNote: body.note || body.patientNote || "",
    channel: "Online",
    status: "scheduled"
  });

  await userRepository.createNotification({
    user: toObjectId(patient._id),
    title: "Đã gửi yêu cầu đặt lịch",
    message: "Lễ tân sẽ kiểm tra và sắp xếp thời gian khám cho bạn.",
    isRead: false
  });

  return { appointment };
}

export async function getDashboard(patientId) {
  const [appointments, records, treatmentPlans, invoices, reviews] = await Promise.all([
    patientRepository.findPatientAppointments(patientId),
    patientRepository.findPatientTreatmentRecords(patientId),
    patientRepository.findPatientTreatmentPlans(patientId),
    patientRepository.findPatientInvoices(patientId),
    patientRepository.findPatientReviews(patientId)
  ]);

  return { appointments, records, treatmentPlans, invoices, reviews };
}

export async function cancelAppointment(patientId, appointmentId) {
  const appointment = await patientRepository.findPatientAppointmentById(appointmentId, patientId);
  if (!appointment) throw createError("Không tìm thấy lịch hẹn.", 404);
  if (lockedStatuses.has(appointment.status)) throw createError("Lịch hẹn này không thể hủy.");

  await patientRepository.deleteAppointment(appointmentId);
  return { message: "Đã hủy lịch hẹn." };
}

export async function rescheduleAppointment(patientId, appointmentId, body) {
  const appointment = await patientRepository.findPatientAppointmentById(appointmentId, patientId);
  if (!appointment) throw createError("Không tìm thấy lịch hẹn.", 404);
  if (lockedStatuses.has(appointment.status)) throw createError("Lịch hẹn này không thể đổi lịch.");

  const startAt = normalizeDate(body.startAt || `${body.date}T08:00:00+07:00`);
  const room = body.roomId ? await patientRepository.findRoomById(body.roomId) : appointment.room;
  const dentist = roomDentist(room);

  const updated = await patientRepository.updateAppointment(appointmentId, {
    startAt,
    date: body.date || startAt.toISOString().slice(0, 10),
    room: room ? roomSnapshot(room) : appointment.room,
    dentist: dentist ? minimalUser(dentist) : appointment.dentist,
    status: "scheduled"
  });

  return { appointment: updated };
}

export async function submitReview(patient, body) {
  const appointment = await patientRepository.findPatientAppointmentById(body.appointmentId, patient._id);
  if (!appointment) throw createError("Không tìm thấy lịch hẹn.", 404);

  const rating = Math.min(Math.max(Number(body.rating || 5), 1), 5);
  const review = await patientRepository.upsertReviewByAppointment(patient._id, appointment._id, {
    patient: minimalUser(patient),
    dentist: appointment.dentist,
    service: appointment.service,
    rating,
    ratingDentist: rating,
    ratingService: rating,
    comment: body.comment || ""
  });

  return { review };
}

function minimalUser(user) {
  const safe = sanitizeUser(user);
  return {
    _id: safe._id,
    fullName: safe.fullName,
    phone: safe.phone,
    avatarUrl: safe.avatarUrl || "",
    yearsOfExperience: safe.yearsOfExperience,
    bio: safe.bio
  };
}

function serviceSnapshot(service) {
  return {
    _id: service._id,
    name: service.name,
    description: service.description || ""
  };
}

function roomSnapshot(room) {
  return {
    _id: room._id,
    name: room.name,
    assignedDentist: room.assignedDentist || null,
    assignedNurse: room.assignedNurse || null
  };
}
