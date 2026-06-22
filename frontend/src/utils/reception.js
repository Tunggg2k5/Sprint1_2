import { clinicDateInput, formatSlotOnly, shouldDisplayExactTime } from "./appointmentSlots.js";
import { formatDateTime, formatTime } from "./format.js";

export const receptionStatusOptions = [
  { value: "confirmed", label: "Đang diễn ra" },
  { value: "checked_in", label: "Có mặt" },
  { value: "in_treatment", label: "Đang khám" },
  { value: "completed", label: "Hoàn tất" }
];

export function statusLabel(status) {
  return {
    pending: "Chờ tiếp nhận",
    scheduled: "Đang chờ",
    confirmed: "Đang diễn ra",
    checked_in: "Có mặt",
    in_treatment: "Đang khám",
    completed: "Hoàn tất",
    cancelled: "Đã hủy",
    rejected: "Đã từ chối",
    unpaid: "Chưa trả",
    partial: "Trả một phần",
    paid: "Đã trả",
    available: "Sẵn sàng",
    in_use: "Đang dùng",
    cleaning: "Vệ sinh",
    maintenance: "Bảo trì"
  }[status] || status || "-";
}

export function appointmentPatient(appointment) {
  return appointment.patientInfo || appointment.patient || {};
}

export function appointmentService(appointment) {
  return appointment.service || {};
}

export function appointmentDentist(appointment) {
  return appointment.dentist || appointment.room?.assignedDentist || {};
}

export function appointmentRoom(appointment) {
  return appointment.room || {};
}

export function appointmentDateLabel(appointment) {
  if (!appointment.startAt) return "-";
  const mainTime = shouldDisplayExactTime(appointment.status)
    ? formatDateTime(appointment.startAt)
    : `${formatClinicDate(appointment.startAt)} - ${formatSlotOnly(appointment.startAt)}`;
  return mainTime;
}

export function appointmentTimeLabel(appointment) {
  if (!appointment.startAt) return "-";
  return shouldDisplayExactTime(appointment.status) ? formatTime(appointment.startAt) : formatSlotOnly(appointment.startAt);
}

export function formatClinicDate(value) {
  if (!value) return "-";
  const [year, month, day] = clinicDateInput(value).split("-");
  return day && month && year ? `${day}/${month}/${year}` : "-";
}

export function filterAppointments(appointments, search = "", date = "") {
  const keyword = search.trim().toLowerCase();
  return appointments.filter((appointment) => {
    const matchesDate = !date || clinicDateInput(appointment.startAt) === date;
    if (!matchesDate) return false;

    if (!keyword) return true;
    const patient = appointmentPatient(appointment);
    const service = appointmentService(appointment);
    const dentist = appointmentDentist(appointment);
    const room = appointmentRoom(appointment);
    return [patient.fullName, patient.phone, service.name, dentist.fullName, room.name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(keyword);
  });
}

export function newestFirst(a, b) {
  const aTime = new Date(a.createdAt || a.updatedAt || a.startAt || 0).getTime();
  const bTime = new Date(b.createdAt || b.updatedAt || b.startAt || 0).getTime();
  return bTime - aTime;
}

export function roomLabel(room) {
  if (!room) return "Chưa chọn phòng";
  const dentistName = room.assignedDentist?.fullName ? ` - ${room.assignedDentist.fullName}` : "";
  return `${room.name}${dentistName}`;
}

export function invoiceRemaining(invoice) {
  const total = Number(invoice?.totalAmount || invoice?.total || 0);
  const paid = Number(invoice?.paidAmount || 0);
  return Math.max(total - paid, 0);
}
