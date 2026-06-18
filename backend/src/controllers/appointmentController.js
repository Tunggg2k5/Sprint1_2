import * as patientService from "../services/patientService.js";

function sendError(res, error) {
  res.status(error.statusCode || 500).json({ message: error.message || "Lỗi hệ thống." });
}

export async function createAppointment(req, res) {
  try {
    const result = await patientService.createAppointment(req.user, req.body);
    res.status(201).json(result);
  } catch (error) {
    sendError(res, error);
  }
}

export async function cancelAppointment(req, res) {
  try {
    const result = await patientService.cancelAppointment(req.user._id, req.params.id);
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
}

export async function rescheduleAppointment(req, res) {
  try {
    const result = await patientService.rescheduleAppointment(req.user._id, req.params.id, req.body);
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
}
