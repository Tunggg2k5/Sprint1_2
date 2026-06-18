import { getCollection, toObjectId } from "../config/mongodb.js";
import { COLLECTIONS } from "../models/collections.js";
import { deleteById, findById, findMany, insertOne, updateById } from "./mongoRepository.js";

export function findServiceById(serviceId) {
  return findById(COLLECTIONS.services, serviceId);
}

export function findRoomById(roomId) {
  return findById(COLLECTIONS.rooms, roomId);
}

export function findPatientAppointments(patientId) {
  return findMany(
    COLLECTIONS.appointments,
    { patient: toObjectId(patientId) },
    { sort: { createdAt: -1 } }
  );
}

export function createAppointment(data) {
  return insertOne(COLLECTIONS.appointments, data);
}

export async function findPatientAppointmentById(appointmentId, patientId) {
  return getCollection(COLLECTIONS.appointments).findOne({
    _id: toObjectId(appointmentId),
    patient: toObjectId(patientId)
  });
}

export function updateAppointment(appointmentId, data) {
  return updateById(COLLECTIONS.appointments, appointmentId, data);
}

export function deleteAppointment(appointmentId) {
  return deleteById(COLLECTIONS.appointments, appointmentId);
}

export function findPatientInvoices(patientId) {
  return findMany(
    COLLECTIONS.invoices,
    { patient: toObjectId(patientId) },
    { sort: { createdAt: -1 } }
  );
}

export function findPatientTreatmentRecords(patientId) {
  return findMany(
    COLLECTIONS.treatmentRecords,
    { patient: toObjectId(patientId) },
    { sort: { createdAt: -1 } }
  );
}

export function findPatientTreatmentPlans(patientId) {
  return findMany(
    COLLECTIONS.treatmentPlans,
    { patient: toObjectId(patientId) },
    { sort: { createdAt: -1 } }
  );
}

export function findPatientReviews(patientId) {
  return findMany(
    COLLECTIONS.reviews,
    { patient: toObjectId(patientId) },
    { sort: { createdAt: -1 } }
  );
}

export async function upsertReviewByAppointment(patientId, appointmentId, data) {
  return getCollection(COLLECTIONS.reviews).findOneAndUpdate(
    { patient: toObjectId(patientId), appointment: toObjectId(appointmentId) },
    {
      $set: {
        ...data,
        patient: toObjectId(patientId),
        appointment: toObjectId(appointmentId),
        updatedAt: new Date()
      },
      $setOnInsert: { createdAt: new Date() }
    },
    { upsert: true, returnDocument: "after" }
  );
}
