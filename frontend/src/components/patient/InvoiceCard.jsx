import StatusBadge from "../StatusBadge.jsx";
import { formatDateTime, formatMoney } from "../../utils/format.js";
import ReviewForm from "./ReviewForm.jsx";

export default function InvoiceCard({
  invoice,
  review,
  reviewForm,
  submitReview,
  updateReviewForm
}) {
  const total = Number(invoice.total || invoice.totalAmount || 0);
  const paidAmount = Number(invoice.paidAmount || 0);
  const appointmentId = invoice.appointment?._id;
  const canReview = appointmentId && invoice.appointment?.status === "completed";
  const currentReviewForm = reviewForm || {
    rating: Number(review?.rating || 5),
    comment: review?.comment || ""
  };

  return (
    <div className="record-card" key={invoice._id}>
      <strong>{invoice.appointment?.service?.name || "Hóa đơn dịch vụ"}</strong>
      <p>{formatMoney(paidAmount)} / {formatMoney(total)}</p>
      <span className="mini">Ngày tạo: {formatDateTime(invoice.invoiceDate || invoice.createdAt)}</span>
      <span className="mini">Lịch hẹn: {formatDateTime(invoice.appointment?.startAt)}</span>
      <StatusBadge value={invoice.status} />
      {canReview && (
        <div className="invoice-review-section">
          <strong>{review ? "Đánh giá của bạn" : "Gửi đánh giá"}</strong>
          <ReviewForm
            form={currentReviewForm}
            onChange={(next) => updateReviewForm(appointmentId, next)}
            onSubmit={(event) => submitReview(event, appointmentId)}
            submitLabel={review ? "Cập nhật đánh giá" : "Gửi đánh giá"}
          />
        </div>
      )}
    </div>
  );
}
