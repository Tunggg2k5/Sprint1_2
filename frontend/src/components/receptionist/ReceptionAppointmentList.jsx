import EmptyState from "../EmptyState.jsx";
import {
  appointmentDateLabel,
  appointmentDentist,
  appointmentPatient,
  appointmentRoom,
  appointmentService,
  roomLabel,
  statusLabel
} from "../../utils/reception.js";

export default function ReceptionAppointmentList({
  appointments,
  date,
  loading,
  onDateChange,
  onSchedule,
  onSearchChange,
  rooms,
  scheduleForms,
  search,
  services,
  setScheduleForms
}) {
  return (
    <section className="reception-page">
      <div className="section-title reception-title">
        <div>
          <span className="eyebrow">Lễ tân</span>
          <h1>Lịch hẹn</h1>
          <p>Tiếp nhận lịch hẹn, xếp giờ khám và phân phòng cho bệnh nhân.</p>
        </div>
      </div>

      <div className="reception-toolbar">
        <label>
          <span>Tìm kiếm</span>
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Tên, SĐT, dịch vụ..." />
        </label>
        <label>
          <span>Lọc theo ngày</span>
          <input type="date" value={date} onChange={(event) => onDateChange(event.target.value)} />
        </label>
      </div>

      {loading ? <div className="panel">Đang tải dữ liệu...</div> : null}
      {!loading && !appointments.length ? <EmptyState title="Chưa có lịch hẹn" text="Lịch hẹn sẽ hiển thị tại đây." /> : null}

      <div className="reception-list">
        {appointments.map((appointment) => {
          const patient = appointmentPatient(appointment);
          const service = appointmentService(appointment);
          const dentist = appointmentDentist(appointment);
          const room = appointmentRoom(appointment);
          const form = scheduleForms[appointment._id] || defaultScheduleForm(appointment, room);
          const canSchedule = !["completed", "cancelled", "rejected"].includes(appointment.status);

          return (
            <article className="reception-card" key={appointment._id}>
              <div className="reception-card-main">
                <div>
                  <strong>{service.name || "Dịch vụ nha khoa"}</strong>
                  <p>{appointmentDateLabel(appointment)}</p>
                  <span>{patient.fullName || "Bệnh nhân"} {patient.phone ? `- ${patient.phone}` : ""}</span>
                  <small>Bác sĩ: {dentist.fullName || "Lễ tân sắp xếp"}</small>
                  {room.name ? <small>Phòng: {room.name}</small> : null}
                </div>
                <span className={`status status-${appointment.status}`}>{statusLabel(appointment.status)}</span>
              </div>

              {canSchedule ? (
                <div className="reception-inline-form">
                  <select
                    value={form.serviceId || service._id || ""}
                    onChange={(event) => updateForm(setScheduleForms, appointment._id, { serviceId: event.target.value })}
                  >
                    {services.map((item) => (
                      <option key={item._id} value={item._id}>{item.name}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) => updateForm(setScheduleForms, appointment._id, { date: event.target.value })}
                  />
                  <input
                    type="time"
                    value={form.time}
                    onChange={(event) => updateForm(setScheduleForms, appointment._id, { time: event.target.value })}
                  />
                  <select
                    value={form.roomId}
                    onChange={(event) => updateForm(setScheduleForms, appointment._id, { roomId: event.target.value })}
                  >
                    <option value="">Chọn phòng/bác sĩ</option>
                    {rooms.map((item) => (
                      <option key={item._id} value={item._id}>{roomLabel(item)}</option>
                    ))}
                  </select>
                  <button className="button primary" onClick={() => onSchedule(appointment)}>Xếp giờ</button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function defaultScheduleForm(appointment, room) {
  const startAt = appointment.startAt ? new Date(appointment.startAt) : new Date();
  const valid = !Number.isNaN(startAt.getTime());
  return {
    serviceId: appointment.service?._id || "",
    date: valid ? startAt.toISOString().slice(0, 10) : "",
    time: valid ? `${String(startAt.getHours()).padStart(2, "0")}:${String(startAt.getMinutes()).padStart(2, "0")}` : "08:00",
    roomId: room?._id || ""
  };
}

function updateForm(setScheduleForms, appointmentId, values) {
  setScheduleForms((current) => ({
    ...current,
    [appointmentId]: {
      ...(current[appointmentId] || {}),
      ...values
    }
  }));
}
