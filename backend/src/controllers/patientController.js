import * as patientService from "../services/patientService.js";

function sendError(res, error) {
  res.status(error.statusCode || 500).json({ message: error.message || "Lỗi hệ thống." });
}

export async function getDashboard(req, res) {
  try {
    const data = await patientService.getDashboard(req.user._id);
    res.json(data);
  } catch (error) {
    sendError(res, error);
  }
}

export async function submitReview(req, res) {
  try {
    const result = await patientService.submitReview(req.user, req.body);
    res.status(201).json(result);
  } catch (error) {
    sendError(res, error);
  }
}
