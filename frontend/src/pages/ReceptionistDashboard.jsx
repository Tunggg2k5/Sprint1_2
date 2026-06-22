import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Feedback from "../components/Feedback.jsx";
import ReceptionAppointmentList from "../components/receptionist/ReceptionAppointmentList.jsx";
import ReceptionBookingForm from "../components/receptionist/ReceptionBookingForm.jsx";
import ReceptionConsultations from "../components/receptionist/ReceptionConsultations.jsx";
import ReceptionPatientAccounts from "../components/receptionist/ReceptionPatientAccounts.jsx";
import ReceptionPaymentList from "../components/receptionist/ReceptionPaymentList.jsx";
import ReceptionScheduleBoard from "../components/receptionist/ReceptionScheduleBoard.jsx";
import { bookingSlotOptions } from "../utils/appointmentSlots.js";
import { api, getErrorMessage } from "../utils/api.js";
import { todayInput } from "../utils/format.js";
import { filterAppointments, newestFirst } from "../utils/reception.js";
import { maxBookingDate, toClinicIso } from "./BookingPage.jsx";

const tabs = new Set(["appointments", "schedule", "payments", "booking", "accounts", "consultations"]);
const scheduleStatuses = new Set(["confirmed", "checked_in", "in_treatment"]);

const genderOptions = [
  { value: "unknown", label: "Chưa chọn" },
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" }
];

export default function ReceptionistDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("appointments");
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [scheduleDate, setScheduleDate] = useState(todayInput());
  const [patientSearch, setPatientSearch] = useState("");
  const [accountMode, setAccountMode] = useState("existing");
  const [bookingDate, setBookingDate] = useState(todayInput());
  const [booking, setBooking] = useState({ patientId: "", serviceId: "", time: bookingSlotOptions[0].value, note: "" });
  const [newPatient, setNewPatient] = useState({ fullName: "", phone: "", gender: "unknown" });
  const [scheduleForms, setScheduleForms] = useState({});
  const [statusForms, setStatusForms] = useState({});
  const [invoiceAmounts, setInvoiceAmounts] = useState({});
  const [paymentAmounts, setPaymentAmounts] = useState({});
  const [resetPasswords, setResetPasswords] = useState({});
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ message: "", error: "" });

  async function load({ silent = false } = {}) {
    if (!silent) setLoading(true);
    try {
      const res = await api.get("/reception/dashboard");
      setAppointments(res.data.appointments || []);
      setPatients(res.data.patients || []);
      setServices(res.data.services || []);
      setConsultations(res.data.consultations || []);
      setRooms(res.data.rooms || []);
      setBooking((current) => ({
        ...current,
        patientId: current.patientId || res.data.patients?.[0]?._id || "",
        serviceId: current.serviceId || res.data.services?.[0]?._id || ""
      }));
    } catch (error) {
      setFeedback({ message: "", error: getErrorMessage(error) });
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab") || "appointments";
    setActiveTab(tabs.has(tab) ? tab : "appointments");
  }, [location.search]);

  useEffect(() => {
    if (!["accounts", "booking"].includes(activeTab)) return undefined;
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/reception/patients", { params: patientSearch.trim() ? { q: patientSearch.trim() } : {} });
        setPatients(res.data.patients || []);
      } catch (error) {
        setFeedback({ message: "", error: getErrorMessage(error) });
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [activeTab, patientSearch]);

  const appointmentList = useMemo(
    () => filterAppointments(appointments, appointmentSearch, appointmentDate).sort(newestFirst),
    [appointments, appointmentDate, appointmentSearch]
  );

  const scheduleAppointments = useMemo(
    () =>
      filterAppointments(appointments, "", scheduleDate)
        .filter((appointment) => scheduleStatuses.has(appointment.status))
        .sort(newestFirst),
    [appointments, scheduleDate]
  );

  const paymentAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === "completed").sort(newestFirst),
    [appointments]
  );

  async function createBooking(event) {
    event.preventDefault();
    setFeedback({ message: "", error: "" });

    if (bookingDate > maxBookingDate()) {
      setFeedback({ message: "", error: "Lễ tân chỉ được đặt lịch trước tối đa 1 tháng." });
      return;
    }

    if (!booking.serviceId) {
      setFeedback({ message: "", error: "Vui lòng chọn dịch vụ." });
      return;
    }

    try {
      let patientId = booking.patientId;
      if (accountMode === "new") {
        if (!newPatient.fullName.trim() || !newPatient.phone.trim()) {
          setFeedback({ message: "", error: "Vui lòng nhập họ tên và số điện thoại bệnh nhân." });
          return;
        }
        const patientRes = await api.post("/reception/patients", newPatient);
        patientId = patientRes.data.patient._id;
        setNewPatient({ fullName: "", phone: "", gender: "unknown" });
      }

      if (!patientId) {
        setFeedback({ message: "", error: "Vui lòng chọn bệnh nhân." });
        return;
      }

      await api.post("/reception/appointments", {
        patientId,
        serviceId: booking.serviceId,
        date: bookingDate,
        startAt: toClinicIso(bookingDate, booking.time),
        time: booking.time,
        note: booking.note
      });

      setFeedback({ message: "Đã tạo lịch hẹn. Lịch nằm trong mục Lịch hẹn.", error: "" });
      setBooking((current) => ({ ...current, note: "" }));
      navigate("/dashboard?tab=appointments", { replace: true });
      await load({ silent: true });
    } catch (error) {
      setFeedback({ message: "", error: getErrorMessage(error) });
    }
  }

  async function scheduleAppointment(appointment) {
    const form = {
      ...defaultScheduleForm(appointment),
      ...(scheduleForms[appointment._id] || {})
    };
    if (!form.date || !form.time || !form.roomId) {
      setFeedback({ message: "", error: "Vui lòng chọn ngày, giờ và phòng/bác sĩ." });
      return;
    }
    if (form.date > maxBookingDate()) {
      setFeedback({ message: "", error: "Chỉ được xếp lịch trước tối đa 1 tháng." });
      return;
    }
    if (!window.confirm("Xác nhận xếp giờ khám cho lịch hẹn này?")) return;

    try {
      await api.patch(`/reception/appointments/${appointment._id}/schedule`, {
        serviceId: form.serviceId || appointment.service?._id,
        date: form.date,
        startAt: toClinicIso(form.date, form.time),
        time: form.time,
        roomId: form.roomId
      });
      setFeedback({ message: "Đã xếp giờ khám cho bệnh nhân.", error: "" });
      await load({ silent: true });
    } catch (error) {
      setFeedback({ message: "", error: getErrorMessage(error) });
    }
  }

  async function updateStatus(appointment, status) {
    if (!window.confirm("Xác nhận cập nhật trạng thái lịch khám?")) return;
    try {
      await api.patch(`/reception/appointments/${appointment._id}/status`, { status });
      setFeedback({ message: "Đã cập nhật trạng thái lịch khám.", error: "" });
      if (status === "completed") navigate("/dashboard?tab=payments", { replace: true });
      await load({ silent: true });
    } catch (error) {
      setFeedback({ message: "", error: getErrorMessage(error) });
    }
  }

  async function createInvoice(appointment) {
    const amount = Number(invoiceAmounts[appointment._id] || 0);
    if (amount <= 0) {
      setFeedback({ message: "", error: "Vui lòng nhập số tiền cần thanh toán." });
      return;
    }
    if (!window.confirm(`Tạo hóa đơn ${amount.toLocaleString("vi-VN")} VND?`)) return;

    try {
      await api.post(`/reception/appointments/${appointment._id}/invoice`, { amount });
      setInvoiceAmounts((current) => ({ ...current, [appointment._id]: "" }));
      setFeedback({ message: "Đã tạo hóa đơn cho bệnh nhân.", error: "" });
      await load({ silent: true });
    } catch (error) {
      setFeedback({ message: "", error: getErrorMessage(error) });
    }
  }

  async function recordPayment(appointment) {
    const amount = Number(paymentAmounts[appointment._id] || 0);
    if (amount <= 0) {
      setFeedback({ message: "", error: "Vui lòng nhập số tiền bệnh nhân đã thanh toán." });
      return;
    }

    try {
      await api.patch(`/reception/appointments/${appointment._id}/payment`, { amount, paymentMethod: "cash" });
      setPaymentAmounts((current) => ({ ...current, [appointment._id]: "" }));
      setFeedback({ message: "Đã ghi nhận thanh toán.", error: "" });
      await load({ silent: true });
    } catch (error) {
      setFeedback({ message: "", error: getErrorMessage(error) });
    }
  }

  async function resetPassword(patient) {
    const password = resetPasswords[patient._id] || "Password123!";
    if (!window.confirm(`Reset mật khẩu cho ${patient.fullName}?`)) return;
    try {
      const res = await api.patch(`/reception/patients/${patient._id}/reset-password`, { password });
      setFeedback({ message: `Mật khẩu tạm: ${res.data.temporaryPassword}`, error: "" });
      setResetPasswords((current) => ({ ...current, [patient._id]: "" }));
    } catch (error) {
      setFeedback({ message: "", error: getErrorMessage(error) });
    }
  }

  async function updateConsultationStatus(request, status) {
    try {
      await api.patch(`/reception/consultations/${request._id}`, { status });
      setFeedback({ message: "Đã cập nhật yêu cầu tư vấn.", error: "" });
      await load({ silent: true });
    } catch (error) {
      setFeedback({ message: "", error: getErrorMessage(error) });
    }
  }

  async function deleteConsultation(request) {
    if (!window.confirm("Xóa yêu cầu tư vấn này khỏi hệ thống?")) return;
    try {
      await api.delete(`/reception/consultations/${request._id}`);
      setFeedback({ message: "Đã xóa yêu cầu tư vấn.", error: "" });
      await load({ silent: true });
    } catch (error) {
      setFeedback({ message: "", error: getErrorMessage(error) });
    }
  }

  return (
    <div className="page-grid reception-dashboard">
      <Feedback error={feedback.error} message={feedback.message} onClear={() => setFeedback({ message: "", error: "" })} />

      <div className="reception-refresh-row">
        <button className="button secondary" onClick={() => load()}>Tải lại dữ liệu</button>
      </div>

      {activeTab === "appointments" ? (
        <ReceptionAppointmentList
          appointments={appointmentList}
          date={appointmentDate}
          loading={loading}
          onDateChange={setAppointmentDate}
          onSchedule={scheduleAppointment}
          onSearchChange={setAppointmentSearch}
          rooms={rooms}
          scheduleForms={scheduleForms}
          search={appointmentSearch}
          services={services}
          setScheduleForms={setScheduleForms}
        />
      ) : null}

      {activeTab === "schedule" ? (
        <ReceptionScheduleBoard
          appointments={scheduleAppointments}
          date={scheduleDate}
          loading={loading}
          onDateChange={setScheduleDate}
          onStatusChange={updateStatus}
          rooms={rooms}
          statusForms={statusForms}
          setStatusForms={setStatusForms}
        />
      ) : null}

      {activeTab === "payments" ? (
        <ReceptionPaymentList
          appointments={paymentAppointments}
          invoiceAmounts={invoiceAmounts}
          loading={loading}
          onCreateInvoice={createInvoice}
          onPayment={recordPayment}
          paymentAmounts={paymentAmounts}
          setInvoiceAmounts={setInvoiceAmounts}
          setPaymentAmounts={setPaymentAmounts}
        />
      ) : null}

      {activeTab === "booking" ? (
        <ReceptionBookingForm
          accountMode={accountMode}
          booking={booking}
          date={bookingDate}
          genderOptions={genderOptions}
          newPatient={newPatient}
          onAccountModeChange={setAccountMode}
          onBookingChange={(values) => setBooking((current) => ({ ...current, ...values }))}
          onDateChange={setBookingDate}
          onNewPatientChange={(values) => setNewPatient((current) => ({ ...current, ...values }))}
          onSubmit={createBooking}
          patientSearch={patientSearch}
          patients={patients}
          services={services}
          setPatientSearch={setPatientSearch}
        />
      ) : null}

      {activeTab === "accounts" ? (
        <ReceptionPatientAccounts
          loading={loading}
          onResetPassword={resetPassword}
          patients={patientSearch.trim() ? patients : []}
          resetPasswords={resetPasswords}
          search={patientSearch}
          setResetPasswords={setResetPasswords}
          setSearch={setPatientSearch}
        />
      ) : null}

      {activeTab === "consultations" ? (
        <ReceptionConsultations
          consultations={consultations}
          loading={loading}
          onDelete={deleteConsultation}
          onUpdateStatus={updateConsultationStatus}
        />
      ) : null}
    </div>
  );
}

function defaultScheduleForm(appointment) {
  const startAt = appointment.startAt ? new Date(appointment.startAt) : new Date();
  const valid = !Number.isNaN(startAt.getTime());
  return {
    serviceId: appointment.service?._id || "",
    date: valid ? startAt.toISOString().slice(0, 10) : todayInput(),
    time: valid ? `${String(startAt.getHours()).padStart(2, "0")}:${String(startAt.getMinutes()).padStart(2, "0")}` : "08:00",
    roomId: appointment.room?._id || ""
  };
}
