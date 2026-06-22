import { getCollection, isObjectId, toObjectId } from "../config/mongodb.js";
import { COLLECTIONS } from "../models/collections.js";
import { insertOne } from "./mongoRepository.js";

const publicUserProjection = {
  passwordHash: 0
};

const patientProjection = {
  passwordHash: 0
};

export async function findReceptionAppointments({ date = "", q = "" } = {}) {
  const query = {};
  if (date) {
    query.startAt = {
      $gte: startOfClinicDay(date),
      $lte: endOfClinicDay(date)
    };
  }

  const appointments = await getCollection(COLLECTIONS.appointments)
    .find(query)
    .sort({ startAt: -1, createdAt: -1 })
    .limit(300)
    .toArray();

  await populateAppointments(appointments);
  await attachInvoices(appointments);

  const keyword = String(q || "").trim().toLowerCase();
  if (!keyword) return appointments;

  return appointments.filter((appointment) =>
    [
      appointment.patient?.fullName,
      appointment.patient?.phone,
      appointment.service?.name,
      appointment.dentist?.fullName,
      appointment.room?.name
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(keyword)
  );
}

export async function findReceptionAppointmentById(appointmentId) {
  const appointment = await getCollection(COLLECTIONS.appointments).findOne({ _id: toObjectId(appointmentId) });
  if (!appointment) return null;
  await populateAppointments([appointment]);
  await attachInvoices([appointment]);
  return appointment;
}

export async function createAppointment(document) {
  const appointment = await insertOne(COLLECTIONS.appointments, document);
  await populateAppointments([appointment]);
  return appointment;
}

export async function updateAppointment(appointmentId, data) {
  const appointment = await getCollection(COLLECTIONS.appointments).findOneAndUpdate(
    { _id: toObjectId(appointmentId) },
    { $set: { ...data, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!appointment) return null;
  await populateAppointments([appointment]);
  await attachInvoices([appointment]);
  return appointment;
}

export function findServiceById(serviceId) {
  return getCollection(COLLECTIONS.services).findOne({ _id: toObjectId(serviceId), isActive: { $ne: false } });
}

export async function findActiveServices() {
  return getCollection(COLLECTIONS.services).find({ isActive: { $ne: false } }).sort({ name: 1 }).toArray();
}

export async function findReceptionRooms() {
  const rooms = await getCollection(COLLECTIONS.rooms)
    .find({ isActive: { $ne: false } })
    .sort({ name: 1 })
    .toArray();
  await populateById(rooms, "assignedDentist", COLLECTIONS.users, { fullName: 1, phone: 1, avatarUrl: 1 });
  await populateById(rooms, "assignedNurse", COLLECTIONS.users, { fullName: 1, phone: 1, avatarUrl: 1 });
  return rooms;
}

export async function findRoomById(roomId) {
  const room = await getCollection(COLLECTIONS.rooms).findOne({ _id: toObjectId(roomId), isActive: { $ne: false } });
  if (!room) return null;
  await populateById([room], "assignedDentist", COLLECTIONS.users, { fullName: 1, phone: 1, avatarUrl: 1 });
  await populateById([room], "assignedNurse", COLLECTIONS.users, { fullName: 1, phone: 1, avatarUrl: 1 });
  return room;
}

export async function updateRoomStatus(roomId, status) {
  const room = await getCollection(COLLECTIONS.rooms).findOneAndUpdate(
    { _id: toObjectId(roomId) },
    { $set: { status, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!room) return null;
  await populateById([room], "assignedDentist", COLLECTIONS.users, { fullName: 1, phone: 1, avatarUrl: 1 });
  await populateById([room], "assignedNurse", COLLECTIONS.users, { fullName: 1, phone: 1, avatarUrl: 1 });
  return room;
}

export function findUserByPhone(phone) {
  return getCollection(COLLECTIONS.users).findOne({ phone });
}

export function findActivePatientById(patientId) {
  return getCollection(COLLECTIONS.users).findOne({
    _id: toObjectId(patientId),
    role: "patient",
    status: "active"
  });
}

export async function findReceptionPatients({ q = "", limit = 60 } = {}) {
  const filter = { role: "patient", status: "active" };
  const keyword = String(q || "").trim();
  if (keyword) {
    const regex = new RegExp(escapeRegex(keyword.slice(0, 80)), "i");
    filter.$or = [{ fullName: regex }, { phone: regex }, { email: regex }];
  }

  return getCollection(COLLECTIONS.users)
    .find(filter)
    .project(patientProjection)
    .sort({ fullName: 1 })
    .limit(limit)
    .toArray();
}

export function createPatientUser(data) {
  return insertOne(COLLECTIONS.users, data);
}

export async function updatePatientUser(patientId, data) {
  return getCollection(COLLECTIONS.users).findOneAndUpdate(
    { _id: toObjectId(patientId), role: "patient" },
    { $set: { ...data, updatedAt: new Date() } },
    { projection: publicUserProjection, returnDocument: "after" }
  );
}

export async function findConsultationRequests({ status = "" } = {}) {
  const filter = {};
  if (status) filter.status = status;
  const requests = await getCollection(COLLECTIONS.consultations)
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
  await populateById(requests, "service", COLLECTIONS.services, { name: 1 });
  await populateById(requests, "handledBy", COLLECTIONS.users, { fullName: 1 });
  return requests;
}

export async function updateConsultationRequest(requestId, data) {
  const request = await getCollection(COLLECTIONS.consultations).findOneAndUpdate(
    { _id: toObjectId(requestId) },
    { $set: { ...data, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!request) return null;
  await populateById([request], "service", COLLECTIONS.services, { name: 1 });
  await populateById([request], "handledBy", COLLECTIONS.users, { fullName: 1 });
  return request;
}

export function deleteConsultationRequest(requestId) {
  return getCollection(COLLECTIONS.consultations).findOneAndDelete({ _id: toObjectId(requestId) });
}

export function findInvoiceByAppointment(appointmentId) {
  return getCollection(COLLECTIONS.invoices).findOne({ appointment: toObjectId(appointmentId) });
}

export function createInvoice(data) {
  return insertOne(COLLECTIONS.invoices, data);
}

export async function updateInvoice(invoiceId, data) {
  return getCollection(COLLECTIONS.invoices).findOneAndUpdate(
    { _id: toObjectId(invoiceId) },
    { $set: { ...data, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
}

export function createPayment(data) {
  return insertOne(COLLECTIONS.payments, data);
}

export function createNotification(data) {
  return insertOne(COLLECTIONS.notifications, { isRead: false, ...data });
}

async function populateAppointments(appointments) {
  await populateById(appointments, "patient", COLLECTIONS.users, { fullName: 1, phone: 1, email: 1, avatarUrl: 1 });
  await populateById(appointments, "createdBy", COLLECTIONS.users, { fullName: 1, role: 1 });
  await populateById(appointments, "receptionist", COLLECTIONS.users, { fullName: 1, role: 1 });
  await populateById(appointments, "dentist", COLLECTIONS.users, { fullName: 1, phone: 1, avatarUrl: 1 });
  await populateById(appointments, "nurse", COLLECTIONS.users, { fullName: 1, phone: 1, avatarUrl: 1 });
  await populateById(appointments, "room", COLLECTIONS.rooms, { name: 1, status: 1, assignedDentist: 1, assignedNurse: 1 });
  await populateById(appointments, "service", COLLECTIONS.services, { name: 1, description: 1, durationMinutes: 1 });

  const rooms = appointments.map((appointment) => appointment.room).filter((room) => room && typeof room === "object");
  await populateById(rooms, "assignedDentist", COLLECTIONS.users, { fullName: 1, phone: 1, avatarUrl: 1 });
  await populateById(rooms, "assignedNurse", COLLECTIONS.users, { fullName: 1, phone: 1, avatarUrl: 1 });
}

async function attachInvoices(appointments) {
  const ids = appointments.map((appointment) => appointment._id).filter(Boolean);
  if (!ids.length) return;
  const invoices = await getCollection(COLLECTIONS.invoices)
    .find({ appointment: { $in: ids.map(toObjectId) } })
    .sort({ createdAt: -1 })
    .toArray();
  const invoiceMap = new Map(invoices.map((invoice) => [relationId(invoice.appointment)?.toString(), invoice]));
  appointments.forEach((appointment) => {
    appointment.invoice = invoiceMap.get(appointment._id.toString()) || null;
  });
}

async function populateById(documents, field, collectionName, projection) {
  const ids = documents
    .map((document) => document?.[field])
    .filter((value) => isObjectId(value))
    .map(toObjectId);

  if (!ids.length) return;

  const related = await getCollection(collectionName)
    .find({ _id: { $in: ids } })
    .project(projection)
    .toArray();
  const map = new Map(related.map((document) => [document._id.toString(), document]));

  documents.forEach((document) => {
    const value = document?.[field];
    if (isObjectId(value)) {
      const found = map.get(toObjectId(value).toString());
      if (found) document[field] = found;
    }
  });
}

function startOfClinicDay(dateText) {
  return new Date(`${dateText}T00:00:00.000+07:00`);
}

function endOfClinicDay(dateText) {
  return new Date(`${dateText}T23:59:59.999+07:00`);
}

function relationId(value) {
  return value?._id || value;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
