import * as receptionService from "../services/receptionService.js";

function sendError(res, error) {
  res.status(error.statusCode || 500).json({ message: error.message || "Loi he thong." });
}

export async function getDashboard(req, res) {
  try {
    res.json(await receptionService.getDashboard(req.query));
  } catch (error) {
    sendError(res, error);
  }
}

export async function getPatients(req, res) {
  try {
    const patients = await receptionService.getPatients(req.query);
    res.json({ patients });
  } catch (error) {
    sendError(res, error);
  }
}

export async function createPatient(req, res) {
  try {
    const patient = await receptionService.createPatient(req.body);
    res.status(201).json({ patient });
  } catch (error) {
    sendError(res, error);
  }
}

export async function resetPatientPassword(req, res) {
  try {
    res.json(await receptionService.resetPatientPassword(req.params.id, req.body));
  } catch (error) {
    sendError(res, error);
  }
}

export async function createAppointment(req, res) {
  try {
    const appointment = await receptionService.createAppointmentByReception(req.user, req.body);
    res.status(201).json({ appointment });
  } catch (error) {
    sendError(res, error);
  }
}

export async function scheduleAppointment(req, res) {
  try {
    const appointment = await receptionService.scheduleAppointment(req.user, req.params.id, req.body);
    res.json({ appointment });
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateAppointmentStatus(req, res) {
  try {
    const appointment = await receptionService.updateAppointmentStatus(req.user, req.params.id, req.body);
    res.json({ appointment });
  } catch (error) {
    sendError(res, error);
  }
}

export async function createInvoice(req, res) {
  try {
    const invoice = await receptionService.createInvoiceForAppointment(req.params.id, req.body);
    res.status(201).json({ invoice });
  } catch (error) {
    sendError(res, error);
  }
}

export async function processPayment(req, res) {
  try {
    const invoice = await receptionService.processAppointmentPayment(req.params.id, req.body);
    res.json({ invoice });
  } catch (error) {
    sendError(res, error);
  }
}

export async function getConsultations(req, res) {
  try {
    const requests = await receptionService.getConsultations(req.query);
    res.json({ requests });
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateConsultation(req, res) {
  try {
    const request = await receptionService.updateConsultation(req.params.id, req.body, req.user._id);
    res.json({ request });
  } catch (error) {
    sendError(res, error);
  }
}

export async function deleteConsultation(req, res) {
  try {
    const request = await receptionService.deleteConsultation(req.params.id);
    res.json({ request });
  } catch (error) {
    sendError(res, error);
  }
}

export async function getRooms(_req, res) {
  try {
    const rooms = await receptionService.getRooms();
    res.json({ rooms });
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateRoomStatus(req, res) {
  try {
    const room = await receptionService.updateRoomStatus(req.params.id, req.body);
    res.json({ room });
  } catch (error) {
    sendError(res, error);
  }
}
