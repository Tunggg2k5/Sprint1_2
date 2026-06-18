import { useState } from "react";
import StatusBadge from "../StatusBadge.jsx";
import { formatDateTime, formatMoney, todayInput } from "../../utils/format.js";
import { bookingSlotOptions } from "../../pages/BookingPage.jsx";
import { clinicDateInput, formatSlotWithDate, getAppointmentSlot, shouldDisplayExactTime } from "../../utils/appointmentSlots.js";
import RescheduleAppointmentModal from "./RescheduleAppointmentModal.jsx";

export default function PatientAppointmentCard({
  appointment,
  canModifyAppointment,
  cancelAppointment,
  dentistOptions,
  invoice,
  rescheduleAppointment,
  rescheduleForm,
  updateRescheduleForm
}) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const canModify = canModifyAppointment(appointment);
  const currentRescheduleForm = rescheduleForm || {
    date: clinicDateInput(appointment.startAt) || todayInput(),
    time: getAppointmentSlot(appointment.startAt)?.value || bookingSlotOptions[0].value,
    dentistId: appointment.dentist?._id || dentistOptions[0]?._id || ""
  };
  const scheduleText = shouldDisplayExactTime(appointment.status)
    ? `Giờ khám: ${formatDateTime(appointment.startAt)}`
    : `Slot đã đặt: ${formatSlotWithDate(appointment.startAt)}`;

  function openRescheduleForm() {
    updateRescheduleForm(appointment, {});
    setRescheduleOpen(true);
  }

  async function submitReschedule() {
    const success = await rescheduleAppointment(appointment);
    if (success) setRescheduleOpen(false);
  }

  return (
    <article className="appointment-card patient-appointment-card" key={appointment._id}>
      <div>
        <h4>{appointment.service?.name}</h4>
        <p>{scheduleText}</p>
        <div className="patient-appointment-meta">
          <span className="mini">Bác sĩ: {appointment.dentist?.fullName || "Lễ tân sắp xếp"}</span>
          {appointment.patientNote && <span className="mini">Ghi chú: {appointment.patientNote}</span>}
        </div>
        {invoice && (
          <div className="appointment-subpanel">
            <strong>Hóa đơn: {formatMoney(invoice.total)}</strong>
            <StatusBadge value={invoice.status} />
          </div>
        )}

        {canModify ? (
          <div className="patient-appointment-actions">
            <button className="button small danger" onClick={() => cancelAppointment(appointment)}>
              Hủy lịch
            </button>
            {!rescheduleOpen && (
              <button className="button small" type="button" onClick={openRescheduleForm}>
                Đổi lịch
              </button>
            )}
            {rescheduleOpen && (
              <RescheduleAppointmentModal
                dentistOptions={dentistOptions}
                form={currentRescheduleForm}
                onCancel={() => setRescheduleOpen(false)}
                onChange={(next) => updateRescheduleForm(appointment, next)}
                onSubmit={submitReschedule}
              />
            )}
          </div>
        ) : (
          <span className="locked-note">Lịch này không thể thay đổi thêm.</span>
        )}
      </div>
      <StatusBadge value={appointment.status} />
    </article>
  );
}
