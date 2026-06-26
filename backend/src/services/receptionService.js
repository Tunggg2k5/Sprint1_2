import bcrypt from "bcryptjs";
import { toObjectId } from "../config/mongodb.js";
import * as receptionRepository from "../repositories/receptionRepository.js";
import { assertRequired, assertValidPhone } from "../utils/validation.js";
import { createError, sanitizeUser } from "./authService.js";

const queueStatuses = new Set(["confirmed", "checked_in", "in_treatment"]);
const lockedStatuses = new Set(["cancelled", "rejected"]);

export async function getDashboard(query = {}) {
  const [appointments, patients, services, consultations, rooms] = await Promise.all([
    receptionRepository.findReceptionAppointments({ date: query.date || "", q: query.q || "" }),
    receptionRepository.findReceptionPatients({ q: query.patientQ || "", limit: 50 }),
    receptionRepository.findActiveServices(),
    receptionRepository.findConsultationRequests({ status: query.consultationStatus || "" }),
    receptionRepository.findReceptionRooms()
  ]);

  return { appointments, patients, services, consultations, rooms };
}

export function getPatients(query = {}) {
  return receptionRepository.findReceptionPatients({ q: query.q || "", limit: 80 });
}

export function getConsultations(query = {}) {
  return receptionRepository.findConsultationRequests({ status: query.status || "" });
}

export function getRooms() {
  return receptionRepository.findReceptionRooms();
}

export async function createPatient(body = {}) {
  const fullName = String(body.fullName || "").trim();
  assertRequired(fullName, "Họ tên bệnh nhân");
  const phone = assertValidPhone(body.phone);

  const duplicate = await receptionRepository.findUserByPhone(phone);
  if (duplicate) {
    if (duplicate.role === "patient" && duplicate.status === "active") {
      return sanitizeUser(duplicate);
    }
    throw createError("So dien thoai da duoc su dung.", 409);
  }

  const password = body.password || "Password123!";
  const patient = await receptionRepository.createPatientUser({
    fullName,
    phone,
    email: body.email || `${phone}@phone.smilecare.local`,
    role: "patient",
    status: "active",
    gender: body.gender || "unknown",
    address: body.address || "",
    avatarUrl: "",
    passwordHash: await bcrypt.hash(password, 10)
  });

  return sanitizeUser(patient);
}

export async function resetPatientPassword(patientId, body = {}) {
  const password = String(body.password || "Password123!");
  if (password.length < 8) throw createError("Mat khau moi phai co it nhat 8 ky tu.");

  const patient = await receptionRepository.findActivePatientById(patientId);
  if (!patient) throw createError("Khong tim thay tai khoan benh nhan.", 404);

  const updated = await receptionRepository.updatePatientUser(patientId, {
    passwordHash: await bcrypt.hash(password, 10)
  });

  return { patient: sanitizeUser(updated), temporaryPassword: password };
}

export async function createAppointmentByReception(receptionist, body = {}) {
  assertBookingWindow(body.date);
  const patient = await receptionRepository.findActivePatientById(body.patientId);
  if (!patient) throw createError("Can chon benh nhan hop le.", 404);

  const service = await receptionRepository.findServiceById(body.serviceId);
  if (!service) throw createError("Can chon dich vu hop le.", 404);

  const startAt = normalizeStartAt(body.date, body.startAt, body.time);
  const room = body.roomId ? await receptionRepository.findRoomById(body.roomId) : null;

  const appointment = await receptionRepository.createAppointment({
    patient: toObjectId(patient._id),
    createdBy: toObjectId(receptionist._id),
    receptionist: toObjectId(receptionist._id),
    dentist: room?.assignedDentist?._id ? toObjectId(room.assignedDentist._id) : null,
    nurse: room?.assignedNurse?._id ? toObjectId(room.assignedNurse._id) : null,
    room: room?._id ? toObjectId(room._id) : null,
    service: toObjectId(service._id),
    channel: body.channel || "offline",
    bookingType: "offline",
    dentistPreference: room?.assignedDentist ? "selected" : "reception_arranged",
    startAt,
    endAt: addMinutes(startAt, Number(service.durationMinutes || 30)),
    date: body.date || dateInput(startAt),
    status: "scheduled",
    paymentStatus: "not_required",
    patientNote: body.note || "",
    receptionistNote: "Le tan tao lich ho benh nhan."
  });

  await notifyPatient(appointment, "Da tiep nhan lich hen", "Le tan da tao lich hen cho ban va se sap xep gio kham phu hop.");
  return appointment;
}

export async function scheduleAppointment(receptionist, appointmentId, body = {}) {
  assertBookingWindow(body.date);
  const appointment = await receptionRepository.findReceptionAppointmentById(appointmentId);
  if (!appointment) throw createError("Khong tim thay lich hen.", 404);
  assertCanChange(appointment);

  const room = await receptionRepository.findRoomById(body.roomId);
  if (!room) throw createError("Can chon phong kham hop le.", 404);
  if (!room.assignedDentist?._id) throw createError("Phong kham nay chua co bac si phu trach.");

  const serviceId = body.serviceId || relationId(appointment.service);
  const service = await receptionRepository.findServiceById(serviceId);
  if (!service) throw createError("Can chon dich vu hop le.", 404);

  const startAt = normalizeStartAt(body.date, body.startAt, body.time);
  const updated = await receptionRepository.updateAppointment(appointmentId, {
    receptionist: toObjectId(receptionist._id),
    dentist: toObjectId(room.assignedDentist._id),
    nurse: room.assignedNurse?._id ? toObjectId(room.assignedNurse._id) : null,
    room: toObjectId(room._id),
    service: toObjectId(service._id),
    startAt,
    endAt: addMinutes(startAt, Number(service.durationMinutes || 30)),
    date: body.date || dateInput(startAt),
    status: "confirmed",
    receptionistNote: body.note || "Le tan da xep gio kham cho benh nhan."
  });

  await notifyPatient(
    updated,
    "Le tan da xep lich kham",
    `Lich hen ${updated.service?.name || "kham"} cua ban da duoc xep luc ${formatClinicDateTime(startAt)}.`
  );
  return updated;
}

export async function updateAppointmentStatus(receptionist, appointmentId, body = {}) {
  const status = String(body.status || "");
  if (!["confirmed", "checked_in", "in_treatment", "completed", "cancelled"].includes(status)) {
    throw createError("Trang thai lich hen khong hop le.");
  }

  const appointment = await receptionRepository.findReceptionAppointmentById(appointmentId);
  if (!appointment) throw createError("Khong tim thay lich hen.", 404);
  assertCanChange(appointment);

  const update = {
    receptionist: toObjectId(receptionist._id),
    status,
    receptionistNote: body.note || appointment.receptionistNote || ""
  };

  if (status === "checked_in") {
    update.checkedInAt = appointment.checkedInAt || new Date();
    update.checkInTime = appointment.checkInTime || update.checkedInAt;
  }

  if (status === "completed") {
    update.completedAt = new Date();
  }

  const updated = await receptionRepository.updateAppointment(appointmentId, update);
  if (status === "in_treatment") await updateAppointmentRoomStatus(updated, "in_use");
  if (status === "completed" || status === "cancelled") await updateAppointmentRoomStatus(updated, "available");

  if (queueStatuses.has(status)) {
    await notifyPatient(updated, "Cap nhat lich kham", `Trang thai lich hen cua ban da duoc cap nhat: ${statusLabel(status)}.`);
  }

  return updated;
}

export async function createInvoiceForAppointment(appointmentId, body = {}) {
  const amount = Number(body.amount || 0);
  if (amount <= 0) throw createError("So tien can thanh toan phai lon hon 0.");

  const appointment = await receptionRepository.findReceptionAppointmentById(appointmentId);
  if (!appointment) throw createError("Khong tim thay lich hen.", 404);
  if (appointment.status !== "completed") {
    throw createError("Chi tao hoa don sau khi lich kham hoan tat.", 409);
  }

  const existing = await receptionRepository.findInvoiceByAppointment(appointmentId);
  if (existing) throw createError("Lich kham nay da co hoa don.", 409);

  const invoice = await receptionRepository.createInvoice({
    appointment: toObjectId(appointment._id),
    patient: toObjectId(relationId(appointment.patient)),
    items: [{ name: appointment.service?.name || "Dich vu nha khoa", amount }],
    total: amount,
    totalAmount: amount,
    paidAmount: 0,
    invoiceDate: new Date(),
    status: "unpaid"
  });

  await receptionRepository.updateAppointment(appointmentId, { paymentStatus: "unpaid" });
  await notifyPatient(appointment, "Ban co hoa don moi", `Le tan da tao hoa don ${amount.toLocaleString("vi-VN")} VND cho lich kham cua ban.`);
  return invoice;
}

export async function processAppointmentPayment(appointmentId, body = {}) {
  const amount = Number(body.amount || 0);
  if (amount <= 0) throw createError("So tien da thanh toan phai lon hon 0.");

  const appointment = await receptionRepository.findReceptionAppointmentById(appointmentId);
  if (!appointment) throw createError("Khong tim thay lich hen.", 404);

  const invoice = await receptionRepository.findInvoiceByAppointment(appointmentId);
  if (!invoice) throw createError("Can tao hoa don truoc khi ghi nhan thanh toan.", 409);

  const total = Number(invoice.totalAmount || invoice.total || 0);
  const paidAmount = Number(invoice.paidAmount || 0);
  const remaining = Math.max(total - paidAmount, 0);
  if (remaining <= 0) throw createError("Hoa don da duoc thanh toan du.", 409);
  if (amount > remaining) throw createError(`So tien thanh toan khong duoc vuot qua ${remaining.toLocaleString("vi-VN")} VND.`);

  const nextPaid = paidAmount + amount;
  const nextStatus = nextPaid >= total ? "paid" : "partial";
  const updatedInvoice = await receptionRepository.updateInvoice(invoice._id, {
    paidAmount: nextPaid,
    status: nextStatus,
    paidAt: nextStatus === "paid" ? new Date() : invoice.paidAt
  });

  await receptionRepository.createPayment({
    invoice: toObjectId(invoice._id),
    appointment: toObjectId(appointment._id),
    patient: toObjectId(relationId(appointment.patient)),
    amount,
    paymentMethod: body.paymentMethod || "cash",
    paymentStatus: "paid",
    paymentDate: new Date()
  });
  await receptionRepository.updateAppointment(appointmentId, { paymentStatus: nextStatus });
  return updatedInvoice;
}

export async function updateConsultation(requestId, body = {}, receptionistId) {
  const request = await receptionRepository.updateConsultationRequest(requestId, {
    status: body.status || "contacted",
    message: body.message,
    handledBy: toObjectId(receptionistId)
  });
  if (!request) throw createError("Khong tim thay yeu cau tu van.", 404);
  return request;
}

export async function deleteConsultation(requestId) {
  const request = await receptionRepository.deleteConsultationRequest(requestId);
  if (!request) throw createError("Khong tim thay yeu cau tu van.", 404);
  return request;
}

export async function updateRoomStatus(roomId, body = {}) {
  const status = body.status || "available";
  const room = await receptionRepository.updateRoomStatus(roomId, status);
  if (!room) throw createError("Khong tim thay phong kham.", 404);
  return room;
}

function assertCanChange(appointment) {
  if (lockedStatuses.has(appointment.status)) {
    throw createError("Lich hen da huy hoac bi tu choi nen khong the cap nhat.", 409);
  }
}

function assertBookingWindow(dateText) {
  if (!dateText) throw createError("Ngay hen la bat buoc.");
  const requested = new Date(`${dateText}T00:00:00+07:00`);
  if (Number.isNaN(requested.getTime())) throw createError("Ngay hen khong hop le.");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const max = new Date(today);
  max.setMonth(max.getMonth() + 1);
  max.setHours(23, 59, 59, 999);
  if (requested > max) throw createError("Chi duoc dat hoac xep lich truoc toi da 1 thang.");
}

function normalizeStartAt(date, startAt, time = "08:00") {
  const value = startAt || `${date}T${time}:00+07:00`;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw createError("Thoi gian hen khong hop le.");
  return parsed;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function dateInput(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const map = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function formatClinicDateTime(value) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).format(new Date(value));
}

function relationId(value) {
  return value?._id || value;
}

async function updateAppointmentRoomStatus(appointment, status) {
  const roomId = relationId(appointment.room);
  if (roomId) await receptionRepository.updateRoomStatus(roomId, status);
}

async function notifyPatient(appointment, title, message) {
  const patientId = relationId(appointment.patient);
  if (!patientId) return;
  await receptionRepository.createNotification({
    user: toObjectId(patientId),
    title,
    message,
    isRead: false
  });
}

function statusLabel(status) {
  return {
    confirmed: "Dang dien ra",
    checked_in: "Co mat",
    in_treatment: "Dang kham",
    completed: "Hoan tat",
    cancelled: "Da huy"
  }[status] || status;
}
