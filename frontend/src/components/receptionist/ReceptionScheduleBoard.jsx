import EmptyState from "../EmptyState.jsx";
import {
  appointmentDentist,
  appointmentPatient,
  appointmentRoom,
  appointmentService,
  appointmentTimeLabel,
  newestFirst,
  receptionStatusOptions,
  statusLabel
} from "../../utils/reception.js";

export default function ReceptionScheduleBoard({
  appointments,
  date,
  loading,
  onDateChange,
  onStatusChange,
  rooms,
  statusForms,
  setStatusForms
}) {
  const dentistColumns = buildDentistColumns(rooms, appointments);

  return (
    <section className="reception-page">
      <div className="section-title reception-title">
        <div>
          <span className="eyebrow">Lễ tân</span>
          <h1>Lịch khám</h1>
          <p>Theo dõi bệnh nhân theo 3 cột bác sĩ, lịch mới hiển thị phía trên.</p>
        </div>
      </div>

      <div className="reception-toolbar">
        <label>
          <span>Ngày khám</span>
          <input type="date" value={date} onChange={(event) => onDateChange(event.target.value)} />
        </label>
      </div>

      <RoomStatus rooms={rooms} />

      {loading ? <div className="panel">Đang tải dữ liệu...</div> : null}
      {!loading && !appointments.length ? <EmptyState title="Chưa có lịch khám" text="Khi lễ tân xếp giờ, lịch sẽ xuất hiện tại đây." /> : null}

      <div className="reception-doctor-board">
        {dentistColumns.map((dentist) => {
          const doctorAppointments = appointments
            .filter((appointment) => appointmentDentist(appointment)?._id === dentist._id)
            .sort(newestFirst);

          return (
            <section className="reception-doctor-column" key={dentist._id}>
              <div className="reception-doctor-head">
                <strong>{dentist.fullName}</strong>
                <span>{dentist.roomName || "Chưa gán phòng"}</span>
              </div>

              {!doctorAppointments.length ? (
                <EmptyState title="Chưa có bệnh nhân" text="Cột này chưa có lịch khám." />
              ) : (
                doctorAppointments.map((appointment) => {
                  const patient = appointmentPatient(appointment);
                  const service = appointmentService(appointment);
                  const room = appointmentRoom(appointment);
                  const selectedStatus = statusForms[appointment._id] || appointment.status || "confirmed";

                  return (
                    <article className="reception-queue-card" key={appointment._id}>
                      <strong>{patient.fullName || "Bệnh nhân"}</strong>
                      <span>{service.name || "Dịch vụ nha khoa"} {room.name ? `/ ${room.name}` : ""}</span>
                      <small>Thời gian: {appointmentTimeLabel(appointment)}</small>
                      {appointment.checkedInAt || appointment.checkInTime ? (
                        <small>Có mặt: {appointmentTimeLabel({ ...appointment, startAt: appointment.checkedInAt || appointment.checkInTime, status: "confirmed" })}</small>
                      ) : null}
                      <span className={`status status-${appointment.status}`}>{statusLabel(appointment.status)}</span>
                      <div className="reception-card-actions">
                        <select
                          value={selectedStatus}
                          onChange={(event) =>
                            setStatusForms((current) => ({ ...current, [appointment._id]: event.target.value }))
                          }
                        >
                          {receptionStatusOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        <button className="button primary" onClick={() => onStatusChange(appointment, selectedStatus)}>Cập nhật</button>
                      </div>
                    </article>
                  );
                })
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}

function RoomStatus({ rooms }) {
  return (
    <div className="reception-room-strip">
      {rooms.map((room) => (
        <article key={room._id}>
          <strong>{room.name}</strong>
          <span className={`status status-${room.status}`}>{statusLabel(room.status)}</span>
          <small>Bác sĩ: {room.assignedDentist?.fullName || "Chưa gán"}</small>
          <small>Y tá: {room.assignedNurse?.fullName || "Không có"}</small>
        </article>
      ))}
    </div>
  );
}

function buildDentistColumns(rooms, appointments) {
  const fromRooms = rooms
    .filter((room) => room.assignedDentist?._id)
    .map((room) => ({ ...room.assignedDentist, roomName: room.name }));
  const fromAppointments = appointments
    .map((appointment) => appointmentDentist(appointment))
    .filter((dentist) => dentist?._id);

  return Array.from(new Map([...fromRooms, ...fromAppointments].map((dentist) => [dentist._id, dentist])).values()).slice(0, 3);
}
