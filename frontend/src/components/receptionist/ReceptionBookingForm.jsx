import { bookingSlotOptions } from "../../utils/appointmentSlots.js";
import { maxBookingDate } from "../../pages/BookingPage.jsx";

export default function ReceptionBookingForm({
  accountMode,
  booking,
  date,
  genderOptions,
  newPatient,
  onAccountModeChange,
  onBookingChange,
  onDateChange,
  onNewPatientChange,
  onSubmit,
  patientSearch,
  patients,
  services,
  setPatientSearch
}) {
  return (
    <section className="reception-page">
      <div className="section-title reception-title">
        <div>
          <span className="eyebrow">Lễ tân</span>
          <h1>Đặt lịch hộ</h1>
          <p>Đặt lịch cho bệnh nhân tại quầy. Sau khi tạo xong, lịch nằm trong mục Lịch hẹn.</p>
        </div>
      </div>

      <form className="panel reception-form" onSubmit={onSubmit}>
        <div className="segmented-control">
          <button type="button" className={accountMode === "existing" ? "active" : ""} onClick={() => onAccountModeChange("existing")}>
            Bệnh nhân có sẵn
          </button>
          <button type="button" className={accountMode === "new" ? "active" : ""} onClick={() => onAccountModeChange("new")}>
            Bệnh nhân mới
          </button>
        </div>

        {accountMode === "existing" ? (
          <>
            <label>
              <span>Tìm bệnh nhân</span>
              <input value={patientSearch} onChange={(event) => setPatientSearch(event.target.value)} placeholder="Nhập tên hoặc số điện thoại" />
            </label>
            <label>
              <span>Bệnh nhân</span>
              <select value={booking.patientId} onChange={(event) => onBookingChange({ patientId: event.target.value })}>
                <option value="">Chọn bệnh nhân</option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.fullName} - {patient.phone}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <div className="reception-form-grid">
            <label>
              <span>Họ tên</span>
              <input value={newPatient.fullName} onChange={(event) => onNewPatientChange({ fullName: event.target.value })} />
            </label>
            <label>
              <span>Số điện thoại</span>
              <input value={newPatient.phone} onChange={(event) => onNewPatientChange({ phone: event.target.value })} />
            </label>
            <label>
              <span>Giới tính</span>
              <select value={newPatient.gender} onChange={(event) => onNewPatientChange({ gender: event.target.value })}>
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="reception-form-grid">
          <label>
            <span>Dịch vụ</span>
            <select value={booking.serviceId} onChange={(event) => onBookingChange({ serviceId: event.target.value })}>
              <option value="">Chọn dịch vụ</option>
              {services.map((service) => (
                <option key={service._id} value={service._id}>{service.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Ngày hẹn</span>
            <input type="date" max={maxBookingDate()} value={date} onChange={(event) => onDateChange(event.target.value)} />
          </label>
          <label>
            <span>Slot bệnh nhân chọn</span>
            <select value={booking.time} onChange={(event) => onBookingChange({ time: event.target.value })}>
              {bookingSlotOptions.map((slot) => (
                <option key={slot.value} value={slot.value}>{slot.label}</option>
              ))}
            </select>
          </label>
        </div>

        <label>
          <span>Ghi chú</span>
          <textarea rows="3" value={booking.note} onChange={(event) => onBookingChange({ note: event.target.value })} />
        </label>

        <button className="button primary booking-submit-final" type="submit">Tạo lịch hẹn</button>
      </form>
    </section>
  );
}
