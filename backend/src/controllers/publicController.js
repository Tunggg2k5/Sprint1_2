import * as publicService from "../services/publicService.js";

function sendError(res, error) {
  res.status(error.statusCode || 500).json({ message: error.message || "Lỗi hệ thống." });
}

export async function getBootstrap(_req, res) {
  try {
    const data = await publicService.getBootstrap();
    res.json(data);
  } catch (error) {
    sendError(res, error);
  }
}

export async function createConsultation(req, res) {
  try {
    const result = await publicService.createConsultation(req.body);
    res.status(201).json(result);
  } catch (error) {
    sendError(res, error);
  }
}
