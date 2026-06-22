import EmptyState from "../EmptyState.jsx";
import { formatMoney } from "../../utils/format.js";
import {
  appointmentDateLabel,
  appointmentPatient,
  appointmentService,
  invoiceRemaining,
  statusLabel
} from "../../utils/reception.js";

export default function ReceptionPaymentList({
  appointments,
  invoiceAmounts,
  loading,
  onCreateInvoice,
  onPayment,
  paymentAmounts,
  setInvoiceAmounts,
  setPaymentAmounts
}) {
  return (
    <section className="reception-page">
      <div className="section-title reception-title">
        <div>
          <span className="eyebrow">Lễ tân</span>
          <h1>Hóa đơn</h1>
          <p>Nhập số tiền cần thanh toán sau khi bệnh nhân hoàn tất khám, rồi ghi nhận số tiền đã thu.</p>
        </div>
      </div>

      {loading ? <div className="panel">Đang tải dữ liệu...</div> : null}
      {!loading && !appointments.length ? <EmptyState title="Chưa có hóa đơn" text="Lịch hoàn tất sẽ được chuyển sang đây để tạo hóa đơn." /> : null}

      <div className="reception-list">
        {appointments.map((appointment) => {
          const patient = appointmentPatient(appointment);
          const service = appointmentService(appointment);
          const invoice = appointment.invoice;
          const remaining = invoiceRemaining(invoice);

          return (
            <article className="reception-card" key={appointment._id}>
              <div className="reception-card-main">
                <div>
                  <strong>{patient.fullName || "Bệnh nhân"}</strong>
                  <p>{service.name || "Dịch vụ nha khoa"} - {appointmentDateLabel(appointment)}</p>
                  {invoice ? (
                    <span>
                      Hóa đơn: {formatMoney(invoice.totalAmount || invoice.total)} - còn lại {formatMoney(remaining)}
                    </span>
                  ) : (
                    <span>Chưa tạo hóa đơn</span>
                  )}
                </div>
                <span className={`status status-${invoice?.status || "unpaid"}`}>{statusLabel(invoice?.status || "unpaid")}</span>
              </div>

              {!invoice ? (
                <div className="reception-inline-form">
                  <input
                    min="0"
                    type="number"
                    value={invoiceAmounts[appointment._id] || ""}
                    onChange={(event) => setInvoiceAmounts((current) => ({ ...current, [appointment._id]: event.target.value }))}
                    placeholder="Số tiền cần trả"
                  />
                  <button className="button primary" onClick={() => onCreateInvoice(appointment)}>Tạo hóa đơn</button>
                </div>
              ) : invoice.status !== "paid" ? (
                <div className="reception-inline-form">
                  <input
                    min="0"
                    type="number"
                    value={paymentAmounts[appointment._id] || ""}
                    onChange={(event) => setPaymentAmounts((current) => ({ ...current, [appointment._id]: event.target.value }))}
                    placeholder={`Còn ${remaining.toLocaleString("vi-VN")} VND`}
                  />
                  <button className="button primary" onClick={() => onPayment(appointment)}>Ghi nhận thanh toán</button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
